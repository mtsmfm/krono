import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { Market_GameFragment } from "../generated/urql";
import { Card } from "./Card";
import { groupBy } from "lodash";

/* GraphQL */ `
fragment Market_game on Game {
  basicMarket { ...Card_card }
  randomMarket { ...Card_card }
  supplyPile { ...Card_card }
}
`;

export const Market: React.FC<{ game: Market_GameFragment }> = ({ game }) => {
  const basicMarketCards = groupBy(game.basicMarket, (c) => c.name);
  const randomMarketCards = groupBy(game.randomMarket, (c) => c.name);

  return (
    <>
      <Typography variant="caption" display="block">
        Basic market
      </Typography>
      <Grid container>
        {Object.entries(basicMarketCards).map(([_, cards]) => (
          <Grid item key={cards[0].id} xs={1}>
            <Card card={cards[0]} />x {cards.length}
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
