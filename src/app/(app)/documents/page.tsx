"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type UploadItem = {
  name: string;
  created_at: string | null;
  path: string;
};

export default function DocumentsPage() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return;
      }

      if (isMounted) {
        setUserId(userData.user.id);
      }

      const { data: files } = await supabase.storage
        .from("documents")
        .list(userData.user.id, {
          limit: 50,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (isMounted) {
        setUploads(
          (files ?? []).map((file) => ({
            name: file.name,
            created_at: file.created_at ?? null,
            path: `${userData.user.id}/${file.name}`,
          })),
        );
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const filename = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("documents")
      .upload(`${userId}/${filename}`, file, { upsert: false });

    if (error) {
      setMessage(error.message);
      setUploading(false);
      return;
    }

    setUploads((current) => [
      { name: filename, created_at: new Date().toISOString(), path: `${userId}/${filename}` },
      ...current,
    ]);
    setMessage("Document uploaded.");
    setUploading(false);
  };

  const handleDownload = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 3600);
    if (error) {
      setMessage(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
        <h1 className="font-display text-3xl">Documents</h1>
        <p className="mt-2 text-sm text-muted">
          Upload transcripts, certificates, and supporting documents.
        </p>
      </div>

      <section className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Your uploads</h2>
            <p className="text-sm text-muted">
              Only you and admins can see these files.
            </p>
          </div>
          <label className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold transition hover:border-foreground">
            {uploading ? "Uploading..." : "Upload document"}
            <input type="file" onChange={handleUpload} className="hidden" />
          </label>
        </div>
        {message ? (
          <p className="mt-4 rounded-2xl border border-line bg-[#f6fff1] px-4 py-3 text-sm text-[#1c5924]">
            {message}
          </p>
        ) : null}
        <div className="mt-4 space-y-3">
          {uploads.length === 0 ? (
            <p className="text-sm text-muted">No documents uploaded yet.</p>
          ) : (
            uploads.map((file) => (
              <div
                key={file.path}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted">
                    {file.created_at ? new Date(file.created_at).toLocaleString() : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(file.path)}
                  className="rounded-full border border-line px-3 py-1 text-xs font-semibold transition hover:border-foreground"
                >
                  Download
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
