const downloadAnchor = document.createElement("a");

export function downloadFile(filename: string, contents: BlobPart) {
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

let uploadInput = document.createElement("input");
uploadInput.type = "file";

export async function requestFileUpload(type: string): Promise<File | null> {
  return (await requestMultipleFilesUpload(type))?.at(0) ?? null;
}

export function requestMultipleFilesUpload(type: string): Promise<File[] | null> {
  let cleanupFiles: any;

  const filesPromise = new Promise<File[] | null>((res) => {
    function onchange() {
      const { files } = uploadInput;
      console.log(files);

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

  let cleanupFocus: any;

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

export function readAsText(file: Blob): Promise<string> {
  return new Promise<string>((res) => {
    const onload = () => {
      res(reader.result as any);
    };
    const reader = new FileReader();
    reader.onload = onload;
    reader.readAsText(file);
  });
}
export function readAsDataURL(file: Blob): Promise<string> {
  return new Promise<string>((res) => {
    const onload = () => {
      res(reader.result as any);
    };
    const reader = new FileReader();
    reader.onload = onload;
    reader.readAsDataURL(file);
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

export function randomId() {
  return Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
}
