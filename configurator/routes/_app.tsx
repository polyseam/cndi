import { type PageProps } from "$fresh/server.ts";
import Nav from "components/Nav.tsx";
import Footer from "components/Footer.tsx";

export default function App({ Component, url }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>cndi-configurator</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-darkpurp text-white">
        <Nav url={url} />
        <Component />
        <Footer url={url} />
      </body>
    </html>
  );
}
