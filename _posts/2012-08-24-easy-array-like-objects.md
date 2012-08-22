---
layout: post
title: Making Array-like Objects 
oneliner: Whipping up your own jQuery, are you?
type: project
projecturl: 
categories:
  - JavaScript
  - Snippets
tags:
  - jQuery
  - Arrays
  - ES5
---

[jQuery][], as you may know, is an array-like object at its core. This means that in nearly every aspect it behaves like an array, except it's just a plain object. If you look at a method on it, such as `slice`, it does some internal stuff before using itself as the target of the native `slice` function:

<div class="highlight" data-ghuserrepo="jquery/jquery"
	data-ghpath="src/core.js"
	data-ghref="9e246dd7fa010f2b8e112ec5a57491167556c55a"
	data-ghlines="252-255"
	data-ghtabsize="2">&nbsp;
</div>

jQuery needs to do internal housekeeping when these methods are called... but what if you want the benefit of an array, but don't want to reimplement [every][] [method][]? Or what if you want to be able to call `reduce` on a jQuery object?

{% highlight js %}
var takeMethodsFromArray = function(target){
	var methods = [
		'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift',
		'concat', 'join', 'slice', 'indexOf', 'lastIndexOf',
		'filter', 'forEach', 'every', 'map', 'some', 'reduce', 'reduceRight'
	]

	,arr = []
	,m;

	for (var i = 0; i < methods.length; i++){
		m = methods[i];
		if( typeof arr[m] === 'function' ){
			if( !target[m] ){
				(function(methodName){
					target[methodName] = function(){
						return arr[methodName].apply(this, Array.prototype.slice.call(arguments, 0));
					}
				})(m);
			}
		} else {
			throw new Error('This lib requires ES5 array iteration methods, missing: ' + m);
		}
	}

}
{% endhighlight %}

The code above lets you do exactly that. Just call it, passing in a target (typically a prototype of some sort)

[jQuery]: https://github.com/jquery/jquery
[every]: https://github.com/jquery/jquery/blob/9e246dd7fa010f2b8e112ec5a57491167556c55a/src/core.js#L705
[method]: https://github.com/jquery/jquery/blob/9e246dd7fa010f2b8e112ec5a57491167556c55a/src/traversing.js#L226
