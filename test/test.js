

const test = require('tape');
const Kepi = require("../kepi.js");
const Defaults = require("../defaults");


function mockResponse(data) {
  const _data = data || {};

  return {
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

  kepi.applyTo(res);
  t.equals(res.toString(), '{"WWW-Authenticate":"Basic, charset=\\"UTF-8\\""}');
  t.end();
});


test('List;', function(t) {
  let kepi = Kepi();
  let res = mockResponse();

  kepi.header("Content-Disposition").set().add('attachment', 'filename="cool.html"');
  kepi.header("Content-Type", ['text/html', 'charset=utf-8']).clear();

  kepi.applyTo(res);
  t.equals(res.toString(), '{"Content-Disposition":"attachment; filename=\\"cool.html\\""}');
  t.end();
});


const SAFE_STRING = '{"Content-Security-Policy":"default-src \'self\'","X-Permitted-Cross-Domain-Policies":"\'none\'","X-DNS-Prefetch-Control":"off","X-Frame-Options":"SAMEORIGIN","Strict-Transport-Security":"max-age=5184000; includeSubDomains","X-Download-Options":"noopen","Content-Type-Options":"nosniff","X-XSS-Protection":"1; mode=block"}';

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


const BIG_STRING3 = '{"X-DNS-Prefetch-Control":"test-dnsPrefetchControl","Access-Control-Allow-Methods":"PUT, POST, DELETE","Feature-Policy":"foo foo1 foo2; bar bar1"}';


test('delete', function(t) {
  let kepi = Kepi();
  let res = mockResponse( { deleteMe: 1, keepThisHeader: 'yes' });
  kepi.header('deleteMe').remove();
  kepi.applyTo(res);
  t.equals(res.toString(), '{"keepThisHeader":"yes"}');
  t.end();
})

const CLEAR_AND_ADD = '{"stringHeader":"addedstring","listHeader":"a,b,c","directiveHeader1":"foo1 newValue1,newValue2","directiveHeader2":"bar2 originalbarValue2; foo3 newfoovalue3"}';

test('clear & add', function(t) {
  let kepi = Kepi({
    stringHeader: 'originalstring',
    listHeader: [1,2,3],
    directiveHeader1: { foo1: 'originalfooValue1', bar1: 'originalbarValue1'},
    directiveHeader2: { foo2: 'originalfooValue2', bar2: 'originalbarValue2'}
  });
  let res = mockResponse();

  kepi.header('stringHeader').clear().add('addedstring');
  kepi.header('listHeader').clear().add(['a','b','c']);
  kepi.header('directiveHeader1').clear().add('foo1', ['newValue1', 'newValue2']);
  kepi.header('directiveHeader2').clear('foo2').add('foo3', ['newfoovalue3']);

  kepi.applyTo(res);
  t.equals(res.toString(), CLEAR_AND_ADD);
  t.end();
})


test('headers', function(t) {

  let kepi = Kepi({ deleteThisHeader: 'bar' });
  let res = mockResponse();

  kepi.dnsPrefetchControl().set('test-dnsPrefetchControl');
  kepi.accessControl.allowMethods().add('PUT', 'POST');
  kepi.accessControl.allowMethods().add('DELETE');
  kepi.header('Feature-Policy').add('foo', "foo1");
  kepi.header('Feature-Policy').add('foo', "foo2");
  kepi.header('Feature-Policy').add('bar', "bar1");
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
