---
layout: post
title: Interpolated Physics Rendering
oneliner: Not everything has to run at 60fps.
type: project
published: false
projecturl: http://codepen.io/kirbysayshi/full/tfDmk
categories:
  - JavaScript
  - Game Design
  - Physics
tags:
  - Timestep
  - Game Loop
  - Multi-threaded Game Engines
---

There are several articles online that attempt to explain good patterns and gotchas for a game loop. Two of the most oft-quoted and referenced, at least according to my informal analysis, are [Fix Your Timestep][] and [deWiTTERS Game Loop][]. They are both excellent resources, and I recommend reading them. What follows is my own interpretation of a game loop that attempts to keep rendering updates independent of physics updates, with actual running examples in JS.

Why Independence?
-----------------

The two most expensive operations in games I've built, computationally, have been drawing and physics. Separating these mean they can run at different speeds to accomodate slower or faster platforms.

For example, let's say that when running at 60 frames (physics updates and frames drawn) per second, your game plays and looks great. But then you try your game on a retina iPad, where it runs at 20 frames per second, and on your cousin's 4 year old laptop where it runs at only 45 frames per second. In both cases, the reduced speed either causes your game to be unchallenging or the simulation aspects to explode due to inconsistent timesteps.

And plus, what if you decide to go ahead with that realtime multiplayer expansion, where players are all playing the same game at the same time?

Do you target the lowest common denominator, and make even those people with super beefy gaming rigs run at 20 frames per second?

Nope, there's another way.

Some Actual Code.
-----------------

A possible solution is to separate your game code into two segments:

- Rendering / drawing to the screen
- Physics / updating all the world entities

What follows is code that does exactly that, [inspired][] [from][] [several][] [sources][]:

<script src="http://gist.github.com/kirbysayshi/6654845.js?file=stepstate.js"></script>

This allows our game to render as fast as the platform allows (in the case of [requestAnimationFrame][], hopefully 60fps as long as drawing doesn't take too long), while allowing physics and/or game state updates to happen at another arbitrarily less frequency.

But there's still one more problem to solve. Won't the game look jittery if renders are happening at 60fps, while physics are only being updated every other frame (30fps)?

ASCII Diagrams Might Help.
--------------------------

Let's pretend that your game is spending most of its time calculating physics. Separating out the physics updates from the rendering (60 fps) could result in physics being calculated every other frame:

	Time (ms):       0    16    32    48   64    80    96    112
	Physics Ticks:   *          *          *           *
	Render Ticks:    *    *     *     *    *     *     *     *

Or even something crazy, like every few frames (every 100 milliseconds):

	Time (ms):       0    16    32    48   64    80    96    112
	Physics Ticks:   *                                       *
	Render Ticks:    *    *     *     *    *     *     *     *

However, even if you're rendering at 60fps (16.666666ms between steps), if physics are only being calculated every 100ms, then the animations will appear very jittery, as the following example demonstrates:

<p data-height="268" data-theme-id="1340" data-slug-hash="iwxvk" data-user="kirbysayshi" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/kirbysayshi/pen/iwxvk'>Current Position, 100ms step at 60fps</a> by Andrew Petersen (<a href='http://codepen.io/kirbysayshi'>@kirbysayshi</a>) on <a href='http://codepen.io'>CodePen</a></p>
<script async src="http://codepen.io/assets/embed/ei.js"></script>

There Is a Solution.
--------------------

We do have a pretty easy solution that is hinted at in [Fix Your Timestep][]: [linear interpolation][].

First off, every time the physics are updated, we need to store the previous state of the world. For the simple demos presented here, that involves only storing the previous position. In a more complex physics simulation, that could involve also storing rotation and transform matrices. Since the demos here use [Verlet integration][], the previous position is necessarily stored. Yay! FREEBIES.

Each time the game is rendered, we compute a ratio of how much time has passed since the last physics step, and how much remains until the next step. This effectively gives us a percentage of the "progress" between the previous physics update and now. In the demos, this ratio is automatically computed and passed as part of the `graphicsStep` callback.

Using this ratio, we can render sometime between _the most current physics step_ and _the step before that_, meaning our rendering is actually slightly behind our simluation. As stated anecdotally in [Fixed-Time-Step Implementation][], this is both imperceptible to the user as well as common practice on all major games.

The formula for linear interpolation of two positions given the ratio of time progressed:

	renderPosition =
		(currentPosition * ratio)
		+ (previousPosition * (1 - ratio))

And if we apply this to the previous demo:

<p data-height="416" data-theme-id="1340" data-slug-hash="tfDmk" data-user="kirbysayshi" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/kirbysayshi/pen/tfDmk'>Current Position vs Interpolated Position</a> by Andrew Petersen (<a href='http://codepen.io/kirbysayshi'>@kirbysayshi</a>) on <a href='http://codepen.io'>CodePen</a></p>
<script async src="http://codepen.io/assets/embed/ei.js"></script>

Pretty smooth, eh? Any jumping near the edges are just because of crappy bounds checking.

Finally.
--------

Where to go from here? Well... to multithreaded land via web workers and beyond! Eventually. Ask questions!


[Fixed-Time-Step Implementation]: http://lspiroengine.com/?p=378

[Fix Your Timestep]: http://gafferongames.com/game-physics/fix-your-timestep/
[deWiTTERS Game Loop]: http://www.koonsolo.com/news/dewitters-gameloop/
[Animate Your Way to Glory]: http://acko.net/blog/animate-your-way-to-glory/
[requestAnimationFrame]: https://developer.mozilla.org/en-US/docs/DOM/window.requestAnimationFrame

[inspired]: http://www.unagames.com/blog/daniele/2010/06/fixed-time-step-implementation-box2d
[from]: http://www.koonsolo.com/news/dewitters-gameloop/
[several]: http://blog.allanbishop.com/box-2d-2-1a-tutorial-part-10-fixed-time-step/
[sources]: http://gafferongames.com/game-physics/fix-your-timestep/

[Linear interpolation]: http://en.wikipedia.org/wiki/Linear_interpolation
[Verlet integration]: http://codeflow.org/entries/2010/nov/29/verlet-collision-with-impulse-preservation/