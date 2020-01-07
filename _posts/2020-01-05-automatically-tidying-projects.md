---
layout: post
title: Automatically Tidying Projects
oneliner: Our technology provides immediate access to every artifact of our entire lives. But sometimes I just want the equivalent of a drawer to stuff things in, out of sight until needed.
type: post
projecturl: /stuff/_archiver.sh
categories:
  - Blabbering Musings
  - Tools
tags:
  - Bash
---

_tl;dr: I wrote a script that automatically moves project folders with stale files into a folder called `_Archive`. When I want to work on something, I move it out of the `_Archive`! And then don't worry about considering unfinished or in-progress projects a failure by default: they just get tidied by a friendly robo-librarian script._

Finishing projects is a continual struggle for me, but not everything deserves to be finished. Some projects are a learning experience, unoriginal, or a prototype that has served its purpose. Others I will come back to when inspiration returns anew. Some even are _done for now_ but will need constant updates as technology marches on. Projects also tend to form the basis for my distributed memory via machine: like looking at photograph, a project, in whatever state, helps me remember my life at the time. _Oh, this was when I wondered about the probability of that card game after game night!_ Our technology provides immediate access to every artifact of our entire lives. But sometimes I just want the equivalent of a technology drawer to stuff things in, out of sight until needed. It's easier to see failure in that mountain of access to the unfinished, rather than the husks of learning.

Which brings me to today.

I was considering basic data disaster prep: what happens if my laptop dies today? What would I lose? I went to check my backup settings (I use [Arq](https://www.arqbackup.com/)) for my various folders in which I keep different types of projects.

Immediately, I was overwhelmed with the task. It was probably around 300 project folders in various locations. Do I really need this stuff? Some of these things are just git clones from github... and some have unique half-finished changes! Perhaps the healthy thing would have been to delete anything I hadn't touched in a while. But even determining that would be a considerable effort! Besides, what counts as "a while"? What about those continuous projects that need touch ups from time to time?

So I came up with a compromise for myself: I would clear out obvious trash, then stash old projects into a folder so I wouldn't see them every day.

First step: I bash-looped through all the folders, checked for git repos, and deleted most anything that had a `remote` (aka preserved on a server somewhere) and didn't have any local changes. This mostly manual process probably took an hour to go through, although luckily (?) I was on hold with Verizon for various reasons so it wasn't that bad :D

Next step was to put everything into one folder. Easy!

Finally, divide the projects into "recently worked on it" and "wow this is old". [Naturally, I spent the majority of the time writing a script to do this automatically!](https://xkcd.com/1319/). While I of course fell for the trap of the automation timesink, the mental considerations actually made this worth it. Similar to being forced to [rewrite your TODO list every week](https://bulletjournal.com/blogs/bulletjournalist/migration), acknowledging the time frame within which I abandon projects was enlightening. I started with an initial list of about 165 projects. Filtering out what I'd touched in the last 30 days left me with 2 projects. I expanded it to 180 days (half a year...), and was left with about 9 projects.

It's so nice to open a folder, and only see the ~10 things you haven't finished instead of the hundreds! This probably sounds bizarre to everyone else besides me. But it was a relief!

[The resulting script](/stuff/_archiver.sh) is somewhat short but fragile, as is typical for Bash. It works by moving all project folders that contain files that have not been modified within the last 180 days to a sibling `_Archive` folder. It checks every file, minus some common exclusions (`node_modules`, `.git`, `.DS_Store`, etc.). I should probably just rewrite it in another language, but it's nice to be able to execute without needing to install dependencies. Plus that would be another project to manage the projects! And I'd likely fall into my familiar trap of premature generalization.

Once a week or so, I'll run this script, and watch as the incomplete projects become archived due to a rule I've set for myself, instead of ambiguous "failure". I could delete them, at the cost of my distributed memory. Maybe forgetting would be even better! But until then, I'm content with having to open the drawer, rather than see failure on my shelves.


Keeping My Digital Desk Clean Through Rules

Projects. I start them. I learn from them. I finish them. More often, I abandon them. Sometimes I return to them. They are typically a folder on my laptop that stares me in the face each time I try to start something new or work on something existing. _Hey! You should work on me! Don't you think I'm important anymore? Why are you choosing that other thing over ME!?_ Decision paralysis sets in, and I end up avoiding making any progress at all. It's too easy to see failure in the mere list of these projects, even the ones considered completed: they were completed with imperfections. Perfectionism sucks.

This weekend, confronted with ~300 project folders in various states, I decided to work through this problem by setting rules. I acknowledged that I would always have unfinished projects, and that I tend to work deeply on projects only to abandon them for months on end. And that is ok. Also, project artifacts tend to be a form of machine memory backup: markers of what has happened in my life. So deleting everything was out of the question.

After doing some manual trash culling (this is just a github clone! DELETE), I wrote a script to divide my projects into "recently worked on it" and "wow this is old": the equivalent of an assistant always trying to clear the clutter from my desk.

The [fragile bash script](/stuff/_archiver.sh) looks at every file in every project (minus some exclusions like `node_modules`, `.git`, `.DS_Store`, etc.), and moves any project folder with files unmodified for the last X days into an `_Archive` folder. If I want to work on a project again, I just grab it from the archive, and move it back! Just like a desk of papers or books.

Initially I set a limit of 30 days. My list of ~300 projects went down to 2! Wait, am I that unproductive? I compromised and set a limit, for now, of 180 days (~half a year). Nine folders! Even seeing this simple data point, similar to [the considerations caused by rewriting your TODO list every week](https://bulletjournal.com/blogs/bulletjournalist/migration), was enlightening. Look, it's only a few incomplete things instead of hundreds!

It's early days for the this experiment, but I already feel better. The tools I use to creatively express myself are technological. And it's amazing that technology today provides nearly immediate access to all of the artifacts of that creativity. But sometimes I'd rather have creative output in a drawer, just out of thought, rather than on my shelves, constantly reminding me of their imperfections.

