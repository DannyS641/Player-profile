"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { buildUploadName, friendlyName, openInNewTab } from "@/lib/files";
import { useConfirm } from "@/components/ConfirmDialog";
import { usePrompt } from "@/components/PromptDialog";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const confirm = useConfirm();
  const prompt = usePrompt();

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
    event.target.value = "";
    if (!file) return;

    const lastDot = file.name.lastIndexOf(".");
    const ext = lastDot >= 0 ? file.name.slice(lastDot) : "";
    const baseName = lastDot >= 0 ? file.name.slice(0, lastDot) : file.name;

    const chosenName = await prompt({
      title: "Name your document",
      description: "Pick a name your coaches will recognise. The file extension stays the same.",
      label: "Document name",
      initialValue: baseName,
      suffix: ext,
      confirmLabel: "Upload document",
    });

    if (chosenName === null) {
      return;
    }

    setUploading(true);
    setMessage(null);

    const filename = buildUploadName(file, chosenName);
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
    if (error || !data?.signedUrl) {
      setMessage(error?.message ?? "Could not generate download link.");
      return;
    }
    openInNewTab(data.signedUrl);
  };

  const handleDelete = async (file: UploadItem) => {
    const ok = await confirm({
      title: "Delete this document?",
      description: `"${friendlyName(file.name)}" will be permanently removed from your uploads. This cannot be undone.`,
      confirmLabel: "Delete document",
      tone: "destructive",
    });
    if (!ok) return;

    const { error } = await supabase.storage
      .from("documents")
      .remove([file.path]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setUploads((current) => current.filter((item) => item.path !== file.path));
    setMessage("Document deleted.");
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Your uploads</h2>
            <p className="text-sm text-muted">
              Only you and admins can see these files.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:bg-[#1e3347] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploading ? "Uploading..." : "Upload document"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
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
                  <p className="text-sm font-semibold">{friendlyName(file.name)}</p>
                  <p className="text-xs text-muted">
                    {file.created_at ? new Date(file.created_at).toLocaleString() : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(file.path)}
                    className="rounded-full border border-line px-3 py-1 text-xs font-semibold transition hover:border-foreground"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(file)}
                    className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-[#8f2b18] transition hover:border-[#8f2b18]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
