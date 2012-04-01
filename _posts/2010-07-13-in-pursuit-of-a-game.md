---
layout: post
title: In Pursuit of a Game
oneliner: Do you dare challenge Lavos\? Do you dare to change what has been set in motion\?
type: post
categories:
  - JavaScript
  - Game Design
image:
  - src: /images/icons/ct.png
  - alt: Do you dare challenge Lavos? Do you dare to change what has been set in motion?
tags:
  - Chrono Trigger
---

Several months ago, I began work on a [JavaScript-powered RPG engine](http://github.com/kirbysayshi/CT), named CT (for now). I started it with the goal of learning about the challenges of game design, and to figure out how the heck those old masters of the 16-bit era did things. Frankly, I think the sprites from *Chrono Trigger* have a lot more character than the typical 3D environment seen today. It’s really about your imagination, and the sprites give it room. Look at the original Pokemon. The battle sprites were literally *ugly*, but I didn’t care, because in my head was where the real battle was.

CT taught me a few things, and even in it’s unfinished state, I’m proud to say I worked on it. It has asynchronous asset loading, map scrolling, animated sprites, menu-driven events, running, point-in-polygon collision detection (the walkable area is defined by a polygon), map switching, pixel-based text rendering engine, and some other tricks too.

![Old Man: Do you dare challenge Lavos? Do you dare to change what has been set in motion?](/images/ct_big.png)

Some things I’d do differently if I ever decide to continue working on it:

* I’m not sold on the way I implemented key detection. I took my previous experience with Flash and [asynchronous key detection](http://www.8bitrocket.com/newsdisplay.aspx?newspage=6249) (that’s not my tutorial, but just what I’m talking about), and thought that it would be a good starting place. In actuality, I probably should have used something along the line of event handlers. In addition to being native to the browser, they are also much more suited to the single inputs of an RPG. Granted, browser keyboard input is far from perfect, especially the inconsistent manner that key repeat events are handled. 
* Figure out how to handle “events”. Not browser events, but game events. The only experience I have creating RPGs is with a program called RPG Maker. It’s been a long time since I touched it, and several new versions have come out since then. But its basic premise was that you have a map of tiles, and each of these tiles can contain an event. An event is simply something that happens. It can be triggered by proximity, the keyboard, a timer, or something else. I used this model for CT. However, I attempted to handle events synchronously. That is, each iteration of the game loop checks what events are in progress, need to be triggered, are completed, or need to be reset. This just turns into a big mess of hairy conditional logic.
* The menu “system”, if it can be called that, is a mess. It’s a series of if statements for all the different types of input that can occur depending on what is showing on the screen. It’s extremely fragile.
* Separate the game world from the visible world. The game would should be a simulation of the world, and then the state of the world is rendered separately. It’s all the same thing currently.
* Find a better way to draw to canvas without reproducing the entire Flash DisplayObject paradigm. 

If you’ve noticed a theme here, good job! JavaScript is event-driven. I should have made the engine the same. That is, everything is triggered by an event. For example, rather than there being a main game loop that checks for input, have input handlers. The player presses the right arrow: move the internal representation of the character right. The framerate timer ticks: render a frame to the screen. An event has completed: perform it’s callback. I could go on.

Moral of the story: use the language’s strengths as that.

If anyone has questions or comments on the engine, I welcome the dialog. The source code is [on github](http://github.com/kirbysayshi/CT), where there is more information on features and what you can do.