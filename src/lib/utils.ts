export function download_file(filename: string, contents: BlobPart) {
  const downloadAnchor = document.createElement("a");
  const reader = new FileReader();
  reader.readAsDataURL(new Blob([contents]));
  reader.addEventListener("load", () => {
    downloadAnchor.href = reader.result as string;
    downloadAnchor.download = filename;
    downloadAnchor.click();
    downloadAnchor.href = "";
    downloadAnchor.download = "";
  });
}

export const slugify = (text: string) =>
  text
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\_/g, "-")
    .replace(/\-\-+/g, "-")
    .replace(/\-$/g, "");

export function random_id() {
  return Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
}

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
