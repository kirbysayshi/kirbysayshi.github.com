---
layout: post
title: Using Signals and Actors with Web Workers
oneliner: Avoid strings! Do your best! 
type: project
projecturl: http://jsbin.com/eremoc/latest
categories:
  - JavaScript
  - Experiments
tags:
  - Web Workers
  - Actor Model
  - Signals
  - JS Bin

---

[Web Workers][] are relatively easy to use, especially now that shared objects are becoming more standard. A while back, I did a little experiment to see if I could make them even easier. 

The scenario is that you have many different tasks, each with their own events and scripts. They need to run in a browser, and asynchronously, so web workers would be a great choice! But wiring up all the events and decoding the payload from the events requires boilerplate (check that the domains match, then do error handling, etc), especially if there is two-way communication.

Using a bastardized [Actor Model][] (I'm barely even using the concept properly), you can setup web workers to instead respond to [Signals][], and provide a common interface.

There are two components to the experiment, the primary script, and the worker script. This could be expanded to two-way communication.

<figure>
	<img src="/images/sky-signal.png" alt="It's a different kind of signal" />
	<figcaption>It's a different kind of signal</figcaption>
</figure>

### Usage (The Prestige!)

We're going to be making a web worker (out "actor") that computes fibonacci sequences (yes, I know that this is... sigh), and when it has computed the next number in sequence, will emit a `stepped` event. When it finishes, it will emit a `stopped` event. This will be controlled by the primary script, which will listen for these events.

{% highlight javascript %}
// primary.js

// define our actors.. there's only one for now!
var actors = {
   'Fibonacci': { path: 'http://jsbin.com/orexal/15/js' }
   // P.S. Did you know that JS Bin can output a raw JS file?
   // Pretty awesome!
};

// make actors available for instantiation
actorsInit(actors);

// make a new instance
var f = new actors.Fibonaci(function(){

  // this function is called when signals are ready to be attached

  f.stepped.add(function(){
    console.log('got a stepped!', arguments);
  })

  f.stopped.add(function(){
    console.log('got a stopped!', arguments);
  })
    
});
{% endhighlight %}

And the content of the worker:

{% highlight javascript %}
// worker.js

var fibber = {
  signals: [ 'stepped', 'stopped' ]
  ,acci: function(n) {
    if (n <= 1) return n;
  
    var x = fibber.acci(n - 2) + fibber.acci(n - 1);
  
    fibber.stepped.dispatch(x);
    return x;
  }
}
                
signalsInit( fibber, fibber.signals );
fibber.acci(5);
fibber.stopped.dispatch( 'yes, yes, I stopped' );
{% endhighlight %}

Notice how the events aren't the typical string-based calls, like used in the DOM and EventEmitter? These are a form of Signals, which means we can define exactly what events something will emit, and know that we're listening to the proper events immediately (if not, an error will be thrown complaining that the property is `undefined`).

Now let's get to that point.

### The Primary Script

First some bootstrapping code:

{% highlight javascript %}
// primary.js

function actorsInit( actors ){
  
  for(var i in actors){
    if(actors.hasOwnProperty(i)){
      
      actors[i] = (function(actorName, actorFace){
        
        var Actor = function(cb){
          var self = this;
          this.worker = new Worker(actorFace.path);
          this.worker.addEventListener('message', function(e){
            console.log('from worker', actorName, e);
            
            if(e.data.signal === 'siginit'){
             
              // setup signals
              for(var i = 0; i < e.data.args.length; i++){
                  self[ e.data.args[i] ] = new Signal();
              }

              if(cb){ cb(this); }
              
              return
            }
            
            var sig = self[e.data.signal];
            e.data.args.length // crappy array test
              ? sig.dispatch.apply(sig, e.data.args)
              : sig.dispatch.call(sig, e.data.args);

          }, false);
          

        }
            
        return Actor;
        
      })(i, actors[i])
    }
  }
}
{% endhighlight %}

For each entry in the given object, create a constructor function. That constructor will create a new Web Worker using the given source, creates the proper signals (when received from the worker: more on that later), attaches an event listener that automatically dispatches the proper signal, and divorces the data from the worker message. This means that while you will still need to know what the worker is dispatching, you don't need to care that it was from a worker. In addition, when the worker is ready for signal bindings, the `cb` constructor argument will be called.

### The Worker Script(s)

{% highlight javascript %}
// worker.js

function signalsInit(target, names){
  var slice = Array.prototype.slice;
  names.forEach(function(name){
    var sig = target[name] = new Signal();
    
    sig.add(function(){
      self.postMessage({ signal: name, args: slice.call(arguments) }); 
    });
    
  });
  
  self.postMessage( { signal: 'siginit', args: names } ); 
}
{% endhighlight %}

This method looks for a `signals` property on the `target` object, and then creates the actual signal objects. It also, upon finishing creating the signals, sends a message to the parent process _describing what signals it accepts_! This means that you only need to configure signals in one place (here), and yet still refer to them by name from the primary script!

### Benefits

This is just an experiment, but I think it's pretty neat that instead of using strings, any events that a worker could fire are defined in one place (`fibber.signals`), and if a typo is made when attempting to listen for a signal, the error is known much sooner than a silently-failing string-based event.

### Addendum: Signals

Here is the very basic code I used to implement a Signal in JS. For a more complete implementation, I recommend [js-signals][], or my own implementation [k-signals][], which is much smaller, but has most of the same features (it was done mostly as a learning experience).

{% highlight javascript %}
var Signal = function Signal(){
  this.slots = [];
};

Signal.prototype = {
  add: function(f){
    this.slots.push(f);
  }
  ,dispatch: function(){
    var slots = this.slots.slice()
        ,len
        ,i
        ,ret;
    
    for (i = 0, len = slots.length; i < len; i++){
      ret = slots[i].apply(this, arguments);
      if(ret === false){
        break;
      }
    }
  }
  ,remove: function(f){
    this.slots.splice(this.slots.indexOf(f), 1);
  }
}
{% endhighlight %}

Signals are a really interesting paradigm to me, so expect a post soon with more details of my experiments!



[Actor Model]: http://en.wikipedia.org/wiki/Actor_model
[Signals]: https://citational.com/v/5mx/signals-vs-eventemitter-vs-pubsub
[Web Workers]: https://developer.mozilla.org/Using_DOM_workers
[js-signals]: http://millermedeiros.github.com/js-signals/
[k-signals]: https://gist.github.com/1296822