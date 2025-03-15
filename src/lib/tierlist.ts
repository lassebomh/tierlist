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
