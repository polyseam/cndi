import { ComponentChildren } from "preact";

type Props = {
  children: ComponentChildren;
  pathname: string;
  className?: string;
  contentVersion: string;
  utm_content: string;
  utm_source: string;
  utm_id: number;
  utm_medium?: string;
  query?: Record<string, string>;
};

const UTM_CAMPAIGN_PREFIX = "site_cndidev@";

declare global {
  interface Window {
    analytics?: {
      // deno-lint-ignore no-explicit-any
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}

/**
 * LinkOut component is used to create a link that opens in a new tab with UTM parameters for tracking
 * @param {Props} props
 * @returns {JSX.Element}
 */
export default function LinkOut(props: Props) {
  const { children, pathname, className } = props;
  const query = props.query || {};
  const utm_medium = props?.utm_medium || "website";
  const utm_campaign = `${UTM_CAMPAIGN_PREFIX}${props.contentVersion}`;

  const data: Record<string, string | number> = {
    utm_content: props.utm_content,
    utm_campaign,
    utm_source: props.utm_source,
    utm_medium,
    utm_id: props.utm_id,
  };

  let href =
    `https://cndi.run${pathname}?utm_content=${props.utm_content}&utm_campaign=${utm_campaign}&utm_source=${props.utm_source}&utm_medium=${utm_medium}&utm_id=${props.utm_id}`;

  for (const key in query) {
    href += `&${key}=${query[key]}`;
    data[key] = query[key];
  }

  const trackClick = () => {
    // deno-lint-ignore no-window
    window?.analytics?.track("Link Out Clicked", data);
    if (pathname === "/gh") {
      fetch(`${href}&synthetic=true`);
    }
  };

  return (
    <a
      // if the link is to the GitHub repo, use the GitHub URL
      // and synthesizes a link shortener request
      href={pathname === "/gh" ? `https://github.com/polyseam/cndi` : href}
      className={className || ""}
      target="_blank"
      onClick={trackClick}
    >
      {children}
    </a>
  );
}
