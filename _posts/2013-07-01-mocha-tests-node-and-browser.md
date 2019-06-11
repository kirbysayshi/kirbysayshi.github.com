---
layout:     post
title: Mocha Tests for Node and the Browser
oneliner: "This is still way more complicated than it should be. I'm doing it wrong, right? Right!?"
type: project
projecturl:
categories:
  - JavaScript
tags:
  - Mocha
  - Browserify
  - TDD
  - Observables
  - FRP

---

To gain a better understanding of the decisions [knockoutjs][] made in terms of implementation, I decided to try and build my own version. I named it `sea` as a homonym for 'see' which is _somehow_ related to [observable properties][], I swear. I started with a simple HTML page that basically contained a series of "things that should work". The first was a simple `div` that followed the mouse cursor using two observables to track position.

[knockoutjs]: https://knockoutjs.com/
[observable properties]: https://knockoutjs.com/documentation/observables.html

After a few more examples similar to that, I realized this library had two testable aspects: the [frp][] parts, which can exist in any JS enviroment, and the data binding parts, which require a DOM. I decided to formalize and write some actual tests using [mocha][], because I'd heard you could use it in a browser and node.

[frp]: https://en.wikipedia.org/wiki/Functional_reactive_programming
[mocha]: https://visionmedia.github.com/mocha/

And that's when things got difficult. Sure, mocha supports [browser-based tests][], but it leaves the part about _getting_ your tests into the HTML harness up to you. You could just load a single JS file, but I bet your library is a bit more complex than just one file, and you're probably using a module system to help keep things... modular (such as `require`ing your `assert` library). So if you're using [requirejs][] or [browserify][], it's up to you to write a build step to make it easy to consume the tests.

[browser-based tests]: https://visionmedia.github.io/mocha/#browser-support
[requirejs]: https://www.requirejs.org/
[browserify]: https://github.com/substack/node-browserify

I also looked into using [phantomjs][] or [one of][] [myriad][] [modules][] that purported to easily get mocha working in phantomjs. The problem is that they all assume a build system (like [grunt][]), assume you're writing non-`require`able code, or assume you're [using requirejs][]. Then there's the problem of getting the test output... out... of phantomjs. So for now, that will wait.

[phantomjs]: https://phantomjs.org
[one of]: https://github.com/kmiyashiro/grunt-mocha
[myriad]: https://github.com/metaskills/mocha-phantomjs
[modules]: https://npmjs.org/package/grunt-mocha-phantomjs
[grunt]: https://github.com/cowboy/grunt
[using requirejs]: https://projectpoppycock.com/the-best-way-to-test-requirejs-code-with-mocha-phantomjs-and-grunt/

There was one more problem that greatly exacerbated my troubles: I wanted to use the `exports` interface that mocha provides. Every example I've seen of using mocha in a browser uses either the [tdd interface][] or the [bdd interface][]. These are especially suited for the browser because it's relatively easy to expose the interfaces globally in the browser environment, while the `exports` interface requires a more complex shim. I find both of them a little verbose, expecially after writing so many tests for [vash][] using [vows][].

[tdd interface]: https://visionmedia.github.io/mocha/#interfaces
[bdd interface]: https://visionmedia.github.io/mocha/#interfaces

[vash]: https://github.com/kirbysayshi/vash
[vows]: https://vowsjs.org/

Here is the typical bdd interface:

{% highlight js %}
describe('sea.observable', function(){

  it('defaults to undefined', function(){
	  var o = sea.observable();
	  assert.equal(o(), undefined);
  })

  it('updates value', function(){
	  var o = sea.observable(null);
	  assert.equal(o(), null);
	  assert.equal(o(2), 2);
  })

})
{% endhighlight %}

That's fine, but I find the repeated `describe` and `it` distracting. Here's the same using the `exports` interface:

{% highlight js %}
exports.observable = {

  'defaults to undefined': function(){
    var o = sea.observable();
    assert.equal(o(), undefined);
  }

  ,'updates value': function(){
    var o = sea.observable(null);
    assert.equal(o(), null);
    assert.equal(o(2), 2);
  }

}
{% endhighlight %}

Honestly, it's basically the same, I know. For more complex suites I've seen it get very difficult to read, but at this point I'm mostly arguing a personal preference.

Final goals for this testing environment:

* Write "mocha" tests using the `exports` interface
* Be able to `require` the in-progress library, along with anything else needed, like `assert` or [chaijs][] or [sinonjs][]
* Write the tests without caring if they'll be running in a browser or node

[chaijs]: https://chaijs.com/
[sinonjs]: https://sinonjs.org/

### Step 1: Project Structure

This is a simple project, and contains the following files:

	/index.js        # frp-parts, node-only
	/dom.js          # data binding, requires DOM
	/package.json    # typical, but will have build/test commands
	/test/
	  runner.html    # the mocha test harness
	  test.sea.js    # the test, run using mocha(1) or in runner.html

Using the library is simple:

{% highlight js %}
var sea = require('./index')

var firstName = sea.observable('Johnny');
var fullName = sea.computed(function(){
  return firstName() + ' Tatlock';
})

console.log(firstName()) // 'Johnny'
console.log(fullName()) // 'Johnny Tatlock'

firstName('James')

console.log(firstName()) // 'James'
console.log(fullName()) // 'James Tatlock'
{% endhighlight %}

And using the data-binding components (assumes a DOM):

{% highlight html %}
<ul data-foreach="items()">
  <li data-text="typeof $data === 'function' ? $data() : $data"></li>
</ul>

<script type="text/javascript">
var sea = require('./dom') // decorates sea with data-binding stuff

var items = sea.observableArray(['a', 'b', 'c']);

// tell sea to parse the entire DOM
sea.applyBindings({
  items: items
})

// in 2 seconds, add some more elements, this will cause the ul to
// render more items
setTimeout(function(){
  items.push('d', 'e', 'f')
}, 2000)
</script>
{% endhighlight %}

If you've ever used knockoutjs, then this should look very familiar. I changed the syntax a bit for data-binding to simplify my job (I didn't want to write a full parser, so instead of using a single `data-bind` attribute, each `data-` attribute is matched against a valid registered binding).

### Step 2: The Tests

The node tests look like (abbreviated):

{% highlight js %}
var assert = require('assert')
  , sea = require('sea')

exports.observableArray = {

  'with no args defaults to empty array': function(){
    var a = sea.observableArray();
    assert.equal(a().length, 0);
  }

  ,'.push updates a computed': function(){
    var a = sea.observableArray()
      , c = sea.computed(function(){
        return a().join(',')
      });

    assert.equal(c(), '');
    a.push('1');
    assert.equal(c(), '1');
    a.push('2', '3');
    assert.equal(c(), '1,2,3');
  }
}
{% endhighlight %}

And the DOM tests (abbreviated):

{% highlight js %}
var assert = require('assert')
  , sea = require('../dom')

// skip running if not in a browser
if(typeof window === 'undefined') return;

var scratch = document.querySelector('#scratch');
var $  = function(query, ctx){
  return [].slice.call((ctx || scratch).querySelectorAll(query));
}

exports['Data Binding'] = {

  'data-text': {

    before: function(){
      var html = '<p data-text="t()"></p>';
      scratch.innerHTML = html
    }

    ,'observable updates value': function(){

      var t = sea.observable('Hello!');
      sea.applyBindings({ t: t }, scratch);
      var p = $('p')[0];

      assert.equal(p.textContent, 'Hello!');

      t('Goodbye!');
      assert.equal(p.textContent, 'Goodbye!');
    }
  }
}
{% endhighlight %}

For the most part, writing a test for the browser or node is exactly the same in terms of structure. Obviously the browser test won't run in node because of lack of DOM objects, but the structure of the tests are the same.

### Step 3: Bundling

Next we need to bundle the tests so that `require` works. It's pretty easy, but took a bit of fiddling with `browserify` to figure out:

	node_modules/browserify/bin/cmd.js ./test/test.dom.js --standalone tests > test.bundle.js

This command:

1. Runs browserify on `test/test.dom.js`, which spiders through and includes the dependencies, including `index.js` (sea), `dom.js`, `assert` and other things (like the `process` shim and such).
2. Uses the `--standalone` flag with argument `tests`, which wraps the bundle in a UMD guard under the name of 'tests'. In the absense of a `require` function in the target environment, the bundle will be attached to the global window as `window.tests`.
3. Dump the resulting output into `test.bundle.js`.

The key step is #2, otherwise there would be no way to reference the tests from the test runner, which is integral when using the `exports` interface. Browserify is really good at script interop, allowing you to explicitly control what is exported.

### Step 4: Hacking the Harness

The last step is to do something super hacky: copy mocha's `exports` interface, modify it slightly, and place it into the typical test harness:

{% highlight html %}
<html>
<head>
  <meta charset="utf-8">
  <title>Mocha Tests</title>
  <link rel="stylesheet" href="../node_modules/mocha/mocha.css" />
</head>
<body>
  <div id="mocha"></div>
  <div id="scratch"></div>
  <script src="../node_modules/mocha/mocha.js"></script>
  <script>mocha.setup('exports')</script>
  <script src="../test.bundle.js"></script>
  <script>
    // This code is directly from mocha/lib/interfaces/exports.js
    // with a few modifications
    (function manualExports(exports, suite){
      var suites = [suite];

      visit(exports);

      function visit(obj) {
        var suite;
        for (var key in obj) {
          if ('function' == typeof obj[key]) {
            var fn = obj[key];
            switch (key) {
              case 'before':
                suites[0].beforeAll(fn);
                break;
              case 'after':
                suites[0].afterAll(fn);
                break;
              case 'beforeEach':
                suites[0].beforeEach(fn);
                break;
              case 'afterEach':
                suites[0].afterEach(fn);
                break;
              default:
                suites[0].addTest(new Mocha.Test(key, fn));
            }
          } else {
            var suite = Mocha.Suite.create(suites[0], key);
            suites.unshift(suite);
            visit(obj[key]);
            suites.shift();
          }
        }
      }
    }(tests, mocha.suite));

    mocha.checkLeaks();
    mocha.run();
  </script>
</body>
</html>
{% endhighlight %}

The key here is that I'm manually passing in `tests`, defined by our test bundle, into a modified version of mocha's `exports` interface. The only modifications were to access mocha using the global `Mocha`, and to be able to pass in the exports object and suites, instead of relying on mocha's `require` event.

### Step 5: Script it

I could go with a build system, like [grunt][] or a Makefile, but that's too much for this tiny project. A few simple additions to the `scripts` field of my `package.json` will do fine:

{% highlight json %}
"scripts": {
  "pretest": "node_modules/browserify/bin/cmd.js ./test/test.dom.js --standalone tests > test.bundle.js",
  "test": "node_modules/mocha/bin/mocha --recursive --ui exports"
}
{% endhighlight %}

If you use `require` and browserify, you really don't need a true build system. The worst is having to manually specify files for inclusion in said build system, and `require` takes care of that.

### Conclusions

Even simple projects quickly get complex when you want to be able to test in a browser and node. With the power of browserify and mocha, a lot of the hard things are taken care of, leaving just a little bit of undefined but required glue. Hopefully this helps the next time you start a small project and want some tests!

