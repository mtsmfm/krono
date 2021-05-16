import Typography from "@material-ui/core/Typography";
import { MyPlayArea_MeFragment } from "../generated/urql";
import Grid from "@material-ui/core/Grid";
import React from "react";
import { Card } from "../components/Card";
import blue from "@material-ui/core/colors/blue";

/* GraphQL */ `
fragment MyPlayArea_me on Player {
  id
  hand {
    id
    ...Card_card
  }
  currentCoins
  discardPile {
    ...Card_card
  }
  drawPile {
    ...Card_card
  }
  linkRemains
  playingCards {
    ...Card_card
  }
  successionPoints
}
`;

export const MyPlayArea: React.FC<{
  me: MyPlayArea_MeFragment;
  isTurnPlayer: boolean;
}> = ({ me, isTurnPlayer }) => {
  return (
    <div
      style={{
        border: isTurnPlayer ? `1px solid ${blue[300]}` : "",
      }}
    >
      {me && (
        <>
          <Typography variant="subtitle1">{me.id}</Typography>
          <Typography variant="caption">Hand</Typography>
          <Grid container>
            {me.hand.map((c, i) => (
              <Grid item key={c?.id || i} xs={1}>
                <Card card={c}></Card>
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" display="block">
            Current coins: {me.currentCoins}
          </Typography>
          <Typography variant="caption" display="block">
            Discard pile: {me.discardPile.length}
          </Typography>
          <Typography variant="caption" display="block">
            Draw pile: {me.drawPile.length}
          </Typography>
        </>
      )}
    </div>
  );
};
