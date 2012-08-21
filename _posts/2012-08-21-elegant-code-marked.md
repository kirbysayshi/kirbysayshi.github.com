---
layout: post
title: "Elegant Code To Notice: marked"
oneliner: 
type: project
projecturl: https://github.com/chjj/marked 
categories:
  - JavaScript
  - Elegant Code
tags:
  - RegExp
  - Regex
  - Markdown
  - marked
---

I was looking at Markdown parsers written in JS, and found [marked][]. Ever curious about how different people tackle parsers, I was completely blown away by the elegance of its code. One function in particular stood out:

<div class="highlight" data-ghuserrepo="chjj/marked"
	data-ghpath="lib/marked.js"
	data-ghref="1a2b02c6695527bd54c4fdd1bfa2f3a4dd64ffc8"
	data-ghlines="698-706"
	data-ghtabsize="2">&nbsp;
</div>

It's basically just a shortcut to `String.prototype.replace`, but the syntax that it enables is beautiful:

<div class="highlight" data-ghuserrepo="chjj/marked"
	data-ghpath="lib/marked.js"
	data-ghref="1a2b02c6695527bd54c4fdd1bfa2f3a4dd64ffc8"
	data-ghlines="27-31"
	data-ghtabsize="2">&nbsp;
</div>

Looking through the source history, at one point it was literally just sequential calls to `String.prototype.replace`:

<div class="highlight" data-ghuserrepo="chjj/marked"
	data-ghpath="lib/marked.js"
	data-ghref="7f9fd628af2b24a98ab7b998edf0c28ab145be18"
	data-ghlines="27-46"
	data-ghtabsize="2">&nbsp;
</div>

I think it's very interesting to study how code evolves over time.

As an experiment, I applied that replace function to the regex I wrote for [MiniVash][]. For a one-shot use like this, breaking the regex up is not worth the size increase. However the comprehension and readability improve immensely:

{% highlight js %}
var re = {};

re.identifier = /[a-zA-Z]+?[a-zA-Z0-9]/
re.inExp = /[a-zA-Z0-9'".()=?:]/
re.pAccess = /(?:[.]+(?!\s|$|"|'|\?))/

re.exp = /(?:identifier*(?:pAccess|(?:\[inExp+\])|(?:\(inExp*\)))*)/
re.keyword = /do|for|function|(?:exp+\(\s*function)|if|switch|try|while|with/

re.combined = /(@(?!keyword)(?:exp+))|(@\(?:.*?\)@)/
re.combined = replace( re.combined, 'g' )
	(/keyword/g, re.keyword)
	(/exp/g, re.exp)
	(/identifier/g, re.identifier)
	(/pAccess/g, re.pAccess)
	(/inExp/g, re.inExp)
	();
{% endhighlight %}

[MiniVash]: http://kirbysayshi.com/2012/08/20/my-longest-regex-minivash.html
[marked]: https://github.com/chjj/marked
