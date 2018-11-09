
<div align="center">
	<br>
	<div>
		<img width="600" height="600" src="kepi.svg" alt="kepi">
	</div>
	<br>
	<br>
	<br>
</div>

# Kepi is a small, elegant, and dependency free library for setting HTTP response headers.

[![Build Status](https://secure.travis-ci.org/MorganConrad/kepi.png)](http://travis-ci.org/MorganConrad/kepi)
[![License](http://img.shields.io/badge/license-MIT-A31F34.svg)](https://github.com/MorganConrad/kepi)
[![NPM Downloads](http://img.shields.io/npm/dm/kepi.svg)](https://www.npmjs.org/package/kepi)
[![Known Vulnerabilities](https://snyk.io/test/github/morganconrad/kepi/badge.svg)](https://snyk.io/test/github/morganconrad/kepi)
[![Coverage Status](https://coveralls.io/repos/github/MorganConrad/kepi/badge.svg)](https://coveralls.io/github/MorganConrad/kepi)


## Usage

### Example Configuration

    const Kepi = require('kepi');

    let kepi = Kepi({
      'X-Powered-By': 'super duper roll your own',
      "X-XSS-Protection": {
        "1": [],
        "mode=block": [],
      },
    });
    kepi.accessControl.allowMethods().add('PUT', 'POST');


### In roll your own code

    kepi.applyTo(myResponse);

### In Express

    app.use(kepi.middleware());


## API

### Kepi

#### constructor(data, options)
 data can be
  - null
  - an Object (see example).  In may cases this is all you really need.
  - "safe": same as calling safe()

#### applyTo(response)
Write the headers into response

#### header(headerName, optionalData)
Retrieve the Header with that name, setting with optional data.  Name may be
 - the full name, e.g. "Content-Security-Policy"
 - a "nickname", e.g. "contentSecurityPolicy"

#### middleware()
For use in Express.  Should be modifiable for others

#### safe()
Sets all headers in options.SAFE or options.safe, creating if needed.

### Header (subclasses are SimpleString, List, and Directives)

#### add(data)
Adds data to the header value
  - `List.add(...items)` accepts a single value or an array
  - `Directives.add(directiveName, ...items)` requires a directive name first

#### applyTo(response)
Write the header to the response.

#### clear()
Clear the value, to "", [], or {} as appropriate
  - `Directives.clear(directiveName)` takes an optional directive name, if provided, only that directive is cleared.

#### remove()
Flags this header to be removed from any response.  **Warning:** cannot be "unflagged".

#### safe()
Set the header to a "safe" value, as provided in the options.

#### set(value)
Sets the value



## Customization



## Notes, Todos, and Caveats

This work was inspired when I ran a [Security Header Audit](https://securityheaders.com/) on one of my websites and got back a lot of angry red.  This quickly lead me to [helmet](https://www.npmjs.com/package/helmet), a popular, well tested, and well documented Express middleware.  However, helmet really only sets "secure" headers, and is of little use setting general purpose response headers.  It has a many dependencies and sucks down a lot of code.

To my surprise, I didn't see any general purpose "setup your response headers" npm module.  This is my attempt to fill that need.


