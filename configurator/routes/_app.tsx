import { type PageProps } from "$fresh/server.ts";
import Nav from "components/Nav.tsx";
import Footer from "components/Footer.tsx";
import SegmentSnippet from "components/SegmentSnippet.tsx";
import GASnippet from "components/GASnippet.tsx";

export default function App({ Component, url }: PageProps) {
  const devMode = url.hostname === "localhost";

  if (devMode) {
    console.log("-- DEVMODE --");
  }

  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CNDI Configurator</title>
        <link rel="stylesheet" href="/styles.css" />
        {!devMode
          ? (
            <SegmentSnippet
              domain=".cndi.dev"
              mixpanelCode="26ce66c5e540b010ebdfa66679a34601"
              analyticsCode="mos3oCk9omHRbDaWH8jp1FCM8UHAKHFh"
            />
          )
          : <meta name="devmode" />}
      </head>
      <body class="bg-darkpurp text-white">
        <Nav url={url} />
        <Component />
        <Footer url={url} />
        {!devMode
          ? <GASnippet code="G-7REFQVSM9L" />
          : <script>{`console.log('GA Disabled for DEVMODE')`}</script>}
      </body>
    </html>
  );
}
