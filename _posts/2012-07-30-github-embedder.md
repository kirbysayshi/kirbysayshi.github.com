---
layout: post
title: The Github Embedder
oneliner: Embed any file from any public repo with no server-side dependencies!
type: project
projecturl: https://github.com/kirbysayshi/ghembedder 
categories:
  - JavaScript
tags:
  - Github
  - JSBin
---

I was working on a tutorial post, and realized that it was extremely tedious to keep copying, pasting, referencing, and updating code. It's also easy for a code sample to make your markdown very cluttered. There are server-side scripts and services ([gist-it][] comes to mind), but I wanted something that was self-contained, and didn't rely on a server.

So I created [ghembedder][], which is a simple way to declaratively embed any file from any public Github repo into a web page for display purposes. It can embed specific lines from a file, and can even show only a specific revision of the file. It has no hard external dependencies, and can even do syntax highlighting if you include [google-code-prettify][].

It turns this:

{% highlight html %}
<div data-ghuserrepo="kirbysayshi/ghembedder"
    data-ghpath="src/ghembedder.js"
    data-ghref="5821e203cd02cf1455d65345989896225c4cee50"
    data-ghlines="329-348"
    data-ghtabsize="2">
</div>
{% endhighlight %}

into:

<div class="highlight" data-ghuserrepo="kirbysayshi/ghembedder"
	data-ghpath="src/ghembedder.js"
	data-ghref="5821e203cd02cf1455d65345989896225c4cee50"
	data-ghlines="329-348"
	data-ghtabsize="2">&nbsp;
</div>

In the above example, `ghref`, `ghlines`, and `ghtabsize` are optional. The only required params are `ghuserrepo` and `ghpath`. There may be bugs, but it works for now! You can also see a live demo at [JSBin][].

[ghembedder]: https://github.com/kirbysayshi/ghembedder
[google-code-prettify]: https://code.google.com/p/google-code-prettify/
[JSBin]: https://jsbin.com/ekises/latest
[gist-it]: https://gist-it.appspot.com/
