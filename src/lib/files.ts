const sanitizeBase = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}._\- ]+/gu, "-")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .replace(/^[-.\s]+|[-.\s]+$/g, "")
    .slice(0, 80);

export const buildUploadName = (file: File, customName: string) => {
  const lastDot = file.name.lastIndexOf(".");
  const ext = lastDot >= 0 ? file.name.slice(lastDot) : "";
  const fallback = lastDot >= 0 ? file.name.slice(0, lastDot) : file.name;
  const userBase = customName.replace(/\.[^.]+$/, "").trim();
  const base = sanitizeBase(userBase || fallback) || "file";
  return `${Date.now()}-${base}${ext}`;
};

export const friendlyName = (storedName: string) =>
  storedName.replace(/^\d+-/, "");

export const openInNewTab = (url: string) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "m4v",
  "mov",
  "qt",
  "webm",
  "ogg",
  "ogv",
  "avi",
  "mkv",
  "3gp",
  "3gpp",
  "wmv",
  "flv",
  "hevc",
]);

export const looksLikeVideo = (file: File) => {
  if (file.type.startsWith("video/")) return true;
  const lastDot = file.name.lastIndexOf(".");
  if (lastDot < 0) return false;
  const ext = file.name.slice(lastDot + 1).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext);
};
