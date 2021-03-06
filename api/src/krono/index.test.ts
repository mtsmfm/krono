import { reducer, initialState, State } from "./index";
import { inspect } from "util";
import { findById, getCity, isType } from "./cardMasters";

inspect.defaultOptions.depth = null;
inspect.defaultOptions.maxArrayLength = null;
inspect.defaultOptions.maxStringLength = null;

describe("krono", () => {
  let state: State;
  let playerIds = ["foo", "bar", "baz", "qux"];

  beforeEach(() => {
    state = reducer(initialState, {
      type: "INIT",
      playerIds,
    });
  });

  it("produces game state", () => {
    expect(state.players.map((p) => p.id)).toEqual(playerIds);

    playerIds.forEach((playerId, index) => {
      expect(state.awaitingActions.length).toEqual(4 - index);

      state = reducer(state, {
        type: "HAND_ELIMINATION",
        playerId,
        coin: 5 - index,
      });
    });

    expect(state.players.map((p) => p.id)).not.toEqual(playerIds);
    playerIds.reverse();
    expect(state.players.map((p) => p.id)).toEqual(playerIds);

    playerIds.forEach((playerId, index) => {
      const player = state.players.find((p) => p.id === playerId)!;

      expect(player.hand.length).toEqual(5);
      expect(player.drawPile.length).toEqual(5);
      expect(player.discardPile.length).toEqual(0);

      expect(
        player.hand
          .map((c) => findById(c.cardMasterId)!)
          .filter(isType("territory")).length
      ).toEqual(index + 2);

      expect(
        player.drawPile
          .map((c) => findById(c.cardMasterId)!)
          .filter(isType("territory")).length
      ).toEqual(5 - index);
    });

    playerIds.forEach((id, i) => {
      let player = state.players.find((p) => p.id === id)!;
      expect(player.currentCoins).toEqual(0);
      expect(
        player.hand.filter(
          (c) => findById(c.cardMasterId)!.type === "territory"
        ).length
      ).toEqual(i + 2);

      const territories = player.hand.filter(
        (c) => findById(c.cardMasterId)!.type === "territory"
      );

      territories.forEach((c) => {
        state = reducer(state, {
          type: "PLAY_HAND",
          playerId: player.id,
          cardId: c.id,
        });
      });

      player = state.players.find((p) => p.id === id)!;
      expect(player.currentCoins).toEqual(territories.length);
      expect(state.turnPlayerIndex).toEqual(i);
      expect(player.hand.length).toEqual(5 - territories.length);

      if (player.currentCoins >= getCity().cost) {
        const city = state.basicMarket.find(
          (c) => getCity().id === c.cardMasterId
        )!;

        state = reducer(state, {
          type: "BUY_CARD",
          playerId: player.id,
          cardId: city.id,
        });

        player = state.players.find((p) => p.id === id)!;
        expect(player.discardPile[0].id).toEqual(city.id);
        expect(player.currentCoins).toEqual(
          territories.length - getCity().cost
        );
      }

      state = reducer(state, {
        type: "END_TURN",
        playerId: player.id,
      });
      player = state.players.find((p) => p.id === id)!;
      expect(
        player.hand.filter(
          (c) => findById(c.cardMasterId)!.type === "territory"
        ).length
      ).toEqual(5 - i);
      expect(state.turnPlayerIndex).toEqual((i + 1) % playerIds.length);
    });

    console.dir(state);
  });
});
