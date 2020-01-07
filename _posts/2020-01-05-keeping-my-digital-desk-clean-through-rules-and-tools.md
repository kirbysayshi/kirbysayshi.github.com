---
layout: post
title: Keeping My Digital Desk Clean Through Rules and Tools
oneliner: If you set rules, the tools decide for you.
type: post
projecturl: /stuff/archiver.sh
categories:
  - Blabbering Musings
  - Tools
tags:
  - Bash
---

Projects. I start them. I learn from them. I finish them. More often, I abandon them. Sometimes I return to them. They are typically a folder on my laptop that stares me in the face each time I try to start something new or work on something existing. _Hey! You should work on me! Don't you think I'm important anymore? Why are you choosing that other thing over ME!?_ Decision paralysis sets in, and I end up avoiding making any progress at all. Plus, it's too easy to see failure in the mere list of these projects, even the ones considered completed: they were completed with imperfections. Perfectionism sucks.

This weekend, confronted with ~300 project folders in various states, I decided to work through this problem by setting rules. I acknowledged that I would always have unfinished projects, and that I tend to work deeply on projects only to abandon them for months on end. And that is ok. Also, project artifacts tend to be a form of machine memory backup: markers of what has happened in my life. So deleting everything was out of the question.

After doing some manual trash culling (_this is just a github clone! DELETE_), I wrote a script to divide my projects into "recently worked on it" and "wow this is old": the equivalent of an assistant always trying to clear the clutter from my desk.

The [fragile bash script](/stuff/archiver.sh) looks at every file in every project (minus some exclusions like `node_modules`, `.git`, `.DS_Store`, etc.), and moves any project folder with files unmodified for the last X days into an `_Archive` folder. If I want to work on a project again, I just grab it from the archive, and move it back! Just like a desk of papers or books.

Initially I set a limit of 30 days. My list of ~300 projects went down to 2! Wait, am I that unproductive? I compromised and set a limit, for now, of 180 days (~half a year). Nine folders! Even seeing this simple data point, similar to [the considerations caused by rewriting your TODO list every week](https://bulletjournal.com/blogs/bulletjournalist/migration), was enlightening. Look, it's only a few incomplete things instead of hundreds!

It's early days for this experiment, but I already feel better. The tools I use to creatively express myself are technological. And it's amazing that technology today provides nearly immediate access to all of the artifacts of that creativity. But sometimes I'd rather have creative output in a drawer, just out of thought, rather than on my shelves, constantly reminding me of their imperfections.

