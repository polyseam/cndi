import LinkOut from "islands/LinkOut.tsx";

type NavProps = {
  url: URL;
};

export default function Nav(props: NavProps) {
  const navVersion = "v2.0.0";
  const utm_source = props.url.toString();
  return (
    <div class="flex justify-between m-8">
      <div>
        <LinkOut
          utm_id={8056}
          utm_content="nav_blog_configurator"
          utm_source={utm_source}
          contentVersion={navVersion}
          pathname="/dev"
          className="inline-block p-2 align-top position-relative text-align-left"
        >
          <img
            src="/images/logo/cndi_by_polyseam.png"
            loading="lazy"
            width="125"
          />
        </LinkOut>
      </div>
      <nav role="navigation" class="my-4">
        <div class="grid grid-flow-row gap-4 sm:grid-flow-col">
          <a
            aria-current="page"
            href="https://configurator.cndi.dev"
            className="inline-block p-2 align-top position-relative text-align-left"
          >
            Configurator
          </a>
          <LinkOut
            utm_id={8056}
            utm_content="nav_blog_configurator"
            utm_source={utm_source}
            contentVersion={navVersion}
            pathname="/blog"
            className="inline-block p-2 align-top position-relative text-align-left"
          >
            Blog
          </LinkOut>
          <LinkOut
            utm_id={8056}
            utm_content="nav_templates_configurator"
            pathname="/templates"
            className="inline-block p-2 align-top position-relative text-align-left"
            contentVersion={navVersion}
            utm_source={utm_source}
          >
            Templates
          </LinkOut>
          <LinkOut
            utm_id={8056}
            utm_content="nav_discord_configurator"
            pathname="/di"
            className="inline-block p-2 align-top position-relative text-align-left"
            contentVersion={navVersion}
            utm_source={utm_source}
          >
            Discord
          </LinkOut>
          <LinkOut
            pathname="/gh"
            utm_content="nav_github_configurator"
            utm_source={utm_source}
            utm_id={8000}
            contentVersion={navVersion}
            className="flex flex-row items-center justify-center align-top position-relative text-align-left"
          >
            <div class="w-10">
              <img
                src="/images/logo/GitHub.png"
                loading="lazy"
                alt="Github Logo"
                width="40"
              />
            </div>
          </LinkOut>
        </div>
      </nav>
    </div>
  );
}
