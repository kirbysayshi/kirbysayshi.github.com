---
layout:     post
title: "Tablespoon: Twitter Syndication Protocol"
categories: 
  - Blabbering Musings
tags:       
  - RSS
  - Fever
  - Twitter
  - PubSubHubbub
  - Feeds
---

Feed readers and I always fall into a loveless relationship. I start off saying, "Yes, this time I will religiously check it." And then I never do, because Twitter is just so much more useful. Why filter things manually when all of the people I follow on Twitter do it for me? I follow people typically because I trust their tastes in one aspect or another. Perhaps my Twitter usage is not common place in this regard, but I have a feeling I'm not alone. 

I've tried things like [Fever][], which while admirable, still isn't quite it. Twitter as an influencer would help, but it's still a second place to check.

There are times when Twitter alone doesn't suffice. This is usually because the content author doesn't use Twitter consistently, or expects people to be subscribing via RSS/ATOM. I found this just today when [@TrinAndTonic][] tweeted:

<blockquote class="twitter-tweet tw-align-center"><p>Remember a long time ago when I talked about Space-Mullet? So far, it is cooler than I ever imagined: <a href="http://t.co/EorD7qcQ" title="http://www.space-mullet.com/2012/06/30/page-1-7/">space-mullet.com/2012/06/30/pag…</a></p>&mdash; Trin (@TrinAndTonic) <a href="https://twitter.com/TrinAndTonic/status/243354070612582400" data-datetime="2012-09-05T14:25:06+00:00">September 5, 2012</a></blockquote>
<script src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

So I checked out [Space Mullet][], and thought it was awesome. But then I realized I had no way to know when a new page was published. To do so, I'd have to search for the author's Twitter handle, which wasn't readily seen on the page itself. 

This happens to me often: I want to get updates via Twitter, because it's the stream I check most often. Last night I was wondering about this:

<blockquote class="twitter-tweet tw-align-center"><p>RSS is dead to me. I want something that will show all new articles from subscribed blogs, when they're posted, in my twitter stream.</p>&mdash; kirbysayshi (@kirbysayshi) <a href="https://twitter.com/kirbysayshi/status/243249747836669952" data-datetime="2012-09-05T07:30:33+00:00">September 5, 2012</a></blockquote>
<script src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

Wouldn't it be awesome to have a bookmarklet or service that could attach an RSS feed to Twitter? Let's call this hypothetical thing **TSP**. Here's how it could work:

1. User on site with RSS Feed
2. Click bookmarklet
3. Send RSS feed url to TSP server
4. TSP Server stores and marks all entries as "read"

Then... The TSP server would poll the feeds at regular intervals (or even use something super cool like [PubSubHubbub][]!). When a new entry was detected in the feed, TSP would tweet it as itself. You would follow TSP, so it would then appear in your Twitter feed. You could even have the service check various sources for a Klout-like rating. Is it on [Hacker News][]? What about already in your Twitter feed? If so, either don't tweet it, or add a rating value to the tweet itself. 

But if this were a service... wouldn't the whole world be following the same Twitter user? Nope, because each TSP user would have a corresponding "internal" Twitter user. For me, it would be something like @TSPKirbySaysHi. Or, it could even be nonsense, like a hash, @TSPa0bc34daf, so it wouldn't appear in search results for users. 

User register/setup flow:

1. OAuth via Twitter on TSP website
2. Creation of TSP user
3. Give user unique email address, like SOMELONGHASH@twittersyndicationprotocol.com
4. User creates new Twitter account using above email address

Once the new Twitter user is created, then it would be trivial to add a [Follow][] button that the user could click from the TSP settings page. 

I like the idea of calling it "Tablespoon", because I think it sounds cute. It could stand for "Twitter Syndication Protocol", except that it's not really a true protocol... 

Anyway, this is just an idea. Maybe I'll build an implementation, maybe not. Ideas? Does this already exist?

[Fever]: http://feedafever.com/
[@TrinAndTonic]: https://twitter.com/TrinAndTonic
[Space Mullet]: http://www.space-mullet.com/
[PubSubHubbub]: http://en.wikipedia.org/wiki/PubSubHubbub
[Hacker News]: http://news.ycombinator.com/
[Follow]: https://twitter.com/about/resources/buttons#follow
