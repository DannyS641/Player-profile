import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type DeletePlayerRequest = {
  player_id?: string;
  email?: string;
};

const STORAGE_BUCKETS = ["media-dump", "documents", "education"] as const;

const findUserIdByEmail = async (
  admin: ReturnType<typeof getSupabaseAdmin>,
  email: string,
): Promise<string | null> => {
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (profile?.id) return profile.id;

  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) break;
    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
};

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Missing Supabase env vars." },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Missing authorization token." },
      { status: 401 },
    );
  }

  const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${token}`,
    },
  });

  if (!authRes.ok) {
    return NextResponse.json({ error: "Invalid user." }, { status: 401 });
  }

  const userData = await authRes.json();
  const callerId = userData?.id;
  if (!callerId) {
    return NextResponse.json({ error: "Invalid user." }, { status: 401 });
  }

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { authorization: `Bearer ${token}` } },
  });

  const { data: callerProfile } = await callerClient
    .from("profiles")
    .select("role")
    .eq("id", callerId)
    .single();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: DeletePlayerRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const playerIdInput = body.player_id?.trim();
  const emailInput = body.email?.trim().toLowerCase();

  if (!playerIdInput && !emailInput) {
    return NextResponse.json(
      { error: "Provide player_id or email." },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Service role client unavailable.",
      },
      { status: 500 },
    );
  }

  let targetId: string | null = playerIdInput ?? null;
  if (!targetId && emailInput) {
    targetId = await findUserIdByEmail(admin, emailInput);
  }

  if (!targetId) {
    return NextResponse.json(
      { error: "No player found for that id or email." },
      { status: 404 },
    );
  }

  if (targetId === callerId) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 },
    );
  }

  const removedFiles: Record<string, number> = {};
  for (const bucket of STORAGE_BUCKETS) {
    const { data: files } = await admin.storage.from(bucket).list(targetId, {
      limit: 1000,
    });
    if (files && files.length > 0) {
      const paths = files.map((file) => `${targetId}/${file.name}`);
      const { error: removeError } = await admin.storage
        .from(bucket)
        .remove(paths);
      removedFiles[bucket] = removeError ? 0 : paths.length;
    } else {
      removedFiles[bucket] = 0;
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(targetId);
  if (deleteError) {
    return NextResponse.json(
      { error: `Storage cleared but auth delete failed: ${deleteError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: targetId,
    removed_files: removedFiles,
  });
}
