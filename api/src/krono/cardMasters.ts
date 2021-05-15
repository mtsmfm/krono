const CARD_MASTERS = [
  {
    id: 1,
    name: "農村",
    coin: 1,
    cost: 1,
    link: 1,
    type: "territory",
    rarity: "basic",
  },
  {
    id: 2,
    name: "都市",
    coin: 2,
    cost: 3,
    link: 1,
    type: "territory",
    rarity: "basic",
  },
  {
    id: 3,
    name: "大都市",
    coin: 3,
    cost: 6,
    link: 1,
    type: "territory",
    rarity: "basic",
  },
  {
    id: 4,
    name: "見習い侍女",
    cost: 2,
    successionPoint: -2,
    type: "succession",
    subtype: "maid",
    rarity: "basic",
  },
  {
    id: 5,
    name: "宮廷侍女",
    cost: 3,
    successionPoint: 2,
    type: "succession",
    subtype: "maid",
    rarity: "basic",
  },
  {
    id: 6,
    name: "議員",
    cost: 5,
    successionPoint: 3,
    type: "succession",
    rarity: "basic",
  },
  {
    id: 7,
    name: "公爵",
    cost: 8,
    successionPoint: 6,
    type: "succession",
    rarity: "basic",
  },
  {
    id: 8,
    name: "呪い",
    cost: 0,
    type: "calamity",
    rarity: "basic",
  },
  {
    id: 9,
    name: "第一皇女 ルルナサイカ",
    cost: 6,
    successionPoint: 6,
    type: "princess",
    rarity: "rare",
  },
] as const;

export const isType =
  <T extends typeof CARD_MASTERS[number]["type"]>(type: T) =>
  <N extends { type: string }>(node: N): node is Extract<N, { type: T }> => {
    return node.type === type;
  };

export type CardMaster = typeof CARD_MASTERS[number];

export const findById = (id: number) => {
  return CARD_MASTERS.find((c) => c.id === id);
};

export const getFarmingVillage = () => {
  return findById(1)!;
};

export const getCity = () => {
  return findById(2)!;
};

export const getLargeCity = () => {
  return findById(3)!;
};

export const getApprenticeMaid = () => {
  return findById(4)!;
};

export const getRoyalMaid = () => {
  return findById(4)!;
};

export const getSenator = () => {
  return findById(6)!;
};

export const getDuke = () => {
  return findById(7)!;
};

export const getCurse = () => {
  return findById(8)!;
};

export const getPrincesses = () => {
  return CARD_MASTERS.filter((c) => c.type === "princess");
};
