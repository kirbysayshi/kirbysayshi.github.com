---
layout: post
title: Introducing Twitter Sequencer
oneliner: And all vowels are intact!
type: post
projecturl: http://kirbysayshi.github.com/twitter-sequencer
categories:
  - JavaScript
image:
  - src: /images/icons/ts.png
  - alt: Twitter-Sequencer
tags:
  - JavaScript
  - Parse
  - Twitter
---

I had a problem. Problems are good for programmers.

[@BobMcLennan](http://twitter.com/TrinAndTonic) made this huge rant on Twitter to [@TrinAndTonic](http://twitter.com/TrinAndTonic). I thought it was interesting, and wanted to ask others what they thought of it. But these tweets were not part of a conversation, and were not replies or RTs. As far as Twitter knew, they were completely independent, separate, and unrelated tweets.

So how do you share something like this? Send people a link to @BobMcLennan's profile, and tell them to scroll down, loading as necessary, until they find the first tweet and then start reading? Well that's awkward. There's no good way to do it...

After thinking for awhile (around a week), I put fingers to code and built something last night. It's called [Twitter Sequencer](http://kirbysayshi.github.com/twitter-sequencer), and it took great amounts of my web-person stamina to keep its vowels intact.

By default it loads up the [aforementioned rant by @BobMcLennan](http://kirbysayshi.github.com/twitter-sequencer/#i/t6sMeIum7R). You can view it "inline" or in "block" mode. Inline mode makes for some very interesting experimental prose! Scroll down to the bottom to construct your own sequence by pasting in URLS to tweets.

The neat part of this whole thing is that there's no server involved! I attempted a few different approaches:

- Have the URL contain the tweets to show (something like tweetid,tweetid,tweetid, etc), and load them fresh from Twitter every time. This has the wonderful aspect of being dead simple. However, a user is liable to hit Twitter rate limits with only a few page loads (150 per hour).
- URL contains the tweets, load them directly from Twitter, and cache them using localStorage. In hindsight, this probably would have worked just fine...
- Save all the tweets in [MongoDB](http://www.mongodb.org), have the whole site be powered by [node.js](http://nodejs.org). I planned to host the entire thing using [DotCloud](http://dotcloud.com), but couldn't get the node instance to successfully fire up and talk to mongo. They officially only support v0.4.10 of node.js, which is rather old.

In the end, I went with [Parse](https://www.parse.com), which has a ridiculously easy API. If you're new to it, it's basically a cloud database that can be accessed through a simple REST API, with CORS to boot!. Using Parse lets me save all the tweets, and cache them locally using localStorage. As a SUPERIOR BONUS I don't have to maintain a server! All the code is hosted using [GitHub pages](http://pages.github.com/), and the data is easily persisted.

What's next? You tell me! It would be nice to come up with an easier way to create sequences, but I haven't thought of a better way yet. If you do, [why don't you fork it](https://github.com/kirbysayshi/twitter-sequencer) and show me?