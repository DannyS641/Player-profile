import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

const REMEMBER_ME_KEY = "a5_remember_me";
const memoryStore = new Map<string, string>();

const rememberMeEnabled = () =>
  typeof window === "undefined" ||
  window.localStorage.getItem(REMEMBER_ME_KEY) !== "false";

export const setRememberMe = (remember: boolean) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_ME_KEY, remember ? "true" : "false");
};

// Auth session storage that only persists across app restarts when
// "remember me" is enabled; otherwise it lives in memory for this session only.
const hybridStorage = {
  getItem: (key: string) => {
    if (rememberMeEnabled()) {
      return window.localStorage.getItem(key);
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: (key: string, value: string) => {
    if (rememberMeEnabled()) {
      window.localStorage.setItem(key, value);
    } else {
      memoryStore.set(key, value);
    }
  },
  removeItem: (key: string) => {
    window.localStorage.removeItem(key);
    memoryStore.delete(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: hybridStorage,
  },
});
