// deno-lint-ignore-file
import __Process$ from "https://deno.land/std@0.173.0/node/process.ts";
import { Buffer as __Buffer$ } from "https://deno.land/std@0.173.0/node/buffer.ts";
import __fs$ from "https://deno.land/std@0.173.0/node/fs.ts";
var Hs = Object.create;
var Gt = Object.defineProperty;
var Qs = Object.getOwnPropertyDescriptor;
var Ks = Object.getOwnPropertyNames;
var Vs = Object.getPrototypeOf,
  Xs = Object.prototype.hasOwnProperty;
var Ys =
  ((e) =>
    typeof require < "u"
      ? require
      : typeof Proxy < "u"
      ? new Proxy(e, { get: (t, r) => (typeof require < "u" ? require : t)[r] })
      : e)(function (e) {
      if (typeof require < "u") return require.apply(this, arguments);
      throw new Error('Dynamic require of "' + e + '" is not supported');
    });
var ee = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var Js = (e, t, r, n) => {
  if ((t && typeof t == "object") || typeof t == "function") {
    for (let s of Ks(t)) {
      !Xs.call(e, s) &&
        s !== r &&
        Gt(e, s, {
          get: () => t[s],
          enumerable: !(n = Qs(t, s)) || n.enumerable,
        });
    }
  }
  return e;
};
var Te = (e, t, r) => (
  (r = e != null ? Hs(Vs(e)) : {}),
    Js(
      t || !e || !e.__esModule
        ? Gt(r, "default", { value: e, enumerable: !0 })
        : r,
      e,
    )
);
var qt = ee((mu, Ut) => {
  var te = 1e3,
    re = te * 60,
    ne = re * 60,
    K = ne * 24,
    Zs = K * 7,
    ei = K * 365.25;
  Ut.exports = function (e, t) {
    t = t || {};
    var r = typeof e;
    if (r === "string" && e.length > 0) return ti(e);
    if (r === "number" && isFinite(e)) return t.long ? ni(e) : ri(e);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" +
        JSON.stringify(e),
    );
  };
  function ti(e) {
    if (((e = String(e)), !(e.length > 100))) {
      var t =
        /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i
          .exec(
            e,
          );
      if (t) {
        var r = parseFloat(t[1]),
          n = (t[2] || "ms").toLowerCase();
        switch (n) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return r * ei;
          case "weeks":
          case "week":
          case "w":
            return r * Zs;
          case "days":
          case "day":
          case "d":
            return r * K;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return r * ne;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return r * re;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return r * te;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return r;
          default:
            return;
        }
      }
    }
  }
  function ri(e) {
    var t = Math.abs(e);
    return t >= K
      ? Math.round(e / K) + "d"
      : t >= ne
      ? Math.round(e / ne) + "h"
      : t >= re
      ? Math.round(e / re) + "m"
      : t >= te
      ? Math.round(e / te) + "s"
      : e + "ms";
  }
  function ni(e) {
    var t = Math.abs(e);
    return t >= K
      ? we(e, t, K, "day")
      : t >= ne
      ? we(e, t, ne, "hour")
      : t >= re
      ? we(e, t, re, "minute")
      : t >= te
      ? we(e, t, te, "second")
      : e + " ms";
  }
  function we(e, t, r, n) {
    var s = t >= r * 1.5;
    return Math.round(e / r) + " " + n + (s ? "s" : "");
  }
});
var Wt = ee((gu, zt) => {
  function si(e) {
    (r.debug = r),
      (r.default = r),
      (r.coerce = h),
      (r.disable = i),
      (r.enable = s),
      (r.enabled = u),
      (r.humanize = qt()),
      (r.destroy = g),
      Object.keys(e).forEach((c) => {
        r[c] = e[c];
      }),
      (r.names = []),
      (r.skips = []),
      (r.formatters = {});
    function t(c) {
      let f = 0;
      for (let d = 0; d < c.length; d++) {
        (f = (f << 5) - f + c.charCodeAt(d)), (f |= 0);
      }
      return r.colors[Math.abs(f) % r.colors.length];
    }
    r.selectColor = t;
    function r(c) {
      let f,
        d = null,
        m,
        P;
      function O(...F) {
        if (!O.enabled) return;
        let U = O,
          J = Number(new Date()),
          ze = J - (f || J);
        (U.diff = ze),
          (U.prev = f),
          (U.curr = J),
          (f = J),
          (F[0] = r.coerce(F[0])),
          typeof F[0] != "string" && F.unshift("%O");
        let Z = 0;
        (F[0] = F[0].replace(/%([a-zA-Z%])/g, (le, We) => {
          if (le === "%%") return "%";
          Z++;
          let ke = r.formatters[We];
          if (typeof ke == "function") {
            let He = F[Z];
            (le = ke.call(U, He)), F.splice(Z, 1), Z--;
          }
          return le;
        })),
          r.formatArgs.call(U, F),
          (U.log || r.log).apply(U, F);
      }
      return (
        (O.namespace = c),
          (O.useColors = r.useColors()),
          (O.color = r.selectColor(c)),
          (O.extend = n),
          (O.destroy = r.destroy),
          Object.defineProperty(O, "enabled", {
            enumerable: !0,
            configurable: !1,
            get: () =>
              d !== null ? d : (m !== r.namespaces &&
                ((m = r.namespaces), (P = r.enabled(c))),
                P),
            set: (F) => {
              d = F;
            },
          }),
          typeof r.init == "function" && r.init(O),
          O
      );
    }
    function n(c, f) {
      let d = r(this.namespace + (typeof f > "u" ? ":" : f) + c);
      return (d.log = this.log), d;
    }
    function s(c) {
      r.save(c), (r.namespaces = c), (r.names = []), (r.skips = []);
      let f,
        d = (typeof c == "string" ? c : "").split(/[\s,]+/),
        m = d.length;
      for (f = 0; f < m; f++) {
        d[f] &&
          ((c = d[f].replace(/\*/g, ".*?")),
            c[0] === "-"
              ? r.skips.push(new RegExp("^" + c.slice(1) + "$"))
              : r.names.push(new RegExp("^" + c + "$")));
      }
    }
    function i() {
      let c = [...r.names.map(o), ...r.skips.map(o).map((f) => "-" + f)].join(
        ",",
      );
      return r.enable(""), c;
    }
    function u(c) {
      if (c[c.length - 1] === "*") return !0;
      let f, d;
      for (f = 0, d = r.skips.length; f < d; f++) {
        if (r.skips[f].test(c)) return !1;
      }
      for (f = 0, d = r.names.length; f < d; f++) {
        if (r.names[f].test(c)) return !0;
      }
      return !1;
    }
    function o(c) {
      return c
        .toString()
        .substring(2, c.toString().length - 2)
        .replace(/\.\*\?$/, "*");
    }
    function h(c) {
      return c instanceof Error ? c.stack || c.message : c;
    }
    function g() {
      console.warn(
        "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.",
      );
    }
    return r.enable(r.load()), r;
  }
  zt.exports = si;
});
var Ke = ee((M, Ce) => {
  M.formatArgs = ai;
  M.save = oi;
  M.load = ui;
  M.useColors = ii;
  M.storage = ci();
  M.destroy = (() => {
    let e = !1;
    return () => {
      e ||
        ((e = !0),
          console.warn(
            "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.",
          ));
    };
  })();
  M.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33",
  ];
  function ii() {
    return typeof document < "u" &&
        window.process &&
        (window.process.type === "renderer" || window.process.__nwjs)
      ? !0
      : typeof navigator < "u" &&
          navigator.userAgent &&
          navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)
      ? !1
      : (typeof document < "u" &&
        document.documentElement &&
        document.documentElement.style &&
        document.documentElement.style.WebkitAppearance) ||
        (typeof document < "u" &&
          window.console &&
          (window.console.firebug ||
            (window.console.exception && window.console.table))) ||
        (typeof navigator < "u" &&
          navigator.userAgent &&
          navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) &&
          parseInt(RegExp.$1, 10) >= 31) ||
        (typeof navigator < "u" &&
          navigator.userAgent &&
          navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
  }
  function ai(e) {
    if (
      ((e[0] = (this.useColors ? "%c" : "") +
        this.namespace +
        (this.useColors ? " %c" : " ") +
        e[0] +
        (this.useColors ? "%c " : " ") +
        "+" +
        Ce.exports.humanize(this.diff)),
        !this.useColors)
    ) {
      return;
    }
    let t = "color: " + this.color;
    e.splice(1, 0, t, "color: inherit");
    let r = 0,
      n = 0;
    e[0].replace(/%[a-zA-Z%]/g, (s) => {
      s !== "%%" && (r++, s === "%c" && (n = r));
    }), e.splice(n, 0, t);
  }
  M.log = console.debug || console.log || (() => {});
  function oi(e) {
    try {
      e ? M.storage.setItem("debug", e) : M.storage.removeItem("debug");
    } catch {}
  }
  function ui() {
    let e;
    try {
      e = M.storage.getItem("debug");
    } catch {}
    return (
      !e &&
      typeof __Process$ < "u" &&
      "env" in __Process$ &&
      (e = __Process$.env.DEBUG), e
    );
  }
  function ci() {
    try {
      return localStorage;
    } catch {}
  }
  Ce.exports = Wt()(M);
  var { formatters: li } = Ce.exports;
  li.j = function (e) {
    try {
      return JSON.stringify(e);
    } catch (t) {
      return "[UnexpectedJSONParseError]: " + t.message;
    }
  };
});
var Ht = ee((L) => {
  "use strict";
  var fi = (L && L.__importDefault) ||
    function (e) {
      return e && e.__esModule ? e : { default: e };
    };
  Object.defineProperty(L, "__esModule", { value: !0 });
  var hi = __fs$,
    pi = fi(Ke()),
    se = pi.default("@kwsites/file-exists");
  function di(e, t, r) {
    se("checking %s", e);
    try {
      let n = hi.statSync(e);
      return n.isFile() && t
        ? (se("[OK] path represents a file"), !0)
        : n.isDirectory() && r
        ? (se("[OK] path represents a directory"), !0)
        : (se(
          "[FAIL] path represents something other than a file or directory",
        ),
          !1);
    } catch (n) {
      if (n.code === "ENOENT") {
        return se("[FAIL] path is not accessible: %o", n), !1;
      }
      throw (se("[FATAL] %o", n), n);
    }
  }
  function mi(e, t = L.READABLE) {
    return di(e, (t & L.FILE) > 0, (t & L.FOLDER) > 0);
  }
  L.exists = mi;
  L.FILE = 1;
  L.FOLDER = 2;
  L.READABLE = L.FILE + L.FOLDER;
});
var Qt = ee((Se) => {
  "use strict";
  function gi(e) {
    for (var t in e) Se.hasOwnProperty(t) || (Se[t] = e[t]);
  }
  Object.defineProperty(Se, "__esModule", { value: !0 });
  gi(Ht());
});
var Xe = ee((V) => {
  "use strict";
  Object.defineProperty(V, "__esModule", { value: !0 });
  V.createDeferred = V.deferred = void 0;
  function Ve() {
    let e,
      t,
      r = "pending";
    return {
      promise: new Promise((s, i) => {
        (e = s), (t = i);
      }),
      done(s) {
        r === "pending" && ((r = "resolved"), e(s));
      },
      fail(s) {
        r === "pending" && ((r = "rejected"), t(s));
      },
      get fulfilled() {
        return r !== "pending";
      },
      get status() {
        return r;
      },
    };
  }
  V.deferred = Ve;
  V.createDeferred = Ve;
  V.default = Ve;
});
var je = Te(Qt(), 1),
  Me = Te(Ke(), 1),
  Zn = Te(Xe(), 1),
  ae = Te(Xe(), 1);
import { spawn as sa } from "https://deno.land/std@0.173.0/node/child_process.ts";
var Ie = Object.defineProperty,
  _i = Object.defineProperties,
  vi = Object.getOwnPropertyDescriptor,
  yi = Object.getOwnPropertyDescriptors,
  pt = Object.getOwnPropertyNames,
  Kt = Object.getOwnPropertySymbols,
  Sr = Object.prototype.hasOwnProperty,
  bi = Object.prototype.propertyIsEnumerable,
  Vt = (e, t, r) =>
    t in e
      ? Ie(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r })
      : (e[t] = r),
  $ = (e, t) => {
    for (var r in t || (t = {})) Sr.call(t, r) && Vt(e, r, t[r]);
    if (Kt) for (var r of Kt(t)) bi.call(t, r) && Vt(e, r, t[r]);
    return e;
  },
  pe = (e, t) => _i(e, yi(t)),
  ki = (e) => Ie(e, "__esModule", { value: !0 }),
  l = (e, t) =>
    function () {
      return e && (t = (0, e[pt(e)[0]])(e = 0)), t;
    },
  Ti = (e, t) =>
    function () {
      return t || (0, e[pt(e)[0]])((t = { exports: {} }).exports, t), t.exports;
    },
  C = (e, t) => {
    for (var r in t) Ie(e, r, { get: t[r], enumerable: !0 });
  },
  wi = (e, t, r, n) => {
    if ((t && typeof t == "object") || typeof t == "function") {
      for (let s of pt(t)) {
        !Sr.call(e, s) &&
          (r || s !== "default") &&
          Ie(e, s, {
            get: () => t[s],
            enumerable: !(n = vi(t, s)) || n.enumerable,
          });
      }
    }
    return e;
  },
  w = (
    (e) => (t, r) =>
      (e && e.get(t)) || ((r = wi(ki({}), t, 1)), e && e.set(t, r), r)
  )(typeof WeakMap < "u" ? new WeakMap() : 0),
  he = (e, t, r) =>
    new Promise((n, s) => {
      var i = (h) => {
          try {
            o(r.next(h));
          } catch (g) {
            s(g);
          }
        },
        u = (h) => {
          try {
            o(r.throw(h));
          } catch (g) {
            s(g);
          }
        },
        o = (h) => (h.done ? n(h.value) : Promise.resolve(h.value).then(i, u));
      o((r = r.apply(e, t)).next());
    }),
  z,
  Q = l({
    "src/lib/errors/git-error.ts"() {
      z = class extends Error {
        constructor(e, t) {
          super(t),
            (this.task = e),
            Object.setPrototypeOf(this, new.target.prototype);
        }
      };
    },
  }),
  ue,
  ce = l({
    "src/lib/errors/git-response-error.ts"() {
      Q(),
        (ue = class extends z {
          constructor(e, t) {
            super(void 0, t || String(e)), (this.git = e);
          }
        });
    },
  }),
  Rr,
  xr = l({
    "src/lib/errors/task-configuration-error.ts"() {
      Q(),
        (Rr = class extends z {
          constructor(e) {
            super(void 0, e);
          }
        });
    },
  });
function Er(e) {
  return typeof e == "function" ? e : Y;
}
function Or(e) {
  return typeof e == "function" && e !== Y;
}
function Fr(e, t) {
  let r = e.indexOf(t);
  return r <= 0 ? [e, ""] : [e.substr(0, r), e.substr(r + 1)];
}
function Ar(e, t = 0) {
  return Pr(e) && e.length > t ? e[t] : void 0;
}
function X(e, t = 0) {
  if (Pr(e) && e.length > t) return e[e.length - 1 - t];
}
function Pr(e) {
  return !!(e && typeof e.length == "number");
}
function _e(
  e = "",
  t = !0,
  r = `
`,
) {
  return e.split(r).reduce((n, s) => {
    let i = t ? s.trim() : s;
    return i && n.push(i), n;
  }, []);
}
function dt(e, t) {
  return _e(e, !0).map((r) => t(r));
}
function mt(e) {
  return (0, je.exists)(e, je.FOLDER);
}
function b(e, t) {
  return Array.isArray(e) ? e.includes(t) || e.push(t) : e.add(t), t;
}
function Mr(e, t) {
  return Array.isArray(e) && !e.includes(t) && e.push(t), e;
}
function gt(e, t) {
  if (Array.isArray(e)) {
    let r = e.indexOf(t);
    r >= 0 && e.splice(r, 1);
  } else e.delete(t);
  return t;
}
function H(e) {
  return Array.isArray(e) ? e : [e];
}
function Lr(e) {
  return H(e).map(String);
}
function T(e, t = 0) {
  if (e == null) return t;
  let r = parseInt(e, 10);
  return isNaN(r) ? t : r;
}
function de(e, t) {
  let r = [];
  for (let n = 0, s = e.length; n < s; n++) r.push(t, e[n]);
  return r;
}
function me(e) {
  return (Array.isArray(e) ? __Buffer$.concat(e) : e).toString("utf-8");
}
function Dr(e, t) {
  return Object.assign({}, ...t.map((r) => (r in e ? { [r]: e[r] } : {})));
}
function tt(e = 0) {
  return new Promise((t) => setTimeout(t, e));
}
var oe,
  Y,
  ve,
  $e = l({
    "src/lib/utils/util.ts"() {
      (oe = "\0"),
        (Y = () => {}),
        (ve = Object.prototype.toString.call.bind(Object.prototype.toString));
    },
  });
function G(e, t, r) {
  return t(e) ? e : arguments.length > 2 ? r : void 0;
}
function _t(e, t) {
  return (
    /number|string|boolean/.test(typeof e) && (!t || !t.includes(typeof e))
  );
}
function vt(e) {
  return !!e && ve(e) === "[object Object]";
}
function Ir(e) {
  return typeof e == "function";
}
var ye,
  x,
  jr,
  Pe,
  yt,
  $r = l({
    "src/lib/utils/argument-filters.ts"() {
      $e(),
        (ye = (e) => Array.isArray(e)),
        (x = (e) => typeof e == "string"),
        (jr = (e) => Array.isArray(e) && e.every(x)),
        (Pe = (e) => x(e) || (Array.isArray(e) && e.every(x))),
        (yt = (e) =>
          e == null || "number|boolean|function".includes(typeof e)
            ? !1
            : Array.isArray(e) ||
              typeof e == "string" ||
              typeof e.length == "number");
    },
  }),
  rt,
  Ci = l({
    "src/lib/utils/exit-codes.ts"() {
      rt = ((e) => (
        (e[e.SUCCESS = 0] = "SUCCESS"),
          (e[e.ERROR = 1] = "ERROR"),
          (e[e.NOT_FOUND = -2] = "NOT_FOUND"),
          (e[e.UNCLEAN = 128] = "UNCLEAN"),
          e
      ))(rt || {});
    },
  }),
  ge,
  Si = l({
    "src/lib/utils/git-output-streams.ts"() {
      ge = class {
        constructor(e, t) {
          (this.stdOut = e), (this.stdErr = t);
        }
        asStrings() {
          return new ge(
            this.stdOut.toString("utf8"),
            this.stdErr.toString("utf8"),
          );
        }
      };
    },
  }),
  v,
  W,
  Ri = l({
    "src/lib/utils/line-parser.ts"() {
      (v = class {
        constructor(e, t) {
          (this.matches = []),
            (this.parse = (r, n) => (
              this.resetMatches(),
                this._regExp.every((s, i) => this.addMatch(s, i, r(i)))
                  ? this.useMatches(n, this.prepareMatches()) !== !1
                  : !1
            )),
            (this._regExp = Array.isArray(e) ? e : [e]),
            t && (this.useMatches = t);
        }
        useMatches(e, t) {
          throw new Error("LineParser:useMatches not implemented");
        }
        resetMatches() {
          this.matches.length = 0;
        }
        prepareMatches() {
          return this.matches;
        }
        addMatch(e, t, r) {
          let n = r && e.exec(r);
          return n && this.pushMatch(t, n), !!n;
        }
        pushMatch(e, t) {
          this.matches.push(...t.slice(1));
        }
      }),
        (W = class extends v {
          addMatch(e, t, r) {
            return /^remote:\s/.test(String(r)) && super.addMatch(e, t, r);
          }
          pushMatch(e, t) {
            (e > 0 || t.length > 1) && super.pushMatch(e, t);
          }
        });
    },
  });
function Nr(...e) {
  let t = __Process$.cwd(),
    r = Object.assign(
      $({ baseDir: t }, Br),
      ...e.filter((n) => typeof n == "object" && n),
    );
  return (r.baseDir = r.baseDir || t), (r.trimmed = r.trimmed === !0), r;
}
var Br,
  xi = l({
    "src/lib/utils/simple-git-options.ts"() {
      Br = {
        binary: "git",
        maxConcurrentProcesses: 5,
        config: [],
        trimmed: !1,
      };
    },
  });
function bt(e, t = []) {
  return vt(e)
    ? Object.keys(e).reduce((r, n) => {
      let s = e[n];
      return _t(s, ["boolean"]) ? r.push(n + "=" + s) : r.push(n), r;
    }, t)
    : t;
}
function q(e, t = 0, r = !1) {
  let n = [];
  for (let s = 0, i = t < 0 ? e.length : t; s < i; s++) {
    "string|number".includes(typeof e[s]) && n.push(String(e[s]));
  }
  return bt(kt(e), n), r || n.push(...Ei(e)), n;
}
function Ei(e) {
  let t = typeof X(e) == "function";
  return G(X(e, t ? 1 : 0), ye, []);
}
function kt(e) {
  let t = Ir(X(e));
  return G(X(e, t ? 1 : 0), vt);
}
function R(e, t = !0) {
  let r = Er(X(e));
  return t || Or(r) ? r : void 0;
}
var Oi = l({
  "src/lib/utils/task-options.ts"() {
    $r(), $e();
  },
});
function nt(e, t) {
  return e(t.stdOut, t.stdErr);
}
function I(e, t, r, n = !0) {
  return (
    H(r).forEach((s) => {
      for (let i = _e(s, n), u = 0, o = i.length; u < o; u++) {
        let h = (g = 0) => {
          if (!(u + g >= o)) return i[u + g];
        };
        t.some(({ parse: g }) => g(h, e));
      }
    }), e
  );
}
var Fi = l({
    "src/lib/utils/task-parser.ts"() {
      $e();
    },
  }),
  Gr = {};
C(Gr, {
  ExitCodes: () => rt,
  GitOutputStreams: () => ge,
  LineParser: () => v,
  NOOP: () => Y,
  NULL: () => oe,
  RemoteLineParser: () => W,
  append: () => b,
  appendTaskOptions: () => bt,
  asArray: () => H,
  asFunction: () => Er,
  asNumber: () => T,
  asStringArray: () => Lr,
  bufferToString: () => me,
  callTaskParser: () => nt,
  createInstanceConfig: () => Nr,
  delay: () => tt,
  filterArray: () => ye,
  filterFunction: () => Ir,
  filterHasLength: () => yt,
  filterPlainObject: () => vt,
  filterPrimitives: () => _t,
  filterString: () => x,
  filterStringArray: () => jr,
  filterStringOrStringArray: () => Pe,
  filterType: () => G,
  first: () => Ar,
  folderExists: () => mt,
  forEachLineWithContent: () => dt,
  getTrailingOptions: () => q,
  including: () => Mr,
  isUserFunction: () => Or,
  last: () => X,
  objectToString: () => ve,
  parseStringResponse: () => I,
  pick: () => Dr,
  prefixedArray: () => de,
  remove: () => gt,
  splitOn: () => Fr,
  toLinesWithContent: () => _e,
  trailingFunctionArgument: () => R,
  trailingOptionsArgument: () => kt,
});
var y = l({
    "src/lib/utils/index.ts"() {
      $r(), Ci(), Si(), Ri(), xi(), Oi(), Fi(), $e();
    },
  }),
  Ur = {};
C(Ur, {
  CheckRepoActions: () => st,
  checkIsBareRepoTask: () => zr,
  checkIsRepoRootTask: () => qr,
  checkIsRepoTask: () => Ai,
});
function Ai(e) {
  switch (e) {
    case "bare":
      return zr();
    case "root":
      return qr();
  }
  return {
    commands: ["rev-parse", "--is-inside-work-tree"],
    format: "utf-8",
    onError: Ne,
    parser: Tt,
  };
}
function qr() {
  return {
    commands: ["rev-parse", "--git-dir"],
    format: "utf-8",
    onError: Ne,
    parser(t) {
      return /^\.(git)?$/.test(t.trim());
    },
  };
}
function zr() {
  return {
    commands: ["rev-parse", "--is-bare-repository"],
    format: "utf-8",
    onError: Ne,
    parser: Tt,
  };
}
function Pi(e) {
  return /(Not a git repository|Kein Git-Repository)/i.test(String(e));
}
var st,
  Ne,
  Tt,
  Wr = l({
    "src/lib/tasks/check-is-repo.ts"() {
      y(),
        (st = ((e) => (
          (e.BARE = "bare"), (e.IN_TREE = "tree"), (e.IS_REPO_ROOT = "root"), e
        ))(st || {})),
        (Ne = ({ exitCode: e }, t, r, n) => {
          if (e === 128 && Pi(t)) return r(__Buffer$.from("false"));
          n(t);
        }),
        (Tt = (e) => e.trim() === "true");
    },
  });
function Mi(e, t) {
  let r = new Hr(e),
    n = e ? Kr : Qr;
  return (
    _e(t).forEach((s) => {
      let i = s.replace(n, "");
      r.paths.push(i), (Vr.test(i) ? r.folders : r.files).push(i);
    }), r
  );
}
var Hr,
  Qr,
  Kr,
  Vr,
  Li = l({
    "src/lib/responses/CleanSummary.ts"() {
      y(),
        (Hr = class {
          constructor(e) {
            (this.dryRun = e),
              (this.paths = []),
              (this.files = []),
              (this.folders = []);
          }
        }),
        (Qr = /^[a-z]+\s*/i),
        (Kr = /^[a-z]+\s+[a-z]+\s*/i),
        (Vr = /\/$/);
    },
  }),
  it = {};
C(it, {
  EMPTY_COMMANDS: () => Be,
  adhocExecTask: () => Xr,
  configurationErrorTask: () => A,
  isBufferTask: () => Yr,
  isEmptyTask: () => Jr,
  straightThroughBufferTask: () => Di,
  straightThroughStringTask: () => N,
});
function Xr(e) {
  return { commands: Be, format: "empty", parser: e };
}
function A(e) {
  return {
    commands: Be,
    format: "empty",
    parser() {
      throw typeof e == "string" ? new Rr(e) : e;
    },
  };
}
function N(e, t = !1) {
  return {
    commands: e,
    format: "utf-8",
    parser(r) {
      return t ? String(r).trim() : r;
    },
  };
}
function Di(e) {
  return {
    commands: e,
    format: "buffer",
    parser(t) {
      return t;
    },
  };
}
function Yr(e) {
  return e.format === "buffer";
}
function Jr(e) {
  return e.format === "empty" || !e.commands.length;
}
var Be,
  S = l({
    "src/lib/tasks/task.ts"() {
      xr(), (Be = []);
    },
  }),
  Zr = {};
C(Zr, {
  CONFIG_ERROR_INTERACTIVE_MODE: () => wt,
  CONFIG_ERROR_MODE_REQUIRED: () => Ct,
  CONFIG_ERROR_UNKNOWN_OPTION: () => St,
  CleanOptions: () => Ee,
  cleanTask: () => en,
  cleanWithOptionsTask: () => Ii,
  isCleanOptionsArray: () => ji,
});
function Ii(e, t) {
  let { cleanMode: r, options: n, valid: s } = $i(e);
  return r
    ? s.options
      ? (n.push(...t), n.some(Gi) ? A(wt) : en(r, n))
      : A(St + JSON.stringify(e))
    : A(Ct);
}
function en(e, t) {
  return {
    commands: ["clean", `-${e}`, ...t],
    format: "utf-8",
    parser(n) {
      return Mi(e === "n", n);
    },
  };
}
function ji(e) {
  return Array.isArray(e) && e.every((t) => Rt.has(t));
}
function $i(e) {
  let t,
    r = [],
    n = { cleanMode: !1, options: !0 };
  return (
    e
      .replace(/[^a-z]i/g, "")
      .split("")
      .forEach((s) => {
        Ni(s)
          ? ((t = s), (n.cleanMode = !0))
          : (n.options = n.options && Bi(r[r.length] = `-${s}`));
      }), { cleanMode: t, options: r, valid: n }
  );
}
function Ni(e) {
  return e === "f" || e === "n";
}
function Bi(e) {
  return /^-[a-z]$/i.test(e) && Rt.has(e.charAt(1));
}
function Gi(e) {
  return /^-[^\-]/.test(e) ? e.indexOf("i") > 0 : e === "--interactive";
}
var wt,
  Ct,
  St,
  Ee,
  Rt,
  tn = l({
    "src/lib/tasks/clean.ts"() {
      Li(),
        y(),
        S(),
        (wt = "Git clean interactive mode is not supported"),
        (Ct = 'Git clean mode parameter ("n" or "f") is required'),
        (St = "Git clean unknown option found in: "),
        (Ee = ((e) => (
          (e.DRY_RUN = "n"),
            (e.FORCE = "f"),
            (e.IGNORED_INCLUDED = "x"),
            (e.IGNORED_ONLY = "X"),
            (e.EXCLUDING = "e"),
            (e.QUIET = "q"),
            (e.RECURSIVE = "d"),
            e
        ))(Ee || {})),
        (Rt = new Set(["i", ...Lr(Object.values(Ee))]));
    },
  });
function Ui(e) {
  let t = new nn();
  for (let r of rn(e)) t.addValue(r.file, String(r.key), r.value);
  return t;
}
function qi(e, t) {
  let r = null,
    n = [],
    s = new Map();
  for (let i of rn(e, t)) {
    i.key === t &&
      (n.push(r = i.value),
        s.has(i.file) || s.set(i.file, []),
        s.get(i.file).push(r));
  }
  return {
    key: t,
    paths: Array.from(s.keys()),
    scopes: s,
    value: r,
    values: n,
  };
}
function zi(e) {
  return e.replace(/^(file):/, "");
}
function* rn(e, t = null) {
  let r = e.split("\0");
  for (let n = 0, s = r.length - 1; n < s;) {
    let i = zi(r[n++]),
      u = r[n++],
      o = t;
    if (
      u.includes(`
`)
    ) {
      let h = Fr(
        u,
        `
`,
      );
      (o = h[0]), (u = h[1]);
    }
    yield { file: i, key: o, value: u };
  }
}
var nn,
  Wi = l({
    "src/lib/responses/ConfigList.ts"() {
      y(),
        (nn = class {
          constructor() {
            (this.files = []), (this.values = Object.create(null));
          }
          get all() {
            return (
              this._all ||
              (this._all = this.files.reduce(
                (e, t) => Object.assign(e, this.values[t]),
                {},
              )), this._all
            );
          }
          addFile(e) {
            if (!(e in this.values)) {
              let t = X(this.files);
              (this.values[e] = t ? Object.create(this.values[t]) : {}),
                this.files.push(e);
            }
            return this.values[e];
          }
          addValue(e, t, r) {
            let n = this.addFile(e);
            n.hasOwnProperty(t)
              ? Array.isArray(n[t]) ? n[t].push(r) : (n[t] = [n[t], r])
              : (n[t] = r), (this._all = void 0);
          }
        });
    },
  });
function Ye(e, t) {
  return typeof e == "string" && at.hasOwnProperty(e) ? e : t;
}
function Hi(e, t, r, n) {
  let s = ["config", `--${n}`];
  return (
    r && s.push("--add"), s.push(e, t), {
      commands: s,
      format: "utf-8",
      parser(i) {
        return i;
      },
    }
  );
}
function Qi(e, t) {
  let r = ["config", "--null", "--show-origin", "--get-all", e];
  return (
    t && r.splice(1, 0, `--${t}`), {
      commands: r,
      format: "utf-8",
      parser(n) {
        return qi(n, e);
      },
    }
  );
}
function Ki(e) {
  let t = ["config", "--list", "--show-origin", "--null"];
  return (
    e && t.push(`--${e}`), {
      commands: t,
      format: "utf-8",
      parser(r) {
        return Ui(r);
      },
    }
  );
}
function Vi() {
  return {
    addConfig(e, t, ...r) {
      return this._runTask(
        Hi(e, t, r[0] === !0, Ye(r[1], "local")),
        R(arguments),
      );
    },
    getConfig(e, t) {
      return this._runTask(Qi(e, Ye(t, void 0)), R(arguments));
    },
    listConfig(...e) {
      return this._runTask(Ki(Ye(e[0], void 0)), R(arguments));
    },
  };
}
var at,
  sn = l({
    "src/lib/tasks/config.ts"() {
      Wi(),
        y(),
        (at = ((e) => (
          (e.system = "system"),
            (e.global = "global"),
            (e.local = "local"),
            (e.worktree = "worktree"),
            e
        ))(at || {}));
    },
  });
function Xi(...e) {
  return new on().param(...e);
}
function Yi(e) {
  let t = new Set(),
    r = {};
  return (
    dt(e, (n) => {
      let [s, i, u] = n.split(oe);
      t.add(s), (r[s] = r[s] || []).push({ line: T(i), path: s, preview: u });
    }), { paths: t, results: r }
  );
}
function Ji() {
  return {
    grep(e) {
      let t = R(arguments),
        r = q(arguments);
      for (let s of an) {
        if (r.includes(s)) {
          return this._runTask(
            A(`git.grep: use of "${s}" is not supported.`),
            t,
          );
        }
      }
      typeof e == "string" && (e = Xi().param(e));
      let n = ["grep", "--null", "-n", "--full-name", ...r, ...e];
      return this._runTask(
        {
          commands: n,
          format: "utf-8",
          parser(s) {
            return Yi(s);
          },
        },
        t,
      );
    },
  };
}
var an,
  fe,
  Xt,
  on,
  un = l({
    "src/lib/tasks/grep.ts"() {
      y(),
        S(),
        (an = ["-h"]),
        (fe = Symbol("grepQuery")),
        (on = class {
          constructor() {
            this[Xt] = [];
          }
          *[((Xt = fe), Symbol.iterator)]() {
            for (let e of this[fe]) yield e;
          }
          and(...e) {
            return (
              e.length && this[fe].push("--and", "(", ...de(e, "-e"), ")"), this
            );
          }
          param(...e) {
            return this[fe].push(...de(e, "-e")), this;
          }
        });
    },
  }),
  cn = {};
C(cn, { ResetMode: () => Oe, getResetMode: () => ea, resetTask: () => Zi });
function Zi(e, t) {
  let r = ["reset"];
  return ln(e) && r.push(`--${e}`), r.push(...t), N(r);
}
function ea(e) {
  if (ln(e)) return e;
  switch (typeof e) {
    case "string":
    case "undefined":
      return "soft";
  }
}
function ln(e) {
  return fn.includes(e);
}
var Oe,
  fn,
  hn = l({
    "src/lib/tasks/reset.ts"() {
      S(),
        (Oe = ((e) => (
          (e.MIXED = "mixed"),
            (e.SOFT = "soft"),
            (e.HARD = "hard"),
            (e.MERGE = "merge"),
            (e.KEEP = "keep"),
            e
        ))(Oe || {})),
        (fn = Array.from(Object.values(Oe)));
    },
  });
function ta() {
  return (0, Me.default)("simple-git");
}
function Yt(e, t, r) {
  return !t || !String(t).replace(/\s*/, "")
    ? r
      ? (n, ...s) => {
        e(n, ...s), r(n, ...s);
      }
      : e
    : (n, ...s) => {
      e(`%s ${n}`, t, ...s), r && r(n, ...s);
    };
}
function ra(e, t, { namespace: r }) {
  if (typeof e == "string") return e;
  let n = (t && t.namespace) || "";
  return n.startsWith(r) ? n.substr(r.length + 1) : n || r;
}
function xt(e, t, r, n = ta()) {
  let s = (e && `[${e}]`) || "",
    i = [],
    u = typeof t == "string" ? n.extend(t) : t,
    o = ra(G(t, x), u, n);
  return g(r);
  function h(c, f) {
    return b(i, xt(e, o.replace(/^[^:]+/, c), f, n));
  }
  function g(c) {
    let f = (c && `[${c}]`) || "",
      d = (u && Yt(u, f)) || Y,
      m = Yt(n, `${s} ${f}`, d);
    return Object.assign(u ? d : m, { label: e, sibling: h, info: m, step: g });
  }
}
var pn = l({
    "src/lib/git-logger.ts"() {
      y(),
        (Me.default.formatters.L = (e) => String(yt(e) ? e.length : "-")),
        (Me.default.formatters.B = (e) =>
          __Buffer$.isBuffer(e) ? e.toString("utf8") : ve(e));
    },
  }),
  Re,
  ot,
  na = l({
    "src/lib/runners/tasks-pending-queue.ts"() {
      Q(),
        pn(),
        (Re = class {
          constructor(e = "GitExecutor") {
            (this.logLabel = e), (this._queue = new Map());
          }
          withProgress(e) {
            return this._queue.get(e);
          }
          createProgress(e) {
            let t = Re.getName(e.commands[0]),
              r = xt(this.logLabel, t);
            return { task: e, logger: r, name: t };
          }
          push(e) {
            let t = this.createProgress(e);
            return (
              t.logger("Adding task to the queue, commands = %o", e.commands),
                this._queue.set(e, t),
                t
            );
          }
          fatal(e) {
            for (let [t, { logger: r }] of Array.from(this._queue.entries())) {
              t === e.task
                ? (r.info("Failed %o", e),
                  r(
                    "Fatal exception, any as-yet un-started tasks run through this executor will not be attempted",
                  ))
                : r.info(
                  "A fatal exception occurred in a previous task, the queue has been purged: %o",
                  e.message,
                ), this.complete(t);
            }
            if (this._queue.size !== 0) {
              throw new Error(
                `Queue size should be zero after fatal: ${this._queue.size}`,
              );
            }
          }
          complete(e) {
            this.withProgress(e) && this._queue.delete(e);
          }
          attempt(e) {
            let t = this.withProgress(e);
            if (!t) {
              throw new z(
                void 0,
                "TasksPendingQueue: attempt called for an unknown task",
              );
            }
            return t.logger("Starting task"), t;
          }
          static getName(e = "empty") {
            return `task:${e}:${++Re.counter}`;
          }
        }),
        (ot = Re),
        (ot.counter = 0);
    },
  });
function ie(e, t) {
  return { method: Ar(e.commands) || "", commands: t };
}
function ia(e, t) {
  return (r) => {
    t("[ERROR] child process exception %o", r),
      e.push(__Buffer$.from(String(r.stack), "ascii"));
  };
}
function Jt(e, t, r, n) {
  return (s) => {
    r("%s received %L bytes", t, s), n("%B", s), e.push(s);
  };
}
var ut,
  aa = l({
    "src/lib/runners/git-executor-chain.ts"() {
      Q(),
        S(),
        y(),
        na(),
        (ut = class {
          constructor(e, t, r) {
            (this._executor = e),
              (this._scheduler = t),
              (this._plugins = r),
              (this._chain = Promise.resolve()),
              (this._queue = new ot());
          }
          get binary() {
            return this._executor.binary;
          }
          get cwd() {
            return this._cwd || this._executor.cwd;
          }
          set cwd(e) {
            this._cwd = e;
          }
          get env() {
            return this._executor.env;
          }
          get outputHandler() {
            return this._executor.outputHandler;
          }
          chain() {
            return this;
          }
          push(e) {
            return (
              this._queue.push(e),
                (this._chain = this._chain.then(() => this.attemptTask(e)))
            );
          }
          attemptTask(e) {
            return he(this, null, function* () {
              let t = yield this._scheduler.next(),
                r = () => this._queue.complete(e);
              try {
                let { logger: n } = this._queue.attempt(e);
                return yield Jr(e)
                  ? this.attemptEmptyTask(e, n)
                  : this.attemptRemoteTask(e, n);
              } catch (n) {
                throw this.onFatalException(e, n);
              } finally {
                r(), t();
              }
            });
          }
          onFatalException(e, t) {
            let r = t instanceof z
              ? Object.assign(t, { task: e })
              : new z(e, t && String(t));
            return (this._chain = Promise.resolve()), this._queue.fatal(r), r;
          }
          attemptRemoteTask(e, t) {
            return he(this, null, function* () {
              let r = this._plugins.exec(
                  "spawn.args",
                  [...e.commands],
                  ie(e, e.commands),
                ),
                n = yield this.gitResponse(
                  e,
                  this.binary,
                  r,
                  this.outputHandler,
                  t.step("SPAWN"),
                ),
                s = yield this.handleTaskData(e, r, n, t.step("HANDLE"));
              return (
                t("passing response to task's parser as a %s", e.format),
                  Yr(e) ? nt(e.parser, s) : nt(e.parser, s.asStrings())
              );
            });
          }
          attemptEmptyTask(e, t) {
            return he(this, null, function* () {
              return (
                t(
                  "empty task bypassing child process to call to task's parser",
                ), e.parser(this)
              );
            });
          }
          handleTaskData(e, t, r, n) {
            let { exitCode: s, rejection: i, stdOut: u, stdErr: o } = r;
            return new Promise((h, g) => {
              n("Preparing to handle process response exitCode=%d stdOut=", s);
              let { error: c } = this._plugins.exec(
                "task.error",
                { error: i },
                $($({}, ie(e, t)), r),
              );
              if (c && e.onError) {
                return (
                  n.info("exitCode=%s handling with custom error handler"),
                    e.onError(
                      r,
                      c,
                      (f) => {
                        n.info("custom error handler treated as success"),
                          n("custom error returned a %s", ve(f)),
                          h(
                            new ge(
                              Array.isArray(f) ? __Buffer$.concat(f) : f,
                              __Buffer$.concat(o),
                            ),
                          );
                      },
                      g,
                    )
                );
              }
              if (c) {
                return (
                  n.info(
                    "handling as error: exitCode=%s stdErr=%s rejection=%o",
                    s,
                    o.length,
                    i,
                  ), g(c)
                );
              }
              n.info("retrieving task output complete"),
                h(new ge(__Buffer$.concat(u), __Buffer$.concat(o)));
            });
          }
          gitResponse(e, t, r, n, s) {
            return he(this, null, function* () {
              let i = s.sibling("output"),
                u = this._plugins.exec(
                  "spawn.options",
                  { cwd: this.cwd, env: this.env, windowsHide: !0 },
                  ie(e, e.commands),
                );
              return new Promise((o) => {
                let h = [],
                  g = [];
                s.info("%s %o", t, r), s("%O", u);
                let c = this._beforeSpawn(e, r);
                if (c) {
                  return o({
                    stdOut: h,
                    stdErr: g,
                    exitCode: 9901,
                    rejection: c,
                  });
                }
                this._plugins.exec(
                  "spawn.before",
                  void 0,
                  pe($({}, ie(e, r)), {
                    kill(d) {
                      c = d || c;
                    },
                  }),
                );
                let f = sa(t, r, u);
                f.stdout.on("data", Jt(h, "stdOut", s, i.step("stdOut"))),
                  f.stderr.on("data", Jt(g, "stdErr", s, i.step("stdErr"))),
                  f.on("error", ia(g, s)),
                  n &&
                  (s(
                    "Passing child process stdOut/stdErr to custom outputHandler",
                  ),
                    n(t, f.stdout, f.stderr, [...r])),
                  this._plugins.exec(
                    "spawn.after",
                    void 0,
                    pe($({}, ie(e, r)), {
                      spawned: f,
                      close(d, m) {
                        o({
                          stdOut: h,
                          stdErr: g,
                          exitCode: d,
                          rejection: c || m,
                        });
                      },
                      kill(d) {
                        f.killed || ((c = d), f.kill("SIGINT"));
                      },
                    }),
                  );
              });
            });
          }
          _beforeSpawn(e, t) {
            let r;
            return (
              this._plugins.exec(
                "spawn.before",
                void 0,
                pe($({}, ie(e, t)), {
                  kill(n) {
                    r = n || r;
                  },
                }),
              ), r
            );
          }
        });
    },
  }),
  dn = {};
C(dn, { GitExecutor: () => mn });
var mn,
  oa = l({
    "src/lib/runners/git-executor.ts"() {
      aa(),
        (mn = class {
          constructor(e = "git", t, r, n) {
            (this.binary = e),
              (this.cwd = t),
              (this._scheduler = r),
              (this._plugins = n),
              (this._chain = new ut(this, this._scheduler, this._plugins));
          }
          chain() {
            return new ut(this, this._scheduler, this._plugins);
          }
          push(e) {
            return this._chain.push(e);
          }
        });
    },
  });
function ua(e, t, r = Y) {
  let n = (i) => {
      r(null, i);
    },
    s = (i) => {
      i?.task === e && r(i instanceof ue ? ca(i) : i, void 0);
    };
  t.then(n, s);
}
function ca(e) {
  let t = (n) => {
    console.warn(
      `simple-git deprecation notice: accessing GitResponseError.${n} should be GitResponseError.git.${n}, this will no longer be available in version 3`,
    ), (t = Y);
  };
  return Object.create(e, Object.getOwnPropertyNames(e.git).reduce(r, {}));
  function r(n, s) {
    return (
      s in e ||
      (n[s] = {
        enumerable: !1,
        configurable: !1,
        get() {
          return t(s), e.git[s];
        },
      }), n
    );
  }
}
var la = l({
  "src/lib/task-callback.ts"() {
    ce(), y();
  },
});
function Zt(e, t) {
  return Xr((r) => {
    if (!mt(e)) {
      throw new Error(`Git.cwd: cannot change to non-directory "${e}"`);
    }
    return ((t || r).cwd = e);
  });
}
var fa = l({
  "src/lib/tasks/change-working-directory.ts"() {
    y(), S();
  },
});
function ha(e) {
  return I(
    {
      author: null,
      branch: "",
      commit: "",
      root: !1,
      summary: { changes: 0, insertions: 0, deletions: 0 },
    },
    gn,
    e,
  );
}
var gn,
  pa = l({
    "src/lib/parsers/parse-commit.ts"() {
      y(),
        (gn = [
          new v(/^\[([^\s]+)( \([^)]+\))? ([^\]]+)/, (e, [t, r, n]) => {
            (e.branch = t), (e.commit = n), (e.root = !!r);
          }),
          new v(/\s*Author:\s(.+)/i, (e, [t]) => {
            let r = t.split("<"),
              n = r.pop();
            !n ||
              !n.includes("@") ||
              (e.author = {
                email: n.substr(0, n.length - 1),
                name: r.join("<").trim(),
              });
          }),
          new v(
            /(\d+)[^,]*(?:,\s*(\d+)[^,]*)(?:,\s*(\d+))/g,
            (e, [t, r, n]) => {
              (e.summary.changes = parseInt(t, 10) || 0),
                (e.summary.insertions = parseInt(r, 10) || 0),
                (e.summary.deletions = parseInt(n, 10) || 0);
            },
          ),
          new v(/^(\d+)[^,]*(?:,\s*(\d+)[^(]+\(([+-]))?/, (e, [t, r, n]) => {
            e.summary.changes = parseInt(t, 10) || 0;
            let s = parseInt(r, 10) || 0;
            n === "-"
              ? (e.summary.deletions = s)
              : n === "+" && (e.summary.insertions = s);
          }),
        ]);
    },
  }),
  _n = {};
C(_n, { commitTask: () => vn, default: () => yn });
function vn(e, t, r) {
  return {
    commands: ["-c", "core.abbrev=40", "commit", ...de(e, "-m"), ...t, ...r],
    format: "utf-8",
    parser: ha,
  };
}
function yn() {
  return {
    commit(t, ...r) {
      let n = R(arguments),
        s = e(t) ||
          vn(H(t), H(G(r[0], Pe, [])), [
            ...G(r[1], ye, []),
            ...q(arguments, 0, !0),
          ]);
      return this._runTask(s, n);
    },
  };
  function e(t) {
    return (
      !Pe(t) &&
      A(
        "git.commit: requires the commit message to be supplied as a string/string[]",
      )
    );
  }
}
var bn = l({
  "src/lib/tasks/commit.ts"() {
    pa(), y(), S();
  },
});
function da(e, t) {
  let r = ["hash-object", e];
  return t && r.push("-w"), N(r, !0);
}
var ma = l({
  "src/lib/tasks/hash-object.ts"() {
    S();
  },
});
function ga(e, t, r) {
  let n = String(r).trim(),
    s;
  if ((s = kn.exec(n))) return new Fe(e, t, !1, s[1]);
  if ((s = Tn.exec(n))) return new Fe(e, t, !0, s[1]);
  let i = "",
    u = n.split(" ");
  for (; u.length;) {
    if (u.shift() === "in") {
      i = u.join(" ");
      break;
    }
  }
  return new Fe(e, t, /^re/i.test(n), i);
}
var Fe,
  kn,
  Tn,
  _a = l({
    "src/lib/responses/InitSummary.ts"() {
      (Fe = class {
        constructor(e, t, r, n) {
          (this.bare = e),
            (this.path = t),
            (this.existing = r),
            (this.gitDir = n);
        }
      }),
        (kn = /^Init.+ repository in (.+)$/),
        (Tn = /^Rein.+ in (.+)$/);
    },
  });
function va(e) {
  return e.includes(Et);
}
function ya(e = !1, t, r) {
  let n = ["init", ...r];
  return (
    e && !va(n) && n.splice(1, 0, Et), {
      commands: n,
      format: "utf-8",
      parser(s) {
        return ga(n.includes("--bare"), t, s);
      },
    }
  );
}
var Et,
  ba = l({
    "src/lib/tasks/init.ts"() {
      _a(), (Et = "--bare");
    },
  });
function Ot(e) {
  for (let t = 0; t < e.length; t++) {
    let r = Ft.exec(e[t]);
    if (r) return `--${r[1]}`;
  }
  return "";
}
function ka(e) {
  return Ft.test(e);
}
var Ft,
  be = l({
    "src/lib/args/log-format.ts"() {
      Ft = /^--(stat|numstat|name-only|name-status)(=|$)/;
    },
  }),
  wn,
  Ta = l({
    "src/lib/responses/DiffSummary.ts"() {
      wn = class {
        constructor() {
          (this.changed = 0),
            (this.deletions = 0),
            (this.insertions = 0),
            (this.files = []);
        }
      };
    },
  });
function Cn(e = "") {
  let t = Sn[e];
  return (r) => I(new wn(), t, r, !1);
}
var Je,
  er,
  tr,
  rr,
  Sn,
  Rn = l({
    "src/lib/parsers/parse-diff-summary.ts"() {
      be(),
        Ta(),
        y(),
        (Je = [
          new v(/(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/, (e, [t, r, n = ""]) => {
            e.files.push({
              file: t.trim(),
              changes: T(r),
              insertions: n.replace(/[^+]/g, "").length,
              deletions: n.replace(/[^-]/g, "").length,
              binary: !1,
            });
          }),
          new v(
            /(.+) \|\s+Bin ([0-9.]+) -> ([0-9.]+) ([a-z]+)/,
            (e, [t, r, n]) => {
              e.files.push({
                file: t.trim(),
                before: T(r),
                after: T(n),
                binary: !0,
              });
            },
          ),
          new v(
            /(\d+) files? changed\s*((?:, \d+ [^,]+){0,2})/,
            (e, [t, r]) => {
              let n = /(\d+) i/.exec(r),
                s = /(\d+) d/.exec(r);
              (e.changed = T(t)),
                (e.insertions = T(n?.[1])),
                (e.deletions = T(s?.[1]));
            },
          ),
        ]),
        (er = [
          new v(/(\d+)\t(\d+)\t(.+)$/, (e, [t, r, n]) => {
            let s = T(t),
              i = T(r);
            e.changed++,
              (e.insertions += s),
              (e.deletions += i),
              e.files.push({
                file: n,
                changes: s + i,
                insertions: s,
                deletions: i,
                binary: !1,
              });
          }),
          new v(/-\t-\t(.+)$/, (e, [t]) => {
            e.changed++,
              e.files.push({ file: t, after: 0, before: 0, binary: !0 });
          }),
        ]),
        (tr = [
          new v(/(.+)$/, (e, [t]) => {
            e.changed++,
              e.files.push({
                file: t,
                changes: 0,
                insertions: 0,
                deletions: 0,
                binary: !1,
              });
          }),
        ]),
        (rr = [
          new v(/([ACDMRTUXB])\s*(.+)$/, (e, [t, r]) => {
            e.changed++,
              e.files.push({
                file: r,
                changes: 0,
                insertions: 0,
                deletions: 0,
                binary: !1,
              });
          }),
        ]),
        (Sn = {
          [""]: Je,
          ["--stat"]: Je,
          ["--numstat"]: er,
          ["--name-status"]: rr,
          ["--name-only"]: tr,
        });
    },
  });
function wa(e, t) {
  return t.reduce(
    (r, n, s) => ((r[n] = e[s] || ""), r),
    Object.create({ diff: null }),
  );
}
function xn(e = Mt, t = En, r = "") {
  let n = Cn(r);
  return function (s) {
    let i = _e(s, !0, At).map(function (u) {
      let o = u.trim().split(Pt),
        h = wa(o[0].trim().split(e), t);
      return o.length > 1 && o[1].trim() && (h.diff = n(o[1])), h;
    });
    return { all: i, latest: (i.length && i[0]) || null, total: i.length };
  };
}
var At,
  Pt,
  Mt,
  En,
  On = l({
    "src/lib/parsers/parse-list-log-summary.ts"() {
      y(),
        Rn(),
        be(),
        (At = "\xF2\xF2\xF2\xF2\xF2\xF2 "),
        (Pt = " \xF2\xF2"),
        (Mt = " \xF2 "),
        (En = [
          "hash",
          "date",
          "message",
          "refs",
          "author_name",
          "author_email",
        ]);
    },
  }),
  Fn = {};
C(Fn, { diffSummaryTask: () => Ca, validateLogFormatConfig: () => Ge });
function Ca(e) {
  let t = Ot(e),
    r = ["diff"];
  return (
    t === "" && ((t = "--stat"), r.push("--stat=4096")),
      r.push(...e),
      Ge(r) || { commands: r, format: "utf-8", parser: Cn(t) }
  );
}
function Ge(e) {
  let t = e.filter(ka);
  if (t.length > 1) {
    return A(
      `Summary flags are mutually exclusive - pick one of ${t.join(",")}`,
    );
  }
  if (t.length && e.includes("-z")) {
    return A(
      `Summary flag ${t} parsing is not compatible with null termination option '-z'`,
    );
  }
}
var Lt = l({
  "src/lib/tasks/diff.ts"() {
    be(), Rn(), S();
  },
});
function Sa(e, t) {
  let r = [],
    n = [];
  return (
    Object.keys(e).forEach((s) => {
      r.push(s), n.push(String(e[s]));
    }), [r, n.join(t)]
  );
}
function Ra(e) {
  return Object.keys(e).reduce((t, r) => (r in ct || (t[r] = e[r]), t), {});
}
function An(e = {}, t = []) {
  let r = G(e.splitter, x, Mt),
    n = !_t(e.format) && e.format ? e.format : {
      hash: "%H",
      date: e.strictDate === !1 ? "%ai" : "%aI",
      message: "%s",
      refs: "%D",
      body: e.multiLine ? "%B" : "%b",
      author_name: e.mailMap !== !1 ? "%aN" : "%an",
      author_email: e.mailMap !== !1 ? "%aE" : "%ae",
    },
    [s, i] = Sa(n, r),
    u = [],
    o = [`--pretty=format:${At}${i}${Pt}`, ...t],
    h = e.n || e["max-count"] || e.maxCount;
  if ((h && o.push(`--max-count=${h}`), e.from || e.to)) {
    let g = e.symmetric !== !1 ? "..." : "..";
    u.push(`${e.from || ""}${g}${e.to || ""}`);
  }
  return (
    x(e.file) && u.push("--follow", e.file),
      bt(Ra(e), o),
      { fields: s, splitter: r, commands: [...o, ...u] }
  );
}
function xa(e, t, r) {
  let n = xn(e, t, Ot(r));
  return { commands: ["log", ...r], format: "utf-8", parser: n };
}
function Ea() {
  return {
    log(...r) {
      let n = R(arguments),
        s = An(kt(arguments), G(arguments[0], ye)),
        i = t(...r) || Ge(s.commands) || e(s);
      return this._runTask(i, n);
    },
  };
  function e(r) {
    return xa(r.splitter, r.fields, r.commands);
  }
  function t(r, n) {
    return (
      x(r) &&
      x(n) &&
      A(
        "git.log(string, string) should be replaced with git.log({ from: string, to: string })",
      )
    );
  }
}
var ct,
  Pn = l({
    "src/lib/tasks/log.ts"() {
      be(),
        On(),
        y(),
        S(),
        Lt(),
        (ct = ((e) => (
          (e[e["--pretty"] = 0] = "--pretty"),
            (e[e["max-count"] = 1] = "max-count"),
            (e[e.maxCount = 2] = "maxCount"),
            (e[e.n = 3] = "n"),
            (e[e.file = 4] = "file"),
            (e[e.format = 5] = "format"),
            (e[e.from = 6] = "from"),
            (e[e.to = 7] = "to"),
            (e[e.splitter = 8] = "splitter"),
            (e[e.symmetric = 9] = "symmetric"),
            (e[e.mailMap = 10] = "mailMap"),
            (e[e.multiLine = 11] = "multiLine"),
            (e[e.strictDate = 12] = "strictDate"),
            e
        ))(ct || {}));
    },
  }),
  Ae,
  Mn,
  Oa = l({
    "src/lib/responses/MergeSummary.ts"() {
      (Ae = class {
        constructor(e, t = null, r) {
          (this.reason = e), (this.file = t), (this.meta = r);
        }
        toString() {
          return `${this.file}:${this.reason}`;
        }
      }),
        (Mn = class {
          constructor() {
            (this.conflicts = []),
              (this.merges = []),
              (this.result = "success");
          }
          get failed() {
            return this.conflicts.length > 0;
          }
          get reason() {
            return this.result;
          }
          toString() {
            return this.conflicts.length
              ? `CONFLICTS: ${this.conflicts.join(", ")}`
              : "OK";
          }
        });
    },
  }),
  lt,
  Ln,
  Fa = l({
    "src/lib/responses/PullSummary.ts"() {
      (lt = class {
        constructor() {
          (this.remoteMessages = { all: [] }),
            (this.created = []),
            (this.deleted = []),
            (this.files = []),
            (this.deletions = {}),
            (this.insertions = {}),
            (this.summary = { changes: 0, deletions: 0, insertions: 0 });
        }
      }),
        (Ln = class {
          constructor() {
            (this.remote = ""),
              (this.hash = { local: "", remote: "" }),
              (this.branch = { local: "", remote: "" }),
              (this.message = "");
          }
          toString() {
            return this.message;
          }
        });
    },
  });
function Ze(e) {
  return (e.objects = e.objects || {
    compressing: 0,
    counting: 0,
    enumerating: 0,
    packReused: 0,
    reused: { count: 0, delta: 0 },
    total: { count: 0, delta: 0 },
  });
}
function nr(e) {
  let t = /^\s*(\d+)/.exec(e),
    r = /delta (\d+)/i.exec(e);
  return { count: T((t && t[1]) || "0"), delta: T((r && r[1]) || "0") };
}
var Dn,
  Aa = l({
    "src/lib/parsers/parse-remote-objects.ts"() {
      y(),
        (Dn = [
          new W(
            /^remote:\s*(enumerating|counting|compressing) objects: (\d+),/i,
            (e, [t, r]) => {
              let n = t.toLowerCase(),
                s = Ze(e.remoteMessages);
              Object.assign(s, { [n]: T(r) });
            },
          ),
          new W(
            /^remote:\s*(enumerating|counting|compressing) objects: \d+% \(\d+\/(\d+)\),/i,
            (e, [t, r]) => {
              let n = t.toLowerCase(),
                s = Ze(e.remoteMessages);
              Object.assign(s, { [n]: T(r) });
            },
          ),
          new W(
            /total ([^,]+), reused ([^,]+), pack-reused (\d+)/i,
            (e, [t, r, n]) => {
              let s = Ze(e.remoteMessages);
              (s.total = nr(t)), (s.reused = nr(r)), (s.packReused = T(n));
            },
          ),
        ]);
    },
  });
function In(e, t) {
  return I({ remoteMessages: new $n() }, jn, t);
}
var jn,
  $n,
  Nn = l({
    "src/lib/parsers/parse-remote-messages.ts"() {
      y(),
        Aa(),
        (jn = [
          new W(
            /^remote:\s*(.+)$/,
            (e, [t]) => (e.remoteMessages.all.push(t.trim()), !1),
          ),
          ...Dn,
          new W(
            [/create a (?:pull|merge) request/i, /\s(https?:\/\/\S+)$/],
            (e, [t]) => {
              e.remoteMessages.pullRequestUrl = t;
            },
          ),
          new W(
            [
              /found (\d+) vulnerabilities.+\(([^)]+)\)/i,
              /\s(https?:\/\/\S+)$/,
            ],
            (e, [t, r, n]) => {
              e.remoteMessages.vulnerabilities = {
                count: T(t),
                summary: r,
                url: n,
              };
            },
          ),
        ]),
        ($n = class {
          constructor() {
            this.all = [];
          }
        });
    },
  });
function Pa(e, t) {
  let r = I(new Ln(), Bn, [e, t]);
  return r.message && r;
}
var sr,
  ir,
  ar,
  or,
  Bn,
  ur,
  Dt,
  Gn = l({
    "src/lib/parsers/parse-pull.ts"() {
      Fa(),
        y(),
        Nn(),
        (sr = /^\s*(.+?)\s+\|\s+\d+\s*(\+*)(-*)/),
        (ir = /(\d+)\D+((\d+)\D+\(\+\))?(\D+(\d+)\D+\(-\))?/),
        (ar = /^(create|delete) mode \d+ (.+)/),
        (or = [
          new v(sr, (e, [t, r, n]) => {
            e.files.push(t),
              r && (e.insertions[t] = r.length),
              n && (e.deletions[t] = n.length);
          }),
          new v(ir, (e, [t, , r, , n]) =>
            r !== void 0 || n !== void 0
              ? ((e.summary.changes = +t || 0),
                (e.summary.insertions = +r || 0),
                (e.summary.deletions = +n || 0),
                !0)
              : !1),
          new v(ar, (e, [t, r]) => {
            b(e.files, r), b(t === "create" ? e.created : e.deleted, r);
          }),
        ]),
        (Bn = [
          new v(/^from\s(.+)$/i, (e, [t]) => void (e.remote = t)),
          new v(/^fatal:\s(.+)$/, (e, [t]) => void (e.message = t)),
          new v(
            /([a-z0-9]+)\.\.([a-z0-9]+)\s+(\S+)\s+->\s+(\S+)$/,
            (e, [t, r, n, s]) => {
              (e.branch.local = n),
                (e.hash.local = t),
                (e.branch.remote = s),
                (e.hash.remote = r);
            },
          ),
        ]),
        (ur = (e, t) => I(new lt(), or, [e, t])),
        (Dt = (e, t) => Object.assign(new lt(), ur(e, t), In(e, t)));
    },
  }),
  cr,
  Un,
  lr,
  Ma = l({
    "src/lib/parsers/parse-merge.ts"() {
      Oa(),
        y(),
        Gn(),
        (cr = [
          new v(/^Auto-merging\s+(.+)$/, (e, [t]) => {
            e.merges.push(t);
          }),
          new v(
            /^CONFLICT\s+\((.+)\): Merge conflict in (.+)$/,
            (e, [t, r]) => {
              e.conflicts.push(new Ae(t, r));
            },
          ),
          new v(
            /^CONFLICT\s+\((.+\/delete)\): (.+) deleted in (.+) and/,
            (e, [t, r, n]) => {
              e.conflicts.push(new Ae(t, r, { deleteRef: n }));
            },
          ),
          new v(/^CONFLICT\s+\((.+)\):/, (e, [t]) => {
            e.conflicts.push(new Ae(t, null));
          }),
          new v(/^Automatic merge failed;\s+(.+)$/, (e, [t]) => {
            e.result = t;
          }),
        ]),
        (Un = (e, t) => Object.assign(lr(e, t), Dt(e, t))),
        (lr = (e) => I(new Mn(), cr, e));
    },
  });
function fr(e) {
  return e.length
    ? {
      commands: ["merge", ...e],
      format: "utf-8",
      parser(t, r) {
        let n = Un(t, r);
        if (n.failed) throw new ue(n);
        return n;
      },
    }
    : A("Git.merge requires at least one option");
}
var La = l({
  "src/lib/tasks/merge.ts"() {
    ce(), Ma(), S();
  },
});
function Da(e, t, r) {
  let n = r.includes("deleted"),
    s = r.includes("tag") || /^refs\/tags/.test(e),
    i = !r.includes("new");
  return {
    deleted: n,
    tag: s,
    branch: !s,
    new: !i,
    alreadyUpdated: i,
    local: e,
    remote: t,
  };
}
var hr,
  qn,
  pr,
  Ia = l({
    "src/lib/parsers/parse-push.ts"() {
      y(),
        Nn(),
        (hr = [
          new v(/^Pushing to (.+)$/, (e, [t]) => {
            e.repo = t;
          }),
          new v(/^updating local tracking ref '(.+)'/, (e, [t]) => {
            e.ref = pe($({}, e.ref || {}), { local: t });
          }),
          new v(/^[*-=]\s+([^:]+):(\S+)\s+\[(.+)]$/, (e, [t, r, n]) => {
            e.pushed.push(Da(t, r, n));
          }),
          new v(
            /^Branch '([^']+)' set up to track remote branch '([^']+)' from '([^']+)'/,
            (e, [t, r, n]) => {
              e.branch = pe($({}, e.branch || {}), {
                local: t,
                remote: r,
                remoteName: n,
              });
            },
          ),
          new v(
            /^([^:]+):(\S+)\s+([a-z0-9]+)\.\.([a-z0-9]+)$/,
            (e, [t, r, n, s]) => {
              e.update = {
                head: { local: t, remote: r },
                hash: { from: n, to: s },
              };
            },
          ),
        ]),
        (qn = (e, t) => {
          let r = pr(e, t),
            n = In(e, t);
          return $($({}, r), n);
        }),
        (pr = (e, t) => I({ pushed: [] }, hr, [e, t]));
    },
  }),
  zn = {};
C(zn, { pushTagsTask: () => ja, pushTask: () => It });
function ja(e = {}, t) {
  return b(t, "--tags"), It(e, t);
}
function It(e = {}, t) {
  let r = ["push", ...t];
  return (
    e.branch && r.splice(1, 0, e.branch),
      e.remote && r.splice(1, 0, e.remote),
      gt(r, "-v"),
      b(r, "--verbose"),
      b(r, "--porcelain"),
      { commands: r, format: "utf-8", parser: qn }
  );
}
var Wn = l({
    "src/lib/tasks/push.ts"() {
      Ia(), y();
    },
  }),
  dr,
  Hn,
  $a = l({
    "src/lib/responses/FileStatusSummary.ts"() {
      (dr = /^(.+) -> (.+)$/),
        (Hn = class {
          constructor(e, t, r) {
            if (
              ((this.path = e),
                (this.index = t),
                (this.working_dir = r),
                t + r === "R")
            ) {
              let n = dr.exec(e) || [null, e, e];
              (this.from = n[1] || ""), (this.path = n[2] || "");
            }
          }
        });
    },
  });
function mr(e) {
  let [t, r] = e.split(oe);
  return { from: r || t, to: t };
}
function D(e, t, r) {
  return [`${e}${t}`, r];
}
function et(e, ...t) {
  return t.map((r) => D(e, r, (n, s) => b(n.conflicted, s)));
}
function Na(e, t) {
  let r = t.trim();
  switch (" ") {
    case r.charAt(2):
      return n(r.charAt(0), r.charAt(1), r.substr(3));
    case r.charAt(1):
      return n(" ", r.charAt(0), r.substr(2));
    default:
      return;
  }
  function n(s, i, u) {
    let o = `${s}${i}`,
      h = Qn.get(o);
    h && h(e, u),
      o !== "##" &&
      o !== "!!" &&
      e.files.push(new Hn(u.replace(/\0.+$/, ""), s, i));
  }
}
var gr,
  Qn,
  Kn,
  Ba = l({
    "src/lib/responses/StatusSummary.ts"() {
      y(),
        $a(),
        (gr = class {
          constructor() {
            (this.not_added = []),
              (this.conflicted = []),
              (this.created = []),
              (this.deleted = []),
              (this.ignored = void 0),
              (this.modified = []),
              (this.renamed = []),
              (this.files = []),
              (this.staged = []),
              (this.ahead = 0),
              (this.behind = 0),
              (this.current = null),
              (this.tracking = null),
              (this.detached = !1),
              (this.isClean = () => !this.files.length);
          }
        }),
        (Qn = new Map([
          D(" ", "A", (e, t) => b(e.created, t)),
          D(" ", "D", (e, t) => b(e.deleted, t)),
          D(" ", "M", (e, t) => b(e.modified, t)),
          D("A", " ", (e, t) => b(e.created, t) && b(e.staged, t)),
          D(
            "A",
            "M",
            (e, t) => b(e.created, t) && b(e.staged, t) && b(e.modified, t),
          ),
          D("D", " ", (e, t) => b(e.deleted, t) && b(e.staged, t)),
          D("M", " ", (e, t) => b(e.modified, t) && b(e.staged, t)),
          D("M", "M", (e, t) => b(e.modified, t) && b(e.staged, t)),
          D("R", " ", (e, t) => {
            b(e.renamed, mr(t));
          }),
          D("R", "M", (e, t) => {
            let r = mr(t);
            b(e.renamed, r), b(e.modified, r.to);
          }),
          D("!", "!", (e, t) => {
            b(e.ignored = e.ignored || [], t);
          }),
          D("?", "?", (e, t) => b(e.not_added, t)),
          ...et("A", "A", "U"),
          ...et("D", "D", "U"),
          ...et("U", "A", "D", "U"),
          [
            "##",
            (e, t) => {
              let r = /ahead (\d+)/,
                n = /behind (\d+)/,
                s = /^(.+?(?=(?:\.{3}|\s|$)))/,
                i = /\.{3}(\S*)/,
                u = /\son\s([\S]+)$/,
                o;
              (o = r.exec(t)),
                (e.ahead = (o && +o[1]) || 0),
                (o = n.exec(t)),
                (e.behind = (o && +o[1]) || 0),
                (o = s.exec(t)),
                (e.current = o && o[1]),
                (o = i.exec(t)),
                (e.tracking = o && o[1]),
                (o = u.exec(t)),
                (e.current = (o && o[1]) || e.current),
                (e.detached = /\(no branch\)/.test(t));
            },
          ],
        ])),
        (Kn = function (e) {
          let t = e.split(oe),
            r = new gr();
          for (let n = 0, s = t.length; n < s;) {
            let i = t[n++].trim();
            i && (i.charAt(0) === "R" && (i += oe + (t[n++] || "")), Na(r, i));
          }
          return r;
        });
    },
  });
function Ga(e) {
  return {
    format: "utf-8",
    commands: [
      "status",
      "--porcelain",
      "-b",
      "-u",
      "--null",
      ...e.filter((r) => !Vn.includes(r)),
    ],
    parser(r) {
      return Kn(r);
    },
  };
}
var Vn,
  Ua = l({
    "src/lib/tasks/status.ts"() {
      Ba(), (Vn = ["--null", "-z"]);
    },
  });
function Le(e = 0, t = 0, r = 0, n = "", s = !0) {
  return Object.defineProperty(
    { major: e, minor: t, patch: r, agent: n, installed: s },
    "toString",
    {
      value() {
        return `${this.major}.${this.minor}.${this.patch}`;
      },
      configurable: !1,
      enumerable: !1,
    },
  );
}
function qa() {
  return Le(0, 0, 0, "", !1);
}
function za() {
  return {
    version() {
      return this._runTask({
        commands: ["--version"],
        format: "utf-8",
        parser: Wa,
        onError(e, t, r, n) {
          if (e.exitCode === -2) return r(__Buffer$.from(jt));
          n(t);
        },
      });
    },
  };
}
function Wa(e) {
  return e === jt ? qa() : I(Le(0, 0, 0, e), Xn, e);
}
var jt,
  Xn,
  Ha = l({
    "src/lib/tasks/version.ts"() {
      y(),
        (jt = "installed=false"),
        (Xn = [
          new v(
            /version (\d+)\.(\d+)\.(\d+)(?:\s*\((.+)\))?/,
            (e, [t, r, n, s = ""]) => {
              Object.assign(e, Le(T(t), T(r), T(n), s));
            },
          ),
          new v(/version (\d+)\.(\d+)\.(\D+)(.+)?$/, (e, [t, r, n, s = ""]) => {
            Object.assign(e, Le(T(t), T(r), n, s));
          }),
        ]);
    },
  }),
  Yn = {};
C(Yn, { SimpleGitApi: () => ft });
var ft,
  Qa = l({
    "src/lib/simple-git-api.ts"() {
      la(),
        fa(),
        bn(),
        sn(),
        un(),
        ma(),
        ba(),
        Pn(),
        La(),
        Wn(),
        Ua(),
        S(),
        Ha(),
        y(),
        (ft = class {
          constructor(e) {
            this._executor = e;
          }
          _runTask(e, t) {
            let r = this._executor.chain(),
              n = r.push(e);
            return (
              t && ua(e, n, t),
                Object.create(this, {
                  then: { value: n.then.bind(n) },
                  catch: { value: n.catch.bind(n) },
                  _executor: { value: r },
                })
            );
          }
          add(e) {
            return this._runTask(N(["add", ...H(e)]), R(arguments));
          }
          cwd(e) {
            let t = R(arguments);
            return typeof e == "string"
              ? this._runTask(Zt(e, this._executor), t)
              : typeof e?.path == "string"
              ? this._runTask(
                Zt(e.path, (e.root && this._executor) || void 0),
                t,
              )
              : this._runTask(
                A("Git.cwd: workingDirectory must be supplied as a string"),
                t,
              );
          }
          hashObject(e, t) {
            return this._runTask(da(e, t === !0), R(arguments));
          }
          init(e) {
            return this._runTask(
              ya(e === !0, this._executor.cwd, q(arguments)),
              R(arguments),
            );
          }
          merge() {
            return this._runTask(fr(q(arguments)), R(arguments));
          }
          mergeFromTo(e, t) {
            return x(e) && x(t)
              ? this._runTask(fr([e, t, ...q(arguments)]), R(arguments, !1))
              : this._runTask(
                A(
                  "Git.mergeFromTo requires that the 'remote' and 'branch' arguments are supplied as strings",
                ),
              );
          }
          outputHandler(e) {
            return (this._executor.outputHandler = e), this;
          }
          push() {
            let e = It(
              { remote: G(arguments[0], x), branch: G(arguments[1], x) },
              q(arguments),
            );
            return this._runTask(e, R(arguments));
          }
          stash() {
            return this._runTask(N(["stash", ...q(arguments)]), R(arguments));
          }
          status() {
            return this._runTask(Ga(q(arguments)), R(arguments));
          }
        }),
        Object.assign(ft.prototype, yn(), Vi(), Ji(), Ea(), za());
    },
  }),
  Jn = {};
C(Jn, { Scheduler: () => es });
var _r,
  es,
  Ka = l({
    "src/lib/runners/scheduler.ts"() {
      y(),
        pn(),
        (_r = (() => {
          let e = 0;
          return () => {
            e++;
            let { promise: t, done: r } = (0, Zn.createDeferred)();
            return { promise: t, done: r, id: e };
          };
        })()),
        (es = class {
          constructor(e = 2) {
            (this.concurrency = e),
              (this.logger = xt("", "scheduler")),
              (this.pending = []),
              (this.running = []),
              this.logger("Constructed, concurrency=%s", e);
          }
          schedule() {
            if (
              !this.pending.length ||
              this.running.length >= this.concurrency
            ) {
              this.logger(
                "Schedule attempt ignored, pending=%s running=%s concurrency=%s",
                this.pending.length,
                this.running.length,
                this.concurrency,
              );
              return;
            }
            let e = b(this.running, this.pending.shift());
            this.logger("Attempting id=%s", e.id),
              e.done(() => {
                this.logger("Completing id=", e.id),
                  gt(this.running, e),
                  this.schedule();
              });
          }
          next() {
            let { promise: e, id: t } = b(this.pending, _r());
            return this.logger("Scheduling id=%s", t), this.schedule(), e;
          }
        });
    },
  }),
  ts = {};
C(ts, { applyPatchTask: () => Va });
function Va(e, t) {
  return N(["apply", ...t, ...e]);
}
var Xa = l({
  "src/lib/tasks/apply-patch.ts"() {
    S();
  },
});
function Ya(e, t) {
  return { branch: e, hash: t, success: !0 };
}
function Ja(e) {
  return { branch: e, hash: null, success: !1 };
}
var rs,
  Za = l({
    "src/lib/responses/BranchDeleteSummary.ts"() {
      rs = class {
        constructor() {
          (this.all = []), (this.branches = {}), (this.errors = []);
        }
        get success() {
          return !this.errors.length;
        }
      };
    },
  });
function ns(e, t) {
  return t === 1 && ht.test(e);
}
var vr,
  ht,
  yr,
  Ue,
  eo = l({
    "src/lib/parsers/parse-branch-delete.ts"() {
      Za(),
        y(),
        (vr = /(\S+)\s+\(\S+\s([^)]+)\)/),
        (ht = /^error[^']+'([^']+)'/m),
        (yr = [
          new v(vr, (e, [t, r]) => {
            let n = Ya(t, r);
            e.all.push(n), (e.branches[t] = n);
          }),
          new v(ht, (e, [t]) => {
            let r = Ja(t);
            e.errors.push(r), e.all.push(r), (e.branches[t] = r);
          }),
        ]),
        (Ue = (e, t) => I(new rs(), yr, [e, t]));
    },
  }),
  ss,
  to = l({
    "src/lib/responses/BranchSummary.ts"() {
      ss = class {
        constructor() {
          (this.all = []),
            (this.branches = {}),
            (this.current = ""),
            (this.detached = !1);
        }
        push(e, t, r, n, s) {
          e === "*" && ((this.detached = t), (this.current = r)),
            this.all.push(r),
            (this.branches[r] = {
              current: e === "*",
              linkedWorkTree: e === "+",
              name: r,
              commit: n,
              label: s,
            });
        }
      };
    },
  });
function br(e) {
  return e ? e.charAt(0) : "";
}
function is(e) {
  return I(new ss(), as, e);
}
var as,
  ro = l({
    "src/lib/parsers/parse-branch.ts"() {
      to(),
        y(),
        (as = [
          new v(
            /^([*+]\s)?\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/,
            (e, [t, r, n, s]) => {
              e.push(br(t), !0, r, n, s);
            },
          ),
          new v(/^([*+]\s)?(\S+)\s+([a-z0-9]+)\s?(.*)$/s, (e, [t, r, n, s]) => {
            e.push(br(t), !1, r, n, s);
          }),
        ]);
    },
  }),
  os = {};
C(os, {
  branchLocalTask: () => so,
  branchTask: () => no,
  containsDeleteBranchCommand: () => us,
  deleteBranchTask: () => ao,
  deleteBranchesTask: () => io,
});
function us(e) {
  let t = ["-d", "-D", "--delete"];
  return e.some((r) => t.includes(r));
}
function no(e) {
  let t = us(e),
    r = ["branch", ...e];
  return (
    r.length === 1 && r.push("-a"), r.includes("-v") || r.splice(1, 0, "-v"), {
      format: "utf-8",
      commands: r,
      parser(n, s) {
        return t ? Ue(n, s).all[0] : is(n);
      },
    }
  );
}
function so() {
  return { format: "utf-8", commands: ["branch", "-v"], parser: is };
}
function io(e, t = !1) {
  return {
    format: "utf-8",
    commands: ["branch", "-v", t ? "-D" : "-d", ...e],
    parser(r, n) {
      return Ue(r, n);
    },
    onError({ exitCode: r, stdOut: n }, s, i, u) {
      if (!ns(String(s), r)) return u(s);
      i(n);
    },
  };
}
function ao(e, t = !1) {
  let r = {
    format: "utf-8",
    commands: ["branch", "-v", t ? "-D" : "-d", e],
    parser(n, s) {
      return Ue(n, s).branches[e];
    },
    onError({ exitCode: n, stdErr: s, stdOut: i }, u, o, h) {
      if (!ns(String(u), n)) return h(u);
      throw new ue(r.parser(me(i), me(s)), String(u));
    },
  };
  return r;
}
var oo = l({
    "src/lib/tasks/branch.ts"() {
      ce(), eo(), ro(), y();
    },
  }),
  cs,
  uo = l({
    "src/lib/responses/CheckIgnore.ts"() {
      cs = (e) =>
        e
          .split(/\n/g)
          .map((t) => t.trim())
          .filter((t) => !!t);
    },
  }),
  ls = {};
C(ls, { checkIgnoreTask: () => co });
function co(e) {
  return { commands: ["check-ignore", ...e], format: "utf-8", parser: cs };
}
var lo = l({
    "src/lib/tasks/check-ignore.ts"() {
      uo();
    },
  }),
  fs = {};
C(fs, { cloneMirrorTask: () => ho, cloneTask: () => hs });
function fo(e) {
  return /^--upload-pack(=|$)/.test(e);
}
function hs(e, t, r) {
  let n = ["clone", ...r];
  return (
    x(e) && n.push(e),
      x(t) && n.push(t),
      n.find(fo) ? A("git.fetch: potential exploit argument blocked.") : N(n)
  );
}
function ho(e, t, r) {
  return b(r, "--mirror"), hs(e, t, r);
}
var po = l({
  "src/lib/tasks/clone.ts"() {
    S(), y();
  },
});
function mo(e, t) {
  return I(
    { raw: e, remote: null, branches: [], tags: [], updated: [], deleted: [] },
    ps,
    [e, t],
  );
}
var ps,
  go = l({
    "src/lib/parsers/parse-fetch.ts"() {
      y(),
        (ps = [
          new v(/From (.+)$/, (e, [t]) => {
            e.remote = t;
          }),
          new v(/\* \[new branch]\s+(\S+)\s*-> (.+)$/, (e, [t, r]) => {
            e.branches.push({ name: t, tracking: r });
          }),
          new v(/\* \[new tag]\s+(\S+)\s*-> (.+)$/, (e, [t, r]) => {
            e.tags.push({ name: t, tracking: r });
          }),
          new v(/- \[deleted]\s+\S+\s*-> (.+)$/, (e, [t]) => {
            e.deleted.push({ tracking: t });
          }),
          new v(/\s*([^.]+)\.\.(\S+)\s+(\S+)\s*-> (.+)$/, (e, [t, r, n, s]) => {
            e.updated.push({ name: n, tracking: s, to: r, from: t });
          }),
        ]);
    },
  }),
  ds = {};
C(ds, { fetchTask: () => vo });
function _o(e) {
  return /^--upload-pack(=|$)/.test(e);
}
function vo(e, t, r) {
  let n = ["fetch", ...r];
  return (
    e && t && n.push(e, t),
      n.find(_o)
        ? A("git.fetch: potential exploit argument blocked.")
        : { commands: n, format: "utf-8", parser: mo }
  );
}
var yo = l({
  "src/lib/tasks/fetch.ts"() {
    go(), S();
  },
});
function bo(e) {
  return I({ moves: [] }, ms, e);
}
var ms,
  ko = l({
    "src/lib/parsers/parse-move.ts"() {
      y(),
        (ms = [
          new v(/^Renaming (.+) to (.+)$/, (e, [t, r]) => {
            e.moves.push({ from: t, to: r });
          }),
        ]);
    },
  }),
  gs = {};
C(gs, { moveTask: () => To });
function To(e, t) {
  return { commands: ["mv", "-v", ...H(e), t], format: "utf-8", parser: bo };
}
var wo = l({
    "src/lib/tasks/move.ts"() {
      ko(), y();
    },
  }),
  _s = {};
C(_s, { pullTask: () => Co });
function Co(e, t, r) {
  let n = ["pull", ...r];
  return (
    e && t && n.splice(1, 0, e, t), {
      commands: n,
      format: "utf-8",
      parser(s, i) {
        return Dt(s, i);
      },
      onError(s, i, u, o) {
        let h = Pa(me(s.stdOut), me(s.stdErr));
        if (h) return o(new ue(h));
        o(i);
      },
    }
  );
}
var So = l({
  "src/lib/tasks/pull.ts"() {
    ce(), Gn(), y();
  },
});
function Ro(e) {
  let t = {};
  return vs(e, ([r]) => (t[r] = { name: r })), Object.values(t);
}
function xo(e) {
  let t = {};
  return (
    vs(e, ([r, n, s]) => {
      t.hasOwnProperty(r) ||
      (t[r] = { name: r, refs: { fetch: "", push: "" } }),
        s && n && (t[r].refs[s.replace(/[^a-z]/g, "")] = n);
    }), Object.values(t)
  );
}
function vs(e, t) {
  dt(e, (r) => t(r.split(/\s+/)));
}
var Eo = l({
    "src/lib/responses/GetRemoteSummary.ts"() {
      y();
    },
  }),
  ys = {};
C(ys, {
  addRemoteTask: () => Oo,
  getRemotesTask: () => Fo,
  listRemotesTask: () => Ao,
  remoteTask: () => Po,
  removeRemoteTask: () => Mo,
});
function Oo(e, t, r = []) {
  return N(["remote", "add", ...r, e, t]);
}
function Fo(e) {
  let t = ["remote"];
  return (
    e && t.push("-v"), { commands: t, format: "utf-8", parser: e ? xo : Ro }
  );
}
function Ao(e = []) {
  let t = [...e];
  return t[0] !== "ls-remote" && t.unshift("ls-remote"), N(t);
}
function Po(e = []) {
  let t = [...e];
  return t[0] !== "remote" && t.unshift("remote"), N(t);
}
function Mo(e) {
  return N(["remote", "remove", e]);
}
var Lo = l({
    "src/lib/tasks/remote.ts"() {
      Eo(), S();
    },
  }),
  bs = {};
C(bs, { stashListTask: () => Do });
function Do(e = {}, t) {
  let r = An(e),
    n = ["stash", "list", ...r.commands, ...t],
    s = xn(r.splitter, r.fields, Ot(n));
  return Ge(n) || { commands: n, format: "utf-8", parser: s };
}
var Io = l({
    "src/lib/tasks/stash-list.ts"() {
      be(), On(), Lt(), Pn();
    },
  }),
  ks = {};
C(ks, {
  addSubModuleTask: () => jo,
  initSubModuleTask: () => $o,
  subModuleTask: () => qe,
  updateSubModuleTask: () => No,
});
function jo(e, t) {
  return qe(["add", e, t]);
}
function $o(e) {
  return qe(["init", ...e]);
}
function qe(e) {
  let t = [...e];
  return t[0] !== "submodule" && t.unshift("submodule"), N(t);
}
function No(e) {
  return qe(["update", ...e]);
}
var Bo = l({
  "src/lib/tasks/sub-module.ts"() {
    S();
  },
});
function Go(e, t) {
  let r = isNaN(e),
    n = isNaN(t);
  return r !== n ? (r ? 1 : -1) : r ? Ts(e, t) : 0;
}
function Ts(e, t) {
  return e === t ? 0 : e > t ? 1 : -1;
}
function Uo(e) {
  return e.trim();
}
function xe(e) {
  return (typeof e == "string" && parseInt(e.replace(/^\D+/g, ""), 10)) || 0;
}
var kr,
  ws,
  qo = l({
    "src/lib/responses/TagList.ts"() {
      (kr = class {
        constructor(e, t) {
          (this.all = e), (this.latest = t);
        }
      }),
        (ws = function (e, t = !1) {
          let r = e
            .split(
              `
`,
            )
            .map(Uo)
            .filter(Boolean);
          t ||
            r.sort(function (s, i) {
              let u = s.split("."),
                o = i.split(".");
              if (u.length === 1 || o.length === 1) {
                return Go(xe(u[0]), xe(o[0]));
              }
              for (let h = 0, g = Math.max(u.length, o.length); h < g; h++) {
                let c = Ts(xe(u[h]), xe(o[h]));
                if (c) return c;
              }
              return 0;
            });
          let n = t ? r[0] : [...r].reverse().find((s) => s.indexOf(".") >= 0);
          return new kr(r, n);
        });
    },
  }),
  Cs = {};
C(Cs, {
  addAnnotatedTagTask: () => Ho,
  addTagTask: () => Wo,
  tagListTask: () => zo,
});
function zo(e = []) {
  let t = e.some((r) => /^--sort=/.test(r));
  return {
    format: "utf-8",
    commands: ["tag", "-l", ...e],
    parser(r) {
      return ws(r, t);
    },
  };
}
function Wo(e) {
  return {
    format: "utf-8",
    commands: ["tag", e],
    parser() {
      return { name: e };
    },
  };
}
function Ho(e, t) {
  return {
    format: "utf-8",
    commands: ["tag", "-a", "-m", t, e],
    parser() {
      return { name: e };
    },
  };
}
var Qo = l({
    "src/lib/tasks/tag.ts"() {
      qo();
    },
  }),
  Ko = Ti({
    "src/git.js"(e, t) {
      var { GitExecutor: r } = (oa(), w(dn)),
        { SimpleGitApi: n } = (Qa(), w(Yn)),
        { Scheduler: s } = (Ka(), w(Jn)),
        { configurationErrorTask: i } = (S(), w(it)),
        {
          asArray: u,
          filterArray: o,
          filterPrimitives: h,
          filterString: g,
          filterStringOrStringArray: c,
          filterType: f,
          getTrailingOptions: d,
          trailingFunctionArgument: m,
          trailingOptionsArgument: P,
        } = (y(), w(Gr)),
        { applyPatchTask: O } = (Xa(), w(ts)),
        {
          branchTask: F,
          branchLocalTask: U,
          deleteBranchesTask: J,
          deleteBranchTask: ze,
        } = (oo(), w(os)),
        { checkIgnoreTask: Z } = (lo(), w(ls)),
        { checkIsRepoTask: Nt } = (Wr(), w(Ur)),
        { cloneTask: le, cloneMirrorTask: We } = (po(), w(fs)),
        { cleanWithOptionsTask: ke, isCleanOptionsArray: He } = (tn(), w(Zr)),
        { commitTask: pu } = (bn(), w(_n)),
        { diffSummaryTask: Ss } = (Lt(), w(Fn)),
        { fetchTask: Rs } = (yo(), w(ds)),
        { moveTask: xs } = (wo(), w(gs)),
        { pullTask: Es } = (So(), w(_s)),
        { pushTagsTask: Os } = (Wn(), w(zn)),
        {
          addRemoteTask: Fs,
          getRemotesTask: As,
          listRemotesTask: Ps,
          remoteTask: Ms,
          removeRemoteTask: Ls,
        } = (Lo(), w(ys)),
        { getResetMode: Ds, resetTask: Is } = (hn(), w(cn)),
        { stashListTask: js } = (Io(), w(bs)),
        {
          addSubModuleTask: $s,
          initSubModuleTask: Ns,
          subModuleTask: Bs,
          updateSubModuleTask: Gs,
        } = (Bo(), w(ks)),
        {
          addAnnotatedTagTask: Us,
          addTagTask: qs,
          tagListTask: zs,
        } = (Qo(), w(Cs)),
        { straightThroughBufferTask: Ws, straightThroughStringTask: j } =
          (S(), w(it));
      function _(a, p) {
        (this._executor = new r(
          a.binary,
          a.baseDir,
          new s(a.maxConcurrentProcesses),
          p,
        )), (this._trimmed = a.trimmed);
      }
      ((_.prototype = Object.create(n.prototype)).constructor = _),
        (_.prototype.customBinary = function (a) {
          return (this._executor.binary = a), this;
        }),
        (_.prototype.env = function (a, p) {
          return (
            arguments.length === 1 && typeof a == "object"
              ? (this._executor.env = a)
              : ((this._executor.env = this._executor.env || {})[a] = p), this
          );
        }),
        (_.prototype.stashList = function (a) {
          return this._runTask(
            js(P(arguments) || {}, (o(a) && a) || []),
            m(arguments),
          );
        });
      function Bt(a, p, k, E) {
        return typeof k != "string"
          ? i(`git.${a}() requires a string 'repoPath'`)
          : p(k, f(E, g), d(arguments));
      }
      (_.prototype.clone = function () {
        return this._runTask(Bt("clone", le, ...arguments), m(arguments));
      }),
        (_.prototype.mirror = function () {
          return this._runTask(Bt("mirror", We, ...arguments), m(arguments));
        }),
        (_.prototype.mv = function (a, p) {
          return this._runTask(xs(a, p), m(arguments));
        }),
        (_.prototype.checkoutLatestTag = function (a) {
          var p = this;
          return this.pull(function () {
            p.tags(function (k, E) {
              p.checkout(E.latest, a);
            });
          });
        }),
        (_.prototype.pull = function (a, p, k, E) {
          return this._runTask(
            Es(f(a, g), f(p, g), d(arguments)),
            m(arguments),
          );
        }),
        (_.prototype.fetch = function (a, p) {
          return this._runTask(
            Rs(f(a, g), f(p, g), d(arguments)),
            m(arguments),
          );
        }),
        (_.prototype.silent = function (a) {
          return (
            console.warn(
              "simple-git deprecation notice: git.silent: logging should be configured using the `debug` library / `DEBUG` environment variable, this will be an error in version 3",
            ), this
          );
        }),
        (_.prototype.tags = function (a, p) {
          return this._runTask(zs(d(arguments)), m(arguments));
        }),
        (_.prototype.rebase = function () {
          return this._runTask(j(["rebase", ...d(arguments)]), m(arguments));
        }),
        (_.prototype.reset = function (a) {
          return this._runTask(Is(Ds(a), d(arguments)), m(arguments));
        }),
        (_.prototype.revert = function (a) {
          let p = m(arguments);
          return typeof a != "string"
            ? this._runTask(i("Commit must be a string"), p)
            : this._runTask(j(["revert", ...d(arguments, 0, !0), a]), p);
        }),
        (_.prototype.addTag = function (a) {
          let p = typeof a == "string"
            ? qs(a)
            : i("Git.addTag requires a tag name");
          return this._runTask(p, m(arguments));
        }),
        (_.prototype.addAnnotatedTag = function (a, p) {
          return this._runTask(Us(a, p), m(arguments));
        }),
        (_.prototype.checkout = function () {
          let a = ["checkout", ...d(arguments, !0)];
          return this._runTask(j(a), m(arguments));
        }),
        (_.prototype.checkoutBranch = function (a, p, k) {
          return this.checkout(["-b", a, p], m(arguments));
        }),
        (_.prototype.checkoutLocalBranch = function (a, p) {
          return this.checkout(["-b", a], m(arguments));
        }),
        (_.prototype.deleteLocalBranch = function (a, p, k) {
          return this._runTask(
            ze(a, typeof p == "boolean" ? p : !1),
            m(arguments),
          );
        }),
        (_.prototype.deleteLocalBranches = function (a, p, k) {
          return this._runTask(
            J(a, typeof p == "boolean" ? p : !1),
            m(arguments),
          );
        }),
        (_.prototype.branch = function (a, p) {
          return this._runTask(F(d(arguments)), m(arguments));
        }),
        (_.prototype.branchLocal = function (a) {
          return this._runTask(U(), m(arguments));
        }),
        (_.prototype.raw = function (a) {
          let p = !Array.isArray(a),
            k = [].slice.call(p ? arguments : a, 0);
          for (let B = 0; B < k.length && p; B++) {
            if (!h(k[B])) {
              k.splice(B, k.length - B);
              break;
            }
          }
          k.push(...d(arguments, 0, !0));
          var E = m(arguments);
          return k.length
            ? this._runTask(j(k, this._trimmed), E)
            : this._runTask(
              i("Raw: must supply one or more command to execute"),
              E,
            );
        }),
        (_.prototype.submoduleAdd = function (a, p, k) {
          return this._runTask($s(a, p), m(arguments));
        }),
        (_.prototype.submoduleUpdate = function (a, p) {
          return this._runTask(Gs(d(arguments, !0)), m(arguments));
        }),
        (_.prototype.submoduleInit = function (a, p) {
          return this._runTask(Ns(d(arguments, !0)), m(arguments));
        }),
        (_.prototype.subModule = function (a, p) {
          return this._runTask(Bs(d(arguments)), m(arguments));
        }),
        (_.prototype.listRemote = function () {
          return this._runTask(Ps(d(arguments)), m(arguments));
        }),
        (_.prototype.addRemote = function (a, p, k) {
          return this._runTask(Fs(a, p, d(arguments)), m(arguments));
        }),
        (_.prototype.removeRemote = function (a, p) {
          return this._runTask(Ls(a), m(arguments));
        }),
        (_.prototype.getRemotes = function (a, p) {
          return this._runTask(As(a === !0), m(arguments));
        }),
        (_.prototype.remote = function (a, p) {
          return this._runTask(Ms(d(arguments)), m(arguments));
        }),
        (_.prototype.tag = function (a, p) {
          let k = d(arguments);
          return (
            k[0] !== "tag" && k.unshift("tag"),
              this._runTask(j(k), m(arguments))
          );
        }),
        (_.prototype.updateServerInfo = function (a) {
          return this._runTask(j(["update-server-info"]), m(arguments));
        }),
        (_.prototype.pushTags = function (a, p) {
          let k = Os({ remote: f(a, g) }, d(arguments));
          return this._runTask(k, m(arguments));
        }),
        (_.prototype.rm = function (a) {
          return this._runTask(j(["rm", "-f", ...u(a)]), m(arguments));
        }),
        (_.prototype.rmKeepLocal = function (a) {
          return this._runTask(j(["rm", "--cached", ...u(a)]), m(arguments));
        }),
        (_.prototype.catFile = function (a, p) {
          return this._catFile("utf-8", arguments);
        }),
        (_.prototype.binaryCatFile = function () {
          return this._catFile("buffer", arguments);
        }),
        (_.prototype._catFile = function (a, p) {
          var k = m(p),
            E = ["cat-file"],
            B = p[0];
          if (typeof B == "string") {
            return this._runTask(
              i("Git.catFile: options must be supplied as an array of strings"),
              k,
            );
          }
          Array.isArray(B) && E.push.apply(E, B);
          let Qe = a === "buffer" ? Ws(E) : j(E);
          return this._runTask(Qe, k);
        }),
        (_.prototype.diff = function (a, p) {
          let k = g(a)
            ? i(
              "git.diff: supplying options as a single string is no longer supported, switch to an array of strings",
            )
            : j(["diff", ...d(arguments)]);
          return this._runTask(k, m(arguments));
        }),
        (_.prototype.diffSummary = function () {
          return this._runTask(Ss(d(arguments, 1)), m(arguments));
        }),
        (_.prototype.applyPatch = function (a) {
          let p = c(a) ? O(u(a), d([].slice.call(arguments, 1))) : i(
            "git.applyPatch requires one or more string patches as the first argument",
          );
          return this._runTask(p, m(arguments));
        }),
        (_.prototype.revparse = function () {
          let a = ["rev-parse", ...d(arguments, !0)];
          return this._runTask(j(a, !0), m(arguments));
        }),
        (_.prototype.show = function (a, p) {
          return this._runTask(j(["show", ...d(arguments, 1)]), m(arguments));
        }),
        (_.prototype.clean = function (a, p, k) {
          let E = He(a),
            B = (E && a.join("")) || f(a, g) || "",
            Qe = d([].slice.call(arguments, E ? 1 : 0));
          return this._runTask(ke(B, Qe), m(arguments));
        }),
        (_.prototype.exec = function (a) {
          let p = {
            commands: [],
            format: "utf-8",
            parser() {
              typeof a == "function" && a();
            },
          };
          return this._runTask(p);
        }),
        (_.prototype.clearQueue = function () {
          return this;
        }),
        (_.prototype.checkIgnore = function (a, p) {
          return this._runTask(Z(u(f(a, c, []))), m(arguments));
        }),
        (_.prototype.checkIsRepo = function (a, p) {
          return this._runTask(Nt(f(a, g)), m(arguments));
        }),
        (t.exports = _);
    },
  });
Q();
var Vo = class extends z {
  constructor(e, t) {
    super(void 0, t), (this.config = e);
  }
};
Q();
Q();
var De = class extends z {
  constructor(e, t, r) {
    super(e, r),
      (this.task = e),
      (this.plugin = t),
      Object.setPrototypeOf(this, new.target.prototype);
  }
};
ce();
xr();
Wr();
tn();
sn();
un();
hn();
function Xo(e) {
  return e
    ? [
      {
        type: "spawn.before",
        action(n, s) {
          e.aborted &&
            s.kill(new De(void 0, "abort", "Abort already signaled"));
        },
      },
      {
        type: "spawn.after",
        action(n, s) {
          function i() {
            s.kill(new De(void 0, "abort", "Abort signal received"));
          }
          e.addEventListener("abort", i),
            s.spawned.on("close", () => e.removeEventListener("abort", i));
        },
      },
    ]
    : void 0;
}
function Yo(e) {
  return typeof e == "string" && e.trim().toLowerCase() === "-c";
}
function Jo(e, t) {
  if (Yo(e) && /^\s*protocol(.[a-z]+)?.allow/.test(t)) {
    throw new De(
      void 0,
      "unsafe",
      "Configuring protocol.allow is not permitted without enabling allowUnsafeExtProtocol",
    );
  }
}
function Zo({ allowUnsafeProtocolOverride: e = !1 } = {}) {
  return {
    type: "spawn.args",
    action(t, r) {
      return (
        t.forEach((n, s) => {
          let i = s < t.length ? t[s + 1] : "";
          e || Jo(n, i);
        }), t
      );
    },
  };
}
y();
function eu(e) {
  let t = de(e, "-c");
  return {
    type: "spawn.args",
    action(r) {
      return [...t, ...r];
    },
  };
}
y();
var Tr = (0, ae.deferred)().promise;
function tu({ onClose: e = !0, onExit: t = 50 } = {}) {
  function r() {
    let s = -1,
      i = {
        close: (0, ae.deferred)(),
        closeTimeout: (0, ae.deferred)(),
        exit: (0, ae.deferred)(),
        exitTimeout: (0, ae.deferred)(),
      },
      u = Promise.race([
        e === !1 ? Tr : i.closeTimeout.promise,
        t === !1 ? Tr : i.exitTimeout.promise,
      ]);
    return (
      n(e, i.close, i.closeTimeout), n(t, i.exit, i.exitTimeout), {
        close(o) {
          (s = o), i.close.done();
        },
        exit(o) {
          (s = o), i.exit.done();
        },
        get exitCode() {
          return s;
        },
        result: u,
      }
    );
  }
  function n(s, i, u) {
    s !== !1 &&
      (s === !0 ? i.promise : i.promise.then(() => tt(s))).then(u.done);
  }
  return {
    type: "spawn.after",
    action(s, i) {
      return he(this, arguments, function* (u, { spawned: o, close: h }) {
        var g, c;
        let f = r(),
          d = !0,
          m = () => void (d = !1);
        (g = o.stdout) == null || g.on("data", m),
          (c = o.stderr) == null || c.on("data", m),
          o.on("error", m),
          o.on("close", (P) => f.close(P)),
          o.on("exit", (P) => f.exit(P));
        try {
          yield f.result, d && (yield tt(50)), h(f.exitCode);
        } catch (P) {
          h(f.exitCode, P);
        }
      });
    },
  };
}
Q();
function ru(e) {
  return !!(e.exitCode && e.stdErr.length);
}
function nu(e) {
  return __Buffer$.concat([...e.stdOut, ...e.stdErr]);
}
function su(e = !1, t = ru, r = nu) {
  return (n, s) => ((!e && n) || !t(s) ? n : r(s));
}
function wr(e) {
  return {
    type: "task.error",
    action(t, r) {
      let n = e(t.error, {
        stdErr: r.stdErr,
        stdOut: r.stdOut,
        exitCode: r.exitCode,
      });
      return __Buffer$.isBuffer(n)
        ? { error: new z(void 0, n.toString("utf-8")) }
        : { error: n };
    },
  };
}
y();
var iu = class {
  constructor() {
    this.plugins = new Set();
  }
  add(e) {
    let t = [];
    return (
      H(e).forEach((r) => r && this.plugins.add(b(t, r))), () => {
        t.forEach((r) => this.plugins.delete(r));
      }
    );
  }
  exec(e, t, r) {
    let n = t,
      s = Object.freeze(Object.create(r));
    for (let i of this.plugins) i.type === e && (n = i.action(n, s));
    return n;
  }
};
y();
function au(e) {
  let t = "--progress",
    r = ["checkout", "clone", "fetch", "pull", "push"];
  return [
    {
      type: "spawn.args",
      action(i, u) {
        return r.includes(u.method) ? Mr(i, t) : i;
      },
    },
    {
      type: "spawn.after",
      action(i, u) {
        var o;
        u.commands.includes(t) &&
          ((o = u.spawned.stderr) == null ||
            o.on("data", (h) => {
              let g = /^([\s\S]+?):\s*(\d+)% \((\d+)\/(\d+)\)/.exec(
                h.toString("utf8"),
              );
              g &&
                e({
                  method: u.method,
                  stage: ou(g[1]),
                  progress: T(g[2]),
                  processed: T(g[3]),
                  total: T(g[4]),
                });
            }));
      },
    },
  ];
}
function ou(e) {
  return String(e.toLowerCase().split(" ", 1)) || "unknown";
}
y();
function uu(e) {
  let t = Dr(e, ["uid", "gid"]);
  return {
    type: "spawn.options",
    action(r) {
      return $($({}, t), r);
    },
  };
}
function cu({ block: e }) {
  if (e > 0) {
    return {
      type: "spawn.after",
      action(t, r) {
        var n, s;
        let i;
        function u() {
          i && clearTimeout(i), (i = setTimeout(h, e));
        }
        function o() {
          var g, c;
          (g = r.spawned.stdout) == null || g.off("data", u),
            (c = r.spawned.stderr) == null || c.off("data", u),
            r.spawned.off("exit", o),
            r.spawned.off("close", o),
            i && clearTimeout(i);
        }
        function h() {
          o(), r.kill(new De(void 0, "timeout", "block timeout reached"));
        }
        (n = r.spawned.stdout) == null || n.on("data", u),
          (s = r.spawned.stderr) == null || s.on("data", u),
          r.spawned.on("exit", o),
          r.spawned.on("close", o),
          u();
      },
    };
  }
}
y();
var lu = Ko();
function $t(e, t) {
  let r = new iu(),
    n = Nr((e && (typeof e == "string" ? { baseDir: e } : e)) || {}, t);
  if (!mt(n.baseDir)) {
    throw new Vo(n, "Cannot use simple-git on a directory that does not exist");
  }
  return (
    Array.isArray(n.config) && r.add(eu(n.config)),
      r.add(Zo(n.unsafe)),
      r.add(tu(n.completion)),
      n.abort && r.add(Xo(n.abort)),
      n.progress && r.add(au(n.progress)),
      n.timeout && r.add(cu(n.timeout)),
      n.spawnOptions && r.add(uu(n.spawnOptions)),
      r.add(wr(su(!0))),
      n.errors && r.add(wr(n.errors)),
      new lu(n, r)
  );
}
ce();
var fu = ["customBinary", "env", "outputHandler", "silent"],
  Cr = [
    "add",
    "addAnnotatedTag",
    "addConfig",
    "addRemote",
    "addTag",
    "applyPatch",
    "binaryCatFile",
    "branch",
    "branchLocal",
    "catFile",
    "checkIgnore",
    "checkIsRepo",
    "checkout",
    "checkoutBranch",
    "checkoutLatestTag",
    "checkoutLocalBranch",
    "clean",
    "clone",
    "commit",
    "cwd",
    "deleteLocalBranch",
    "deleteLocalBranches",
    "diff",
    "diffSummary",
    "exec",
    "fetch",
    "getRemotes",
    "init",
    "listConfig",
    "listRemote",
    "log",
    "merge",
    "mergeFromTo",
    "mirror",
    "mv",
    "pull",
    "push",
    "pushTags",
    "raw",
    "rebase",
    "remote",
    "removeRemote",
    "reset",
    "revert",
    "revparse",
    "rm",
    "rmKeepLocal",
    "show",
    "stash",
    "stashList",
    "status",
    "subModule",
    "submoduleAdd",
    "submoduleInit",
    "submoduleUpdate",
    "tag",
    "tags",
    "updateServerInfo",
  ];
function ku(...e) {
  let t,
    r = Promise.resolve();
  try {
    t = $t(...e);
  } catch (h) {
    r = Promise.reject(h);
  }
  function n() {
    return i;
  }
  function s() {
    return r;
  }
  let i = [...fu, ...Cr].reduce((h, g) => {
    let c = Cr.includes(g),
      f = c ? u(g, t) : o(g, t, h);
    return (
      Object.defineProperty(h, g, {
        enumerable: !1,
        configurable: !1,
        value: t ? f : c ? s : n,
      }), h
    );
  }, {});
  return i;
  function u(h, g) {
    return function (...c) {
      if (typeof c[c.length] == "function") {
        throw new TypeError(
          "Promise interface requires that handlers are not supplied inline, trailing function not allowed in call to " +
            h,
        );
      }
      return r.then(function () {
        return new Promise(function (f, d) {
          let m = (P, O) => {
            if (P) return d(hu(P));
            f(O);
          };
          c.push(m), g[h].apply(g, c);
        });
      });
    };
  }
  function o(h, g, c) {
    return (...f) => (g[h](...f), c);
  }
}
function hu(e) {
  return e instanceof Error
    ? e
    : typeof e == "string"
    ? new Error(e)
    : new ue(e);
}
var Tu = $t,
  wu = $t;
export {
  at as GitConfigScope,
  De as GitPluginError,
  Ee as CleanOptions,
  ku as gitP,
  Oe as ResetMode,
  Rr as TaskConfigurationError,
  st as CheckRepoActions,
  Tu as simpleGit,
  ue as GitResponseError,
  Vo as GitConstructError,
  wu as default,
  Xi as grepQueryBuilder,
  z as GitError,
};
