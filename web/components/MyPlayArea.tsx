import Typography from "@material-ui/core/Typography";
import {
  ActionType,
  MyPlayArea_MeFragment,
  useEndTurnMutation,
  usePlayHandMutation,
} from "../generated/urql";
import Grid from "@material-ui/core/Grid";
import React from "react";
import { Card } from "../components/Card";
import blue from "@material-ui/core/colors/blue";
import Button from "@material-ui/core/Button";
import { Transition, TransitionGroup } from "react-transition-group";

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
  isTurnPlayer
  awaitingActions {
    type
  }
}
`;

/* GraphQL */ `
mutation PlayHand($cardId: ID!) {
  actionPlayHand(cardId: $cardId)
}
`;

/* GraphQL */ `
mutation EndTurn {
  actionEndTurn
}
`;

const duration = 100;

const defaultStyle = {
  transition: `opacity ${duration}ms ease-in-out`,
  opacity: 1,
} as const;

const transitionStyles: { [k: string]: React.CSSProperties } = {
  entering: { opacity: 0.5 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 },
  unmounted: { opacity: 0 },
} as const;

export const MyPlayArea: React.FC<{
  me: MyPlayArea_MeFragment;
  refetch: () => void;
}> = ({ me, refetch }) => {
  const [{}, playHand] = usePlayHandMutation();
  const [{}, endTurn] = useEndTurnMutation();

  const handPlayable = me.awaitingActions.some(
    (a) => a.type === ActionType.PlayHand
  );

  return (
    <div
      style={{
        border: me.isTurnPlayer ? `1px solid ${blue[300]}` : "",
      }}
    >
      {me && (
        <>
          <Typography variant="subtitle1">{me.id}</Typography>
          <Typography variant="caption" display="block">
            Playing cards
          </Typography>
          <Grid container>
            <TransitionGroup component={null}>
              {me.playingCards.map((c) => (
                <Transition in timeout={300} key={c.id}>
                  {(state) => (
                    <Grid item xs={1}>
                      <Card
                        card={c}
                        style={{
                          ...defaultStyle,
                          ...transitionStyles[state],
                        }}
                      />
                    </Grid>
                  )}
                </Transition>
              ))}
            </TransitionGroup>
          </Grid>
          <Typography variant="caption" display="block">
            Hand
          </Typography>
          <Grid container>
            <TransitionGroup component={null}>
              {me.hand.map((c) => (
                <Transition key={c!.id} in timeout={150}>
                  {(state) => (
                    <Grid item xs={1}>
                      <Card
                        card={c}
                        style={{
                          ...defaultStyle,
                          ...transitionStyles[state],
                        }}
                        onClick={
                          handPlayable
                            ? () => {
                                playHand({ cardId: c!.id }).then(refetch);
                              }
                            : undefined
                        }
                      />
                    </Grid>
                  )}
                </Transition>
              ))}
            </TransitionGroup>
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
          {me.awaitingActions.some((a) => a.type === ActionType.EndTurn) && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => endTurn().then(refetch)}
            >
              End turn
            </Button>
          )}
        </>
      )}
    </div>
  );
};
