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

export async function request_file_upload(type: string): Promise<File | null> {
  return (await request_multi_file_upload(type))?.at(0) ?? null;
}

export function request_multi_file_upload(type: string): Promise<File[] | null> {
  const uploadInput = document.createElement("input");
  uploadInput.type = "file";
  uploadInput.accept = type;

  let cleanupFiles: () => void;

  const filesPromise = new Promise<File[] | null>((res) => {
    function onchange() {
      const { files } = uploadInput;
      if (files?.length) {
        res([...files]);
      } else {
        res(null);
      }
    }

    uploadInput.addEventListener("change", onchange);
    uploadInput.click();
    cleanupFiles = () => uploadInput.removeEventListener("change", onchange);
  });

  let cleanupFocus: () => void;

  const focusPromise = new Promise<null>((res) => {
    function onfocus() {
      res(null);
    }
    window.addEventListener("focus", onfocus, { once: true });
    cleanupFocus = () => window.removeEventListener("focus", onfocus);
  });

  const race = Promise.race([focusPromise, filesPromise]);

  race.finally(() => {
    cleanupFiles?.();
    cleanupFocus?.();
  });

  return race;
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
