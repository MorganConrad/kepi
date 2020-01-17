

/**
 * Base class, plus static methods and factories
 */

class Header {

  constructor(fullName, data, options = {}) {
    this.fullName = fullName;
    this.data = data;
    this.options = options;
  }

  /**
   *
   * @param {*} response    http.ServerResponse @see  https://nodejs.org/api/http.html#http_class_http_serverresponse
   * @param {*} headerName  usually null for this.fullName
   */
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

  /**
   * Clears the header
   */
  clear() { return this.set(); }

  /**
   * INdicaters that this header should be removed from the response
   */
  remove() { this.doRemove = true; }

  /**
   * Set header to the "safe" value
   */
  safe() {
    let value = or(this.options.safe[this.fullName], this.options.SAFE[this.fullName]);
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
      case "LIST,":    return { clazz: List, delimiter: ', ' };
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

    options.delimiter = nameInfo.delimiter;

    let Clazz = nameInfo.clazz || dataInfo.clazz || Value;

    return new Clazz(fullName, data, options);
  }

}

/**
 * Basic header consisting of a single string value
 */
class Value extends Header {

  constructor(fullName, data, options) {
    let opts = Object.assign({}, options);
    super(fullName, data, opts);
  }

  /**
   * @param data   usually a string, gets appended to end
   */
  add(data) {
    this.data += data;
    return this;
  }

  set(value = '') {
    this.data = value;
    return this;
  }

}


/**
 * Header consisting of a single UTC Date
 *   Automatically puts in current date if value == 0 (or null)
 *   e.g. "Expires"
 */
class DateValue extends Value {

  toStr() {
    let date = this.data ? new Date(this.data) : new Date();
    return date.toUTCString();
  }

}


/**
 * A header consisting of multiple semicolon delimited Policies
 *   Each Policy has a name and a list of space delimited values
 *   e.g. Content-Security-Policy
 */

class Policies extends Header {

  constructor(fullName, data, options) {
    let opts = Object.assign({}, options);
    super(fullName, {}, opts);  // set data later, see below

    this.set(data || {});
  }

  /**
   * Add a policy or policies.
   * @param {*} policyNameOrObject    if a string, single policy
   * @param  {...any} items           only relevant if single policy
   */
  add(policyNameOrObject, ...items) {
    if (typeof policyNameOrObject === 'string') {  // single policy
      let policyName = policyNameOrObject;
      items = flatten1(items);
      let policyValues = this.data[policyName];
      if (policyValues)
        policyValues.push(...items);
      else
        this.data[policyName] = [...items];
    }
    else {
      for (let policyName of Object.keys(policyNameOrObject)) {
        this.add(policyName, ...forceArray(policyNameOrObject[policyName]) );  // recur
      }
    }
    return this;
  }

  /**
   * Clear one policy name, or clear all if policyName is falsy
   * @param {string} policyName
   */
  clear(policyName) {
    if (policyName)
      delete this.data[policyName];
    else
      this.data = {};

    return this;
  }

  set(values = {}) {
    this.data = {};    // clear old, then set
    this.add(values);

    return this;
  }

  toStr() {
    let policies = Object.keys(this.data);
    let delimiterIntra = or(this.options.delimiter_intra, " ");
    let policyStrings = policies.map((policyName) => {
      let policyValues = this.data[policyName];
      let policyString = policyValues.join(delimiterIntra);
      return policyString ? policyName + ' ' + policyString : policyName;
    });
    return policyStrings.join(or(this.options.delimiter_inter, "; "));
   }

}

/**
 * A header consisting of multiple values, usually comma delimited
 *   e.g. Access-Control-Allow-Methods
 */
class List extends Header {

  constructor(fullName, inData = [], options) {
    let opts = Object.assign({}, options);
    let dataCopy = [...inData];

    super(fullName, dataCopy, opts);
  }

  add(...items) {
    this.data.push(...flatten1(items));
    return this;
  }

  set(...items) {
    this.data = [...flatten1(items)];
    return this;
  }

  toStr() { return this.data.join(or(this.options.delimiter, ', ')); }
}

// utilities

function forceArray(x) {
  if (Array.isArray(x))
    return x;
  else
    return x ? [x] : [];
}

// 1 level deep flatten
function flatten1(arr) {
  return [].concat(...arr);
}

// find first non-null, more robust than x || DEFAULT
function or(...items) {
  return items.find((x) => x != null);
}

module.exports = { Header };
