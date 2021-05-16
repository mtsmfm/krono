import MuiCard from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { Card_CardFragment } from "../generated/urql";

/* GraphQL */ `
fragment Card_card on Card {
  id
  name
}
`;

export const Card: React.FC<{ card: Card_CardFragment | null }> = ({
  card,
}) => {
  return (
    <MuiCard>
      <CardContent>
        <Typography>{card ? card.name : "?"}</Typography>
      </CardContent>
    </MuiCard>
  );
};
