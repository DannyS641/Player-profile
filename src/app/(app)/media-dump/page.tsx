"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type VideoUpload = {
  name: string;
  created_at: string | null;
  path: string;
  signedUrl: string | null;
};

const acceptedVideoTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
];
const maxVideoSizeBytes = 1024 * 1024 * 1024;

export default function MediaDumpPage() {
  const [uploads, setUploads] = useState<VideoUpload[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

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

    if (!acceptedVideoTypes.includes(file.type)) {
      setMessage("Upload an MP4, WebM, MOV, or OGG video file.");
      return;
    }

    if (file.size > maxVideoSizeBytes) {
      setMessage("Video is too large. Maximum upload size is 1024 MB.");
      return;
    }

    setUploading(true);
    setMessage(null);

    const filename = `${Date.now()}-${file.name}`;
    const path = `${userId}/${filename}`;

    const { error } = await supabase.storage
      .from("media-dump")
      .upload(path, file, { upsert: false });

    if (error) {
      setMessage(error.message);
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Your videos</h2>
            <p className="text-sm text-muted">
              Supported formats: MP4, WebM, MOV, and OGG. Max size: 1024 MB.
            </p>
          </div>
          <label className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold transition hover:border-foreground">
            {uploading ? "Uploading..." : "Upload video"}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/ogg"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
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
                  <p className="text-sm font-semibold text-foreground">
                    {file.name}
                  </p>
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
