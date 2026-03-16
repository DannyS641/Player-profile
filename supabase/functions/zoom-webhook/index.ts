import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const hmacSha256Hex = async (secret: string, message: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return toHex(signature);
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const debugEnabled = Deno.env.get("ZOOM_WEBHOOK_DEBUG") === "true";

const supabase =
  supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;
const log = (...args: unknown[]) => {
  if (debugEnabled) {
    console.log(...args);
  }
};

const toDateKey = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
};

const toTimestamp = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  const secret = Deno.env.get("ZOOM_WEBHOOK_SECRET");
  if (!secret) {
    return jsonResponse(
      { error: "Missing ZOOM_WEBHOOK_SECRET env var." },
      500,
    );
  }

  const rawBody = await req.text();
  let body: {
    event?: string;
    payload?: { plainToken?: string };
  };

  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  if (body?.event === "endpoint.url_validation") {
    const plainToken = body.payload?.plainToken;
    if (!plainToken) {
      return jsonResponse({ error: "Missing plainToken." }, 400);
    }
    log("Zoom validation request received.");
    const encryptedToken = await hmacSha256Hex(secret, plainToken);
    return jsonResponse({ plainToken, encryptedToken });
  }

  const timestamp = req.headers.get("x-zm-request-timestamp") ?? "";
  const signature = req.headers.get("x-zm-signature") ?? "";
  if (!timestamp || !signature) {
    log("Missing signature headers.");
    return jsonResponse({ error: "Missing Zoom signature headers." }, 400);
  }

  const message = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${await hmacSha256Hex(secret, message)}`;
  if (signature !== expected) {
    log("Invalid signature.");
    return jsonResponse({ error: "Invalid signature." }, 401);
  }

  if (!supabase) {
    return jsonResponse(
      { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      500,
    );
  }

  const event = body?.event ?? "";
  if (
    event !== "meeting.participant_joined" &&
    event !== "meeting.participant_left"
  ) {
    log("Ignoring event:", event);
    return jsonResponse({ received: true });
  }

  const payloadObject = body?.payload?.object ?? {};
  const meetingId = String(payloadObject.id ?? payloadObject.uuid ?? "").trim();
  const participant = payloadObject.participant ?? {};
  const participantEmail =
    participant.email?.toLowerCase().trim() ??
    participant.user_email?.toLowerCase().trim() ??
    null;
  const participantName = String(
    participant.user_name ?? participant.name ?? "",
  ).trim();
  const participantKey =
    participantEmail ||
    participant.id ||
    participant.user_id ||
    participantName ||
    "unknown";
  log("Zoom event:", event, {
    meetingId,
    participantKey,
    participantEmail,
  });

  const joinTime = toTimestamp(participant.join_time ?? payloadObject.start_time);
  const leaveTime = toTimestamp(
    participant.leave_time ?? payloadObject.start_time,
  );
  const sessionDate = toDateKey(
    participant.join_time ?? participant.leave_time ?? payloadObject.start_time,
  );

  let playerId: string | null = null;
  if (participantEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", participantEmail)
      .maybeSingle();
    playerId = profile?.id ?? null;
  }
  if (!playerId && participantName) {
    const { data: profileByName } = await supabase
      .from("profiles")
      .select("id")
      .ilike("full_name", participantName)
      .maybeSingle();
    playerId = profileByName?.id ?? null;
  }
  if (!playerId) {
    log("Participant identity unresolved; using fallback key.");
  }

  const { data: existing } = await supabase
    .from("attendance_events")
    .select("id, joined_at, left_at, duration_minutes, player_id")
    .eq("meeting_id", meetingId)
    .eq("participant_email", participantKey)
    .eq("session_date", sessionDate)
    .maybeSingle();

  const currentDurationMinutes = existing?.duration_minutes ?? 0;
  const existingPlayerId = existing?.player_id ?? null;
  const resolvedPlayerId = existingPlayerId ?? playerId;

  if (event === "meeting.participant_joined") {
    if (existing?.id) {
      await supabase
        .from("attendance_events")
        .update({
          joined_at: joinTime,
          left_at: null,
          raw_payload: body,
          updated_at: new Date().toISOString(),
          player_id: resolvedPlayerId,
        })
        .eq("id", existing.id);
      log("Updated attendance_events (join).", existing.id);
    } else {
      await supabase.from("attendance_events").insert({
        meeting_id: meetingId,
        participant_email: participantKey,
        session_date: sessionDate,
        joined_at: joinTime,
        left_at: null,
        duration_minutes: 0,
        raw_payload: body,
        player_id: resolvedPlayerId,
      });
      log("Inserted attendance_events (join).");
    }

    return jsonResponse({ received: true });
  }

  let newDurationMinutes = currentDurationMinutes;
  if (existing?.joined_at) {
    const joinedAt = new Date(existing.joined_at);
    const leftAt = new Date(leaveTime);
    if (!Number.isNaN(joinedAt.getTime()) && !Number.isNaN(leftAt.getTime())) {
      const deltaSeconds = Math.max(
        0,
        (leftAt.getTime() - joinedAt.getTime()) / 1000,
      );
      const totalSeconds = currentDurationMinutes * 60 + deltaSeconds;
      newDurationMinutes = Math.floor(totalSeconds / 60);
    }
  }
  log("Computed duration minutes:", newDurationMinutes);

  if (existing?.id) {
    await supabase
      .from("attendance_events")
      .update({
        left_at: leaveTime,
        duration_minutes: newDurationMinutes,
        raw_payload: body,
        updated_at: new Date().toISOString(),
        player_id: resolvedPlayerId,
      })
      .eq("id", existing.id);
    log("Updated attendance_events (leave).", existing.id);
  } else {
    await supabase.from("attendance_events").insert({
      meeting_id: meetingId,
      participant_email: participantKey,
      session_date: sessionDate,
      joined_at: null,
      left_at: leaveTime,
      duration_minutes: newDurationMinutes,
      raw_payload: body,
      player_id: resolvedPlayerId,
    });
    log("Inserted attendance_events (leave).");
  }

  if (resolvedPlayerId) {
    const { data: settings } = await supabase
      .from("app_settings")
      .select("min_minutes")
      .eq("id", 1)
      .maybeSingle();
    const minMinutes = settings?.min_minutes ?? 10;

    if (newDurationMinutes >= minMinutes) {
      await supabase.from("attendance").upsert(
        {
          player_id: resolvedPlayerId,
          session_date: sessionDate,
          method: "zoom_webhook",
        },
        { onConflict: "player_id,session_date" },
      );
      log("Attendance marked present.", {
        playerId: resolvedPlayerId,
        sessionDate,
        minutes: newDurationMinutes,
      });
    } else {
      log("Attendance not yet met minimum.", {
        playerId: resolvedPlayerId,
        sessionDate,
        minutes: newDurationMinutes,
        minMinutes,
      });
    }
  }

  return jsonResponse({ received: true });
});
