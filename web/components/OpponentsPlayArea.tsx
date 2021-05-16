import { OpponentsPlayArea_OpponentFragment } from "../generated/urql";
import Typography from "@material-ui/core/Typography";
import React from "react";

/* GraphQL */ `
fragment OpponentsPlayArea_opponent on Player {
  id
  hand { id }
  currentCoins
  discardPile { id }
  drawPile { id }
  linkRemains
  playingCards { id }
  successionPoints
}
`;

export const OpponentsPlayArea: React.FC<{
  opponent: OpponentsPlayArea_OpponentFragment;
}> = ({ opponent }) => {
  return (
    <div>
      <Typography variant="subtitle1">{opponent.id}</Typography>
      <Typography variant="caption" display="block">
        Hand: {opponent.hand.length}
      </Typography>
      <Typography variant="caption" display="block">
        Current coins: {opponent.currentCoins}
      </Typography>
      <Typography variant="caption" display="block">
        Discard pile: {opponent.discardPile.length}
      </Typography>
      <Typography variant="caption" display="block">
        Draw pile: {opponent.drawPile.length}
      </Typography>
    </div>
  );
};
