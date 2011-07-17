---
layout: post
title: Vash, the Sixty Billion Double Dollar Template Function
oneliner: Love and Peace, through templates
type: project
projecturl: https://github.com/kirbysayshi/vash
categories:
  - javascript
  - projects
image:
tags:
  - Razor
  - doT
  - templates
  - C#

---

[Razor](http://weblogs.asp.net/scottgu/archive/2010/07/02/introducing-razor.aspx) is a templating idea from the ASP.NET team at Microsoft that shipped with their MVC 3 release. Razor differs from other templating languages in that there is no special template syntax to learn, and no keywords. It's also pretty clean, for a template. Here is an example of a template (C#) that loops through an array:

	<ul id="theBigList">
	@for(int i = 0; i < myItems.Count(); i++){
		SomeItem item = myItems[i];
		<li class="@( i % 2 == 0 ? 'even' : 'odd' )">@item.name</li>
	}
	</ul>

There is a lot more you can do, but that gives you the basics. Today, I'm releasing [Vash](https://github.com/kirbysayshi/vash), an implementation (not a port) of Razor syntax to JavaScript. With Vash, the above becomes:

	<ul id="theBigList">
	@for(var i = 0; i < myItems.Count(); i++){
		var item = myItems[i];
		<li class="@( i % 2 === 0 ? 'even' : 'odd' )">@item.name</li>
	}
	</ul>

Notice how it's almost exactly the same, and is only JavaScript. There is no special syntax, aside from @ and @(). From here on out, _Razor_ refers to the general syntax, while _Vash_ refers to the parser implementation. Even though Vash is in JavaScript, there are few if any differences in the actual syntax.

Vash renders just as fast as [doT](https://github.com/olado/doT).

#### Quick Razor Primer

Razor has a single key character, _@_. This character has three primary usages:

* Denote an _expression_, meaning some JavaScript that should be evaluated inline. For example: @someVar.aFunction()[3]
* Denote an _escaped expression_, implying that all of the text is valid JavaScript. For example: @( someVar == true ? "yeah <strong>buddy</strong>" : 'nope.' )
* Denote an _anonymous block_, which, while having no bearing on scope, can allow for multiline JavaScript blocks. For example:

	@{
		var  a = []
			,all = '';
		
		a.push('love', 'and', 'peace');
		all = a.join(' ');
		<span>@all</span>
	}

In addition, there are two other usages that aren't very common:

* Denote a "server-side" comment. _@* this text is not included in the compiled template *@_
* Escape a literal character in content. _@}_ would allow the _}_ to be included literally, and not assumed to be the closing brace of a code block. This is how Vash treats this case, but this may not be compliant with Razor.

Most of the time, it doesn't matter what the modes are called. Razor is pretty natural once you use it a bit.

#### Choices

For Vash, a few changes had to be made. JavaScript is not C#! 

* Line breaks are of no consequence. To Vash, the following statements are equivalent (and yes, Vash is smart enough to know what's code and what's markup!):

	@* A *@
	<div class="how"> @for(var i = 0; i < 1; i++){ <div class="item-@i">I be an item!</div> } </div>
	
	@* B *@
	<div class="how"> 
	@for(var i = 0; i < 1; i++){ 
		<div class="item-@i">I be an item!</div> 
	} 
	</div>

* Things related to Razor as a View Engine are not implemented. This includes: LayoutPage, RenderSection, RenderBody, @helper, @section, @using, @Html.Raw, etc.
* Automatic HTML encoding. Razor, by default, HTML encodes all content to better protect against XSS. Vash does not. I believe this is more in line with what other JS templates do.
* Inline templates as parameters are not supported. This requires more of a View Engine or framework.

#### Usage

Include vash.js on your page somewhere. Compile templates:

	var compiled = vash.tpl('<li>I'm a template, @name!</li>');

Return a template string:

	compiled({ name: 'Vash the Stampede' });

For inline script tag usage, I recommend `type="text/vash"`. For template files on the server or otherwise, I've been using a `.vash` extension.

More information on usage can be found at [Vash's Github repo](https://github.com/kirbysayshi/vash).

#### To Conclude

Let me know what you think! This is definitely my first non-trivial parser experience, and I have a ton to learn. 

Coming up:

* [Express]() support
* NPM package