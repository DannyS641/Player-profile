import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type TitleRequest = {
  url?: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceKey);

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
    },
  });

const getTitleFromHtml = (html: string) => {
  const ogMatch = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return jsonResponse({ error: "Missing authorization token" }, 401);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return jsonResponse({ error: "Invalid user" }, 401);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profile?.role !== "admin") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  let body: TitleRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const url = body.url?.trim();
  if (!url) {
    return jsonResponse({ error: "Missing URL" }, 400);
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
    return jsonResponse({ error: "Could not fetch title" }, 404);
  }

  return jsonResponse({ title });
});
