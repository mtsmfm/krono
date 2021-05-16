import { OpponentsPlayArea_OpponentFragment } from "../generated/urql";
import Typography from "@material-ui/core/Typography";
import React from "react";
import blue from "@material-ui/core/colors/blue";

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
  isTurnPlayer: boolean;
  opponent: OpponentsPlayArea_OpponentFragment;
}> = ({ isTurnPlayer, opponent }) => {
  return (
    <div
      style={{
        border: isTurnPlayer ? `1px solid ${blue[300]}` : "",
      }}
    >
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
