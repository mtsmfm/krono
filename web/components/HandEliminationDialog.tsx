import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import List from "@material-ui/core/List";
import ListItemText from "@material-ui/core/ListItemText";
import ListItem from "@material-ui/core/ListItem";
import {
  ActionType,
  HandEliminationDialog_GameFragment,
  useHandEliminationMutation,
} from "../generated/urql";
import React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";

/* GraphQL */ `
fragment HandEliminationDialog_game on Game {
  me {
    awaitingActions {
      type
    }
  }
}
`;

/* GraphQL */ `
mutation HandElimination($coin: Int!) {
  actionHandElimination(coin: $coin)
}
`;

export const HandEliminationDialog: React.FC<{
  game: HandEliminationDialog_GameFragment;
  refetch: () => void;
}> = ({ game, refetch }) => {
  const [{ fetching }, action] = useHandEliminationMutation();

  return (
    <Dialog
      open={
        !!game.me?.awaitingActions.some(
          (a) => a.type === ActionType.HandElimination
        )
      }
    >
      <DialogTitle>Hand elimination</DialogTitle>
      {fetching ? (
        <CircularProgress />
      ) : (
        <List>
          {[2, 3, 4, 5].map((coin) => (
            <ListItem
              button
              key={coin}
              onClick={() => action({ coin }).then(refetch)}
            >
              <ListItemText>{coin}</ListItemText>
            </ListItem>
          ))}
        </List>
      )}
    </Dialog>
  );
};
