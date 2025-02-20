import LinkOut from "islands/LinkOut.tsx";

type FooterProps = {
  url: URL;
};

export default function Footer(props: FooterProps) {
  const footerVersion = "v2.0.0";
  const utm_source = props.url.toString();
  return (
    <>
      <section class="grid grid-cols-1 my-12">
        <div class="w-full mx-auto relative">
          <div class="flex justify-between items-center flex-col sm:justify-around sm:flex-row">
            <div class="flex my-8">
              <LinkOut
                utm_source={utm_source}
                pathname="/pio"
                utm_content="nav_github"
                utm_id={8000}
                contentVersion={footerVersion}
              >
                <img
                  src="/images/logo/polyseam.png"
                  loading="lazy"
                  width="211"
                  sizes="(max-width: 479px) 100vw, 211px"
                  alt="Polyseam Logo"
                  srcset="/images/logo/polyseam-p-500.png 500w, /images/logo/polyseam-p-800.png 800w, /images/logo/polyseam-p-1080.png 1080w, /images/logo/polyseam-p-1600.png 1600w, /images/logo/polyseam-p-2000.png 2000w, /images/logo/polyseam-p-2600.png 2600w, /images/logo/polyseam-p-3200.png 3200w"
                />
              </LinkOut>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="flex flex-col items-center justify-center sm:justify-start sm:items-start">
                <div class="text-lightpurp uppercase">Socials</div>
                <LinkOut
                  utm_content="footer_youtube"
                  utm_source={utm_source}
                  utm_id={8013}
                  contentVersion={footerVersion}
                  pathname="/yt"
                  className="text-white my-2"
                >
                  YouTube
                </LinkOut>
                <LinkOut
                  utm_content="footer_github"
                  utm_source={utm_source}
                  utm_id={8014}
                  contentVersion={footerVersion}
                  pathname="/gh"
                  className="text-white my-2"
                >
                  GitHub
                </LinkOut>
                <LinkOut
                  utm_content="footer_discord"
                  utm_source={utm_source}
                  utm_id={8015}
                  contentVersion={footerVersion}
                  pathname="/di"
                  className="text-white my-2"
                >
                  Discord
                </LinkOut>
                <LinkOut
                  utm_content="footer_twitter"
                  utm_source={utm_source}
                  utm_id={8016}
                  contentVersion={footerVersion}
                  pathname="/tw"
                  className="text-white my-2"
                >
                  Twitter
                </LinkOut>

                <LinkOut
                  utm_content="footer_linkedin"
                  utm_source={utm_source}
                  utm_id={8017}
                  contentVersion={footerVersion}
                  pathname="/li"
                  className="text-white my-2"
                >
                  LinkedIn
                </LinkOut>
              </div>
              <div class="flex flex-col items-center justify-center sm:justify-start sm:items-start">
                <div class="text-lightpurp uppercase">About</div>
                <a
                  href="https://cndi.dev/terms-of-use"
                  target="_blank"
                  class="text-white my-2"
                >
                  Terms of Use
                </a>
                <a
                  href="https://cndi.dev/privacy-policy"
                  target="_blank"
                  class="text-white my-2"
                >
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="align-middle text-center text-slate-500 text-sm py-4">
          Copyright © {new Date().getFullYear()}{" "}
          <a
            href="https://polyseam.io"
            aria-current="page"
            class="text-slate-600 underline"
          >
            Polyseam
          </a>
        </div>
      </section>
    </>
  );
}
