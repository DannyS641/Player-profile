import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type TitleRequest = {
  url?: string;
};

const getTitleFromHtml = (html: string) => {
  const ogMatch = html.match(
    /property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
  );
  if (ogMatch?.[1]) return ogMatch[1].trim();
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) return titleMatch[1].trim();
  return "";
};

const fetchOembedTitle = async (url: string) => {
  const encoded = encodeURIComponent(url);
  const providers = [
    `https://www.youtube.com/oembed?url=${encoded}&format=json`,
    `https://vimeo.com/api/oembed.json?url=${encoded}`,
  ];

  for (const endpoint of providers) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.title) return String(data.title);
    } catch {
      // ignore and try next provider
    }
  }

  return "";
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
    const details = await authRes.text();
    return NextResponse.json(
      {
        error: "Invalid user.",
        details,
      },
      { status: 401 },
    );
  }

  const userData = await authRes.json();
  const userId = userData?.id;
  if (!userId) {
    return NextResponse.json({ error: "Invalid user." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: TitleRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  let title = await fetchOembedTitle(url);
  if (!title) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok) {
        const html = await res.text();
        title = getTitleFromHtml(html);
      }
    } catch {
      // ignore
    }
  }

  if (!title) {
    return NextResponse.json(
      { error: "Could not fetch title" },
      { status: 404 },
    );
  }

  return NextResponse.json({ title });
}
