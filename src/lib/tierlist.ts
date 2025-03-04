import { randomId, readAsDataURL } from "./utils";

export type Item = {
  src: string;
  id: number;
};

export type Tier = { name: string; items: Item[]; color: string };

export type TierList = {
  name: string;
  tiers: Tier[];
  uncategorized: Item[];
};

export function filesToItems(...files: File[]): Promise<Item[]> {
  return Promise.all(
    files
      .filter((file) => file.type.startsWith("image/"))
      .map(async (file) => ({
        id: randomId(),
        src: await readAsDataURL(file),
      }))
  );
}
