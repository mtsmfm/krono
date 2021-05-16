import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import React, { useEffect, useState } from "react";
import { useRootQuery } from "../generated/urql";
import Divider from "@material-ui/core/Divider";
import { MyPlayArea } from "../components/MyPlayArea";
import { OpponentsPlayArea } from "../components/OpponentsPlayArea";
import { SharedResourceArea } from "../components/SharedResouceArea";
import { HandEliminationDialog } from "../components/HandEliminationDialog";

/* GraphQL */ `
query Root {
  game {
    me {
      ...MyPlayArea_me
    }
    opponents {
      ...OpponentsPlayArea_opponent
    }
    players {
      id
    }
    awaitingActions {
      playerId
      type
    }
    firstCoronationCeremonyDeclaredPlayerIndex
    overtime
    ...SharedResourceArea_game
    ...HandEliminationDialog_game
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
      <Grid container>
        {result.data.game.opponents?.map((o) => (
          <Grid item key={o.id} xs={4}>
            <OpponentsPlayArea opponent={o} />
          </Grid>
        ))}
      </Grid>

      <Divider />

      <SharedResourceArea game={result.data.game} />

      <Divider />

      {result.data.game.me && <MyPlayArea me={result.data.game.me} />}

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

      <HandEliminationDialog
        game={result.data.game}
        playerId={currentPlayerId}
        refetch={refetch}
      />
    </Container>
  );
}
