const downloadAnchor = document.createElement("a");

export function download(filename: string, contents: BlobPart) {
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

export async function uploadSingle(type: string): Promise<File | null> {
  return (await uploadMultiple(type))?.at(0) ?? null;
}

export function uploadMultiple(type: string): Promise<File[] | null> {
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
    .normalize("NFKD") // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
    .toLowerCase() // Convert the string to lowercase letters
    .trim() // Remove whitespace from both sides of a string (optional)
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\_/g, "-") // Replace _ with -
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/\-$/g, ""); // Remove trailing -

export function randomId() {
  return Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
}
