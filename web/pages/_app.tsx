import "../styles/globals.css";
import type { AppProps } from "next/app";
import { createClient, Provider } from "urql";
import React from "react";
import Head from "next/head";

const client = createClient({
  url: "http://localhost:4000/graphql",
  requestPolicy: "network-only",
  fetchOptions() {
    return {
      headers: {
        "x-krono-player-id":
          typeof window !== "undefined" && (window as any).__krono_player_id,
      },
    };
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider value={client}>
      <Head>
        <title>Krono</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </Provider>
  );
}

export default MyApp;
