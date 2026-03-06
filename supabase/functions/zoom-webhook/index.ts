import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ZoomWebhookPayload = {
  event?: string;
  payload?: {
    plainToken?: string;
    object?: {
      id?: string | number;
      participant?: {
        email?: string;
        join_time?: string;
        leave_time?: string;
        duration?: number;
      };
    };
    participant?: {
      email?: string;
      join_time?: string;
      leave_time?: string;
      duration?: number;
    };
  };
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const zoomSecret = Deno.env.get("ZOOM_WEBHOOK_SECRET");

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceKey);

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const hmacSha256 = async (secret: string, message: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return toHex(signature);
};

const verifyZoomSignature = async (
  secret: string,
  timestamp: string | null,
  body: string,
  signature: string | null,
) => {
  if (!timestamp || !signature) return false;
  const message = `v0:${timestamp}:${body}`;
  const hash = await hmacSha256(secret, message);
  return signature === `v0=${hash}`;
};

Deno.serve(async (req: Request) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-zm-signature");
  const timestamp = req.headers.get("x-zm-request-timestamp");

  if (zoomSecret) {
    const valid = await verifyZoomSignature(zoomSecret, timestamp, rawBody, signature);
    if (!valid) {
      return new Response("Invalid signature", { status: 401 });
    }
  }

  let payload: ZoomWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  if (payload?.event === "endpoint.url_validation") {
    const plainToken = payload?.payload?.plainToken;
    if (!plainToken || !zoomSecret) {
      return new Response("Missing token", { status: 400 });
    }
    const encryptedToken = await hmacSha256(zoomSecret, plainToken);
    return Response.json({ plainToken, encryptedToken });
  }

  if (
    payload?.event !== "meeting.participant_joined" &&
    payload?.event !== "meeting.participant_left"
  ) {
    return new Response("Ignored", { status: 200 });
  }

  const settings = await supabase
    .from("app_settings")
    .select("meeting_id, session_tz")
    .eq("id", 1)
    .single();

  const meetingId = String(payload?.payload?.object?.id ?? "");
  const allowedMeetingId = settings.data?.meeting_id ?? "";
  if (allowedMeetingId && meetingId && allowedMeetingId !== meetingId) {
    return new Response("Meeting not allowed", { status: 200 });
  }

  const participant =
    payload?.payload?.participant ?? payload?.payload?.object?.participant ?? {};
  const participantEmail = String(participant?.email ?? "").toLowerCase();
  const joinTime = participant?.join_time ?? null;
  const leaveTime = participant?.leave_time ?? null;
  const durationMinutes = participant?.duration ?? null;
  const sessionTz = settings.data?.session_tz ?? "Africa/Lagos";

  const baseTime = joinTime || leaveTime || new Date().toISOString();
  const sessionDate = new Date(baseTime).toLocaleDateString("en-CA", {
    timeZone: sessionTz,
  });

  let playerId: string | null = null;
  if (participantEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", participantEmail)
      .single();
    playerId = profile?.id ?? null;
  }

  const record: Record<string, unknown> = {
    meeting_id: meetingId || allowedMeetingId,
    participant_email: participantEmail,
    session_date: sessionDate,
    updated_at: new Date().toISOString(),
    raw_payload: payload,
  };

  if (playerId) {
    record.player_id = playerId;
  }
  if (joinTime) record.joined_at = joinTime;
  if (leaveTime) record.left_at = leaveTime;
  if (durationMinutes !== null) record.duration_minutes = durationMinutes;

  const { error } = await supabase
    .from("attendance_events")
    .upsert(record, { onConflict: "meeting_id,participant_email,session_date" });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
