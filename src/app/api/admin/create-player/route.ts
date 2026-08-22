import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type CreatePlayerRequest = {
  email?: string;
  password?: string;
  full_name?: string;
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
  const userId = userData?.id;
  if (!userId) {
    return NextResponse.json({ error: "Invalid user." }, { status: 401 });
  }

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { authorization: `Bearer ${token}` } },
  });

  const { data: profile } = await callerClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: CreatePlayerRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const fullName = body.full_name?.trim();

  if (!email || !password || !fullName) {
    return NextResponse.json(
      { error: "email, password, and full_name are required." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
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

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Failed to create user." },
      { status: 400 },
    );
  }

  const newUserId = created.user.id;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: newUserId,
      email,
      full_name: fullName,
      role: "player",
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await admin.auth.admin.deleteUser(newUserId);
    return NextResponse.json(
      { error: `Created auth user but profile insert failed: ${profileError.message}. The auth user has been rolled back.` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: newUserId,
    email,
    full_name: fullName,
  });
}
