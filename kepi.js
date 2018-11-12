const DEFAULTS = require('./defaults');
const Header = require('./header').Header;


class Kepi {

  constructor(data, customOptions) {
    this.options = Object.assign({}, DEFAULTS, customOptions);
    this.headers = {};

    if (this.options.setupNicknames) {
      this._setupNicknames(this.options.NICKNAMES);
      this._setupNicknames(this.options.nicknames);
    }

    if (data === 'safe')
      this.safe();
    else
      this._setInitialData(data || {});
  }


  applyTo(response) {
    let headerNames = Object.keys(this.headers);
    headerNames.forEach( (headerName) => {
      this.headers[headerName].applyTo(response);
    });
  }


  header(headerName, data = undefined) {
    let fullName = this._fullName(headerName);
    let header = this.headers[fullName];
    if (header)
      return header;

    header = Header.create(this._headerType(fullName), fullName, data, this.options);
    this.headers[fullName] = header;
    return header;
  }


  middleware() {
    let kepi = this;
    return function(req, res, next) {
       kepi.applyTo(res);
       next();
    }
  }

  safe() {
    let allSafe = Object.assign({}, this.options.SAFE, this.options.safe);
    Object.keys(allSafe).forEach( (headerName) => {
      this.header(headerName).safe();
    });
  }

  _fullName(name) {
     return this.options.nicknames[name] ||
            this.options.NICKNAMES[name] ||
            name;
  }


  _headerType(fullName) {
    return this.options.headerClasses[fullName] || this.options.HEADER_CLASSES[fullName];
  }


  _setInitialData(data) {
    let headerNames = Object.keys(data);
    headerNames.forEach( (headerName) => {
      let fullName = this._fullName(headerName);
      this.headers[headerName] = Header.create(this._headerType(fullName), fullName, data[headerName], this.options);
    });
  }


  _setupNicknames(data, where = this) {
    Object.keys(data).forEach( (nickname) => {
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
