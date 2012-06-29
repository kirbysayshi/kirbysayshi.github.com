---
layout: post
title: Seedable Dice Rolls Using JS
oneliner: Randomly-generated also means random bugs. 
type: project
projecturl: https://gist.github.com/1342625
categories:
  - JavaScript
  - Game Design
tags:
  - PRNGs
  - Dice
  - Alea

---

When I'm testing out something that needs a generated environment (sprites, objects, whatever), I often use `Math.random()` with some ranges to avoid having to purposefully specify values. However, if something goes wrong, it's nearly impossible to reproduce the environment.

The solution to this is to use a [psuedo random number generator][] that is seedable, which means that if you initialize it with a specific value, it will produce the same results each time (deterministic). Given that currently [JavaScript doesn't have access to a PRNG][], the only way do this is to implement your own seedable generator. This is actually [really difficult to do][], because most algorithms assume exact calculations on known integers, such as multiplying two 32-bit integers together to get a 64-bit integer (and JavaScript does not offer that sort of specificity natively). I found one by [Johannes Baagøe][] that uses his implementation of the Alea algorithm, and wrapped it into a dice-ready interface, so you can do things like:

{% highlight javascript %}
var dice = new Dice(); // defaults to +new Date() as a seed, can use any number of arguments for seeding

dice.d6(); // returns 1-6
dice.d6(2); // equivalent to 2d6
dice.d100(); // d2 - d100 are valid options
dice.d49();

dice.d6(2); // returns the total as a number
dice.d6(2, true); // returns two rolls as an array
{% endhighlight %}


[pseudo random number generator]: http://en.wikipedia.org/wiki/Pseudorandom_number_generator
[really difficult to do]: http://baagoe.com/en/RandomMusings/javascript
[JavaScript doesn't have access to a PRNG]: https://bugzilla.mozilla.org/show_bug.cgi?id=440046
[Johannes Baagøe]: http://baagoe.com/en/RandomMusings/javascript/