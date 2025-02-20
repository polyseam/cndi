// deno-lint-ignore-file react-no-danger
export default function SegmentSnippet({
  domain,
  analyticsCode,
  mixpanelCode,
}: {
  domain: string;
  analyticsCode: string;
  mixpanelCode: string;
}) {
  const __html = `
    !function(){var i="analytics",analytics=window[i]=window[i]||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","screen","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware","register"];analytics.factory=function(e){return function(){if(window[i].initialized)return window[i][e].apply(window[i],arguments);var n=Array.prototype.slice.call(arguments);if(["track","screen","alias","group","page","identify"].indexOf(e)>-1){var c=document.querySelector("link[rel='canonical']");n.push({__t:"bpc",c:c&&c.getAttribute("href")||void 0,p:location.pathname,u:location.href,s:location.search,t:document.title,r:document.referrer})}n.unshift(e);analytics.push(n);return analytics}};for(var n=0;n<analytics.methods.length;n++){var key=analytics.methods[n];analytics[key]=analytics.factory(key)}analytics.load=function(key,n){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute("data-global-segment-analytics-key",i);t.src="https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r);analytics._loadOptions=n};analytics._writeKey="MS1j3f3cwJSgjFxigYY2bTQ6LtPjypXG";;analytics.SNIPPET_VERSION="5.2.0";
    analytics.load("${analyticsCode}",{ cookie: { domain: "${domain}" });
    analytics.page();
    }}();
  
  // Mixpanel Snippet
  // patched from https://github.com/vercel/next.js/issues/4480
  (function (f, b) { if (!b.__SV) { var e, g, i, h; window.mixpanel = b; b._i = []; b.init = function (e, f, c) { function g(a, d) { var b = d.split("."); 2 == b.length && ((a = a[b[0]]), (d = b[1])); a[d] = function () { a.push([d].concat(Array.prototype.slice.call(arguments, 0))); }; } var a = b; "undefined" !== typeof c ? (a = b[c] = []) : (c = "mixpanel"); a.people = a.people || []; a.toString = function (a) { var d = "mixpanel"; "mixpanel" !== c && (d += "." + c); a || (d += " (stub)"); return d; }; a.people.toString = function () { return a.toString(1) + ".people (stub)"; }; i = "disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split( " "); for (h = 0; h < i.length; h++) g(a, i[h]); var j = "set set_once union unset remove delete".split(" "); a.get_group = function () { function b(c) { d[c] = function () { call2_args = arguments; call2 = [c].concat(Array.prototype.slice.call(call2_args, 0)); a.push([e, call2]); }; } for ( var d = {}, e = ["get_group"].concat( Array.prototype.slice.call(arguments, 0)), c = 0; c < j.length; c++) b(j[c]); return d; }; b._i.push([e, f, c]); }; b.__SV = 1.2; e = f.createElement("script"); e.type = "text/javascript"; e.async = !0; e.src = "undefined" !== typeof MIXPANEL_CUSTOM_LIB_URL ? MIXPANEL_CUSTOM_LIB_URL : "file:" === f.location.protocol && "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//) ? "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js" : "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"; g = f.getElementsByTagName("script")[0]; g.parentNode.insertBefore(e, g); } })(document, window.mixpanel || []);
  
  mixpanel.init(
      "${mixpanelCode}", 
      {
          record_sessions_percent: 100,  //records 100% of all sessions
          record_mask_text_selector: '.mask-text-in-replay',
          record_block_selector: '.block-in-replay',
      }
  )
  
  // Middleware to add Mixpanel's session recording properties to Segment events
  analytics.addSourceMiddleware(({ payload, next, integrations }) => {
      if (payload.obj.type === 'track' || payload.obj.type === 'page') {
          if (window.mixpanel) {
              const segmentDeviceId = payload.obj.anonymousId;
              // Simplified ID Merge
              mixpanel.register({ $device_id: segmentDeviceId, distinct_id : "$device:"+segmentDeviceId }); 
              // -------------------------------------------	
              const sessionReplayProperties = mixpanel.get_session_recording_properties();
              payload.obj.properties = {
                  ...payload.obj.properties,
                  ...sessionReplayProperties
              };
          }
      }
      if (payload.obj.type === 'identify') {
          if (window.mixpanel) {
              const userId = payload.obj.userId;
              mixpanel.identify(userId);
          }
      }
      next(payload);
  });
    `;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html }} />
    </>
  );
}
