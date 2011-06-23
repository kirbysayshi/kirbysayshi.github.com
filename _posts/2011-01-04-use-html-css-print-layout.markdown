---
layout: post
title: I want to use HTML/CSS for print layout
oneliner: It was not fine.
type: post
categories:
  - JavaScript
  - Future Hopes
image:
  - src:
  - alt:
tags:
  - JavaScript
---

Imagine, for a minute, being able to design paged layouts for print in a browser environment. You get to use JS for data/templating, and HTML/CSS for the structure/style, and don't have to worry about cross-browser compatibility.

If you like this idea, get ready for the events that inspired it.

My mother, over Christmas break, asked me to help create her Christmas card address labels. She had all the names entered into a Word document, but we didn't have Word on that computer anymore (long story), just OpenOffice.org. Thinking it was fine, I attempted to print the labels.

It was not fine.
=========

First off, the template that OpenOffice claimed would fit the packaged labels my mother bought did not fit. I had to make a custom template by measuring the physical labels and doing a lot of guesswork as to how OpenOffice calculated things. It was a lot of trial and error. Even once the template was complete, the labels still had formatting issues that were seemingly impossible to rectify as a whole. They were in a weird table... thing... that didn't act like a table (no way to auto-justify the columns or even precisely adjust the columns or rows, you could not turn off borders, etc).

Eventually, I gave up on the previously existing document, and had my mother enter all of her addresses into an OpenOffice database (I believe the software is called Base). From there it was relatively easy to use the database as a data source to the template, and changes were easy to erect over every label.

However, still things were not perfect, as there was no easy way to make fields, if null/blank (like salutation), not appear on the label. Thus, an extra space would be on the label, and that drove me nuts. Eventually I gave up, and my mother said that she could live with an extra space.

There is a point here...
------------------

This was actually not meant to be a rant about OpenOffice (which has some major interface issues, but it's FREE), but rather a question: could the web be used for print?

The answer is a qualified yes.

I cannot imagine ANYONE, after using Illustrator/InDesign, or web development, ever wanting to touch Microsoft Word again to create something more complicated than a simple document. It's basically equivalent to the crappy wysiwyg editor that ships with every CMS or blogging platform that completely takes all the fun of writing out of... writing (this editor I'm using on Tumblr is not excluded from this). You have to fight to get things to nudge. There is a vague idea of block-level elements, but you'd never know where one begins and one ends. Have you ever had to move the cursor to a point where the formatting was "good" because somehow all the formatting at the cursor is completely contrary (or uses the default) to what you've defined?

Part of this issue is the lack of forcing a user to outline their document with styles.

Wait a minute. Styles? Block-elements? That sounds like...

HTML and CSS
=========

Buh buh buuuuuh!

True, MS Word does use some proprietary XML format for storing its documents, but have you ever looked at the source of someone's webpage that was completely built using Dreamweaver 8? Enough said.

InDesign is a powerful program, but is it possible to connect data to it?

So the question that I asked [on Twitter today](http://twitter.com/#!/kirbysayshi/status/22378251343106048) was an attempt to investigate if anyone has seriously considered using HTML/CSS for print. I'm not talking about [print stylesheets](http://twitter.com/#!/nathanstilwell/status/22390970444152832). Well, I sort of am, but I'm not talking about printing web pages. I'm talking about printing something like labels.

This is possible, right now.

What needs to happen
------------------

Creating an app for this is probably not that hard to do. I say app in a native, not web sense. The main reason for this is that CSS can do some pretty cool things for print but needs more browser-options to bolster its ability. For example, the print dialogue box cannot do complex margins, and insists on leaving space for things like page numbers, urls, dates, etc. This isn't really something that can be fixed by CSS or JavaScript libraries, but could be by the browser shell.

So I see the main challenge being to take something like [Mozilla](http://en.wikipedia.org/wiki/Mozilla_application_framework) (the platform, not the browser, see [Komodo](http://mozillalinks.org/wp/2007/09/activestate-announces-open-komodo-project) [Edit](http://www.activestate.com/komodo-edit)), and add some print-specific extensions to it. This would be difficult.

Another challenge is the data aspect. That is, getting your data into this environment. This should actually not be too much of a problem. We've got [IndexedDB](http://hacks.mozilla.org/2010/06/comparing-indexeddb-and-webdatabase)! As long as something, like Google Contacts, can export as text, then parsers can be written to create. Not to mention that if we're hacking on Mozilla, you could package another database, like [MongoDb](http://www.mongodb.org/), as an extension, and offer a JS interface.

There are a lot more challenges, but mostly this is about the idea. Does anyone else think this might be valid or useful?