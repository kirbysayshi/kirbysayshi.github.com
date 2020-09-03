---
layout: post
title: Multithreaded Physics Rendering on the Web
oneliner:  Exploit a pocket parallel universe!
type: project
projecturl: https://youtu.be/p1dINlm1W9M
categories:
  - Talks
  - JavaScript
  - Game Design
tags:
  - Timestep
  - Game Loop
  - Multi-threaded Game Engines
  - Physics
---

Back in 2013, I wrote a [post about frame-by-frame animation interpolation]({% link _posts/2013-09-24-interpolated-physics-rendering %}).

That was a necessary step to demonstrating multithreaded physics simulations, which I presented at EmpireJS in 2014... and then never presented again!

<iframe width="560" height="315" src="https://www.youtube.com/embed/p1dINlm1W9M" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Although it’s been a long time, the information within that talk mostly holds up! I just never got around to collecting it all here.

In summary: sending serialized game state between a rendering thread (60hz) and a processing thread (30hz, Web Worker), combined with interpolated animation, frees extra CPU time to spend on both. Aka, exploit a pocket parallel universe!

The [slides are available on github](https://github.com/kirbysayshi/multithreaded-game-example/blob/gh-pages/docs/empirejs_2014-05-04.js), as well as [all the code](https://github.com/kirbysayshi/multithreaded-game-example)! The [README](https://github.com/kirbysayshi/multithreaded-game-example/blob/gh-pages/README.md), in particular, has a ton of information on how it works and inspiration/resources, too!