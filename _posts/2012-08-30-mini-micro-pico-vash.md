---
layout:     post
title: Mini, Micro, and Pico Vash, An Experiment
oneliner: Can a six-gun become a Derringer?
published: 
type: project
projecturl: https://gist.github.com/3411585
categories: 
  - JavaScript 
tags:       
  - Templates
  - Vash
  - RegExp

---

Here's a challenge: how small can I make a compatible version of [Vash][]? If I limit features, the answer is less than [800 bytes][]!

The conditions:

* _Expressions_: The feature that arguably gives Vash its reason for existence. Examples:
	* `@something.what`
    * `@it.is[0].funcCall()`
* _Explicit Expressions_: These enable Vash to have arbitrary JS that is still assumed to be a statement. Each is surrounded by `()`. Examples:
	* `@( model.doIt ? 'Yes, you should' : 'Nope!' )`
	* `@( it.total + it.tax )` 
* _HTML Encoding_: This is necessary to be compatible with Vash proper, and includes `html.raw` overriding.

Noticeably left out is block support, which is Vash's most complex feature. To fully implement it requires a full lexer/parser. This means NO:

	@for(i; i<0; i++){ <markup> }
	@if(){ <markup> } else {}
	@it.forEach(function(){ <markup> })

Typically, JS templates are a big string concatenated together, and then compiled once using the `Function` constructor, which is basically `eval`. This is relatively simple (and fast at render time), but has a few problems that arise with Vash. Because expressions are not easily bounded (e.g. there is no simple `}}` to tell when an expression ends), it's really hard to know what's markup and what's not. A good deal of code is required to properly delineate, escape, and encode the markup. In this situation, where code length is the concern, it's best to avoid fully processing markup.

For this experiment, I tried two alternatives.

Alternative 1: Manual Lookup
----------------------------

At runtime, find all expressions. Then attempt to manually evaluate each using the model passed to the template. This means manual parsing of an expression, including things like function calls, indexing, and dot property notation.

	var lookup = function(str, model){
		str.replace(reProp, function(ma, mo, i, b, p){ 
			model = i 
				? model[i] 
				: b 
					? model[b] 
					: p 
						? model(p) 
						: mo 
							? model 
							: model();
		});
		return model;
	}

This method is used to resolve a valid expression match, such as `@it.some.function("what").property`. The regex assigned to `reProp` is extremely long, but below is a condensed logical version.

	@(<model name>)|(<identifier>)|(<bracket index>)|(<parenthesis call>)

The regex is broken into four sections, each of which correspond to an argument to the replace call above (the first argument is the entire match). This makes it easy to avoid an explicit `while` loop, as well as a complicated conditional. The giant ternary just "replays" the actions that the original expression would have performed to resolve a value.

Note that this technique does not allow for explicit expressions like `@(something)`, because there is no way to manually resolve a ternary or operation like addition.

Alternative 2: Cached Function (Eval)
-------------------------------------

At runtime, find all expressions via a really long regular expression. For each one, create a new function via the `Function` constructor. The new function will simply return the result of the original expression, and accept a model as its single parameter. Once the function is created, cache it using the original expression as a property name.

	var lookup = function(str, model){
		var ret = ( 
			LIB[str] 
			|| 
			( LIB[str] = Function('it', 'return ' + str) )
		)(model);

		return ret;
	}

This function accepts something like `it.some.function("what").property`, and returns a function that looks like this:

	function(it){
		return it.some.function("what").property;
	}

It then saves the function into the `LIB` object. After the template is rendered once, this provides a speedup: subsequent renders only need to find the expressions and call the cached functions.

This attempt also uses a very small bit of code to locate matching parenthesis. This allows for complex expressions like `@( (i + 2) / 2 ? 'hey' : 'how' )`. Regular expressions by themselves cannot handle recursive or matching input.

	var  opens = ''
		,count = 0
		,pidx = 0;

	str = str.replace( /(\()|(\))/g, function(m, left, right, idx, str){
		if(str[idx-1] == '@') { opens += 0; }
		count += m == '(' ? 1 : -1;
		if(!count && opens.length){ opens = opens.slice(0,-1); m += '@'; }
		return m
	})

This code simply finds all matching parentheses, and if the character directly previous to the open parenthesis is an `@`, adds an `@` directly after the closing.

Results
-------

While the manual lookup technique is simpler logically, it's prone to errors and edge cases. It also requires two large regular expressions: one to find the expression amid markup, and another to parse the expression. This adds a lot to code size. Since it does not support explicit expressions, there is actually no way to have any sort of conditional logic in the template. If I were to limit valid expressions even further, and only allow direct property lookups, this version could be made [extremely small][].

The cached function technique is much less error prone, since as long as the expression is properly detected, it will resolve to a value. I assume it's also just slightly faster, since after the first rendering of the template, all it's doing is replacing text with the results of a function call. It supports explicit expressions, and can even properly parse nested parentheses.

Therefore, the winner is the cached function technique, since it's actually usable.

One More Feature...
-----------------

A neat feature of both attempts is implicit iteration. Without block support, there is no way to loop through anything. As a simple fix, if an array is passed as a model, it will automatically be iterated through, and the template will be rendered separately for each item of the array. This is something that Vash proper doesn't do, but I will probably add in the future.

For example:

	var  m1 = 'a'
		,m2 = [ 'a', 'b', 'c' ]

	var tplStr = '<li>@it</li>'
		,tpl = vash.compile( tplStr )

	tpl(m1); // outputs: <li>a</li>
	tpl(m2); // outputs: <li>a</li><li>b</li><li>c</li>

Conclusions
-----------

Templates are fun... for some reason. One of really neat things about this project was that I got to push my regular expression knowledge to the limit, while also learning more. I still have a long ways to go, but couldn't have done it without [RegexPal's][] wonderful [syntax highlighting][]. 

[Vash]: https://github.com/kirbysayshi/vash
[800 bytes]: https://gist.github.com/3411585 
[extremely small]: https://gist.github.com/1075080
[RegexPal's]: https://www.regexpal.com/
[syntax highlighting]: https://stevenlevithan.com/regex/colorizer/
