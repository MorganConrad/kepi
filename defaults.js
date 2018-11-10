const DEFAULTS = {

  HEADER_CLASSES: {
    "Accept-Ranges": "Value",
    "Age": "Value",
    "Allow": "List,",
    "Cache-Control": "Value",
    "Connection": "List,",
    "Content-Disposition": "List;",
    "Content-Encoding": "List,",
    "Content-Language": "List,",
    "Content-Length": "Value",
    "Content-Location": "Value",
    "Content-Range": "Value",
    "Content-Security-Policy": "Policies",
    "Content-Security-Policy-Report_Only": "Policies",
    "Content-Type": "List;",
    "Content-Type-Options": "Value",
    "Date": "Date",
    "ETag": "Value",
    "Expect-CT": "List,",
    "Expires": "Date",
    "Feature-Policy": "Policies",
    "Last-Modified": "Date",
    "Public-Key-Pins": "Value",
    "Referrer-Policy": "Value",
    "Set-Cookie": "List;",
    "Strict-Transport-Security": "List;",
    "Tk": "Value",
    "Trailer": "Value",
    "Transfer-Encoding": "Value",
    "Vary": "List,",
    "Via": "List,",
    "Warning": "Value",
    "WWW-Authenticate": "List,",

    "X-DNS-Prefetch-Control": "Value",
    "X-Download-Options": "Value",
    "X-Frame-Options": "Value",
    "X-Permitted-Cross-Domain-Policies": "Value",
    "X-Powered-By": "Value",
    "X-XSS-Protection": "List;",

    "Access-Control-Allow-Credentials": "Value",
    "Access-Control-Allow-Headers": "List,",
    "Access-Control-Allow-Methods": "List,",
    "Access-Control-Allow-Origin": "Value",
    "Access-Control-Expose-Headers": "List,",
    "Access-Control-Max-Age": "Value",
  },

  SAFE: {
    "Content-Security-Policy": {
      "default-src": ["'self'"],
    },
    "X-Permitted-Cross-Domain-Policies": "'none'",
    "X-DNS-Prefetch-Control": "off",
    "X-Frame-Options": "SAMEORIGIN",
    "Strict-Transport-Security": ["max-age=5184000", "includeSubDomains"],
    "X-Download-Options": "noopen",
    "Content-Type-Options": "nosniff",
    "X-XSS-Protection": [1, "mode=block"],
  },

  NICKNAMES: {
    contentSecurityPolicy: "Content-Security-Policy",
    crossdomain: "X-Permitted-Cross-Domain-Policies",
    date: "Date",
    expires: "Expires",
    dnsPrefetchControl: "X-DNS-Prefetch-Control",
    expectCt: "Expect-CT",
    featurePolicy: "Feature-Policy",
    frameguard: "X-Frame-Options",
    hidePoweredBy: "X-Powered-By",
    hpkp: "Public-Key-Pins",
    hsts: "Strict-Transport-Security",
    ienoopen: "X-Download-Options",
    nocache: "Cache-Control",
    noSniff: "Content-Type-Options",
    referrerPolicy: "Referrer-Policy",
    xssFilter: "X-XSS-Protection",

    // these are specific to me
    accessControl: {
      allowCredentials: "Access-Control-Allow-Credentials",
      allowHeaders: "Access-Control-Allow-Headers",
      allowMethods: "Access-Control-Allow-Methods",
      allowOrigin: "Access-Control-Allow-Origin",
      exposeHeaders: "Access-Control-Expose-Headers",
      maxAge: "Access-Control-Max-Age",
      requestHeaders: "Access-Control-Request-Headers",
      requestMethod: "Access-Control-Request-Method",
    },
  },

  headerClasses: {},
  nicknames: {},
  safe: {},
  setupNicknames: true,


};

module.exports = DEFAULTS;
