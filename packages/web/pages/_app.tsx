import { AppProps } from 'next/app';
import Head from 'next/head';
import { MantineProvider } from '@mantine/core';
import PlausibleProvider from "next-plausible";
import { Source_Sans_Pro } from "@next/font/google";

import "./global.css";

const ssp = Source_Sans_Pro({
  weight: "400",
  subsets: ["latin"],
});

const App = (props: AppProps) => {
  const { Component, pageProps } = props;

  return (
    <>
      <Head>
        <title>Discord Word of the Day</title>
        <meta name="description" content="Word of the Day delivered directly to your Discord guild." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/WotD.ico" />
      </Head>

      <PlausibleProvider
        domain="wotd.halfmatthalfcat.com"
        enabled={process.env.NODE_ENV === "production"}
      >
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{
            /** Put your mantine theme override here */
            colorScheme: 'light',
            globalStyles: (theme) => ({
              body: {
                ...theme.fn.fontStyles(),
                ...ssp.style,
              },
            }),
          }}
        >
          <Component {...pageProps} />
        </MantineProvider>
      </PlausibleProvider>
    </>
  );
}

export default App;