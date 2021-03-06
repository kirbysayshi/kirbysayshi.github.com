---
layout: post
title: Dark Theme for NetBeans
type: project
categories:
  - else
projecturl: /stuff/succulent-netbeans.zip
oneliner: I translated the Succulent/Sunburst theme (dark theme) that ships with Textmate to NetBeans for PHP/Javascript/HTML development.
image:
  - src: /images/icons/netbeans-succulent.png
  - alt: Example of syntax highlighting using my Succulent theme for NetBeans (PHP)
tags:
  - NetBeans
  - Textmate
---

[Textmate](https://macromates.com) is easily my favorite tool to use
everyday. But there are times when I would like a little more: actual
code completion, debugging, etc. Many of these things are possible with
Textmate, but sometimes they’re just a little too complicated, or take
to long to get up and running.

For PHP/Javascript/HTML/CSS development, nothing beats NetBeans (at the
moment…). It is easily the greatest IDE I’ve ever used for PHP,
especially of the free ones. I’ve tried Eclipse and its children
(Aptana, PDT), Komodo (really great second, and the default dark theme
it comes with is GREAT), Visual Studio (no Mac version == not for me),
and a handful of other text editors (jEdit, BBEdit, TextWrangler, etc).
This list by no means makes me an expert, but I’ve found my IDE for now:
NetBeans. Oh yeah, AND, with 6.7 they’ve totally revamped the layout and
appearance of the IDE itself, so it actually looks like an OS X
application! Yay!

The one thing NetBeans is lacking in, however, is dark color schemes.
Sure, there’s the Extra Ruby Color Themes available from the Plugin
Manager in NetBeans, but they’re for **Ruby**. In PHP, they’re pretty
abysmal. One day, I decided to take the plunge and recreate the
Succulent theme from Textmate in NetBeans. It’s pretty close, as close
as I could give it given NetBeans’s semi-weird color editor (but it’s
still better than Eclipse’s!).

You can download it [here](/stuff/succulent-netbeans.zip).

You should be able to import it using the “Import” button on the Fonts &
Colors tab of preferences, but if you can’t, merge the contents of the
config folder in the zip file with the contents of
\~/.netbeans/6.7/config. The 6.7 in my case is my version. If you’re
using an older version of netbeans, check the contents of your .netbeans
folder first.

On Mac OS X there is no merge functionality using the Finder (!). To get
around this, use the following terminal command, modified appropriately
(this assumes that you’re inside of the succulent-netbeans folder):

{% highlight sh %}
#!/bin/bash
cp ./config/* ~/.netbeans/6.7/config/
{% endhighlight %}

I bet you can barely tell the two apart:

|                                     |                                    |
|-------------------------------------|------------------------------------|
| ![](/images/netbeans-succulent.png) | ![](/images/textmate-sunburst.png) |

Ok, not really… but they’re close, right?
