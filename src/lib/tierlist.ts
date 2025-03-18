import { blob_to_dataurl, extract_image_segments } from "./blob";
import { random_id } from "./utils";

export type Item = {
  src: string;
  id: number;
  name?: string;
};

export type Tier = { name: string; items: Item[]; color: string };

export type TierList = {
  name: string;
  tiers: Tier[];
  uncategorized: Item[];
};

function empty(): TierList {
  return {
    name: "TierList",
    uncategorized: [],
    tiers: [
      {
        name: "S",
        items: [],
        color: "#02aff0",
      },
      {
        name: "A",
        items: [],
        color: "#00ae50",
      },
      {
        name: "B",
        items: [],
        color: "#92cf52",
      },
      {
        name: "C",
        items: [],
        color: "#edc031",
      },
      {
        name: "D",
        items: [],
        color: "#f7861c",
      },
      {
        name: "F",
        items: [],
        color: "#bf0001",
      },
    ],
  };
}

function balatro() {
  const tierlist = empty();

  const urls = Object.keys(import.meta.glob("../../public/tierlists/balatro/*", { query: "url", import: "default" }));

  for (const path of urls) {
    const url = path.replace("../../public/", "");
    const name = url.split(".")[0].split("/").at(-1)?.replace("_", " ");
    tierlist.uncategorized.push({
      id: random_id(),
      src: url,
      name: name,
    });
  }

  return tierlist;
}

async function tabg_blessings() {
  const res = await fetch("tierlists/tabg_blessings.png");
  const blob = await res.blob();
  const segments = await extract_image_segments(blob);
  const dataurls = await Promise.all(segments.map(blob_to_dataurl));
  const tierlist = empty();

  for (const dataurl of dataurls) {
    tierlist.uncategorized.push({
      id: random_id(),
      src: dataurl,
    });
  }

  return tierlist;
}

async function melee() {
  const res = await fetch("./tierlists/melee.png");
  const blob = await res.blob();
  const segments = await extract_image_segments(blob);
  const dataurls = await Promise.all(segments.map(blob_to_dataurl));
  const tierlist = empty();

  for (const dataurl of dataurls) {
    tierlist.uncategorized.push({
      id: random_id(),
      src: dataurl,
    });
  }

  return tierlist;
}

async function tabg_grenades() {
  const res = await fetch("tierlists/tabg_grenades.png");
  const blob = await res.blob();
  const segments = await extract_image_segments(blob);
  const dataurls = await Promise.all(segments.map(blob_to_dataurl));
  const tierlist = empty();

  for (const dataurl of dataurls) {
    tierlist.uncategorized.push({
      id: random_id(),
      src: dataurl,
    });
  }

  return tierlist;
}

export const templates = {
  "tabg-blessings": tabg_blessings,
  "tabg-grenades": tabg_grenades,
  melee,
  balatro,
  empty,
};
