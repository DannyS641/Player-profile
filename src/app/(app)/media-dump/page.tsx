"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { buildUploadName, friendlyName, looksLikeVideo } from "@/lib/files";
import { useConfirm } from "@/components/ConfirmDialog";
import { usePrompt } from "@/components/PromptDialog";

type VideoUpload = {
  name: string;
  created_at: string | null;
  path: string;
  signedUrl: string | null;
};

const maxVideoSizeBytes = 1024 * 1024 * 1024;

export default function MediaDumpPage() {
  const [uploads, setUploads] = useState<VideoUpload[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const confirm = useConfirm();
  const prompt = usePrompt();

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setUserId(userData.user.id);
      }

      const { data: files, error } = await supabase.storage
        .from("media-dump")
        .list(userData.user.id, {
          limit: 50,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        if (isMounted) {
          setMessage(error.message);
          setLoading(false);
        }
        return;
      }

      const mappedUploads = (files ?? []).map((file) => ({
        name: file.name,
        created_at: file.created_at ?? null,
        path: `${userData.user.id}/${file.name}`,
        signedUrl: null,
      }));

      const signedUrls = await Promise.all(
        mappedUploads.map(async (file) => {
          const { data } = await supabase.storage
            .from("media-dump")
            .createSignedUrl(file.path, 3600);
          return {
            path: file.path,
            signedUrl: data?.signedUrl ?? null,
          };
        }),
      );

      if (isMounted) {
        setUploads(
          mappedUploads.map((file) => ({
            ...file,
            signedUrl:
              signedUrls.find((item) => item.path === file.path)?.signedUrl ?? null,
          })),
        );
        setLoading(false);
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

    if (!looksLikeVideo(file)) {
      setMessage(
        `That file doesn't look like a video (detected type "${file.type || "unknown"}"). Try MP4, MOV, WebM, or another video format.`,
      );
      return;
    }

    if (file.size > maxVideoSizeBytes) {
      setMessage("Video is too large. Maximum upload size is 1024 MB.");
      return;
    }

    const lastDot = file.name.lastIndexOf(".");
    const ext = lastDot >= 0 ? file.name.slice(lastDot) : "";
    const baseName = lastDot >= 0 ? file.name.slice(0, lastDot) : file.name;

    const chosenName = await prompt({
      title: "Name your video",
      description: "Pick a name your coaches will recognise. The file extension stays the same.",
      label: "Video name",
      initialValue: baseName,
      suffix: ext,
      confirmLabel: "Upload video",
    });

    if (chosenName === null) {
      return;
    }

    setUploading(true);
    setMessage(null);

    const filename = buildUploadName(file, chosenName);
    const path = `${userId}/${filename}`;

    const contentType = file.type || "application/octet-stream";
    const { error } = await supabase.storage
      .from("media-dump")
      .upload(path, file, { upsert: false, contentType });

    if (error) {
      console.error("[media-dump] upload failed", {
        bucketError: error,
        fileType: file.type,
        fileName: file.name,
        sizeBytes: file.size,
      });
      setMessage(`Upload failed: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data: signedData } = await supabase.storage
      .from("media-dump")
      .createSignedUrl(path, 3600);

    setUploads((current) => [
      {
        name: filename,
        created_at: new Date().toISOString(),
        path,
        signedUrl: signedData?.signedUrl ?? null,
      },
      ...current,
    ]);
    setMessage("Video uploaded to media dump.");
    setUploading(false);
  };

  const handleDelete = async (file: VideoUpload) => {
    const ok = await confirm({
      title: "Delete this video?",
      description: `"${friendlyName(file.name)}" will be permanently removed from your media dump. This cannot be undone.`,
      confirmLabel: "Delete video",
      tone: "destructive",
    });
    if (!ok) return;

    const { error } = await supabase.storage
      .from("media-dump")
      .remove([file.path]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setUploads((current) => current.filter((item) => item.path !== file.path));
    setMessage("Video deleted.");
  };

  if (loading) {
    return <p className="text-sm text-muted">Loading media dump...</p>;
  }

  if (!userId) {
    return (
      <div className="rounded-[28px] border border-line bg-white p-8">
        <h1 className="font-display text-2xl">Log in required</h1>
        <p className="mt-2 text-sm text-muted">
          Please log in to upload and view your videos.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
        <h1 className="font-display text-3xl">Media Dump</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Upload your game film, practice clips, and highlights. You can watch
          them here, and admins can review them from the dashboard too.
        </p>
      </div>

      <section className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_-45px_rgba(11,27,43,0.7)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Your videos</h2>
            <p className="text-sm text-muted">
              Any video format. Max size: 1024 MB.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#d84f1d] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploading ? "Uploading..." : "Upload video"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
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

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {uploads.length === 0 ? (
            <p className="text-sm text-muted">No videos uploaded yet.</p>
          ) : (
            uploads.map((file) => (
              <article
                key={file.path}
                className="overflow-hidden rounded-[26px] border border-line bg-[#fbf8f2]"
              >
                <div className="aspect-video bg-[#d9d2c4]">
                  {file.signedUrl ? (
                    <video
                      controls
                      preload="metadata"
                      className="h-full w-full object-cover"
                      src={file.signedUrl}
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted">
                      Preview unavailable right now.
                    </div>
                  )}
                </div>
                <div className="space-y-2 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {friendlyName(file.name)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDelete(file)}
                      className="shrink-0 rounded-full border border-line px-3 py-1 text-[11px] font-semibold text-[#8f2b18] transition hover:border-[#8f2b18]"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-xs text-muted">
                    {file.created_at
                      ? new Date(file.created_at).toLocaleString()
                      : "Recently uploaded"}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
