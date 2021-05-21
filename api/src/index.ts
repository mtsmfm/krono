import { ApolloServer } from "apollo-server";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import {
  makeSchema,
  queryType,
  objectType,
  mutationType,
  nonNull,
  intArg,
  list,
  stringArg,
  fieldAuthorizePlugin,
  enumType,
  idArg,
} from "nexus";
import path, { dirname, join } from "path";
import { initialState, reducer, State } from "./krono";
import { findById } from "./krono/cardMasters";

const Card = objectType({
  name: "Card",
  definition(t) {
    t.nonNull.id("id");
    t.nonNull.string("name", {
      resolve(c) {
        return findById(c.cardMasterId)!.name;
      },
    });
  },
});

const Domain = objectType({
  name: "Domain",
  definition(t) {
    t.nonNull.list.nonNull.field("territories", { type: Card });
    t.nonNull.field("princess", { type: Card });
    t.nonNull.list.nonNull.field("successionCards", { type: Card });
  },
});

const Player = objectType({
  name: "Player",
  definition(t) {
    t.nonNull.id("id");
    t.nonNull.list.field("hand", {
      type: Card,
      resolve(player, _, { playerId }) {
        if (player.id === playerId) {
          return player.hand;
        } else {
          return player.hand.map(() => null);
        }
      },
    });
    t.nonNull.list.field("drawPile", {
      type: Card,
      resolve(player) {
        return player.drawPile.map(() => null);
      },
    });
    t.nonNull.list.nonNull.field("discardPile", { type: Card });
    t.field("domain", { type: Domain });
    t.nonNull.list.nonNull.field("playingCards", { type: Card });
    t.nonNull.int("currentCoins");
    t.nonNull.int("linkRemains");
    t.int("successionPoints");
    t.nonNull.boolean("coronationCeremonyDeclared");
    t.nonNull.boolean("isTurnPlayer", {
      resolve(p, _, { gameState }) {
        return p.id === gameState.players[gameState.turnPlayerIndex].id;
      },
    });
    t.nonNull.list.nonNull.field("awaitingActions", {
      type: AwaitingAction,
      resolve(p, _, { gameState }) {
        return gameState.awaitingActions.filter((a) => a.playerId === p.id);
      },
    });
  },
});

const ActionType = enumType({
  name: "ActionType",
  members: [
    "HAND_ELIMINATION",
    "PLAY_HAND",
    "BUY_CARD",
    "BACK_PRINCESS",
    "SET_SUCCESSION_CARD",
    "DECLARE_CORONATION_CEREMONY",
    "END_TURN",
  ],
});

const AwaitingAction = objectType({
  name: "AwaitingAction",
  definition(t) {
    t.nonNull.id("playerId");
    t.nonNull.field("type", { type: ActionType });
  },
});

const Game = objectType({
  name: "Game",
  definition(t) {
    t.field("me", {
      type: Player,
      resolve(g, _, { playerId }) {
        return g.players.find((p) => p.id === playerId) || null;
      },
    });
    t.list.nonNull.field("opponents", {
      type: Player,
      resolve(g, _, { playerId }) {
        if (!playerId) {
          return null;
        }
        return g.players.filter((p) => p.id !== playerId);
      },
    });
    t.nonNull.list.nonNull.field("players", { type: Player });
    t.nonNull.list.nonNull.field("outskirts", { type: Card });
    t.nonNull.list.field("supplyPile", { type: Card });
    t.nonNull.list.nonNull.field("curseCards", { type: Card });
    t.nonNull.list.nonNull.field("princessCards", { type: Card });
    t.nonNull.list.nonNull.field("basicMarket", { type: Card });
    t.nonNull.list.nonNull.field("randomMarket", { type: Card });
    t.nonNull.list.nonNull.field("awaitingActions", { type: AwaitingAction });
    t.int("firstCoronationCeremonyDeclaredPlayerIndex");
    t.nonNull.boolean("overtime");
    t.nonNull.field("turnPlayer", {
      type: Player,
      resolve(g) {
        return g.players[g.turnPlayerIndex];
      },
    });
    t.field("winner", {
      type: Player,
      resolve(g) {
        if (g.winnerPlayerId) {
          return g.players.find((p) => p.id === g.winnerPlayerId)!;
        } else {
          return null;
        }
      },
    });
  },
});

const Query = queryType({
  definition(t) {
    t.field("game", {
      type: Game,
      resolve(_x, _y, { gameState }) {
        return gameState;
      },
    });
  },
});

const Mutation = mutationType({
  definition(t) {
    t.boolean("init", {
      args: {
        playerIds: nonNull(list(nonNull(stringArg()))),
      },
      resolve(_, { playerIds }) {
        state = reducer(state, {
          type: "INIT",
          playerIds,
        });

        return true;
      },
    });
    t.boolean("actionHandElimination", {
      args: {
        coin: nonNull(intArg()),
      },
      resolve(_, { coin }, { playerId }) {
        if (playerId === undefined) {
          throw "invalid";
        }

        state = reducer(state, {
          type: "HAND_ELIMINATION",
          coin,
          playerId,
        });

        return true;
      },
    });
    t.boolean("actionPlayHand", {
      args: {
        cardId: nonNull(idArg()),
      },
      resolve(_, { cardId }, { playerId }) {
        if (playerId === undefined) {
          throw "invalid";
        }

        state = reducer(state, {
          type: "PLAY_HAND",
          cardId,
          playerId,
        });

        return true;
      },
    });
    t.boolean("actionBuyCard", {
      args: {
        cardId: nonNull(idArg()),
      },
      resolve(_, { cardId }, { playerId }) {
        if (playerId === undefined) {
          throw "invalid";
        }

        state = reducer(state, {
          type: "BUY_CARD",
          playerId,
          cardId,
        });

        return true;
      },
    });
    t.boolean("actionEndTurn", {
      resolve(_, {}, { playerId }) {
        if (playerId === undefined) {
          throw "invalid";
        }

        state = reducer(state, {
          type: "END_TURN",
          playerId,
        });

        return true;
      },
    });
  },
});

export interface Context {
  playerId: string | undefined;
  gameState: State;
}

const schema = makeSchema({
  types: [Query, Mutation],
  plugins: [fieldAuthorizePlugin()],
  sourceTypes: {
    modules: [
      {
        module: path.join(__dirname, "krono", "index.ts"),
        alias: "krono",
      },
    ],
    mapping: {
      Game: "krono.State",
    },
  },
  contextType: {
    module: __filename,
    export: "Context",
  },
  outputs: {
    typegen: join(__dirname, "generated", "nexus-typegen.ts"),
    schema: join(__dirname, "generated", "schema.graphql"),
  },
});

const server = new ApolloServer({
  schema,
  context({ req }) {
    return {
      playerId: req.header("x-krono-player-id"),
      gameState: state,
    };
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

let state: State;
const stateFilePath = join(__dirname, "..", "tmp", "state.json");
mkdirSync(dirname(stateFilePath), { recursive: true });
if (existsSync(stateFilePath)) {
  state = JSON.parse(readFileSync(stateFilePath, "utf8"));
} else {
  state = initialState;
}

process.on("exit", () => {
  writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
});
