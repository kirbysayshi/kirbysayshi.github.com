---
layout:     post
title: Maintaining Scroll Position When Adding Content to the Top of a Container
oneliner: Sometimes libraries complicate your task.
published:  true
type:       project
projecturl: https://jsfiddle.net/kirbysayshi/57HbV/
categories:
  - JavaScript
tags:
  - KnockoutJS
  - JSFiddle
  - UI
  - scrollTop
  - scrollHeight

---

I recently had to create a widget that would lazy load content when scrolled to the top, and also maintain the currently scrolled position. This is something that we encounter everyday on the web, but is actually a little tricky to do seamlessly.

Loading in new content is easy. The difficult part is that when adding content to the beginning of a parent container's children, the new content pushes the old content down, creating a jarring experience for the user.

Content starts like:

	content top:     -----------
	                 B
	viewport top:    ===========
	                 C
	                 D
	viewport bottom: ===========

And then a new item is added to the top (`A`):

	content top:     -----------
	                 A
	viewport top:    ===========
	                 B
	                 C
	viewport bottom: ===========
	                 D

Instead of the user continuing to see `C` at the top of the viewport, `C` and `D` have been jarringly pushed down due to the way content typically flows. What we want to happen is:

	content top:     -----------
	                 A
	                 B
	viewport top:    ===========
	                 C
	                 D
	viewport bottom: ===========

This involves a two step process of:

- save the current scroll position and `scrollHeight` of the container
- once the new content has been added (possibly asynchronously), scroll in the opposite direction to compensate

And of course hope that you can do that between repaints of the browser so that the user doesn't notice anything :).

I setup a small test case to [try this out][] using [jsfiddle][]. Click the buttons to add content above and below, and see that new content does not affect the position of the existing content in the viewport:

<iframe
	width="100%"
	height="450"
	src="http://jsfiddle.net/kirbysayshi/57HbV/embedded/result,js,html,css"
	allowfullscreen="allowfullscreen"
	frameborder="0"
	scrolling="no"></iframe>

The only real trick is partially due to using [KnockoutJS][] (KO). Using plain DOM techniques, this effect could be accomplished by creating the new content, measuring its height (`scrollHeight`), and then scrolling the parent container / viewport in the opposite direction that amount. Since KO automatically handles adding new DOM elements, it's not as easy to actually get a reference to the new element to measure it. Thus, before the content is added we effectively save the `scrollTop` (current scroll position) minus `scrollHeight` of the container to know how much it's been expanded by the new content once added.

I did this using a small class called `ScrollPosition`:

{% highlight js %}
function ScrollPosition(node) {
    this.node = node;
    this.previousScrollHeightMinusTop = 0;
    this.readyFor = 'up';
}

ScrollPosition.prototype.restore = function () {
    if (this.readyFor === 'up') {
        this.node.scrollTop = this.node.scrollHeight
        	- this.previousScrollHeightMinusTop;
    }

    // 'down' doesn't need to be special cased unless the
    // content was flowing upwards, which would only happen
    // if the container is position: absolute, bottom: 0 for
    // a Facebook messages effect
}

ScrollPosition.prototype.prepareFor = function (direction) {
    this.readyFor = direction || 'up';
    this.previousScrollHeightMinusTop = this.node.scrollHeight
    	- this.node.scrollTop;
}
{% endhighlight %}

Please excuse the extremely verbose name of `previousScrollHeightMinusTop`, but I just couldn't think of something better. Please try and let me know what you come up with! It's effectively the distance from the bottom of the scroll content (which could be outside the viewport) to the line formed by the top of the viewport.

It's expected that before the content is added, the developer calls `ScrollPosition#prepareFor` with the direction the new content is "arriving" or scrolling in, such as `'up'`. Then, once the content has been added, the developer calls `ScrollPosition#restore` to compensate for the increased height of the container and reset the scroll position.

You can see this in the `unshift` view model method, which adds new content to the top:

{% highlight js %}
self.unshift = function () {
    self.scrollPosition.prepareFor('up');
    setTimeout(function () {
        self.things.unshift(randBackColor());
        self.scrollPosition.restore();
    }, 1000)
}
{% endhighlight %}

The `setTimeout` is there to simulate asynchronicity, as I've noticed that KO is sometimes inconsistent with when DOM elements are added, especially with nested structures containing `foreach`. I was also loading in content from the server in the actual app, so this was a cheap way to simulate that too.

In the demo, checking "Monitor Scroll Events" will call `unshift` and `push` when scrolling up and downwards respectively. If you fiercely scroll on OS X, you may see the scroll position "jump" when the new content is added. This is actually the OS's inertial scrolling still decelerating!

There is one primary caveat to this technique. Content can only come in from one direction (up or down) at one time. If content is loading from the top and bottom at the same time, then there's no way for the `ScrollPosition` helper to know how to affect the viewport.

That's it! Let me know if you have a better way to do this in the comments, and as always, questions are welcome!

[KnockoutJS]: https://knockoutjs.com/
[jsfiddle]: https://jsfiddle.net
[try this out]: https://jsfiddle.net/kirbysayshi/57HbV/