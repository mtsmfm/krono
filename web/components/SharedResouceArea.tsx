import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { SharedResourceArea_GameFragment } from "../generated/urql";
import { Card } from "./Card";
import { Market } from "./Market";

/* GraphQL */ `
fragment SharedResourceArea_game on Game {
  ...Market_game
  outskirts { id }
  princessCards { ...Card_card }
}
`;

export const SharedResourceArea: React.FC<{
  game: SharedResourceArea_GameFragment;
}> = ({ game }) => {
  return (
    <>
      <Market game={game} />
      <Typography variant="caption" display="block">
        Outskirts: {game.outskirts.length}
      </Typography>
      <Typography variant="caption" display="block">
        Princess cards
      </Typography>
      <Grid container>
        {game.princessCards.map((c) => (
          <Grid item key={c.id}>
            <Card card={c} />
          </Grid>
        ))}
      </Grid>
    </>
  );
};
