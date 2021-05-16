import produce from "immer";
import { ulid } from "ulid";
import {
  CardMaster,
  isType,
  findById,
  getFarmingVillage,
  getApprenticeMaid,
  getCurse,
  getPrincesses,
  getCity,
  getLargeCity,
  getRoyalMaid,
  getSenator,
  getDuke,
} from "./cardMasters";
import { shuffle, partition, sortBy } from "lodash";

export type Action =
  | { type: "INIT"; playerIds: string[] }
  | {
      type: "HAND_ELIMINATION";
      playerId: string;
      coin: number;
    }
  | {
      type: "PLAY_HAND";
      playerId: string;
      cardId: string;
    }
  | {
      type: "BUY_CARD";
      playerId: string;
      cardId: string;
    }
  | {
      type: "BACK_PRINCESS";
      playerId: string;
      cardId: string;
    }
  | {
      type: "SET_SUCCESSION_CARD";
      playerId: string;
      cardId: string;
    }
  | {
      type: "DECLARE_CORONATION_CEREMONY";
      playerId: string;
    }
  | {
      type: "END_TURN";
      playerId: string;
    };

export interface Domain {
  territories: Card[];
  princess: Card;
  successionCards: Card[];
}

export interface Player {
  id: string;
  hand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  domain: Domain | undefined;
  playingCards: Card[];
  currentCoins: number;
  linkRemains: number;
  successionPoints: number | undefined;
  coronationCeremonyDeclared: boolean;
}

export interface State {
  players: Player[];
  outskirts: Card[];
  supplyPile: Card[];
  curseCards: Card[];
  princessCards: Card[];
  basicMarket: Card[];
  randomMarket: Card[];
  awaitingActions: Array<{
    playerId: string;
    type: Exclude<Action["type"], "INIT">;
  }>;
  turnPlayerIndex: number;
  firstCoronationCeremonyDeclaredPlayerIndex: number | undefined;
  overtime: boolean;
  winnerPlayerId: string | undefined;
}

export const initialState: State = {
  players: [],
  outskirts: [],
  supplyPile: [],
  curseCards: [],
  princessCards: [],
  basicMarket: [],
  randomMarket: [],
  awaitingActions: [],
  turnPlayerIndex: 0,
  firstCoronationCeremonyDeclaredPlayerIndex: undefined,
  overtime: false,
  winnerPlayerId: undefined,
};

export interface Card {
  id: string;
  cardMasterId: number;
}

const HAND_CARD_COUNT = 5;
const CURSE_CARD_COUNT_PER_PLAYER = 4;
const CORONATION_CEREMONY_REQUIREMENT_POINTS = 20;
const OVERTIME_WINNER_REQUIREMENT_POINTS = 30;

const drawCard = (player: Player, count: number) => {
  Array.from({ length: count }).forEach(() => {
    if (player.drawPile.length === 0) {
      player.drawPile = shuffle(player.discardPile);
      player.discardPile = [];
    }

    const card = player.drawPile.shift();

    if (card) {
      player.hand.push(card);
    }
  });
};

const calcSuccessionPoints = (player: Player): number | undefined => {
  if (!player.domain) {
    return undefined;
  }

  const princess = findById(player.domain.princess.cardMasterId)!;

  let points = 0;

  if (isType("princess")(princess)) {
    points += princess.successionPoint;
  }

  points += player.domain.successionCards
    .map((c) => findById(c.cardMasterId)!)
    .filter(isType("succession"))
    .reduce((acc, m) => acc + m.successionPoint, 0);

  return points;
};

const extractValidCard = <T extends CardMaster["type"]>(
  cardsList: Card[][],
  condition?: { id?: string; type?: T },
  fn?: (c: Card, m: Extract<CardMaster, { type: T }>) => boolean
): [Card, Extract<CardMaster, { type: T }>] => {
  for (const cards of cardsList) {
    const i = cards.findIndex((c) => {
      const m = findById(c.cardMasterId)!;

      return (
        (!condition?.id || condition.id === c.id) &&
        (!condition?.type || isType(condition.type)(m)) &&
        (!fn || fn(c, m as any))
      );
    });

    if (i >= 0) {
      const [card] = cards.splice(i, 1);

      return [card, findById(card.cardMasterId) as any];
    }
  }

  throw "invalid";
};

export const reducer = produce((state: State, action: Action) => {
  if (action.type === "INIT") {
    state.players = action.playerIds.map((id) => {
      const cards = shuffle(
        [
          [getFarmingVillage().id, 7],
          [getApprenticeMaid().id, 3],
        ].flatMap(([id, count]) =>
          Array.from({ length: count }).map(() => ({
            id: ulid(),
            cardMasterId: id,
          }))
        )
      );

      return {
        id,
        discardPile: [],
        hand: cards.slice(0, HAND_CARD_COUNT),
        drawPile: cards.slice(HAND_CARD_COUNT),
        domain: undefined,
        playingCards: [],
        currentCoins: 0,
        linkRemains: 1,
        successionPoints: undefined,
        coronationCeremonyDeclared: false,
      };
    });
    state.curseCards = Array.from({
      length: action.playerIds.length * CURSE_CARD_COUNT_PER_PLAYER,
    }).map(() => ({
      id: ulid(),
      cardMasterId: getCurse().id,
    }));
    state.princessCards = getPrincesses().map(({ id }) => ({
      id: ulid(),
      cardMasterId: id,
    }));
    state.basicMarket = [
      [getFarmingVillage().id, 20],
      [getCity().id, 30],
      [getLargeCity().id, 20],
      [getRoyalMaid().id, 12],
      [getSenator().id, 12],
      [getDuke().id, 12],
    ].flatMap(([id, count]) =>
      Array.from({ length: count }).map(() => ({
        id: ulid(),
        cardMasterId: id,
      }))
    );
    state.supplyPile = [];
    state.randomMarket = [];
    state.outskirts = [];

    state.awaitingActions = action.playerIds.map((id) => ({
      type: "HAND_ELIMINATION",
      playerId: id,
    }));

    return;
  }

  const awaitingActionIndex = state.awaitingActions.findIndex(
    (a) => a.type === action.type && a.playerId === action.playerId
  );

  if (awaitingActionIndex === -1) {
    throw "invalid";
  }

  switch (action.type) {
    case "HAND_ELIMINATION": {
      if (!(2 <= action.coin && action.coin <= 5)) {
        throw "invalid";
      }

      const player = state.players.find((p) => p.id === action.playerId)!;
      const [territories, others] = partition(
        [...player.hand, ...player.drawPile],
        (card) => findById(card.cardMasterId)!.type === "territory"
      );
      player.hand = [
        ...territories.slice(0, action.coin),
        ...others.slice(0, HAND_CARD_COUNT - action.coin),
      ];
      player.drawPile = [
        ...territories.slice(action.coin, territories.length),
        ...others.slice(HAND_CARD_COUNT - action.coin, others.length),
      ];

      state.awaitingActions.splice(awaitingActionIndex, 1);

      if (state.awaitingActions.length === 0) {
        state.players = sortBy(
          shuffle(state.players),
          (p) =>
            p.hand.filter((c) => findById(c.cardMasterId)!.type === "territory")
              .length
        );

        const playerId = state.players[state.turnPlayerIndex].id;
        state.awaitingActions = [
          { type: "PLAY_HAND", playerId },
          { type: "BACK_PRINCESS", playerId },
          { type: "BUY_CARD", playerId },
          { type: "END_TURN", playerId },
        ];
      }

      break;
    }
    case "PLAY_HAND": {
      const turnPlayer = state.players[state.turnPlayerIndex];

      if (turnPlayer.linkRemains === 0) {
        throw "invalid";
      }

      const [card, cardMaster] = extractValidCard(
        [turnPlayer.hand],
        // TODO: check playable
        { id: action.cardId, type: "territory" }
      );

      turnPlayer.playingCards.push(card);
      turnPlayer.linkRemains += cardMaster.link - 1;
      turnPlayer.currentCoins += cardMaster.coin;

      state.awaitingActions = [
        { type: "PLAY_HAND", playerId: turnPlayer.id },
        { type: "BUY_CARD", playerId: turnPlayer.id },
        { type: "END_TURN", playerId: turnPlayer.id },
      ];

      if (turnPlayer.domain) {
        state.awaitingActions.push({
          type: "SET_SUCCESSION_CARD",
          playerId: turnPlayer.id,
        });
      } else {
        state.awaitingActions.push({
          type: "BACK_PRINCESS",
          playerId: turnPlayer.id,
        });
      }

      break;
    }
    case "BUY_CARD": {
      const turnPlayer = state.players[state.turnPlayerIndex];

      const [card, cardMaster] = extractValidCard(
        [state.basicMarket, state.randomMarket],
        { id: action.cardId },
        (_, m) => m.cost <= turnPlayer.currentCoins
      );

      turnPlayer.discardPile.push(card);
      turnPlayer.currentCoins -= cardMaster.cost;

      state.awaitingActions = [
        { type: "BUY_CARD", playerId: turnPlayer.id },
        { type: "END_TURN", playerId: turnPlayer.id },
      ];

      break;
    }
    case "BACK_PRINCESS": {
      const [princess] = extractValidCard(
        [state.princessCards],
        { id: action.cardId, type: "princess" },
        (_, m) => m.cost <= turnPlayer.currentCoins
      );

      const turnPlayer = state.players[state.turnPlayerIndex];

      const territories = sortBy(
        turnPlayer.playingCards.filter((c) =>
          isType("territory")(findById(c.cardMasterId)!)
        ),
        (c) => {
          -findById(c.cardMasterId)!.cost;
        }
      ).slice(0, 3);

      turnPlayer.domain = {
        princess,
        successionCards: [],
        territories,
      };

      turnPlayer.playingCards = turnPlayer.playingCards.filter(
        (c) => !territories.some((t) => t.id === c.id)
      );

      state.awaitingActions = [{ type: "END_TURN", playerId: turnPlayer.id }];

      break;
    }
    case "SET_SUCCESSION_CARD": {
      const turnPlayer = state.players[state.turnPlayerIndex];

      const [card] = extractValidCard([turnPlayer.hand], {
        id: action.cardId,
        type: "succession",
      });

      turnPlayer.domain!.successionCards.push(card);

      state.awaitingActions = [
        { type: "SET_SUCCESSION_CARD", playerId: turnPlayer.id },
        { type: "END_TURN", playerId: turnPlayer.id },
      ];

      break;
    }
    case "DECLARE_CORONATION_CEREMONY": {
      const turnPlayer = state.players[state.turnPlayerIndex];
      turnPlayer.coronationCeremonyDeclared = true;

      if (state.firstCoronationCeremonyDeclaredPlayerIndex === undefined) {
        state.firstCoronationCeremonyDeclaredPlayerIndex =
          state.turnPlayerIndex;
      }

      state.awaitingActions = [{ type: "END_TURN", playerId: turnPlayer.id }];

      break;
    }
    case "END_TURN": {
      const currentPlayer = state.players[state.turnPlayerIndex];
      currentPlayer.linkRemains = 1;
      currentPlayer.currentCoins = 0;
      currentPlayer.discardPile.push(...currentPlayer.playingCards);
      currentPlayer.discardPile.push(...currentPlayer.hand);
      currentPlayer.playingCards = [];
      currentPlayer.hand = [];
      drawCard(currentPlayer, HAND_CARD_COUNT);

      do {
        state.turnPlayerIndex =
          (state.turnPlayerIndex + 1) % state.players.length;
      } while (
        state.overtime &&
        state.players[state.turnPlayerIndex].coronationCeremonyDeclared
      );

      const nextPlayer = state.players[state.turnPlayerIndex];

      if (
        !state.overtime &&
        state.turnPlayerIndex ===
          state.firstCoronationCeremonyDeclaredPlayerIndex
      ) {
        if (
          state.players.filter((p) => p.coronationCeremonyDeclared).length === 1
        ) {
          state.winnerPlayerId = nextPlayer.id;
          state.awaitingActions = [];
          return;
        } else {
          state.overtime = true;
        }
      }

      state.awaitingActions = [
        { type: "PLAY_HAND", playerId: nextPlayer.id },
        { type: "BUY_CARD", playerId: nextPlayer.id },
        { type: "END_TURN", playerId: nextPlayer.id },
      ];

      if (nextPlayer.domain) {
        state.awaitingActions.push({
          type: "SET_SUCCESSION_CARD",
          playerId: nextPlayer.id,
        });
      } else {
        state.awaitingActions.push({
          type: "BACK_PRINCESS",
          playerId: nextPlayer.id,
        });
      }

      break;
    }
    default: {
      const _: never = action;
      throw `Unhandled action ${JSON.stringify(action)}`;
    }
  }

  const turnPlayer = state.players[state.turnPlayerIndex];
  turnPlayer.successionPoints = calcSuccessionPoints(turnPlayer);

  if (state.overtime) {
    const winner = state.players.find(
      (p) =>
        p.successionPoints &&
        p.successionPoints >= OVERTIME_WINNER_REQUIREMENT_POINTS
    );

    if (winner) {
      state.winnerPlayerId = winner.id;
      state.awaitingActions = [];
    }
  } else {
    if (
      turnPlayer.successionPoints &&
      turnPlayer.successionPoints >= CORONATION_CEREMONY_REQUIREMENT_POINTS &&
      !turnPlayer.coronationCeremonyDeclared
    ) {
      state.awaitingActions.push({
        type: "DECLARE_CORONATION_CEREMONY",
        playerId: turnPlayer.id,
      });
    }
  }
});
