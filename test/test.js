

const test = require('tape');
const Kepi = require("../kepi.js");
const Defaults = require("../defaults");


function mockResponse(data) {
  const _data = data || {};
  
  return {
    end: (x) => { _data.body = x},
    setHeader: (name, s) => { _data[name] = s; },
    removeHeader: (name) => { delete _data[name]; },
    toString: () => {
      return JSON.stringify(_data);
    }
    ,
  }
}


test('nodata', function(t) {
  let kepi = Kepi();
  let res = mockResponse();

  t.equals(JSON.stringify(kepi.headers), "{}");
  kepi.applyTo(res);
  t.equals(res.toString(), '{}');
  t.end();
});

test('Date', function(t) {
  let kepi = Kepi();
  let res = mockResponse();

  let now = Date.now();
  let nowUTC = new Date(now).toUTCString();

  kepi.date().set(now);
  kepi.header("Expires").set(nowUTC);
  kepi.applyTo(res);
  t.equals(res.toString(), `{"Date":"${nowUTC}","Expires":"${nowUTC}"}`);

  let kepi2 = Kepi();
  let res2 = mockResponse();
  kepi2.header("Last-Modified").set();
  kepi2.applyTo(res2);
  let resString = res2.toString();
  t.true(resString.startsWith('{"Last-Modified"'));
  t.true(resString.endsWith('GMT"}'));

  t.end();
});


test('List,', function(t) {
  let kepi = Kepi();
  let res = mockResponse();

  kepi.header("WWW-Authenticate").set().add('Basic').add('charset="UTF-8"');
  kepi.header("Content-Encoding").set(['a', 'b']).clear();
  kepi.header("Access-Control-Allow-Methods").set('GET','PUT');

  kepi.applyTo(res);
  t.equals(res.toString(), '{"WWW-Authenticate":"Basic, charset=\\"UTF-8\\"","Access-Control-Allow-Methods":"GET, PUT"}');
  t.end();
});


test('List;', function(t) {
  let kepi = Kepi();
  let res = mockResponse();

  kepi.header("Content-Disposition").set().add('attachment', 'filename="cool.html"');
  kepi.header("Content-Type", ['text/html', 'charset=utf-8']).clear();
  kepi.header("Access-Control-Allow-Methods").add(['GET','PUT']);  // was a bug in 0.1.0
  kepi.header("Content-Type").set(['abc','def']);

  kepi.applyTo(res);
  t.equals(res.toString(), '{"Content-Disposition":"attachment; filename=\\"cool.html\\"","Content-Type":"abc; def","Access-Control-Allow-Methods":"GET, PUT"}');
  t.end();
});


const SAFE_STRING = '{"Content-Security-Policy":"default-src \'self\'","X-Permitted-Cross-Domain-Policies":"\'none\'","X-DNS-Prefetch-Control":"off","X-Frame-Options":"SAMEORIGIN","Strict-Transport-Security":"max-age=5184000; includeSubDomains","X-Content-Type-Options":"nosniff","X-Download-Options":"noopen","X-XSS-Protection":"1; mode=block"}';

test('allsafe', function(t) {
  let kepi = Kepi('safe');
  let res = mockResponse();

  kepi.applyTo(res);
  t.equals(res.toString(), SAFE_STRING);
  t.end();
});

test('somesafe', function(t) {
  let kepi = Kepi();
  let res = mockResponse();
  kepi.dnsPrefetchControl().safe();
  kepi.xssFilter().safe();
  kepi.applyTo(res);
  t.equals(res.toString(), '{"X-DNS-Prefetch-Control":"off","X-XSS-Protection":"1; mode=block"}');

  t.end();
});


const BIG_STRING3 = '{"X-DNS-Prefetch-Control":"test-dnsPrefetchControl","Access-Control-Allow-Methods":"PUT, POST, DELETE","Feature-Policy":"foo foo1 foo2 foo3; bar bar1"}';


test('delete', function(t) {
  let kepi = Kepi();
  let res = mockResponse( { deleteMe: 1, keepThisHeader: 'yes' });
  kepi.header('deleteMe').remove();
  kepi.applyTo(res);
  t.equals(res.toString(), '{"keepThisHeader":"yes"}');
  t.end();
})

const CLEAR_AND_ADD = '{"stringHeader":"addedstring.added","listHeader":"a, b, c, 4","directiveHeader1":"foo1 newValue1 newValue2","directiveHeader2":"bar2 originalbarValue2; foo3 newfoovalue3 3; foo4 4","addedHeader1":"addedHeader1"}';
const CLEAR_AND_ADD_AFTER_RESET = '{"stringHeader":"originalstring","listHeader":"1, 2, 3","directiveHeader1":"foo1 originalfooValue1; bar1 originalbarValue1","directiveHeader2":"foo2 originalfooValue2; bar2 originalbarValue2"}';

test('clear & add & reset', function(t) {
  let kepi = Kepi({
    stringHeader: 'originalstring',
    listHeader: [1,2,3],
    directiveHeader1: { foo1: 'originalfooValue1', bar1: 'originalbarValue1'},
    directiveHeader2: { foo2: 'originalfooValue2', bar2: 'originalbarValue2'}
  },
  { resetAfterApply: true }
  );
  let res = mockResponse();

  kepi.header('stringHeader').clear().add('addedstring');
  kepi.header('listHeader').clear().add(['a','b','c']);
  kepi.header('directiveHeader1').clear().add('foo1', ['newValue1', 'newValue2']);
  kepi.header('directiveHeader2').clear('foo2').add('foo3', ['newfoovalue3']);
  kepi.add({addedHeader1: "addedHeader1",
            listHeader: 4,
            stringHeader: ".added",
            directiveHeader2: {foo3: 3, foo4: 4, }});

  kepi.applyTo(res);
  t.equals(res.toString(), CLEAR_AND_ADD);

  res = mockResponse();
  kepi.applyTo(res);
  t.equals(res.toString(), CLEAR_AND_ADD_AFTER_RESET);

  t.end();
})


test('headers', function(t) {

  let kepi = Kepi({ deleteThisHeader: 'bar' });
  let res = mockResponse();

  kepi.dnsPrefetchControl().set('test-dnsPrefetchControl');
  kepi.accessControl.allowMethods().add('PUT', 'POST');
  kepi.accessControl.allowMethods().add('DELETE');
  kepi.header('Feature-Policy').add('foo', "foo1");
  kepi.header('Feature-Policy').add('foo', "foo2", "foo3");
  kepi.header('Feature-Policy').add('bar', ["bar1"]);
  kepi.header('Feature-Policy').add('removeLater', "shouldBeRemoved");
  kepi.header('Feature-Policy').clear('removeLater');

  kepi.header('deleteThisHeader').remove();

  kepi.applyTo(res);
  t.equals(res.toString(), BIG_STRING3);
  t.end();
});

test('rawdata', function(t) {
  let kepi = Kepi({
    simpleHeader: ['bar'],
    listHeader: [1,2,3],
    'Feature-Policy': {
      vibrate: "'none'",
      geolocation: "'self'",
    },
  });
  let res = mockResponse();

  kepi.middleware()(null, res, () => null);
  // kepi.applyTo(res);
  t.equals(res.toString(), '{"simpleHeader":"bar","listHeader":"1, 2, 3","Feature-Policy":"vibrate \'none\'; geolocation \'self\'"}');
  
  res = mockResponse();
  const microHandler = function(req, res, rest) { res.end(rest); };
  kepi.micro(microHandler)(null, res, "hi there");
  t.equals(res.toString(), '{"simpleHeader":"bar","listHeader":"1, 2, 3","Feature-Policy":"vibrate \'none\'; geolocation \'self\'","body":"hi there"}');
  
  t.end();
});


test('errors', function(t) {
  let kepi = Kepi(null, { setupNicknames: false })
  t.false(kepi.xssFilter);

  t.throws(() => kepi.header("Content-Disposition", {}), Error);
  t.throws(() => kepi.header("Content-Security-Policy", "foobar"), Error);
  t.throws(() => kepi.header("Content-Range", new Date()), Error);
  t.throws(() => kepi.header("Date", []), Error);

  t.end();
});

test('customization', function(t) {
  let customOptions = {
    headerClasses: {
      "X-Super-Cool-List": "list;",
      "X-Super-Cool-Policies": "Policies",
      "X-Date": "DATE"
    },
    nicknames: {
      xscl: "X-Super-Cool-List"
    },
    safe: {
      "X-Super-Cool-List": ["safe", "at", "home"]
    },
  }
  let kepi = Kepi({
    "X-Super-Cool-Policies": { pissInTheWind: "don't", "of-truth" : "faithfully pursue" }
    },
    customOptions);
  kepi.xscl().safe();
  kepi.header("X-Date").set(1);
  let res = mockResponse();

  kepi.applyTo(res);
  t.equals(res.toString(), '{"X-Super-Cool-Policies":"pissInTheWind don\'t; of-truth faithfully pursue","X-Super-Cool-List":"safe; at; home","X-Date":"Thu, 01 Jan 1970 00:00:00 GMT"}');
  t.end();

});
