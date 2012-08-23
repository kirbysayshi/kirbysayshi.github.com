---
layout: post
title: Is Vim Worth It?
oneliner: 
categories:
  - Opinion
tags:
  - Vim
  - Sublime Text 2
  - Text Editors
---

When I discovered [Sublime Text 2][] in February of 2011, I thought I had finally found THE EDITOR that I could just use forever. It's cross platform (I was on Windows at work then), and was being updated almost every week. 

And so I purchased a license, and used ST2 happily for a year and a half. Occasionally I'd have a bit of Vim time, where I'd attempt to use it as my primary editor. [I've been building my Vim setup for about the same amount of time.][]

About a month ago, I started one of these bouts again, trying to use MacVim, and am writing this post in it. Each time I start one of these periods, the following happens:

* Hack on some code
* Come to a situation where I would use ST2's multicursors/multiselect
* Say to myself, "Well, Vim has to have a better, more efficient way to do this one exact edit"
* Spend 20 minutes trying to figure it out
* Abandon looking for a solution, and do the labor manually 

Another common occurance is this:

* Edit some code in something like [jsbin][] or [jsfiddle][]
* Paste it into a file because it was actually just an experimental component of a larger project
* Oh, it's set in spaces/tabs, the rest of the project is in tabs/spaces
* Spend 20 minutes looking up how to flip all the indentation
* Find a solution, add it to my .vimrc for next time

Anything you can easily discover via a single click in ST2 goes through the above sequence in Vim (the first time).

The cumulative effect is that while I might be fast enough at typical editing, knowing that _somewhere_ deep inside Vim there is a set of key sequences that will solve my exact issue causes any speed gains to be offset by the eternal search for enlightenment. The mental tax of this is significant.

Even things we take for granted, like a [project drawer][], take a surprising amount of time to configure and get to work "properly". For some reason, my entire window still closes when I call `:bd` with NERDTree + a buffer open. _This is infuriating._

I am absolutely not saying that Vim or Sublime Text 2 is better than the other. But Vim definitely takes a lot longer to get to the point where I can say, "Yes, now I am ready to work efficiently." There is just too much to tweak, too much that isn't _just quite right_. Coupled with the knowledge that nearly anything __can__ be tweaked, this creates an environment where extreme discipline is required to know what to live with, and what is worth fixing; this is mentally exhausting. Sometimes I feel that instead of using Vim to build things, I'm using Vim to build the ultimate Vim setup.

I'm still using Vim, but should it be this hard?  

[Sublime Text 2]: http://www.sublimetext.com/2
[jsbin]: http://jsbin.com
[jsfiddle]: http://jsfiddle.net
[I've been building my Vim setup for about the same amount of time.]: https://github.com/kirbysayshi/dotvim
[project drawer]: https://github.com/jistr/vim-nerdtree-tabs
