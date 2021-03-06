---
layout: post
published: false
title: MiniVash, or My Longest Regular Expression Ever 
oneliner: How else are you supposed to become adept with regex without abusing them?
type: project
projecturl: https://gist.github.com/3411585 
categories:
  - JavaScript
tags:
  - RegExp
  - Regex
---

> NOTE: Since writing this initially, MiniVash's primary regex has changed. This information is still valid as a learning resource, however.

Here's a challenge: how small can I make a self-contained version of [Vash][]? If I limit it to the following features, the answer is about [800 bytes][]!

* _Expressions_: The feature that arguably gives Vash its reason for existence. Examples:
	* `@something.what`
    * `@it.is[0].funcCall()`
* _Explicit Expressions_: These enable Vash to have arbitrary JS that is still assumed to be a statement. Each is surrounded by `()`. Examples:
	* `@( model.doIt ? 'Yes, you should' : 'Nope!' )`
	* `@( it.total + it.tax )` 

Noticeably left out is block support, which is Vash's most complex feature. To fully implement it requires a full lexer/parser. This means NO:

* `@for(i; i<0; i++){ <markup> }`
* `@if(){ <markup> } else {}`
* `@it.forEach(function(){ <markup> })`

One more change in approach had to be made. Typically, JS templates are a big string concatenated together, and then compiled using the `Function` constructor, which is basically `eval`. For this experiment, I tried two alternatives:

1. Parse the template at render time. Each time an expression or interpolation was discovered, create and cache a function that returns the value of that expression. This allows for very simple handling of both expressions and interpolations, with relatively minimal overhead after the first rendering of the template. The mini version uses this technique.
2. Parse the template at render time. When an interpolation is encountered, parse the property expression, and manually "look it up" using a loop. This does not support explicit expressions, only interpolations. The micro version uses this technique.

Given these requirements, and knowing that I wasn't going to be relying on a true lexer, I had to embark on a great journey...

## The Longest Regex I've Ever Written

I recently read a great SO answer saying that regexps are [readable only by the one who wrote it][], and that this means we should treat complex ones as a write only language. After writing the following regex, I agree. It is broken up by whitespace below to be readable in this narrow space. Written as one valid JS regex, it's pretty tricky looking. Yes, there have been much longer regexes, but this is definitely a personal record.

<pre><code class="regex">(
	@
	(?!do|for|function
		|
		(?:
			(?:
				[a-zA-Z]+
				(?:
					[.]*
					|
					(?:\[[a-zA-Z0-9'"]+\])*
					|
					(?:\([a-zA-Z0-9'"]*\))*
				)*
			)+
			\(\s*function
		)
		|
		if|switch|try|while|with
	)
	(?:[a-zA-Z_]+?[a-zA-Z0-9_]*
		(?:
			(?:[.]+(?=[a-zA-Z]))
			|
			(?:\[[a-zA-Z0-9'".()=?:]+\])
			|
			(?:\([a-zA-Z0-9'".() =?:]*\))
		)*
	)+
)
|
(
	@\(.*?\)@
)
</code></pre>

This regex is divided into two primary components, and several secondaries. Substituting each section for a label of the form `<this is a label>`, it looks like this:

<pre><code class="regex">(&lt;valid property expression&gt;)|(&lt;explicit expression&gt;)
</code></pre>

### Valid Property Expression

The bulk of the complexity of this section comes from both a lack of recursion as well as possibly a lack of knowledge on my part. It breaks down into the following components:

<pre><code class="regex">@
(?!&lt;keyword or &lt;&lt;valid expression&gt; containing function expression&gt;&gt;)
(?:&lt;valid expression&gt;)+
</code></pre>

Then `valid expression` breaks down into:

<pre><code class="regex">(?:
	&lt;valid identifier&gt;
	(?:&lt;dot notation&gt;|&lt;bracket property notation&gt;|&lt;call expression&gt;)*
)+
</code></pre>

Luckily, regexs allow for implicit recursion. The `valid expression` is repeated one or more times, which allows all of the following to match:

	@it.Do 
	@it.rea6lize()
	@it.everyone[0]
	@it.everyone('param').go

This will fail, however, due to nested parentheses (more on this later):

	@it.everyone(it.another('param')[0]).go

One of the most complex sections, visually, is the `<keyword or <<valid expression> containing function expression>>` because it has the rather complex `<valid expression>` nested within. Taking that out, it becomes a bit more manageable:

<pre><code class="regex">(?!do|for|function|(?:&lt;valid expression&gt;+\(\s*function)|if|switch|try|while|with)
</code></pre>

It prevents the following from matching (ellipses added):

	@for(...
	@if(...
	@valid.expression.cb(function...

We can't allow `@valid.expression.cb(function...` to match because the `function` call implies a new block, which could contain markup. Since this doesn't support any sort of blocks, we just ignore it all.

One interesting note is the `dot notation` section. We want to distinguish between tricky scenarios like `@property.`, in which the period is meant to be content (the period at the end of a sentence, for example), and even things like `"@property."` where both the period and the quotes are meant to be content, eventhough quotes are valid inside of bracket property access and function calls. Therefore, the `dot notation` section only accepts a period if it is followed by the start of a valid identifier: `[a-zA-Z_]+`. 

### Explicit Expression (and Nested Parentheses)

An explicit expression seems easy at first to write a regex for, and it basically is... until you remember that regex has no way of dealing with paired tokens, such as `(` and `)`. It just cannot do it without language specific extensions, such as true recursion. This is definitely not something that JS has natively!

At first I was content to just specify that explicit expressions could not contain nested parentheses. But that seemed too limiting, and just flat out "tricky". Instead, I perform a very simple preprocessing step before applying the main regex: search for all matched parentheses, and if the character before the opening parenthesis is `@`, then add an `@` after the closing parenthesis. This clearly delineates what an explicit expression is, and thus all nesting parentheses problems are avoided! It makes the regex very simple:

<pre><code class="regex">@\(.*?\)@</code></pre>

Unfortunately, this trick cannot work for nested parentheses in `valid expressions`, because there is no easy, foolproof way to tell if a parenthesis is within a `valid expression` without true tokenizing or a lot more code than is worth it.

## HTML Escaping?

I guess this is a required feature of templates these days, so I made sure MiniVash
could do it too. Thanks to a [recent patch][] to Vash by [rjgotten][], this was easy to do without being too hacky! MiniVash of course supports `vash.raw` to avoid HTML escaping a value.

## What? Implicit Iteration!?

What surprised me about this project, was that limiting MiniVash to only expressions and explicit expressions mean that it would be impossible to iterate within a template. So composition of, say, a list, would have to happen outside of the template.

But a neat way around this is implicit iteration. This means that if an array is passed as a model to a MiniVash template, it will automatically iterate through the array, and apply the template to each one, returning the total output. For example:

	// template
	<li>@it.value</li>

	// compile it:
	var t = vash.compile( document.getElementById('tpl').innerHTML );

	// single model:
	console.log( t( { value: 'HEY!' } )

	// outputs:
	<li>HEY!</li>

	// multiple models:
	console.log( t( [ { value: 'HEY!' }, { value: 'YOU!' }, { value: 'OFF!' } ] )

	// outputs:
	<li>HEY!</li><li>YOU!</li><li>OFF!</li>

This is actually a feature that Vash doesn't have. Might have to add it in!

## Invaluable Tools

I used [regexpal][] by [Steven Levithan][] extensively throughout this challenge. Combined with a small helper script run in firebug, it was invaluable!

{% highlight js %}
var  input = $('inputText').value
	,re = new RegExp( $('searchText').value, 'g' );

input.split(re);
input.replace(re, function(){ console.log(arguments); });
{% endhighlight %}

This easily let me test the results of a regex, with minimal back and forth, and no setup. The most important component of [regexpal][], and which other regex helpers get wrong, is the beautiful highlighting of grouping characters. Regexpal highlights parenthesis and pipes in matching colors, according to nesting level. This makes editing complex expressions much more easy: you can tell _where_ you're actually editing! 

Also pretty interesting is Perl's [YAPE Regex Explain][] module. Given a regex, it will output an explanation of what it does in english. If you've ever had a regular expression misbehaving, this tool can really help explain why it's not working how you think it should.

I made a short script that would easily perform the analysis:

{% highlight perl %}
#!/usr/bin/perl
use YAPE::Regex::Explain;
$re = '@\(.*?\)@';
print YAPE::Regex::Explain->new($re)->explain;
{% endhighlight %}

It requires the module to be installed, since it doesn't come with perl by default. On Mac OS X, this is easy:

{% highlight sh %}
$ sudo cpan
$ install YAPE::Regex::Explain
{% endhighlight %}

After installing the module, running the above helper script yields:

	The regular expression:

	(?-imsx:@\(.*?\)@)

	matches as follows:
	
	NODE                     EXPLANATION
	----------------------------------------------------------------------
	(?-imsx:                 group, but do not capture (case-sensitive)
							(with ^ and $ matching normally) (with . not
							matching \n) (matching whitespace and #
							normally):
	----------------------------------------------------------------------
	@                        '@'
	----------------------------------------------------------------------
	\(                       '('
	----------------------------------------------------------------------
	.*?                      any character except \n (0 or more times
							(matching the least amount possible))
	----------------------------------------------------------------------
	\)                       ')'
	----------------------------------------------------------------------
	@                        '@'
	----------------------------------------------------------------------
	)                        end of grouping
	----------------------------------------------------------------------

As you can see, it's pretty useful with longer expressions. 

## Conclusions

Wow, did you really make it all the way down here? If so, I congratulate you! [MiniVash][] is available as [a gist][]. I don't anticipate it being used, but it was a fun challenge!

[Vash]: https://github.com/kirbysayshi/vash
[readable only by the one who wrote it]: https://stackoverflow.com/a/708284/169491
[recent patch]: https://github.com/kirbysayshi/Vash/pull/5
[rjgotten]: https://github.com/rjgotten
[regexpal]: https://www.regexpal.com/
[Steven Levithan]: https://blog.stevenlevithan.com/
[YAPE Regex Explain]: https://search.cpan.org/~gsullivan/YAPE-Regex-Explain-4.01/Explain.pm
[MiniVash]: https://gist.github.com/3411585
[a gist]: https://gist.github.com/3411585
[800 bytes]: https://gist.github.com/3411585 
