export function hsv_to_rgb(h: number, s: number, v: number) {
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

export function rgba_to_int(r: number, g: number, b: number, a: number) {
  if (a === 0) return 0;
  return r + (g << 8) + (b << 16) + (a << 24);
}
export function int_to_rgba(dec: number) {
  const r = dec & 255;
  const g = (dec >> 8) & 255;
  const b = (dec >> 16) & 255;
  const a = (dec >> 24) & 255;
  return { r, g, b, a };
}

export function distance(a: number, b: number) {
  return (
    Math.abs((a & 255) - (b & 255)) +
    Math.abs(((a >> 8) & 255) - ((b >> 8) & 255)) +
    Math.abs(((a >> 16) & 255) - ((b >> 16) & 255)) +
    Math.abs(((a >> 24) & 255) - ((b >> 24) & 255))
  );
}
