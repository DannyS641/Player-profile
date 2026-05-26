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
