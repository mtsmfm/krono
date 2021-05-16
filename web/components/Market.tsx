import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import React from "react";
import {
  ActionType,
  Market_GameFragment,
  useBuyCardMutation,
} from "../generated/urql";
import { Card } from "./Card";
import { groupBy } from "lodash";

/* GraphQL */ `
fragment Market_game on Game {
  basicMarket { ...Card_card }
  randomMarket { ...Card_card }
  supplyPile { ...Card_card }
  me {
    awaitingActions {
      type
    }
  }
}
`;

/* GraphQL */ `
mutation BuyCard($cardId: ID!) {
  actionBuyCard(cardId: $cardId)
}
`;

export const Market: React.FC<{
  game: Market_GameFragment;
  refetch: () => void;
}> = ({ game, refetch }) => {
  const basicMarketCards = groupBy(game.basicMarket, (c) => c.name);
  const randomMarketCards = groupBy(game.randomMarket, (c) => c.name);

  const cardBuyable = game.me?.awaitingActions.some(
    (a) => a.type === ActionType.BuyCard
  );

  const [{}, buyCard] = useBuyCardMutation();

  return (
    <>
      <Typography variant="caption" display="block">
        Basic market
      </Typography>
      <Grid container>
        {Object.entries(basicMarketCards).map(([_, cards]) => (
          <Grid item key={cards[0].id} xs={1}>
            <Card
              card={cards[0]}
              onClick={
                cardBuyable
                  ? () => {
                      buyCard({ cardId: cards[0].id }).then(refetch);
                    }
                  : undefined
              }
            />
            x {cards.length}
          </Grid>
        ))}
      </Grid>
      <Typography variant="caption" display="block">
        Random market
      </Typography>
      <Grid container>
        {Object.entries(randomMarketCards).map(([_, cards]) => (
          <Grid item key={cards[0].id} xs={1}>
            <Card card={cards[0]} />x {cards.length}
          </Grid>
        ))}
      </Grid>
      <Typography variant="caption" display="block">
        Supply pile: {game.supplyPile.length}
      </Typography>
    </>
  );
};
