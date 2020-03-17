---
layout: post
title: The SPACEBIRD Log
oneliner: Roleplay yourself into a motivated self 
type: post
categories:
  - Blabbering Musings
  - Tools
tags:
---

Motivation is often difficult for me, even when it's something I want to do or will have measurably positive outcomes. So it always helps to have a little bit of external motivation, even if it's in my head...

When I start coding or fleshing out a new idea, I tend to oscillate between two approaches:

> yay, I can't believe all the stuff I'll have to learn!

> booo, I can't believe all the obstacles in my way. SO MANY TOOLS. This is too hard ABORT ABORT.

And along the way, I often wish I'd kept a developer log of all those obstacles I faced and overcame, both to remind me that the journey was long but worth it, and to perhaps help others that might be curious about the same problems. Plus once you're done with a project, it's exceedingly more difficult to reverse-document it than if you'd done it as you went along.

Others are way better at this than me (see YouTube)! But I find that a huge problem is just getting started. Or having a structure and place to put it. If I start off with the intent to write a blog post, sometimes I'll just give up because the details (the title, the structure, the story, the outcome, the approach) all become overwhelming: I really struggle to focus on what matters and instead default to everything at once.

So. Motivation. Logging. Stories. Blogging. What if I could avoid overwhelming myself by hiding away as many details as possible until the last possible moment? AND help motivate myself with some make-believe excitement?

## ENTER THE SPACE BIRD LOG

I've always wanted to feel like a character that logs their daily interactions and challenges, ready to be retold in an epic story later. Like Captain Picard and his ship's log, or... [Samus Aran and the intro to Super Metroid](https://youtu.be/86Z4bwdxn_Y?t=54). It would be pretty exciting to recount how I squashed these bugs, or overcame a particularly nasty typed-language situation as if I were trapsing across the galaxy in a ship, adventure to adventure!

So... I feel a tool coming on.

## Acceptance Criteria:

- must remove all choices and friction when documenting
- must log progress over time without any fiddling
- must provide external motivation by MAKING ME FEEL LIKE A SPACE HUNTER THAT WAS SAVED BY AN ANCIENT ALIEN SPACE BIRD PEOPLE FLYING THEIR SHIP THROUGH UNCHARTED SPACE

This tool would:

- open instantly via CLI: `spacebird`
- save all entries in a `spacebird.log` file in the current directory (e.g. per project)
- `spacebird.log` is mostly human readable via markdown-ish

This tool's UI would:

- [Open playing the music Samus has while logging her diary entries](https://youtu.be/86Z4bwdxn_Y?t=54).
- Probably have a GIF or shadow of Samus's helmet in the background
- Probably feel like a CRT monitor
- Provide a single box for text. No scrolling or showing of previous entries without pressing a "PREVIOUSLY, ON SPACEBIRD SHOW" button.
- The single text box is automatically `DateTime`-d when done typing.
- I can paste code into the box and format it (Github-flavored Markdown triple-backticks, probably)
- Have a readable yet on-theme font
- never let me worry about saving or where to save

## OPTIONAL YET AWESOME BONUSES (maybe mandatory???)

- Have some prompts that cycle or are randomly generated to get me in the mood: "I thought I was done with these bugs..." "I previously outflew these pirates using minimal fuel..."
- Extract the "subject" or "target" of the entry and be able to mark it as something "in universe". So if it's an entry about TypeScript generics, it would summarize or mark the entry as "Fought TypeScript Generics on 20XX, Mar-17. Escaped badly bruised."
- Allow for changing the music, theme, and log filename for those folks that are not excited by SAMUS, SPACE HEROINE OF THE GALAXY. Maybe it has a bunch of filenames it will use (`spacebird.log`, `codex.log`, etc) but puts a marker in the file so it knows it created it.

## This is Silly, Do You Really Need a Tool for This?

Maybe? Sure, you could probably use IAWriter for this. But you'd have to worry about where to save your file, what to name it, what to tag it with, a structure... And, it definitely wouldn't make you feel like you were shooting across the galaxy at point five past light speed, ready to take on the next adventure just beyond known space.