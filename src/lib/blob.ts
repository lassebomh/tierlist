import { hsv_to_rgb, int_to_rgba, rgba_to_int } from "./color";

export function blob_to_text(file: Blob): Promise<string> {
  return new Promise<string>((res) => {
    const onload = () => {
      res(reader.result as any);
    };
    const reader = new FileReader();
    reader.onload = onload;
    reader.readAsText(file);
  });
}
export function blob_to_dataurl(file: Blob): Promise<string> {
  return new Promise<string>((res) => {
    const onload = () => {
      res(reader.result as any);
    };
    const reader = new FileReader();
    reader.onload = onload;
    reader.readAsDataURL(file);
  });
}

export async function extract_image_segments(blob: Blob): Promise<Blob[]> {
  const bmp = await createImageBitmap(blob);
  const { width, height } = bmp;

  const canvas = new OffscreenCanvas(width, height);

  // const canvas = document.createElement("canvas");
  // canvas.width = width;
  // canvas.height = height;
  // document.body.prepend(canvas);
  // canvas.style.imageRendering = "pixelated";

  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(bmp, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);

  // let paint_tick = 0;
  // function paint(pnt: number, int: number) {
  //   const { r, g, b, a } = int_to_rgba(int);
  //   imageData.data[pnt * 4 + 0] = r;
  //   imageData.data[pnt * 4 + 1] = g;
  //   imageData.data[pnt * 4 + 2] = b;
  //   imageData.data[pnt * 4 + 3] = a;
  // }

  // let PAINT_SPEED = 80;

  // async function tick() {
  //   if (paint_tick++ % PAINT_SPEED === 0)
  //     await new Promise((res) => {
  //       ctx.putImageData(imageData, 0, 0);
  //       requestAnimationFrame(res);
  //     });
  // }

  const mat = new Uint32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const r = imageData.data[i * 4];
    const g = imageData.data[i * 4 + 1];
    const b = imageData.data[i * 4 + 2];
    const a = imageData.data[i * 4 + 3];
    mat[i] = rgba_to_int(r, g, b, a);
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

  let dominantColor = 0;
  let dominantColorCount = 0;
  const counter = new Map<number, number>();

  for (const pnt of borderPoints) {
    const color = mat[pnt];
    if (color === 0) {
      dominantColor = 0;
      break;
    }

    const count = (counter.get(color) ?? 0) + 1;

    counter.set(color, count);

    if (dominantColorCount < count) {
      dominantColor = color;
      dominantColorCount = count;
    }
  }

  for (const [color, count] of counter) {
    if (dominantColorCount < count) {
      dominantColor = color;
      dominantColorCount = count;
    }
  }

  const bgPoints = new Array<boolean>(mat.length).fill(false);

  const queue = Array.from(borderPoints);
  const ignore = new Set<number>(queue);

  while (queue.length) {
    const pnt = queue.shift()!;
    ignore.add(pnt);

    if (mat[pnt] === dominantColor) {
      // paint(pnt, rgba_to_int(255, 0, 0, 100));
      // await tick();
      bgPoints[pnt] = true;
    } else {
      // paint(pnt, rgba_to_int(100, 0, 0, 255));
      continue;
    }

    const right = pnt + 1;
    if (!ignore.has(right) && (right + 1) % width !== 0) {
      queue.push(right);
      ignore.add(right);
    }
    const up = pnt - width;
    if (!ignore.has(up) && up >= 0) {
      queue.push(up);
      ignore.add(up);
    }
    const left = pnt - 1;
    if (!ignore.has(left) && left % width !== 0) {
      queue.push(left);
      ignore.add(left);
    }
    const down = pnt + width;
    if (!ignore.has(down) && down < mat.length) {
      queue.push(down);
      ignore.add(down);
    }
  }

  // await tick();

  const pnts = new Set<number>();
  const pntsMap = new Map<number, Set<number>>();

  // let colorI = 0;
  // const colorMap = new Map<Set<any>, number>();
  // function getOrCreateColor(component: Set<any>) {
  //   let color = colorMap.get(component);
  //   if (color === undefined) {
  //     const { r, g, b } = hsv_to_rgb((colorI++ % 12) / 12, 1, 1);
  //     color = rgba_to_int(r, g, b, 255);
  //     colorMap.set(component, color);
  //   }
  //   return color;
  // }

  for (let i = 0; i < mat.length; i++) {
    if (!bgPoints[i]) pnts.add(i);
  }

  // PAINT_SPEED = 80;

  for (const pnt of pnts) {
    // await tick();
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

    // const componentColor = getOrCreateColor(component);
    // paint(pnt, componentColor);
    pntsMap.set(pnt, component);
    component.add(pnt);

    if (rightIsValid && rightComponent !== component) {
      if (rightComponent !== undefined) {
        for (const pnt of rightComponent) {
          pntsMap.set(pnt, component);
          component.add(pnt);
          // paint(pnt, componentColor);
        }
      } else {
        pntsMap.set(right, component);
        component.add(right);
        // paint(right, componentColor);
      }
    }
    if (downIsValid && downComponent !== component) {
      if (downComponent !== undefined) {
        for (const pnt of downComponent) {
          pntsMap.set(pnt, component);
          component.add(pnt);
          // paint(pnt, componentColor);
        }
      } else {
        pntsMap.set(down, component);
        component.add(down);
        // paint(down, componentColor);
      }
    }
    if (upIsValid && upComponent !== component) {
      if (upComponent !== undefined) {
        for (const pnt of upComponent) {
          pntsMap.set(pnt, component);
          component.add(pnt);
          // paint(pnt, componentColor);
        }
      } else {
        pntsMap.set(up, component);
        component.add(up);
        // paint(up, componentColor);
      }
    }

    if (leftIsValid && leftComponent !== component) {
      if (leftComponent !== undefined) {
        for (const pnt of leftComponent) {
          pntsMap.set(pnt, component);
          component.add(pnt);
          // paint(pnt, componentColor);
        }
      } else {
        pntsMap.set(left, component);
        component.add(left);
        // paint(left, componentColor);
      }
    }
  }

  const components = new Set(pntsMap.values());

  const blobPromises = new Array<Promise<Blob>>();

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

    const componentCanvas = new OffscreenCanvas(cw, ch);
    const componentCtx = componentCanvas.getContext("2d")!;

    componentCtx.putImageData(componentImageData, 0, 0);

    blobPromises.push(componentCanvas.convertToBlob());
  }

  return Promise.all(blobPromises);
}

// const blob = await (await fetch("tierlists/melee.png")).blob();
// const start = performance.now();

// for (let i = 0; i < 100; i++) {
//   await extract_image_segments(blob);
// }

// console.log(performance.now() - start);
