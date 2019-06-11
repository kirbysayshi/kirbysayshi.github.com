---
layout:     post
title: Putting Macros into Markdown
oneliner: Heros in a text file. Turtle power?
published: true 
type: project
categories: 
  - JavaScript
tags:       
  - Markdown
  - Vash
  - HTML
  - Macros
---

**tl;dr**: Use a JS templating language to add macros to Markdown. It can be as simple as:

	cat path/to/input.md | bin/vash --execute | marked > path/to/destination.html

I was recently working on an article that had a lot of code samples and demos. [Markdown][] was my primary choice, and I also learned that the publishing platform employed Markdown as well. Neat!

I wanted to be able to link to specific demos, images, and code samples embedded within the page. I also wanted to set these areas aside using proper markup, using the `<figure>` and `<figcaption>` tags. They would also be numbered, for easy reference from within the document: Fig. 1, Fig. 2, and so forth.

Of course this is where Markdown falls over: now you're basically writing an article in HTML minus `<p>` tags. Markdown isn't meant for media-heavy documents, nor for doing meta things like autonumbering footnotes and figures. Just editing is a chore. If you have figures that are numbered sequentially, and decide to move a section around ("Ah, it makes so much more sense AFTER!"), you have to edit at least 3 different places to keep the figure updated:

* `id` attribute of the figure: `id="fig-1"`
* Visual display in the `<figcaption>`: "Fig. 1"
* Any references to the figure in the text itself: `[Fig. 1](#fig-1)`

Now do that for a few figures and it's pretty annoying. Should I have been using [LaTeX][]? Maybe, but I wasn't ready to commit to learning something that complicated just yet. There are flavors of Markdown that offer figure and footnotes support, but since I'd be handing off plain Markdown I couldn't guarrantee that flavor would be supported.

So I did it manually, and yes it was a pain.

But it made me think... wouldn't it be great if Markdown could have macros? Nearly any functionality that was flavor-specific could be reproduced. But I didn't want to create _another_ flavor of Markdown, because that doesn't solve my issue of the rendering being platform-dependent.

Instead, I realized that I have a pretty great text processor powered by JavaScript via [Vash][]. And because it's plain JavaScript, it meant that with a few hooks nearly anything could be possible:

	var imgfigure = (function(){

		var figcount = 0;

		return function(path, caption){
			var isfunc = typeof caption === 'function';
			<figure>
				<a id="fig-@(figcount++)"></a>
				<img src="@path" alt="@(isfunc ? caption() : caption)" /> 
				<figcaption>Fig. @figcount: @(isfunc ? caption() : caption)</figcaption>
			</figure>
		}
	}())

Look! It's auto-numbered figure support! And the caption can be simple or complex:

	// option 1:
	@imgfigure( 'path/to.img', 'Wow, what an amazing figure!' )

	// option 2:
	@imgfigure( 'path/to.img', function(){
		@:Wow, what an amazing figure!
		imgfigure( 'path/to/another.img', 'Yo, I put a figure into your figure. It\'s definitely invalid html.' )
	})

Some other crazy stuff you could do is add footnote support **[WHERE THERE IS NONE][]**. Check out the [gist][] for more. This is all possible via Vash's [helper API][], which allows for things as simple as shown here or as complex as an entire [view engine][]. It's currently undocumented, but that will change soon.

One other thing to keep in mind is that there is nothing preventing this sort of workflow with other JS/HTML templating languages, but Vash is really tailored to it because it provides a pretty seamless transition from text to code.


[LaTeX]: https://www.latex-project.org/
[Vash]: https://github.com/kirbysayshi/vash
[gist]: https://gist.github.com/3740308
[WHERE THERE IS NONE]: https://gist.github.com/3740308
[Markdown]: https://daringfireball.net/projects/markdown
[helper API]: https://github.com/kirbysayshi/Vash/blob/master/src/vhelpers.js 
[view engine]: https://github.com/kirbysayshi/Vash/blob/master/src/vhelpers.layout.js
