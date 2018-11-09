

/**
 * Basic header whose value is a single String
 * also serves as subclass for fancier headers
 */

class Header {

  constructor(fullName, data, options = {}) {
    this.fullName = fullName;
    this.data = data;
    this.options = options;
  }

  applyTo(response, headerName = this.fullName) {
    if (this.doRemove)
      response.removeHeader(headerName);

    else {
      let str = this.toStr();
      if (str)
        response.setHeader(headerName, str);
    }

    return this;
  }

  clear() { return this.set(); }

  remove() { this.doRemove = true; }

  safe() {
    let value = this.options.safe[this.fullName] || this.options.SAFE[this.fullName];
    return this.set(value);
  }

  toStr() { return this.data.toString(); }

  /* todo in subclasses

   add();

   set()

   */


  static typeNameToInfo(typeName = "UNKNOWN") {

    switch (typeName.toUpperCase()) {
      case "DATE":     return { clazz: DateValue };
      case "LIST,":    return { clazz: List };
      case "LIST;":    return { clazz: List, delimiter: '; ' };
      case "POLICIES": return { clazz: Policies };
      case "VALUE":    return { clazz: Value };

      default: return {};
    }
  }


  static dataToInfo(data) {
    let clazz;

    if (data == null)                  clazz = null;
    else if (data instanceof Date)     clazz = DateValue;
    else if (Array.isArray(data))      clazz = List;
    else if (typeof data === 'string') clazz = Value;
    else                               clazz = Policies;

    return { clazz };
  }

  static create(typeName, fullName, data, options) {
    let nameInfo = Header.typeNameToInfo(typeName);
    let dataInfo = Header.dataToInfo(data);

    if (nameInfo.clazz && dataInfo.clazz && (nameInfo.clazz !== dataInfo.clazz))
      throw new Error(`Header ${fullName} expects type ${nameInfo.clazz.name} but data is type ${dataInfo.clazz.name}`);

    options.delimiter = options.delimiter || nameInfo.delimiter;

    let Clazz = nameInfo.clazz || dataInfo.clazz || Value;

    return new Clazz(fullName, data, options);
  }

}

/**
 * Basic header consisting of a single value
 */
class Value extends Header {

  constructor(fullName, data, options) {
    let opts = Object.assign({}, options);
    super(fullName, data, opts);
  }

  add(data) {
    this.data += data;
    return this;
  }

  set(value = '') {
    this.data = value;
    return this;
  }

}


class DateValue extends Value {

  toStr() {
    let date = this.data ? new Date(this.data) : new Date();
    return date.toUTCString();
  }

}


/**
 * A header consisting of multiple semicolon delimited Policies
 *   each with a name and a list of space delimited values
 *   e.g. Content-Security-Policy
 */

class Policies extends Header {

  constructor(fullName, data, options) {
    let opts = Object.assign({}, options);
    super(fullName, {}, opts);  // set data later, see below

    this.set(data || {});
  }

  add(directiveName, ...items) {
    let directive = this.data[directiveName];
    if (directive)
      directive.push(...items);
    else
      this.data[directiveName] = [...items];

    return this;
  }

  clear(directiveName) {
    if (directiveName)
      delete this.data[directiveName];
    else
      this.data = {};  // todo super

    return this;
  }

  set(values = {}) {
    this.data = {};
    for (let directiveName of Object.keys(values)) {
      this.add(directiveName, ...forceArray(values[directiveName]) );
    }

    return this;
  }

  toStr() {
    let policies = Object.keys(this.data);
    let dstrs = policies.map((dname) => {
      let directive = this.data[dname];
     // if (!Array.isArray(directive))
     //   directive = [];
      let s = directive.join(this.options.delimiter_intra || " ");
      return s ? dname + ' ' + s : dname;
    });
    return dstrs.join(this.options.delimiter_inter || "; ");
   }

}

/**
 * A header consisting of multiple comma delimited values
 *   e.g. Access-Control-Allow-Methods
 */
class List extends Header {

  constructor(fullName, inData = [], options) {
    let opts = Object.assign({}, options);
    let dataCopy = [...inData];

    super(fullName, dataCopy, opts);
  }

  add(...items) {
    this.data.push(...items);
    return this;
  }

  set(items = []) {
    this.data = [...items];
    return this;
  }

  toStr() { return this.data.join(this.options.delimiter || ', '); }
}


function forceArray(x) {
  if (Array.isArray(x))
    return x;
  else
    return x ? [x] : [];
}


module.exports = { Header };
