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

I was working on a tutorial post, and realized that it was extremely tedious to keep copying, pasting, referencing, and updating code. It's also easy for a code sample to make your markdown very cluttered.

So I created [ghembedder][], which is a simple way to declaratively embed any file from any public Github repo into a web page for display purposes. It can embed specific lines from a file, and can even show only a specific revision of the file. It has no external dependencies, and can even do syntax highlighting if you include [google-code-prettify][].

It turns this:

````
<div data-ghuserrepo="kirbysayshi/ghembedder"
	data-ghpath="src/ghembedder.js"
	data-ghref="5821e203cd02cf1455d65345989896225c4cee50"
	data-ghlines="325-348"></div>

````

into:

<div data-ghuserrepo="kirbysayshi/ghembedder"
	data-ghpath="src/ghembedder.js"
	data-ghref="5821e203cd02cf1455d65345989896225c4cee50"
	data-ghlines="325-348"></div>

In the above example, both `ghref` and `ghlines` are optional. The only required params are `ghuserrepo` and `ghpath`. There may be bugs, but it works for now! You can also see a live demo at [JSBin][].

[ghembedder]: https://github.com/kirbysayshi/ghembedder
[google-code-prettify]: https://code.google.com/p/google-code-prettify/
[JSBin]: http://jsbin.com/ekises/latest