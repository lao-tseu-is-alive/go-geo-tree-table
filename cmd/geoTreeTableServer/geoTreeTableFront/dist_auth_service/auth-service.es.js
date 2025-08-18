var ht = Object.defineProperty;
var mt = (e, t, n) => t in e ? ht(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var le = (e, t, n) => mt(e, typeof t != "symbol" ? t + "" : t, n);
function qe(e, t) {
  return function() {
    return e.apply(t, arguments);
  };
}
const { toString: gt } = Object.prototype, { getPrototypeOf: be } = Object, { iterator: ne, toStringTag: Me } = Symbol, re = /* @__PURE__ */ ((e) => (t) => {
  const n = gt.call(t);
  return e[n] || (e[n] = n.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null)), C = (e) => (e = e.toLowerCase(), (t) => re(t) === e), se = (e) => (t) => typeof t === e, { isArray: M } = Array, J = se("undefined");
function wt(e) {
  return e !== null && !J(e) && e.constructor !== null && !J(e.constructor) && x(e.constructor.isBuffer) && e.constructor.isBuffer(e);
}
const He = C("ArrayBuffer");
function Et(e) {
  let t;
  return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? t = ArrayBuffer.isView(e) : t = e && e.buffer && He(e.buffer), t;
}
const yt = se("string"), x = se("function"), ve = se("number"), oe = (e) => e !== null && typeof e == "object", St = (e) => e === !0 || e === !1, G = (e) => {
  if (re(e) !== "object")
    return !1;
  const t = be(e);
  return (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) && !(Me in e) && !(ne in e);
}, bt = C("Date"), Rt = C("File"), Tt = C("Blob"), At = C("FileList"), Ot = (e) => oe(e) && x(e.pipe), _t = (e) => {
  let t;
  return e && (typeof FormData == "function" && e instanceof FormData || x(e.append) && ((t = re(e)) === "formdata" || // detect form-data instance
  t === "object" && x(e.toString) && e.toString() === "[object FormData]"));
}, xt = C("URLSearchParams"), [Ut, kt, Ct, Nt] = ["ReadableStream", "Request", "Response", "Headers"].map(C), Pt = (e) => e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function z(e, t, { allOwnKeys: n = !1 } = {}) {
  if (e === null || typeof e > "u")
    return;
  let r, s;
  if (typeof e != "object" && (e = [e]), M(e))
    for (r = 0, s = e.length; r < s; r++)
      t.call(null, e[r], r, e);
  else {
    const o = n ? Object.getOwnPropertyNames(e) : Object.keys(e), i = o.length;
    let c;
    for (r = 0; r < i; r++)
      c = o[r], t.call(null, e[c], c, e);
  }
}
function Je(e, t) {
  t = t.toLowerCase();
  const n = Object.keys(e);
  let r = n.length, s;
  for (; r-- > 0; )
    if (s = n[r], t === s.toLowerCase())
      return s;
  return null;
}
const B = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : global, ze = (e) => !J(e) && e !== B;
function me() {
  const { caseless: e } = ze(this) && this || {}, t = {}, n = (r, s) => {
    const o = e && Je(t, s) || s;
    G(t[o]) && G(r) ? t[o] = me(t[o], r) : G(r) ? t[o] = me({}, r) : M(r) ? t[o] = r.slice() : t[o] = r;
  };
  for (let r = 0, s = arguments.length; r < s; r++)
    arguments[r] && z(arguments[r], n);
  return t;
}
const Lt = (e, t, n, { allOwnKeys: r } = {}) => (z(t, (s, o) => {
  n && x(s) ? e[o] = qe(s, n) : e[o] = s;
}, { allOwnKeys: r }), e), Dt = (e) => (e.charCodeAt(0) === 65279 && (e = e.slice(1)), e), It = (e, t, n, r) => {
  e.prototype = Object.create(t.prototype, r), e.prototype.constructor = e, Object.defineProperty(e, "super", {
    value: t.prototype
  }), n && Object.assign(e.prototype, n);
}, Ft = (e, t, n, r) => {
  let s, o, i;
  const c = {};
  if (t = t || {}, e == null) return t;
  do {
    for (s = Object.getOwnPropertyNames(e), o = s.length; o-- > 0; )
      i = s[o], (!r || r(i, e, t)) && !c[i] && (t[i] = e[i], c[i] = !0);
    e = n !== !1 && be(e);
  } while (e && (!n || n(e, t)) && e !== Object.prototype);
  return t;
}, jt = (e, t, n) => {
  e = String(e), (n === void 0 || n > e.length) && (n = e.length), n -= t.length;
  const r = e.indexOf(t, n);
  return r !== -1 && r === n;
}, Bt = (e) => {
  if (!e) return null;
  if (M(e)) return e;
  let t = e.length;
  if (!ve(t)) return null;
  const n = new Array(t);
  for (; t-- > 0; )
    n[t] = e[t];
  return n;
}, $t = /* @__PURE__ */ ((e) => (t) => e && t instanceof e)(typeof Uint8Array < "u" && be(Uint8Array)), qt = (e, t) => {
  const r = (e && e[ne]).call(e);
  let s;
  for (; (s = r.next()) && !s.done; ) {
    const o = s.value;
    t.call(e, o[0], o[1]);
  }
}, Mt = (e, t) => {
  let n;
  const r = [];
  for (; (n = e.exec(t)) !== null; )
    r.push(n);
  return r;
}, Ht = C("HTMLFormElement"), vt = (e) => e.toLowerCase().replace(
  /[-_\s]([a-z\d])(\w*)/g,
  function(n, r, s) {
    return r.toUpperCase() + s;
  }
), Oe = (({ hasOwnProperty: e }) => (t, n) => e.call(t, n))(Object.prototype), Jt = C("RegExp"), Ve = (e, t) => {
  const n = Object.getOwnPropertyDescriptors(e), r = {};
  z(n, (s, o) => {
    let i;
    (i = t(s, o, e)) !== !1 && (r[o] = i || s);
  }), Object.defineProperties(e, r);
}, zt = (e) => {
  Ve(e, (t, n) => {
    if (x(e) && ["arguments", "caller", "callee"].indexOf(n) !== -1)
      return !1;
    const r = e[n];
    if (x(r)) {
      if (t.enumerable = !1, "writable" in t) {
        t.writable = !1;
        return;
      }
      t.set || (t.set = () => {
        throw Error("Can not rewrite read-only method '" + n + "'");
      });
    }
  });
}, Vt = (e, t) => {
  const n = {}, r = (s) => {
    s.forEach((o) => {
      n[o] = !0;
    });
  };
  return M(e) ? r(e) : r(String(e).split(t)), n;
}, Wt = () => {
}, Kt = (e, t) => e != null && Number.isFinite(e = +e) ? e : t;
function Xt(e) {
  return !!(e && x(e.append) && e[Me] === "FormData" && e[ne]);
}
const Gt = (e) => {
  const t = new Array(10), n = (r, s) => {
    if (oe(r)) {
      if (t.indexOf(r) >= 0)
        return;
      if (!("toJSON" in r)) {
        t[s] = r;
        const o = M(r) ? [] : {};
        return z(r, (i, c) => {
          const u = n(i, s + 1);
          !J(u) && (o[c] = u);
        }), t[s] = void 0, o;
      }
    }
    return r;
  };
  return n(e, 0);
}, Qt = C("AsyncFunction"), Yt = (e) => e && (oe(e) || x(e)) && x(e.then) && x(e.catch), We = ((e, t) => e ? setImmediate : t ? ((n, r) => (B.addEventListener("message", ({ source: s, data: o }) => {
  s === B && o === n && r.length && r.shift()();
}, !1), (s) => {
  r.push(s), B.postMessage(n, "*");
}))(`axios@${Math.random()}`, []) : (n) => setTimeout(n))(
  typeof setImmediate == "function",
  x(B.postMessage)
), Zt = typeof queueMicrotask < "u" ? queueMicrotask.bind(B) : typeof process < "u" && process.nextTick || We, en = (e) => e != null && x(e[ne]), a = {
  isArray: M,
  isArrayBuffer: He,
  isBuffer: wt,
  isFormData: _t,
  isArrayBufferView: Et,
  isString: yt,
  isNumber: ve,
  isBoolean: St,
  isObject: oe,
  isPlainObject: G,
  isReadableStream: Ut,
  isRequest: kt,
  isResponse: Ct,
  isHeaders: Nt,
  isUndefined: J,
  isDate: bt,
  isFile: Rt,
  isBlob: Tt,
  isRegExp: Jt,
  isFunction: x,
  isStream: Ot,
  isURLSearchParams: xt,
  isTypedArray: $t,
  isFileList: At,
  forEach: z,
  merge: me,
  extend: Lt,
  trim: Pt,
  stripBOM: Dt,
  inherits: It,
  toFlatObject: Ft,
  kindOf: re,
  kindOfTest: C,
  endsWith: jt,
  toArray: Bt,
  forEachEntry: qt,
  matchAll: Mt,
  isHTMLForm: Ht,
  hasOwnProperty: Oe,
  hasOwnProp: Oe,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors: Ve,
  freezeMethods: zt,
  toObjectSet: Vt,
  toCamelCase: vt,
  noop: Wt,
  toFiniteNumber: Kt,
  findKey: Je,
  global: B,
  isContextDefined: ze,
  isSpecCompliantForm: Xt,
  toJSONObject: Gt,
  isAsyncFn: Qt,
  isThenable: Yt,
  setImmediate: We,
  asap: Zt,
  isIterable: en
};
function m(e, t, n, r, s) {
  Error.call(this), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack, this.message = e, this.name = "AxiosError", t && (this.code = t), n && (this.config = n), r && (this.request = r), s && (this.response = s, this.status = s.status ? s.status : null);
}
a.inherits(m, Error, {
  toJSON: function() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: a.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
});
const Ke = m.prototype, Xe = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL"
  // eslint-disable-next-line func-names
].forEach((e) => {
  Xe[e] = { value: e };
});
Object.defineProperties(m, Xe);
Object.defineProperty(Ke, "isAxiosError", { value: !0 });
m.from = (e, t, n, r, s, o) => {
  const i = Object.create(Ke);
  return a.toFlatObject(e, i, function(u) {
    return u !== Error.prototype;
  }, (c) => c !== "isAxiosError"), m.call(i, e.message, t, n, r, s), i.cause = e, i.name = e.name, o && Object.assign(i, o), i;
};
const tn = null;
function ge(e) {
  return a.isPlainObject(e) || a.isArray(e);
}
function Ge(e) {
  return a.endsWith(e, "[]") ? e.slice(0, -2) : e;
}
function _e(e, t, n) {
  return e ? e.concat(t).map(function(s, o) {
    return s = Ge(s), !n && o ? "[" + s + "]" : s;
  }).join(n ? "." : "") : t;
}
function nn(e) {
  return a.isArray(e) && !e.some(ge);
}
const rn = a.toFlatObject(a, {}, null, function(t) {
  return /^is[A-Z]/.test(t);
});
function ie(e, t, n) {
  if (!a.isObject(e))
    throw new TypeError("target must be an object");
  t = t || new FormData(), n = a.toFlatObject(n, {
    metaTokens: !0,
    dots: !1,
    indexes: !1
  }, !1, function(g, h) {
    return !a.isUndefined(h[g]);
  });
  const r = n.metaTokens, s = n.visitor || f, o = n.dots, i = n.indexes, u = (n.Blob || typeof Blob < "u" && Blob) && a.isSpecCompliantForm(t);
  if (!a.isFunction(s))
    throw new TypeError("visitor must be a function");
  function l(d) {
    if (d === null) return "";
    if (a.isDate(d))
      return d.toISOString();
    if (a.isBoolean(d))
      return d.toString();
    if (!u && a.isBlob(d))
      throw new m("Blob is not supported. Use a Buffer instead.");
    return a.isArrayBuffer(d) || a.isTypedArray(d) ? u && typeof Blob == "function" ? new Blob([d]) : Buffer.from(d) : d;
  }
  function f(d, g, h) {
    let S = d;
    if (d && !h && typeof d == "object") {
      if (a.endsWith(g, "{}"))
        g = r ? g : g.slice(0, -2), d = JSON.stringify(d);
      else if (a.isArray(d) && nn(d) || (a.isFileList(d) || a.endsWith(g, "[]")) && (S = a.toArray(d)))
        return g = Ge(g), S.forEach(function(A, L) {
          !(a.isUndefined(A) || A === null) && t.append(
            // eslint-disable-next-line no-nested-ternary
            i === !0 ? _e([g], L, o) : i === null ? g : g + "[]",
            l(A)
          );
        }), !1;
    }
    return ge(d) ? !0 : (t.append(_e(h, g, o), l(d)), !1);
  }
  const p = [], w = Object.assign(rn, {
    defaultVisitor: f,
    convertValue: l,
    isVisitable: ge
  });
  function R(d, g) {
    if (!a.isUndefined(d)) {
      if (p.indexOf(d) !== -1)
        throw Error("Circular reference detected in " + g.join("."));
      p.push(d), a.forEach(d, function(S, T) {
        (!(a.isUndefined(S) || S === null) && s.call(
          t,
          S,
          a.isString(T) ? T.trim() : T,
          g,
          w
        )) === !0 && R(S, g ? g.concat(T) : [T]);
      }), p.pop();
    }
  }
  if (!a.isObject(e))
    throw new TypeError("data must be an object");
  return R(e), t;
}
function xe(e) {
  const t = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0"
  };
  return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function(r) {
    return t[r];
  });
}
function Re(e, t) {
  this._pairs = [], e && ie(e, this, t);
}
const Qe = Re.prototype;
Qe.append = function(t, n) {
  this._pairs.push([t, n]);
};
Qe.toString = function(t) {
  const n = t ? function(r) {
    return t.call(this, r, xe);
  } : xe;
  return this._pairs.map(function(s) {
    return n(s[0]) + "=" + n(s[1]);
  }, "").join("&");
};
function sn(e) {
  return encodeURIComponent(e).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
}
function Ye(e, t, n) {
  if (!t)
    return e;
  const r = n && n.encode || sn;
  a.isFunction(n) && (n = {
    serialize: n
  });
  const s = n && n.serialize;
  let o;
  if (s ? o = s(t, n) : o = a.isURLSearchParams(t) ? t.toString() : new Re(t, n).toString(r), o) {
    const i = e.indexOf("#");
    i !== -1 && (e = e.slice(0, i)), e += (e.indexOf("?") === -1 ? "?" : "&") + o;
  }
  return e;
}
class Ue {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(t, n, r) {
    return this.handlers.push({
      fulfilled: t,
      rejected: n,
      synchronous: r ? r.synchronous : !1,
      runWhen: r ? r.runWhen : null
    }), this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(t) {
    this.handlers[t] && (this.handlers[t] = null);
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    this.handlers && (this.handlers = []);
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(t) {
    a.forEach(this.handlers, function(r) {
      r !== null && t(r);
    });
  }
}
const Ze = {
  silentJSONParsing: !0,
  forcedJSONParsing: !0,
  clarifyTimeoutError: !1
}, on = typeof URLSearchParams < "u" ? URLSearchParams : Re, an = typeof FormData < "u" ? FormData : null, cn = typeof Blob < "u" ? Blob : null, ln = {
  isBrowser: !0,
  classes: {
    URLSearchParams: on,
    FormData: an,
    Blob: cn
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
}, Te = typeof window < "u" && typeof document < "u", we = typeof navigator == "object" && navigator || void 0, un = Te && (!we || ["ReactNative", "NativeScript", "NS"].indexOf(we.product) < 0), fn = typeof WorkerGlobalScope < "u" && // eslint-disable-next-line no-undef
self instanceof WorkerGlobalScope && typeof self.importScripts == "function", dn = Te && window.location.href || "http://localhost", pn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hasBrowserEnv: Te,
  hasStandardBrowserEnv: un,
  hasStandardBrowserWebWorkerEnv: fn,
  navigator: we,
  origin: dn
}, Symbol.toStringTag, { value: "Module" })), O = {
  ...pn,
  ...ln
};
function hn(e, t) {
  return ie(e, new O.classes.URLSearchParams(), Object.assign({
    visitor: function(n, r, s, o) {
      return O.isNode && a.isBuffer(n) ? (this.append(r, n.toString("base64")), !1) : o.defaultVisitor.apply(this, arguments);
    }
  }, t));
}
function mn(e) {
  return a.matchAll(/\w+|\[(\w*)]/g, e).map((t) => t[0] === "[]" ? "" : t[1] || t[0]);
}
function gn(e) {
  const t = {}, n = Object.keys(e);
  let r;
  const s = n.length;
  let o;
  for (r = 0; r < s; r++)
    o = n[r], t[o] = e[o];
  return t;
}
function et(e) {
  function t(n, r, s, o) {
    let i = n[o++];
    if (i === "__proto__") return !0;
    const c = Number.isFinite(+i), u = o >= n.length;
    return i = !i && a.isArray(s) ? s.length : i, u ? (a.hasOwnProp(s, i) ? s[i] = [s[i], r] : s[i] = r, !c) : ((!s[i] || !a.isObject(s[i])) && (s[i] = []), t(n, r, s[i], o) && a.isArray(s[i]) && (s[i] = gn(s[i])), !c);
  }
  if (a.isFormData(e) && a.isFunction(e.entries)) {
    const n = {};
    return a.forEachEntry(e, (r, s) => {
      t(mn(r), s, n, 0);
    }), n;
  }
  return null;
}
function wn(e, t, n) {
  if (a.isString(e))
    try {
      return (t || JSON.parse)(e), a.trim(e);
    } catch (r) {
      if (r.name !== "SyntaxError")
        throw r;
    }
  return (n || JSON.stringify)(e);
}
const V = {
  transitional: Ze,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [function(t, n) {
    const r = n.getContentType() || "", s = r.indexOf("application/json") > -1, o = a.isObject(t);
    if (o && a.isHTMLForm(t) && (t = new FormData(t)), a.isFormData(t))
      return s ? JSON.stringify(et(t)) : t;
    if (a.isArrayBuffer(t) || a.isBuffer(t) || a.isStream(t) || a.isFile(t) || a.isBlob(t) || a.isReadableStream(t))
      return t;
    if (a.isArrayBufferView(t))
      return t.buffer;
    if (a.isURLSearchParams(t))
      return n.setContentType("application/x-www-form-urlencoded;charset=utf-8", !1), t.toString();
    let c;
    if (o) {
      if (r.indexOf("application/x-www-form-urlencoded") > -1)
        return hn(t, this.formSerializer).toString();
      if ((c = a.isFileList(t)) || r.indexOf("multipart/form-data") > -1) {
        const u = this.env && this.env.FormData;
        return ie(
          c ? { "files[]": t } : t,
          u && new u(),
          this.formSerializer
        );
      }
    }
    return o || s ? (n.setContentType("application/json", !1), wn(t)) : t;
  }],
  transformResponse: [function(t) {
    const n = this.transitional || V.transitional, r = n && n.forcedJSONParsing, s = this.responseType === "json";
    if (a.isResponse(t) || a.isReadableStream(t))
      return t;
    if (t && a.isString(t) && (r && !this.responseType || s)) {
      const i = !(n && n.silentJSONParsing) && s;
      try {
        return JSON.parse(t);
      } catch (c) {
        if (i)
          throw c.name === "SyntaxError" ? m.from(c, m.ERR_BAD_RESPONSE, this, null, this.response) : c;
      }
    }
    return t;
  }],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: O.classes.FormData,
    Blob: O.classes.Blob
  },
  validateStatus: function(t) {
    return t >= 200 && t < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
a.forEach(["delete", "get", "head", "post", "put", "patch"], (e) => {
  V.headers[e] = {};
});
const En = a.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]), yn = (e) => {
  const t = {};
  let n, r, s;
  return e && e.split(`
`).forEach(function(i) {
    s = i.indexOf(":"), n = i.substring(0, s).trim().toLowerCase(), r = i.substring(s + 1).trim(), !(!n || t[n] && En[n]) && (n === "set-cookie" ? t[n] ? t[n].push(r) : t[n] = [r] : t[n] = t[n] ? t[n] + ", " + r : r);
  }), t;
}, ke = Symbol("internals");
function v(e) {
  return e && String(e).trim().toLowerCase();
}
function Q(e) {
  return e === !1 || e == null ? e : a.isArray(e) ? e.map(Q) : String(e);
}
function Sn(e) {
  const t = /* @__PURE__ */ Object.create(null), n = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let r;
  for (; r = n.exec(e); )
    t[r[1]] = r[2];
  return t;
}
const bn = (e) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim());
function ue(e, t, n, r, s) {
  if (a.isFunction(r))
    return r.call(this, t, n);
  if (s && (t = n), !!a.isString(t)) {
    if (a.isString(r))
      return t.indexOf(r) !== -1;
    if (a.isRegExp(r))
      return r.test(t);
  }
}
function Rn(e) {
  return e.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (t, n, r) => n.toUpperCase() + r);
}
function Tn(e, t) {
  const n = a.toCamelCase(" " + t);
  ["get", "set", "has"].forEach((r) => {
    Object.defineProperty(e, r + n, {
      value: function(s, o, i) {
        return this[r].call(this, t, s, o, i);
      },
      configurable: !0
    });
  });
}
let U = class {
  constructor(t) {
    t && this.set(t);
  }
  set(t, n, r) {
    const s = this;
    function o(c, u, l) {
      const f = v(u);
      if (!f)
        throw new Error("header name must be a non-empty string");
      const p = a.findKey(s, f);
      (!p || s[p] === void 0 || l === !0 || l === void 0 && s[p] !== !1) && (s[p || u] = Q(c));
    }
    const i = (c, u) => a.forEach(c, (l, f) => o(l, f, u));
    if (a.isPlainObject(t) || t instanceof this.constructor)
      i(t, n);
    else if (a.isString(t) && (t = t.trim()) && !bn(t))
      i(yn(t), n);
    else if (a.isObject(t) && a.isIterable(t)) {
      let c = {}, u, l;
      for (const f of t) {
        if (!a.isArray(f))
          throw TypeError("Object iterator must return a key-value pair");
        c[l = f[0]] = (u = c[l]) ? a.isArray(u) ? [...u, f[1]] : [u, f[1]] : f[1];
      }
      i(c, n);
    } else
      t != null && o(n, t, r);
    return this;
  }
  get(t, n) {
    if (t = v(t), t) {
      const r = a.findKey(this, t);
      if (r) {
        const s = this[r];
        if (!n)
          return s;
        if (n === !0)
          return Sn(s);
        if (a.isFunction(n))
          return n.call(this, s, r);
        if (a.isRegExp(n))
          return n.exec(s);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(t, n) {
    if (t = v(t), t) {
      const r = a.findKey(this, t);
      return !!(r && this[r] !== void 0 && (!n || ue(this, this[r], r, n)));
    }
    return !1;
  }
  delete(t, n) {
    const r = this;
    let s = !1;
    function o(i) {
      if (i = v(i), i) {
        const c = a.findKey(r, i);
        c && (!n || ue(r, r[c], c, n)) && (delete r[c], s = !0);
      }
    }
    return a.isArray(t) ? t.forEach(o) : o(t), s;
  }
  clear(t) {
    const n = Object.keys(this);
    let r = n.length, s = !1;
    for (; r--; ) {
      const o = n[r];
      (!t || ue(this, this[o], o, t, !0)) && (delete this[o], s = !0);
    }
    return s;
  }
  normalize(t) {
    const n = this, r = {};
    return a.forEach(this, (s, o) => {
      const i = a.findKey(r, o);
      if (i) {
        n[i] = Q(s), delete n[o];
        return;
      }
      const c = t ? Rn(o) : String(o).trim();
      c !== o && delete n[o], n[c] = Q(s), r[c] = !0;
    }), this;
  }
  concat(...t) {
    return this.constructor.concat(this, ...t);
  }
  toJSON(t) {
    const n = /* @__PURE__ */ Object.create(null);
    return a.forEach(this, (r, s) => {
      r != null && r !== !1 && (n[s] = t && a.isArray(r) ? r.join(", ") : r);
    }), n;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([t, n]) => t + ": " + n).join(`
`);
  }
  getSetCookie() {
    return this.get("set-cookie") || [];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(t) {
    return t instanceof this ? t : new this(t);
  }
  static concat(t, ...n) {
    const r = new this(t);
    return n.forEach((s) => r.set(s)), r;
  }
  static accessor(t) {
    const r = (this[ke] = this[ke] = {
      accessors: {}
    }).accessors, s = this.prototype;
    function o(i) {
      const c = v(i);
      r[c] || (Tn(s, i), r[c] = !0);
    }
    return a.isArray(t) ? t.forEach(o) : o(t), this;
  }
};
U.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
a.reduceDescriptors(U.prototype, ({ value: e }, t) => {
  let n = t[0].toUpperCase() + t.slice(1);
  return {
    get: () => e,
    set(r) {
      this[n] = r;
    }
  };
});
a.freezeMethods(U);
function fe(e, t) {
  const n = this || V, r = t || n, s = U.from(r.headers);
  let o = r.data;
  return a.forEach(e, function(c) {
    o = c.call(n, o, s.normalize(), t ? t.status : void 0);
  }), s.normalize(), o;
}
function tt(e) {
  return !!(e && e.__CANCEL__);
}
function H(e, t, n) {
  m.call(this, e ?? "canceled", m.ERR_CANCELED, t, n), this.name = "CanceledError";
}
a.inherits(H, m, {
  __CANCEL__: !0
});
function nt(e, t, n) {
  const r = n.config.validateStatus;
  !n.status || !r || r(n.status) ? e(n) : t(new m(
    "Request failed with status code " + n.status,
    [m.ERR_BAD_REQUEST, m.ERR_BAD_RESPONSE][Math.floor(n.status / 100) - 4],
    n.config,
    n.request,
    n
  ));
}
function An(e) {
  const t = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
  return t && t[1] || "";
}
function On(e, t) {
  e = e || 10;
  const n = new Array(e), r = new Array(e);
  let s = 0, o = 0, i;
  return t = t !== void 0 ? t : 1e3, function(u) {
    const l = Date.now(), f = r[o];
    i || (i = l), n[s] = u, r[s] = l;
    let p = o, w = 0;
    for (; p !== s; )
      w += n[p++], p = p % e;
    if (s = (s + 1) % e, s === o && (o = (o + 1) % e), l - i < t)
      return;
    const R = f && l - f;
    return R ? Math.round(w * 1e3 / R) : void 0;
  };
}
function _n(e, t) {
  let n = 0, r = 1e3 / t, s, o;
  const i = (l, f = Date.now()) => {
    n = f, s = null, o && (clearTimeout(o), o = null), e.apply(null, l);
  };
  return [(...l) => {
    const f = Date.now(), p = f - n;
    p >= r ? i(l, f) : (s = l, o || (o = setTimeout(() => {
      o = null, i(s);
    }, r - p)));
  }, () => s && i(s)];
}
const Z = (e, t, n = 3) => {
  let r = 0;
  const s = On(50, 250);
  return _n((o) => {
    const i = o.loaded, c = o.lengthComputable ? o.total : void 0, u = i - r, l = s(u), f = i <= c;
    r = i;
    const p = {
      loaded: i,
      total: c,
      progress: c ? i / c : void 0,
      bytes: u,
      rate: l || void 0,
      estimated: l && c && f ? (c - i) / l : void 0,
      event: o,
      lengthComputable: c != null,
      [t ? "download" : "upload"]: !0
    };
    e(p);
  }, n);
}, Ce = (e, t) => {
  const n = e != null;
  return [(r) => t[0]({
    lengthComputable: n,
    total: e,
    loaded: r
  }), t[1]];
}, Ne = (e) => (...t) => a.asap(() => e(...t)), xn = O.hasStandardBrowserEnv ? /* @__PURE__ */ ((e, t) => (n) => (n = new URL(n, O.origin), e.protocol === n.protocol && e.host === n.host && (t || e.port === n.port)))(
  new URL(O.origin),
  O.navigator && /(msie|trident)/i.test(O.navigator.userAgent)
) : () => !0, Un = O.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(e, t, n, r, s, o) {
      const i = [e + "=" + encodeURIComponent(t)];
      a.isNumber(n) && i.push("expires=" + new Date(n).toGMTString()), a.isString(r) && i.push("path=" + r), a.isString(s) && i.push("domain=" + s), o === !0 && i.push("secure"), document.cookie = i.join("; ");
    },
    read(e) {
      const t = document.cookie.match(new RegExp("(^|;\\s*)(" + e + ")=([^;]*)"));
      return t ? decodeURIComponent(t[3]) : null;
    },
    remove(e) {
      this.write(e, "", Date.now() - 864e5);
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);
function kn(e) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
}
function Cn(e, t) {
  return t ? e.replace(/\/?\/$/, "") + "/" + t.replace(/^\/+/, "") : e;
}
function rt(e, t, n) {
  let r = !kn(t);
  return e && (r || n == !1) ? Cn(e, t) : t;
}
const Pe = (e) => e instanceof U ? { ...e } : e;
function q(e, t) {
  t = t || {};
  const n = {};
  function r(l, f, p, w) {
    return a.isPlainObject(l) && a.isPlainObject(f) ? a.merge.call({ caseless: w }, l, f) : a.isPlainObject(f) ? a.merge({}, f) : a.isArray(f) ? f.slice() : f;
  }
  function s(l, f, p, w) {
    if (a.isUndefined(f)) {
      if (!a.isUndefined(l))
        return r(void 0, l, p, w);
    } else return r(l, f, p, w);
  }
  function o(l, f) {
    if (!a.isUndefined(f))
      return r(void 0, f);
  }
  function i(l, f) {
    if (a.isUndefined(f)) {
      if (!a.isUndefined(l))
        return r(void 0, l);
    } else return r(void 0, f);
  }
  function c(l, f, p) {
    if (p in t)
      return r(l, f);
    if (p in e)
      return r(void 0, l);
  }
  const u = {
    url: o,
    method: o,
    data: o,
    baseURL: i,
    transformRequest: i,
    transformResponse: i,
    paramsSerializer: i,
    timeout: i,
    timeoutMessage: i,
    withCredentials: i,
    withXSRFToken: i,
    adapter: i,
    responseType: i,
    xsrfCookieName: i,
    xsrfHeaderName: i,
    onUploadProgress: i,
    onDownloadProgress: i,
    decompress: i,
    maxContentLength: i,
    maxBodyLength: i,
    beforeRedirect: i,
    transport: i,
    httpAgent: i,
    httpsAgent: i,
    cancelToken: i,
    socketPath: i,
    responseEncoding: i,
    validateStatus: c,
    headers: (l, f, p) => s(Pe(l), Pe(f), p, !0)
  };
  return a.forEach(Object.keys(Object.assign({}, e, t)), function(f) {
    const p = u[f] || s, w = p(e[f], t[f], f);
    a.isUndefined(w) && p !== c || (n[f] = w);
  }), n;
}
const st = (e) => {
  const t = q({}, e);
  let { data: n, withXSRFToken: r, xsrfHeaderName: s, xsrfCookieName: o, headers: i, auth: c } = t;
  t.headers = i = U.from(i), t.url = Ye(rt(t.baseURL, t.url, t.allowAbsoluteUrls), e.params, e.paramsSerializer), c && i.set(
    "Authorization",
    "Basic " + btoa((c.username || "") + ":" + (c.password ? unescape(encodeURIComponent(c.password)) : ""))
  );
  let u;
  if (a.isFormData(n)) {
    if (O.hasStandardBrowserEnv || O.hasStandardBrowserWebWorkerEnv)
      i.setContentType(void 0);
    else if ((u = i.getContentType()) !== !1) {
      const [l, ...f] = u ? u.split(";").map((p) => p.trim()).filter(Boolean) : [];
      i.setContentType([l || "multipart/form-data", ...f].join("; "));
    }
  }
  if (O.hasStandardBrowserEnv && (r && a.isFunction(r) && (r = r(t)), r || r !== !1 && xn(t.url))) {
    const l = s && o && Un.read(o);
    l && i.set(s, l);
  }
  return t;
}, Nn = typeof XMLHttpRequest < "u", Pn = Nn && function(e) {
  return new Promise(function(n, r) {
    const s = st(e);
    let o = s.data;
    const i = U.from(s.headers).normalize();
    let { responseType: c, onUploadProgress: u, onDownloadProgress: l } = s, f, p, w, R, d;
    function g() {
      R && R(), d && d(), s.cancelToken && s.cancelToken.unsubscribe(f), s.signal && s.signal.removeEventListener("abort", f);
    }
    let h = new XMLHttpRequest();
    h.open(s.method.toUpperCase(), s.url, !0), h.timeout = s.timeout;
    function S() {
      if (!h)
        return;
      const A = U.from(
        "getAllResponseHeaders" in h && h.getAllResponseHeaders()
      ), _ = {
        data: !c || c === "text" || c === "json" ? h.responseText : h.response,
        status: h.status,
        statusText: h.statusText,
        headers: A,
        config: e,
        request: h
      };
      nt(function(j) {
        n(j), g();
      }, function(j) {
        r(j), g();
      }, _), h = null;
    }
    "onloadend" in h ? h.onloadend = S : h.onreadystatechange = function() {
      !h || h.readyState !== 4 || h.status === 0 && !(h.responseURL && h.responseURL.indexOf("file:") === 0) || setTimeout(S);
    }, h.onabort = function() {
      h && (r(new m("Request aborted", m.ECONNABORTED, e, h)), h = null);
    }, h.onerror = function() {
      r(new m("Network Error", m.ERR_NETWORK, e, h)), h = null;
    }, h.ontimeout = function() {
      let L = s.timeout ? "timeout of " + s.timeout + "ms exceeded" : "timeout exceeded";
      const _ = s.transitional || Ze;
      s.timeoutErrorMessage && (L = s.timeoutErrorMessage), r(new m(
        L,
        _.clarifyTimeoutError ? m.ETIMEDOUT : m.ECONNABORTED,
        e,
        h
      )), h = null;
    }, o === void 0 && i.setContentType(null), "setRequestHeader" in h && a.forEach(i.toJSON(), function(L, _) {
      h.setRequestHeader(_, L);
    }), a.isUndefined(s.withCredentials) || (h.withCredentials = !!s.withCredentials), c && c !== "json" && (h.responseType = s.responseType), l && ([w, d] = Z(l, !0), h.addEventListener("progress", w)), u && h.upload && ([p, R] = Z(u), h.upload.addEventListener("progress", p), h.upload.addEventListener("loadend", R)), (s.cancelToken || s.signal) && (f = (A) => {
      h && (r(!A || A.type ? new H(null, e, h) : A), h.abort(), h = null);
    }, s.cancelToken && s.cancelToken.subscribe(f), s.signal && (s.signal.aborted ? f() : s.signal.addEventListener("abort", f)));
    const T = An(s.url);
    if (T && O.protocols.indexOf(T) === -1) {
      r(new m("Unsupported protocol " + T + ":", m.ERR_BAD_REQUEST, e));
      return;
    }
    h.send(o || null);
  });
}, Ln = (e, t) => {
  const { length: n } = e = e ? e.filter(Boolean) : [];
  if (t || n) {
    let r = new AbortController(), s;
    const o = function(l) {
      if (!s) {
        s = !0, c();
        const f = l instanceof Error ? l : this.reason;
        r.abort(f instanceof m ? f : new H(f instanceof Error ? f.message : f));
      }
    };
    let i = t && setTimeout(() => {
      i = null, o(new m(`timeout ${t} of ms exceeded`, m.ETIMEDOUT));
    }, t);
    const c = () => {
      e && (i && clearTimeout(i), i = null, e.forEach((l) => {
        l.unsubscribe ? l.unsubscribe(o) : l.removeEventListener("abort", o);
      }), e = null);
    };
    e.forEach((l) => l.addEventListener("abort", o));
    const { signal: u } = r;
    return u.unsubscribe = () => a.asap(c), u;
  }
}, Dn = function* (e, t) {
  let n = e.byteLength;
  if (n < t) {
    yield e;
    return;
  }
  let r = 0, s;
  for (; r < n; )
    s = r + t, yield e.slice(r, s), r = s;
}, In = async function* (e, t) {
  for await (const n of Fn(e))
    yield* Dn(n, t);
}, Fn = async function* (e) {
  if (e[Symbol.asyncIterator]) {
    yield* e;
    return;
  }
  const t = e.getReader();
  try {
    for (; ; ) {
      const { done: n, value: r } = await t.read();
      if (n)
        break;
      yield r;
    }
  } finally {
    await t.cancel();
  }
}, Le = (e, t, n, r) => {
  const s = In(e, t);
  let o = 0, i, c = (u) => {
    i || (i = !0, r && r(u));
  };
  return new ReadableStream({
    async pull(u) {
      try {
        const { done: l, value: f } = await s.next();
        if (l) {
          c(), u.close();
          return;
        }
        let p = f.byteLength;
        if (n) {
          let w = o += p;
          n(w);
        }
        u.enqueue(new Uint8Array(f));
      } catch (l) {
        throw c(l), l;
      }
    },
    cancel(u) {
      return c(u), s.return();
    }
  }, {
    highWaterMark: 2
  });
}, ae = typeof fetch == "function" && typeof Request == "function" && typeof Response == "function", ot = ae && typeof ReadableStream == "function", jn = ae && (typeof TextEncoder == "function" ? /* @__PURE__ */ ((e) => (t) => e.encode(t))(new TextEncoder()) : async (e) => new Uint8Array(await new Response(e).arrayBuffer())), it = (e, ...t) => {
  try {
    return !!e(...t);
  } catch {
    return !1;
  }
}, Bn = ot && it(() => {
  let e = !1;
  const t = new Request(O.origin, {
    body: new ReadableStream(),
    method: "POST",
    get duplex() {
      return e = !0, "half";
    }
  }).headers.has("Content-Type");
  return e && !t;
}), De = 64 * 1024, Ee = ot && it(() => a.isReadableStream(new Response("").body)), ee = {
  stream: Ee && ((e) => e.body)
};
ae && ((e) => {
  ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((t) => {
    !ee[t] && (ee[t] = a.isFunction(e[t]) ? (n) => n[t]() : (n, r) => {
      throw new m(`Response type '${t}' is not supported`, m.ERR_NOT_SUPPORT, r);
    });
  });
})(new Response());
const $n = async (e) => {
  if (e == null)
    return 0;
  if (a.isBlob(e))
    return e.size;
  if (a.isSpecCompliantForm(e))
    return (await new Request(O.origin, {
      method: "POST",
      body: e
    }).arrayBuffer()).byteLength;
  if (a.isArrayBufferView(e) || a.isArrayBuffer(e))
    return e.byteLength;
  if (a.isURLSearchParams(e) && (e = e + ""), a.isString(e))
    return (await jn(e)).byteLength;
}, qn = async (e, t) => {
  const n = a.toFiniteNumber(e.getContentLength());
  return n ?? $n(t);
}, Mn = ae && (async (e) => {
  let {
    url: t,
    method: n,
    data: r,
    signal: s,
    cancelToken: o,
    timeout: i,
    onDownloadProgress: c,
    onUploadProgress: u,
    responseType: l,
    headers: f,
    withCredentials: p = "same-origin",
    fetchOptions: w
  } = st(e);
  l = l ? (l + "").toLowerCase() : "text";
  let R = Ln([s, o && o.toAbortSignal()], i), d;
  const g = R && R.unsubscribe && (() => {
    R.unsubscribe();
  });
  let h;
  try {
    if (u && Bn && n !== "get" && n !== "head" && (h = await qn(f, r)) !== 0) {
      let _ = new Request(t, {
        method: "POST",
        body: r,
        duplex: "half"
      }), I;
      if (a.isFormData(r) && (I = _.headers.get("content-type")) && f.setContentType(I), _.body) {
        const [j, W] = Ce(
          h,
          Z(Ne(u))
        );
        r = Le(_.body, De, j, W);
      }
    }
    a.isString(p) || (p = p ? "include" : "omit");
    const S = "credentials" in Request.prototype;
    d = new Request(t, {
      ...w,
      signal: R,
      method: n.toUpperCase(),
      headers: f.normalize().toJSON(),
      body: r,
      duplex: "half",
      credentials: S ? p : void 0
    });
    let T = await fetch(d, w);
    const A = Ee && (l === "stream" || l === "response");
    if (Ee && (c || A && g)) {
      const _ = {};
      ["status", "statusText", "headers"].forEach((Ae) => {
        _[Ae] = T[Ae];
      });
      const I = a.toFiniteNumber(T.headers.get("content-length")), [j, W] = c && Ce(
        I,
        Z(Ne(c), !0)
      ) || [];
      T = new Response(
        Le(T.body, De, j, () => {
          W && W(), g && g();
        }),
        _
      );
    }
    l = l || "text";
    let L = await ee[a.findKey(ee, l) || "text"](T, e);
    return !A && g && g(), await new Promise((_, I) => {
      nt(_, I, {
        data: L,
        headers: U.from(T.headers),
        status: T.status,
        statusText: T.statusText,
        config: e,
        request: d
      });
    });
  } catch (S) {
    throw g && g(), S && S.name === "TypeError" && /Load failed|fetch/i.test(S.message) ? Object.assign(
      new m("Network Error", m.ERR_NETWORK, e, d),
      {
        cause: S.cause || S
      }
    ) : m.from(S, S && S.code, e, d);
  }
}), ye = {
  http: tn,
  xhr: Pn,
  fetch: Mn
};
a.forEach(ye, (e, t) => {
  if (e) {
    try {
      Object.defineProperty(e, "name", { value: t });
    } catch {
    }
    Object.defineProperty(e, "adapterName", { value: t });
  }
});
const Ie = (e) => `- ${e}`, Hn = (e) => a.isFunction(e) || e === null || e === !1, at = {
  getAdapter: (e) => {
    e = a.isArray(e) ? e : [e];
    const { length: t } = e;
    let n, r;
    const s = {};
    for (let o = 0; o < t; o++) {
      n = e[o];
      let i;
      if (r = n, !Hn(n) && (r = ye[(i = String(n)).toLowerCase()], r === void 0))
        throw new m(`Unknown adapter '${i}'`);
      if (r)
        break;
      s[i || "#" + o] = r;
    }
    if (!r) {
      const o = Object.entries(s).map(
        ([c, u]) => `adapter ${c} ` + (u === !1 ? "is not supported by the environment" : "is not available in the build")
      );
      let i = t ? o.length > 1 ? `since :
` + o.map(Ie).join(`
`) : " " + Ie(o[0]) : "as no adapter specified";
      throw new m(
        "There is no suitable adapter to dispatch the request " + i,
        "ERR_NOT_SUPPORT"
      );
    }
    return r;
  },
  adapters: ye
};
function de(e) {
  if (e.cancelToken && e.cancelToken.throwIfRequested(), e.signal && e.signal.aborted)
    throw new H(null, e);
}
function Fe(e) {
  return de(e), e.headers = U.from(e.headers), e.data = fe.call(
    e,
    e.transformRequest
  ), ["post", "put", "patch"].indexOf(e.method) !== -1 && e.headers.setContentType("application/x-www-form-urlencoded", !1), at.getAdapter(e.adapter || V.adapter)(e).then(function(r) {
    return de(e), r.data = fe.call(
      e,
      e.transformResponse,
      r
    ), r.headers = U.from(r.headers), r;
  }, function(r) {
    return tt(r) || (de(e), r && r.response && (r.response.data = fe.call(
      e,
      e.transformResponse,
      r.response
    ), r.response.headers = U.from(r.response.headers))), Promise.reject(r);
  });
}
const ct = "1.10.0", ce = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((e, t) => {
  ce[e] = function(r) {
    return typeof r === e || "a" + (t < 1 ? "n " : " ") + e;
  };
});
const je = {};
ce.transitional = function(t, n, r) {
  function s(o, i) {
    return "[Axios v" + ct + "] Transitional option '" + o + "'" + i + (r ? ". " + r : "");
  }
  return (o, i, c) => {
    if (t === !1)
      throw new m(
        s(i, " has been removed" + (n ? " in " + n : "")),
        m.ERR_DEPRECATED
      );
    return n && !je[i] && (je[i] = !0, console.warn(
      s(
        i,
        " has been deprecated since v" + n + " and will be removed in the near future"
      )
    )), t ? t(o, i, c) : !0;
  };
};
ce.spelling = function(t) {
  return (n, r) => (console.warn(`${r} is likely a misspelling of ${t}`), !0);
};
function vn(e, t, n) {
  if (typeof e != "object")
    throw new m("options must be an object", m.ERR_BAD_OPTION_VALUE);
  const r = Object.keys(e);
  let s = r.length;
  for (; s-- > 0; ) {
    const o = r[s], i = t[o];
    if (i) {
      const c = e[o], u = c === void 0 || i(c, o, e);
      if (u !== !0)
        throw new m("option " + o + " must be " + u, m.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (n !== !0)
      throw new m("Unknown option " + o, m.ERR_BAD_OPTION);
  }
}
const Y = {
  assertOptions: vn,
  validators: ce
}, N = Y.validators;
let $ = class {
  constructor(t) {
    this.defaults = t || {}, this.interceptors = {
      request: new Ue(),
      response: new Ue()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(t, n) {
    try {
      return await this._request(t, n);
    } catch (r) {
      if (r instanceof Error) {
        let s = {};
        Error.captureStackTrace ? Error.captureStackTrace(s) : s = new Error();
        const o = s.stack ? s.stack.replace(/^.+\n/, "") : "";
        try {
          r.stack ? o && !String(r.stack).endsWith(o.replace(/^.+\n.+\n/, "")) && (r.stack += `
` + o) : r.stack = o;
        } catch {
        }
      }
      throw r;
    }
  }
  _request(t, n) {
    typeof t == "string" ? (n = n || {}, n.url = t) : n = t || {}, n = q(this.defaults, n);
    const { transitional: r, paramsSerializer: s, headers: o } = n;
    r !== void 0 && Y.assertOptions(r, {
      silentJSONParsing: N.transitional(N.boolean),
      forcedJSONParsing: N.transitional(N.boolean),
      clarifyTimeoutError: N.transitional(N.boolean)
    }, !1), s != null && (a.isFunction(s) ? n.paramsSerializer = {
      serialize: s
    } : Y.assertOptions(s, {
      encode: N.function,
      serialize: N.function
    }, !0)), n.allowAbsoluteUrls !== void 0 || (this.defaults.allowAbsoluteUrls !== void 0 ? n.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls : n.allowAbsoluteUrls = !0), Y.assertOptions(n, {
      baseUrl: N.spelling("baseURL"),
      withXsrfToken: N.spelling("withXSRFToken")
    }, !0), n.method = (n.method || this.defaults.method || "get").toLowerCase();
    let i = o && a.merge(
      o.common,
      o[n.method]
    );
    o && a.forEach(
      ["delete", "get", "head", "post", "put", "patch", "common"],
      (d) => {
        delete o[d];
      }
    ), n.headers = U.concat(i, o);
    const c = [];
    let u = !0;
    this.interceptors.request.forEach(function(g) {
      typeof g.runWhen == "function" && g.runWhen(n) === !1 || (u = u && g.synchronous, c.unshift(g.fulfilled, g.rejected));
    });
    const l = [];
    this.interceptors.response.forEach(function(g) {
      l.push(g.fulfilled, g.rejected);
    });
    let f, p = 0, w;
    if (!u) {
      const d = [Fe.bind(this), void 0];
      for (d.unshift.apply(d, c), d.push.apply(d, l), w = d.length, f = Promise.resolve(n); p < w; )
        f = f.then(d[p++], d[p++]);
      return f;
    }
    w = c.length;
    let R = n;
    for (p = 0; p < w; ) {
      const d = c[p++], g = c[p++];
      try {
        R = d(R);
      } catch (h) {
        g.call(this, h);
        break;
      }
    }
    try {
      f = Fe.call(this, R);
    } catch (d) {
      return Promise.reject(d);
    }
    for (p = 0, w = l.length; p < w; )
      f = f.then(l[p++], l[p++]);
    return f;
  }
  getUri(t) {
    t = q(this.defaults, t);
    const n = rt(t.baseURL, t.url, t.allowAbsoluteUrls);
    return Ye(n, t.params, t.paramsSerializer);
  }
};
a.forEach(["delete", "get", "head", "options"], function(t) {
  $.prototype[t] = function(n, r) {
    return this.request(q(r || {}, {
      method: t,
      url: n,
      data: (r || {}).data
    }));
  };
});
a.forEach(["post", "put", "patch"], function(t) {
  function n(r) {
    return function(o, i, c) {
      return this.request(q(c || {}, {
        method: t,
        headers: r ? {
          "Content-Type": "multipart/form-data"
        } : {},
        url: o,
        data: i
      }));
    };
  }
  $.prototype[t] = n(), $.prototype[t + "Form"] = n(!0);
});
let Jn = class lt {
  constructor(t) {
    if (typeof t != "function")
      throw new TypeError("executor must be a function.");
    let n;
    this.promise = new Promise(function(o) {
      n = o;
    });
    const r = this;
    this.promise.then((s) => {
      if (!r._listeners) return;
      let o = r._listeners.length;
      for (; o-- > 0; )
        r._listeners[o](s);
      r._listeners = null;
    }), this.promise.then = (s) => {
      let o;
      const i = new Promise((c) => {
        r.subscribe(c), o = c;
      }).then(s);
      return i.cancel = function() {
        r.unsubscribe(o);
      }, i;
    }, t(function(o, i, c) {
      r.reason || (r.reason = new H(o, i, c), n(r.reason));
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason)
      throw this.reason;
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(t) {
    if (this.reason) {
      t(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(t) : this._listeners = [t];
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(t) {
    if (!this._listeners)
      return;
    const n = this._listeners.indexOf(t);
    n !== -1 && this._listeners.splice(n, 1);
  }
  toAbortSignal() {
    const t = new AbortController(), n = (r) => {
      t.abort(r);
    };
    return this.subscribe(n), t.signal.unsubscribe = () => this.unsubscribe(n), t.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let t;
    return {
      token: new lt(function(s) {
        t = s;
      }),
      cancel: t
    };
  }
};
function zn(e) {
  return function(n) {
    return e.apply(null, n);
  };
}
function Vn(e) {
  return a.isObject(e) && e.isAxiosError === !0;
}
const Se = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511
};
Object.entries(Se).forEach(([e, t]) => {
  Se[t] = e;
});
function ut(e) {
  const t = new $(e), n = qe($.prototype.request, t);
  return a.extend(n, $.prototype, t, { allOwnKeys: !0 }), a.extend(n, t, null, { allOwnKeys: !0 }), n.create = function(s) {
    return ut(q(e, s));
  }, n;
}
const E = ut(V);
E.Axios = $;
E.CanceledError = H;
E.CancelToken = Jn;
E.isCancel = tt;
E.VERSION = ct;
E.toFormData = ie;
E.AxiosError = m;
E.Cancel = E.CanceledError;
E.all = function(t) {
  return Promise.all(t);
};
E.spread = zn;
E.isAxiosError = Vn;
E.mergeConfig = q;
E.AxiosHeaders = U;
E.formToJSON = (e) => et(a.isHTMLForm(e) ? new FormData(e) : e);
E.getAdapter = at.getAdapter;
E.HttpStatusCode = Se;
E.default = E;
const {
  Axios: or,
  AxiosError: ir,
  CanceledError: ar,
  isCancel: cr,
  CancelToken: lr,
  VERSION: ur,
  all: fr,
  Cancel: dr,
  isAxiosError: pr,
  spread: hr,
  toFormData: mr,
  AxiosHeaders: gr,
  HttpStatusCode: wr,
  formToJSON: Er,
  getAdapter: yr,
  mergeConfig: Sr
} = E, pe = function(e) {
  switch (e) {
    case 4:
      return "color: #1976d2";
    case 3:
      return "color: #3D873FFF";
    case 2:
      return "color: #ff9800";
    case 1:
      return "color: #f44336";
  }
  return "background: #dddddd; color: #000";
}, K = function(e) {
  if (typeof e > "u" || e === null)
    return "";
  {
    let t = e.replace(/^Error\s+/, "");
    return t = t.split(`
`)[1], t = t.replace(/^\s+at Object./, ""), t = t.replace(/ \(.+\)$/, ""), t = t.replace(/\@.+/, ""), t = t.replace("at ", "").trim(), t = t.replace("VueComponent.", "").trim(), t;
  }
}, X = function(e, t, n, r, ...s) {
  let o;
  switch (t.length > 1 ? o = `${e}::${t}()` : o = `${e}::`, r) {
    case 1:
      console.error(`%c ${o} ${n}`, pe(r)), console.trace();
      break;
    case 2:
      console.warn(`%c ${o} ${n}`, pe(r));
      break;
    default:
      console.log(`%c ${o} ${n}`, pe(r));
      break;
  }
  s.length > 0 && s.forEach((i) => console.log(i));
};
class Be {
  constructor(t = "", n = 4) {
    le(this, "_moduleName", "");
    le(this, "_logLevel", 4);
    this._moduleName = t, this._logLevel = n;
  }
  l(t, ...n) {
    if (this._logLevel >= 4) {
      const r = K(new Error().stack);
      X(this._moduleName, r, t, 4, ...n);
    }
  }
  t(t, ...n) {
    if (this._logLevel >= 3) {
      const r = K(new Error().stack);
      X(this._moduleName, r, t, 3, ...n);
    }
  }
  w(t, ...n) {
    if (this._logLevel >= 2) {
      const r = K(new Error().stack);
      X(this._moduleName, r, t, 2, ...n);
    }
  }
  e(t, ...n) {
    if (this._logLevel >= 1) {
      const r = K(new Error().stack);
      X(this._moduleName, r, t, 1, ...n);
    }
  }
}
var Wn = {};
const ft = Wn.NODE_ENV === "development", he = new URL(location.toString()), Kn = he.href.endsWith("/") ? he.href.slice(0, -1) : he.href, Xn = "http://localhost:7979", Gn = ft ? Xn : Kn, dt = "/goapi/v1", Qn = (e, t, n) => ft ? new Be(e, t) : new Be(e, n), Yn = 1e4, $e = (e) => typeof e > "u" || e === null, y = Qn("AuthService", 2, 1), b = {
  JWT_TOKEN: "_goapi_jwt_session_token",
  USER_ID: "_goapi_idgouser",
  USER_EXTERNAL_ID: "_goapi_user_external_id",
  NAME: "_goapi_name",
  USERNAME: "_goapi_username",
  EMAIL: "_goapi_email",
  IS_ADMIN: "_goapi_isadmin",
  DATE_EXPIRATION: "_goapi_date_expiration",
  SESSION_UUID: "_goapi_session_uuid",
  GROUPS: "_goapi_groups"
};
class F extends Error {
  constructor(t, n) {
    super(t), this.status = n, this.name = "AuthError";
  }
}
const te = (e, t) => `${e}${t}`, D = (e, t, n) => {
  sessionStorage.setItem(te(e, t), n);
}, P = (e, t) => (y.t(
  `session get called with key:${t}, appName:${te(e, t)}`
), sessionStorage.getItem(te(e, t))), Zn = (e, t) => {
  sessionStorage.removeItem(te(e, t));
}, pt = (e) => {
  y.t(`# entering clearSession... ${e} `), Object.values(b).forEach((t) => Zn(e, t)), y.t("Session storage cleared for app:", e);
}, er = (e) => {
  try {
    const t = e.split(".")[1];
    if (!t) throw new Error("Invalid JWT format: Missing payload.");
    const n = t.replace(/-/g, "+").replace(/_/g, "/"), r = decodeURIComponent(
      window.atob(n).split("").map((s) => `%${`00${s.charCodeAt(0).toString(16)}`.slice(-2)}`).join("")
    );
    return JSON.parse(r);
  } catch (t) {
    throw y.e("Error parsing JWT:", t), new F(
      `Invalid JWT token: ${t instanceof Error ? t.message : String(t)}`
    );
  }
}, br = async (e, t = 8) => {
  if (e.trim().length >= t) {
    const r = new TextEncoder().encode(e), s = await crypto.subtle.digest("SHA-256", r);
    return Array.from(new Uint8Array(s)).map((i) => i.toString(16).padStart(2, "0")).join("");
  } else
    throw new F(
      `Password must be at least ${t} characters long`
    );
}, Rr = async (e, t, n, r, s, o = !1) => {
  var c;
  const i = `${t}${n}`;
  y.t(
    `# entering getToken... ${i} isF5: ${o}, username: ${r}`
  );
  try {
    let u = null;
    if (o)
      u = await E.get(i), y.l("getToken() isF5 axios.get Success! response:", u.data);
    else {
      if (!(e != null && e.trim()) || !(r != null && r.trim()) || !(s != null && s.trim()))
        throw new F("appName, username, and passwordHash are required");
      u = await E.post(i, {
        username: r,
        password_hash: s
      }), y.l("getToken() axios.post Success! response:", u.data);
    }
    if ($e(u.data))
      return {
        msg: "getToken() backend did not send data.",
        err: new F("backend did not send data"),
        status: u.status,
        data: u.data,
        receivedValidToken: !1
      };
    if ($e(u.data.jwtStatus))
      return {
        msg: "getToken() backend did not send jwtStatus.",
        err: new F("backend did not send jwtStatus"),
        status: u.status,
        data: u.data,
        receivedValidToken: !1
      };
    if (u.data.jwtStatus !== "success")
      return {
        msg: `getToken() backend got problem jwtStatus : ${u.data.jwtStatus}`,
        err: new F(`backend got problem jwtStatus : ${u.data.jwtStatus}`),
        status: u.status,
        data: u.data,
        receivedValidToken: !1
      };
    const l = er(u.data.token);
    y.l("getToken() parsed token values:", l);
    const f = /* @__PURE__ */ new Date(0);
    return f.setUTCSeconds(l.exp), y.l(`getToken() JWT token expiration: ${f}`), D(e, b.JWT_TOKEN, u.data.token), u.data.session && D(e, b.SESSION_UUID, u.data.session), D(
      e,
      b.USER_ID,
      String(l.User.user_id)
    ), D(
      e,
      b.USER_EXTERNAL_ID,
      l.User.external_id
    ), D(e, b.NAME, l.name), D(e, b.USERNAME, l.User.login), D(e, b.EMAIL, l.User.email), D(
      e,
      b.IS_ADMIN,
      String(l.User.is_admin)
    ), D(
      e,
      b.DATE_EXPIRATION,
      String(l.exp)
    ), {
      msg: "getToken() axios.post Success.",
      err: null,
      status: u.status,
      data: u.data,
      receivedValidToken: !0
    };
  } catch (u) {
    if (E.isAxiosError(u)) {
      const f = `getToken() Axios Error: ${u.message}`;
      return y.w(f, u.response), { msg: f, err: u, status: (c = u.response) == null ? void 0 : c.status, data: null, receivedValidToken: !1 };
    }
    const l = `getToken() Unexpected Error: ${u}`;
    return y.e(l), {
      msg: l,
      err: u instanceof Error ? u : new Error(String(u)),
      status: void 0,
      data: null,
      receivedValidToken: !1
    };
  }
}, k = (e) => {
  y.t("# entering getUserProfile validation...");
  const t = P(e, b.JWT_TOKEN), n = P(e, b.DATE_EXPIRATION), r = P(e, b.USER_ID), s = P(e, b.EMAIL);
  if (!t || !n || !r || !s)
    return y.w(
      `# IN getUserProfile() - Missing required session keys: jwtToken: ${t}, expiration: ${n}, userId: ${r}, email: ${s}`
    ), null;
  const o = new Date(parseInt(n, 10) * 1e3), i = /* @__PURE__ */ new Date();
  if (i > o)
    return y.w(
      `# IN getUserProfile() - SESSION EXPIRED. Expiration was: ${o.toString()}`
    ), pt(e), null;
  const c = Math.floor(
    (o.getTime() - i.getTime()) / 1e3 / 60
  );
  return y.l(
    `Yes, session exists and is valid for ${c} more minutes.`
  ), {
    jwtToken: t,
    dateExpiration: parseInt(n, 10),
    userId: parseInt(r, 10),
    email: s,
    isAdmin: P(e, b.IS_ADMIN) === "true",
    name: P(e, b.NAME) ?? "",
    username: P(e, b.USERNAME) ?? "",
    userExternalId: P(e, b.USER_EXTERNAL_ID) ?? "",
    sessionUuid: P(e, b.SESSION_UUID) ?? "",
    groups: P(e, b.GROUPS)
  };
}, Tr = (e) => (y.t("# entering doesCurrentSessionExist..."), k(e) !== null), Ar = async (e, t = Gn) => {
  var r;
  y.t("# entering getTokenStatus...");
  const n = k(e);
  if (!n)
    return {
      msg: "No valid session found locally.",
      err: new F("No session"),
      status: 401,
      data: null
    };
  try {
    const s = await E.get(`${t}${dt}/status`, {
      headers: {
        Authorization: `Bearer ${n.jwtToken}`,
        "X-Goeland-Token": n.sessionUuid
      },
      timeout: Yn
    });
    y.l("getTokenStatus() axios.get Success! response:", s);
    const o = /* @__PURE__ */ new Date(0);
    o.setUTCSeconds(s.data.exp);
    const i = `getTokenStatus() JWT token expiration: ${o}`;
    return y.l(i), { msg: i, err: null, status: s.status, data: s.data };
  } catch (s) {
    if (E.isAxiosError(s)) {
      const i = `Error in getTokenStatus(): ${s.message}`;
      return y.w(i, s.response), { msg: i, err: s, status: (r = s.response) == null ? void 0 : r.status, data: null };
    }
    const o = `Unexpected error in getTokenStatus(): ${s}`;
    return y.e(o), {
      msg: o,
      err: s instanceof Error ? s : new Error(String(s)),
      status: void 0,
      data: null
    };
  }
}, Or = async (e, t) => {
  y.t("# IN logoutAndResetToken()");
  const n = k(e);
  if (pt(e), !n) {
    y.w("logoutAndResetToken called, but no local session was found.");
    return;
  }
  try {
    const r = await E.get(`${t}${dt}/logout`, {
      headers: { Authorization: `Bearer ${n.jwtToken}` }
    });
    y.l("logoutAndResetToken() Server logout Success! response:", r);
  } catch (r) {
    throw y.e("logoutAndResetToken() ## SERVER LOGOUT ERROR ##:", r), new F(
      `Server logout failed: ${r instanceof Error ? r.message : String(r)}`
    );
  }
}, _r = (e) => {
  var t;
  return ((t = k(e)) == null ? void 0 : t.jwtToken) ?? "";
}, xr = (e) => {
  var t;
  return ((t = k(e)) == null ? void 0 : t.dateExpiration) ?? 0;
}, Ur = (e) => {
  var t;
  return ((t = k(e)) == null ? void 0 : t.email) ?? "";
}, kr = (e) => {
  var t;
  return ((t = k(e)) == null ? void 0 : t.userId) ?? 0;
}, Cr = (e) => {
  var t;
  return ((t = k(e)) == null ? void 0 : t.name) ?? "";
}, Nr = (e) => {
  var t;
  return ((t = k(e)) == null ? void 0 : t.username) ?? "";
}, Pr = (e) => {
  var t;
  return ((t = k(e)) == null ? void 0 : t.isAdmin) ?? !1;
}, Lr = (e) => {
  var t;
  return ((t = k(e)) == null ? void 0 : t.sessionUuid) ?? "";
}, tr = (e) => {
  var n;
  const t = (n = k(e)) == null ? void 0 : n.groups;
  return !t || t === "null" ? null : t.split(",").map((r) => parseInt(r.trim(), 10));
}, Dr = (e) => {
  var t;
  return ((t = tr(e)) == null ? void 0 : t[0]) ?? null;
}, Ir = (e) => {
  var n;
  const t = (n = k(e)) == null ? void 0 : n.groups;
  return !!t && t !== "null";
};
export {
  pt as clearSession,
  Tr as doesCurrentSessionExist,
  xr as getDateExpiration,
  _r as getLocalJwtTokenAuth,
  br as getPasswordHashSHA256,
  Lr as getSessionId,
  Rr as getToken,
  Ar as getTokenStatus,
  Ur as getUserEmail,
  Dr as getUserFirstGroups,
  tr as getUserGroupsArray,
  kr as getUserId,
  Pr as getUserIsAdmin,
  Nr as getUserLogin,
  Cr as getUserName,
  k as getUserProfile,
  Ir as isUserHavingGroups,
  Or as logoutAndResetToken,
  er as parseJwt
};
