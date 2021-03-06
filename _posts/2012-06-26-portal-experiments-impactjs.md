---
layout: post
title: Portal Experiments Using ImpactJS
oneliner: Keep thinking with portals... in 2D!
type: project
projecturl: https://dl.dropbox.com/u/52514/games/impact-portal-4/index.html
categories:
  - JavaScript
  - Game Design
tags:
  - Portal
  - Portile
  - 2D

---

> UPDATE 06-29-2012: The demo now shows the what you can "see" through the portals in a limited way!

> UPDATE 06-30-2012: A bit of slowmo as you approach and exit the portals. There is a slight visual glitch, but it's definitely pretty close to what I was looking for.

[ImpactJS][] is a great game engine. I'm still working on this, but wanted to share some basic portal-like teleportation using ImpactJS. 

<div data-role="figure">
	<img src="/images/impact-portal.png" alt="Portals are surprisingly tough!" />
	<span data-role="figcaption">Portals are surprisingly tough!</span>
</div>

There are lots of bugs, but it's in a playable state for now. Aside from the portals themselves, all the graphics come with ImpactJS's demos.

Portals can be shot onto any surface using WASD. I wanted to try something different than the typical mouse-controlled targeting. I've always found mouse controlled aiming to be difficult and cumbersome in a smaller screen size, especially when attempting to do the tight movements required for Portal. My initial experimentation is that WASD works well, allowing for extremely swift shots. I eventually hope to add diagonals too.

The strange translucent cones are a hint of phase 2 of this experiment. They are "view cones", which are basically what the portal can "see", if you were looking through the other end... Every 2D version of Portal that I've seen typically uses a fixed camera, or a gliding camera like the one I implemented in this experiment. Instead, I plan to fix the camera on the player, and actually translate the level (including rotation) accordingly. 

Below is a GIF demonstrating how the view cones might work in Impact. The only thing I did not animate were the view cones themselves, which would naturally expand and contract as you approached or distanced.

<div data-role="figure">
	<img src="/images/traversal_mockup.gif" alt="Hopefully this helps explain" />
	<span data-role="figcaption">Hopefully this helps explain</span>
</div>

[Portile][] implemented this mechanic first (painting what you can "see" beyond the portal on the other end), but I found it extremely confusing (although really neat to look at!) to figure out the actual level geometry. [ASCII Portal][] took it one step further, by limiting what you could see via view cones. Neither of these incorporated actual physics, which is why I started on this experiment.


[ImpactJS]: https://impactjs.com/
[Portile]: https://www.increpare.com/2008/11/portile/
[ASCII Portal]: https://cymonsgames.com/asciiportal/
