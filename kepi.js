const DEFAULTS = require('./defaults');
const Header = require('./header').Header;


class Kepi {

  constructor(data, customOptions) {
    data = data || {};
    this.options = Object.assign({}, DEFAULTS, customOptions);
    this.resetData = this.options.resetAfterApply ? data : null;
    this.headers = {};

    if (this.options.setupNicknames) {
      this._setupNicknames(this.options.NICKNAMES);
      this._setupNicknames(this.options.nicknames);
    }

    this.add(data);
  }


  /**
   * add to existing headers, creating if necessary
   * @param {*} data  "safe", or a { } of key/value pairs.
   */
  add(data) {
    if (data === 'safe')
      return this.safe();

    let headerNames = Object.keys(data);
    headerNames.forEach((headerName) => {
      let fullName = this._fullName(headerName);

      if (this.headers[headerName])
        this.headers[headerName].add(data[headerName]);
      else
        this.headers[headerName] = Header.create(this._headerType(fullName), fullName, data[headerName], this.options);
    });

    return this;
  }


  /**
   * Write the headers into the http.ServerResponse, and possibly reset
   * @param {*} response  http.ServerResponse
   */
  applyTo(response) {
    let headerNames = Object.keys(this.headers);
    headerNames.forEach((headerName) => {
      this.headers[headerName].applyTo(response);
    });
    if (this.resetData) {
      this.headers = {};
      this.add(this.resetData);
    }

    return this;
  }

/**
 * Find the header, creating if needed
 * @param {string} headerName
 * @param {*} data   only used if creating
 */
  header(headerName, data = undefined) {
    let fullName = this._fullName(headerName);
    let header = this.headers[fullName];
    if (header)
      return header;

    header = Header.create(this._headerType(fullName), fullName, data, this.options);
    this.headers[fullName] = header;
    return header;
  }

/**
 * Creates micro "middleware"
 * @param {*} handler
 */
  micro(handler) {
    let kepi = this;
    return function(req, res, ...restArgs) {
      kepi.applyTo(res);
      return handler(req, res, ...restArgs)
    }
  }

/**
 * Creates express middleware.  Usually used via  `app.use(kepi.middleware());`
 */
  middleware() {
    let kepi = this;
    return function(req, res, next) {
       kepi.applyTo(res);
       next();
    }
  }


  safe() {
    let allSafe = Object.assign({}, this.options.SAFE, this.options.safe);
    Object.keys(allSafe).forEach((headerName) => {
      this.header(headerName).safe();
    });
    return this;
  }

  _fullName(name) {
     return this.options.nicknames[name] ||
            this.options.NICKNAMES[name] ||
            name;
  }


  _headerType(fullName) {
    return this.options.headerClasses[fullName] || this.options.HEADER_CLASSES[fullName];
  }


  _setupNicknames(data, where = this) {
    Object.keys(data).forEach((nickname) => {
      let value = data[nickname];
      if (typeof value === 'string')
        where[nickname] = () => this.header(value);
      else {
        where[nickname] = {};
        this._setupNicknames(value, where[nickname]);
      }
    });
  }
}


module.exports = function(data, options) { return new Kepi(data, options); }
