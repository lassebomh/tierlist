function HSVtoRGB(h: number, s: number, v: number) {
  let r: number;
  let g: number;
  let b: number;

  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }
  return {
    r: Math.round(r! * 255),
    g: Math.round(g! * 255),
    b: Math.round(b! * 255),
  };
}

function rgbaToDec(r: number, g: number, b: number, a: number) {
  return r + (g << 8) + (b << 16) + (a << 24);
}
function decToRgba(dec: number) {
  const r = dec & 255;
  const g = (dec >> 8) & 255;
  const b = (dec >> 16) & 255;
  const a = (dec >> 24) & 255;
  return { r, g, b, a };
}

export function downloadFile(filename: string, contents: BlobPart) {
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

export async function requestFileUpload(type: string): Promise<File | null> {
  return (await requestMultipleFilesUpload(type))?.at(0) ?? null;
}

export function requestMultipleFilesUpload(type: string): Promise<File[] | null> {
  const uploadInput = document.createElement("input");
  uploadInput.type = "file";

  let cleanupFiles: () => void;

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

export function blobAsText(file: Blob): Promise<string> {
  return new Promise<string>((res) => {
    const onload = () => {
      res(reader.result as any);
    };
    const reader = new FileReader();
    reader.onload = onload;
    reader.readAsText(file);
  });
}
export function blobAsDataURL(file: Blob): Promise<string> {
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

export async function getImageSegments(blob: Blob) {
  const bmp = await createImageBitmap(blob);
  const { width, height } = bmp;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  // document.body.prepend(canvas);

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);

  const mat = new Uint32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const r = imageData.data[i * 4];
    const g = imageData.data[i * 4 + 1];
    const b = imageData.data[i * 4 + 2];
    const a = imageData.data[i * 4 + 3];
    mat[i] = rgbaToDec(r, g, b, a);
  }

  const borderPoints = new Uint32Array(width * 2 + (height - 2) * 2);

  {
    let i = 0;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y += height - 1) {
        borderPoints[i++] = x + y * width;
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 0; x < width; x += width - 1) {
        borderPoints[i++] = x + y * width;
      }
    }
  }

  const counter = new Map<number, number>();

  for (const pnt of borderPoints) {
    const color = mat[pnt];

    if (!counter.has(color)) {
      counter.set(color, 1);
    } else {
      counter.set(color, counter.get(color)! + 1);
    }
  }

  let dominantColor = 0;
  let dominantColorCount = 0;

  for (const [color, count] of counter) {
    if (dominantColorCount < count) {
      dominantColor = color;
      dominantColorCount = count;
    }
  }

  const bgPoints = new Set<number>();
  const fgPoints = new Set<number>();
  const toBeChecked = Array.from(borderPoints);

  while (toBeChecked.length) {
    const pnt = toBeChecked.pop()!;

    if (mat[pnt] === dominantColor) {
      bgPoints.add(pnt);
    } else {
      fgPoints.add(pnt);
      continue;
    }

    const up = pnt - width;
    if (!bgPoints.has(up) && !fgPoints.has(up) && up >= 0) {
      toBeChecked.push(up);
    }

    const down = pnt + width;
    if (!bgPoints.has(down) && !fgPoints.has(down) && down < mat.length) {
      toBeChecked.push(down);
    }
    const left = pnt - 1;
    if (!bgPoints.has(left) && !fgPoints.has(left) && left % width !== 0) {
      toBeChecked.push(left);
    }
    const right = pnt + 1;
    if (!bgPoints.has(right) && !fgPoints.has(right) && (right + 1) % width !== 0) {
      toBeChecked.push(right);
    }
  }

  // for (const pnt of bgPoints) {
  //   imageData.data[pnt * 4] = 0;
  //   imageData.data[pnt * 4 + 1] = 0;
  //   imageData.data[pnt * 4 + 2] = 255;
  //   imageData.data[pnt * 4 + 3] = 100;
  // }

  const pnts = new Set<number>();
  const pntsMap = new Map<number, Set<number>>();

  for (let i = 0; i < mat.length; i++) {
    if (!bgPoints.has(i)) pnts.add(i);
  }

  for (const pnt of pnts) {
    const up = pnt - width;
    const down = pnt + width;
    const left = pnt - 1;
    const right = pnt + 1;

    const upIsValid = up >= 0 && pnts.has(up);
    const downIsValid = down < mat.length && pnts.has(down);
    const leftIsValid = left % width !== 0 && pnts.has(left);
    const rightIsValid = (right + 1) % width !== 0 && pnts.has(right);

    const upComponent = pntsMap.get(up);
    const downComponent = pntsMap.get(down);
    const leftComponent = pntsMap.get(left);
    const rightComponent = pntsMap.get(right);

    const component = leftComponent ?? upComponent ?? downComponent ?? rightComponent ?? new Set();

    pntsMap.set(pnt, component);
    component.add(pnt);

    if (upIsValid && upComponent !== component) {
      if (upComponent !== undefined) {
        for (const pnt of upComponent) {
          pntsMap.set(pnt, component);
          component.add(pnt);
        }
      } else {
        pntsMap.set(up, component);
        component.add(up);
      }
    }

    if (downIsValid && downComponent !== component) {
      if (downComponent !== undefined) {
        for (const pnt of downComponent) {
          pntsMap.set(pnt, component);
          component.add(pnt);
        }
      } else {
        pntsMap.set(down, component);
        component.add(down);
      }
    }

    if (leftIsValid && leftComponent !== component) {
      if (leftComponent !== undefined) {
        for (const pnt of leftComponent) {
          pntsMap.set(pnt, component);
          component.add(pnt);
        }
      } else {
        pntsMap.set(left, component);
        component.add(left);
      }
    }

    if (rightIsValid && rightComponent !== component) {
      if (rightComponent !== undefined) {
        for (const pnt of rightComponent) {
          pntsMap.set(pnt, component);
          component.add(pnt);
        }
      } else {
        pntsMap.set(right, component);
        component.add(right);
      }
    }
  }

  const components = new Set(pntsMap.values());

  const blobPromises = new Array<Promise<Blob>>();

  // let colorI = 0;

  for (const component of components) {
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    for (const pnt of component) {
      const x = pnt % width;
      const y = Math.floor(pnt / width);
      if (minX > x) minX = x;
      if (maxX < x) maxX = x;
      if (minY > y) minY = y;
      if (maxY < y) maxY = y;
    }

    const cx = minX;
    const cy = minY;
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;

    const componentImageData = ctx.getImageData(cx, cy, cw, ch);

    const componentCanvas = document.createElement("canvas");
    componentCanvas.width = cw;
    componentCanvas.height = ch;
    const componentCtx = componentCanvas.getContext("2d")!;

    componentCtx.putImageData(componentImageData, 0, 0);

    blobPromises.push(
      new Promise((res) => {
        componentCanvas.toBlob((blob) => res(blob!));
      })
    );

    // const { r, g, b } = HSVtoRGB(colorI++ / components.size, 1, 1);

    // for (const pnt of component) {
    //   imageData.data[pnt * 4] = r;
    //   imageData.data[pnt * 4 + 1] = g;
    //   imageData.data[pnt * 4 + 2] = b;
    //   imageData.data[pnt * 4 + 3] = 255;
    // }
  }
  // ctx.putImageData(imageData, 0, 0);

  return Promise.all(blobPromises);
}

// const blob = await (await fetch("melee2.png")).blob();

// await getImageSegments(blob);
