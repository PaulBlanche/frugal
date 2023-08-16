import { Navigation } from "./Navigation.tsx";
import { Head, PageProps } from "../../dep/frugal/preact.server.ts";
import { Hero } from "./Hero.tsx";
import { Main } from "./Main.tsx";

import "./Page.css";

export function Page({ assets, descriptor }: PageProps) {
  console.log("Render page");

  const stylesheetHref = assets["style"][descriptor];
  const scriptSrc = assets["script"][descriptor];
  return (
    <>
      <Head>
        {stylesheetHref && <link href={stylesheetHref} rel="stylesheet" />}
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Navigation />
      <Hero />

      <Main />

      <script src={scriptSrc} />
    </>
  );
}
