import CardActionArea from "@material-ui/core/CardActionArea";
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

export const Card: React.FC<{
  card: Card_CardFragment | null;
  onClick?: () => void;
}> = ({ card, onClick }) => {
  return (
    <MuiCard>
      {onClick ? (
        <CardActionArea onClick={onClick}>
          <CardContent>
            <Typography>{card ? card.name : "?"}</Typography>
          </CardContent>
        </CardActionArea>
      ) : (
        <CardContent>
          <Typography>{card ? card.name : "?"}</Typography>
        </CardContent>
      )}
    </MuiCard>
  );
};
