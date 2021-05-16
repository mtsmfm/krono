import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { useRootQuery } from "../generated/urql";
import Divider from "@material-ui/core/Divider";
import { Market } from "../components/Market";

/* GraphQL */ `
query Root {
  game {
    players {
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
    awaitingActions {
      playerId
      type
    }
    curseCards { ...Card_card }
    firstCoronationCeremonyDeclaredPlayerIndex
    outskirts { ...Card_card }
    overtime
    princessCards { ...Card_card }
    turnPlayerIndex
    winnerPlayerId
    ...Market_game
  }
}
`;

export default function Home() {
  const [result, refetch] = useRootQuery();

  const [currentPlayerId, setCurrentPlayerId] = useState("");

  useEffect(() => {
    (window as any).__krono_player_id = currentPlayerId;

    refetch();
  }, [currentPlayerId]);

  useEffect(() => {
    if (
      result.data?.game &&
      !result.data.game.players.some((p) => p.id === currentPlayerId)
    ) {
      setCurrentPlayerId(result.data.game.players[0].id);
    }
  }, [result.data?.game?.players, currentPlayerId]);

  if (result.fetching || !result.data) {
    return "loading";
  }

  if (!result.data.game || result.error) {
    return "error";
  }

  return (
    <Container>
      <Market game={result.data.game} />

      <Divider />

      <Select
        value={currentPlayerId}
        onChange={(e: any) => {
          setCurrentPlayerId(e.target.value);
        }}
      >
        {result.data.game.players.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.id}
          </MenuItem>
        ))}
      </Select>

      <Divider />

      {result.data.game.players.map((p) => (
        <div key={p.id}>
          <Typography variant="subtitle1">{p.id}</Typography>
          <Typography variant="caption">Hand</Typography>
          <Grid container>
            {p.hand.map((c, i) => (
              <Grid item key={c?.id || i} xs={1}>
                <Card card={c}></Card>
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" display="block">
            Current coins: {p.currentCoins}
          </Typography>
          <Typography variant="caption" display="block">
            Discard pile: {p.discardPile.length}
          </Typography>
          <Typography variant="caption" display="block">
            Draw pile: {p.drawPile.length}
          </Typography>
          <Divider />
        </div>
      ))}
    </Container>
  );
}
