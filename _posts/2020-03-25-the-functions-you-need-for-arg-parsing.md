---
layout: post
title: Argument Parsing Doesn't Have to Require a Library
oneliner: Sometimes a bit of repetition is faster than grabbing the generic solution.
type: post
categories:
  - TypeScript
tags:
  - CLI
  - Tools
---

I've written quite a few command-line tools, whether for public consumption or at work. They often take the form of a script that does one thing, but then needs some flags to make it truly useful. At some point you probably want to pass a list of files to even the most basic tool you write!

Command-line argument parsing is one of those tasks that everyone will tell you is solved: just grab a library! But there's a cost to "just grab a library".

There are two core costs:

- Initial learning curve: I may know exactly what I want to get done. How does this library work, and will it satisfy what needs to be done? Does it fit into my constraints and requirements? How long will it take me to figure all of this out?
- Maintenance: the library will change and evolve, or it will die. How much effort will it take to update or replace it? 

## Obstacles I've Encountered

I've found that these two costs often completely outweigh the benefits, especially for the very specific task of parsing command line arguments. 

Some of them aren't written in TypeScript (or the types don't match the implementation), so they're not type safe, at exactly the time when you want to be sure of data structures: when dealing with user input! This is a big one.

Some of them are written in TypeScript, but due to the varied nature of argument parsing, become so complicated that you end up defining more types or structures than you actually need.

Encoding relationships between flags and commands in a generic library is really hard. An example would be two flags that are incompatible with each other. Figuring out how a library has encoded this is usually more work than just doing it manually!

Some of them try to help automate common tasks like outputting generated `--help`. This is helpful! But they often require a specific string-based format to define the arguments, description, and usage. This is usually pretty hard to make type-safe as well.

## The Bare Minimum

What I usually end up doing is just writing my own. Using an example of a music player, I've found that I basically need the same things:

The concrete shape of the parsed data, ready for the logic later:

```ts
type ParsedCLIFlags = {
  // a command to give the player
  command: "play" | "pause";

  // some sort of identifier, like a link
  track: string;

  // where to seek in seconds, to skip ahead or back up
  seek: number;
};
```

A function to output the parsed shape:

```ts
function parseCLI(): ParsedCLIFlags {
  const trackIdx = process.argv.indexOf("--track");
  if (trackIdx === -1) throw new Error("No --track passed!");
  const track = process.argv[trackIdx + 1];

  const seekIdx = process.argv.indexOf("--seek");
  const seek = seekIdx > -1 ? Number(process.argv[seekIdx + 1]) : 0;

  const command =
    process.argv.indexOf("play") > -1
      ? "play"
      : process.argv.indexOf("pause") > -1
      ? "pause"
      : undefined;
  if (command === undefined)
    throw new Error("Invalid command, expected pause or play!");

  return {
    command,
    track,
    seek
  };
}
```

Usually something to output help:

```ts
const showHelpAndExit = () => {
  console.log(`
Usage
  $ player <command> [options]
Commands
  play
  pause
Global Options
  --track [URL]                       The track to play
  --seek, -s [0.0]                    Where to start playing from.
  --help, -h                          Display this help.
Examples
  # Play a track
  $ player play --track https://www.youtube.com/watch?v=-2sVzixucQU
`);
  process.exit(1);
};
```

And then a main function:

```ts
async function run() {
  if (process.argv.indexOf("--help") > -1) {
    return showHelpAndExit();
  }

  let parsed: ParsedCLIFlags;
  try {
    parsed = parseCLI();
  } catch (e) {
    console.log(e);
    return showHelpAndExit();
  }

  // And finally, do something with `parsed`!

  switch (parsed.command) {
    case "play":
      // ...
      break;

    case "pause":
      // ...
      break;
  }
}

run();
```

## You Still Have to Answer the Same Questions

If I'd used a library for this example, I'd have to answer all of these questions, regardless:

- Deciding what logic to apply to a "command" and to a "flag".
- Which combinations are valid, which are not.
- How to handle errors? Throw? When? Return a parsed result that you have to check?
- If arguments are invalid, should I exit the process automatically? Does it output "help" when it exits?

Digging through documentation (or lack thereof) or examples for answers to all these questions weighs me down when I could instead just choose for the specific situation I need.

## Real World Example

If you want a real-world example, [check out this CLI for the NFPlayerJS I wrote very quickly when I found out the previous CLI arg library didn't quite support TypeScript after undergoing a major version bump.](https://github.com/spotify/NFPlayerJS/blob/5881a02a4e3a03dd441c4cf323395cfea4cdfc8e/src/cli.ts#L88) It has a [small utility function](https://github.com/spotify/NFPlayerJS/blob/5881a02a4e3a03dd441c4cf323395cfea4cdfc8e/src/cli.ts#L273-L308) to allow for short names, defaults, and type coercion.

An even simpler one is for a utility I wrote a few months ago called [Idier](/2020/01/05/keeping-my-digital-desk-clean-through-rules-and-tools.html). Its [CLI parsing](https://github.com/kirbysayshi/idier/blob/85aa052df6f8ead2a9d8eb7c2d29cc1df4dfd149/src/index.ts) is a [single function that handles exiting, help, and validation](https://github.com/kirbysayshi/idier/blob/85aa052df6f8ead2a9d8eb7c2d29cc1df4dfd149/src/index.ts#L16-L79).

## But It Depends

Testing is one issue I haven't addressed, and it is hard to argue that some hand-rolled code is better than open source code with excellent code coverage and used by thousands of developers.

But it depends on your use case. Sometimes, the simplicity of the code you can write (and will test anyway with integration) outweighs the cognitive overhead of "just use a library".