---
layout: post
title: Grab All Authors From a Git Repo 
oneliner: Give credit where credit is due...
categories:
  - Snippets 
tags:
  - Git
  - Bash
---

In prep for a new release of [Vash][], I decided to make an AUTHORS file. I wanted to make sure I didn't forget anyone, eventhough there haven't been that many contributors. Turns out it's [kind of difficult][] to get all [commits NOT by a particular author][].

So I went the opposite route, and decided to output all unique authors, using `git --log` formatting, and a suggestion from [linuxforums.org][] to use `sort` and `uniq`.

{% highlight sh %}
git log --pretty=format:'%an <%ae>' | sort | uniq
{% endhighlight %}

[Vash]: https://github.com/kirbysayshi/vash
[kind of difficult]: https://stackoverflow.com/a/4262780/169491
[commits NOT by a particular author]: https://stackoverflow.com/a/4262780/169491
[linuxforums.org]: https://www.linuxforums.org/forum/newbie/70975-how-print-unique-lines-file.html#post370515
