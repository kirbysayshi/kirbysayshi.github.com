---
layout: post
title: Considering, Then Abandoning JSX for Strongly-Typed YAML Configuration
oneliner: Ah! A wild string template full of logic appeared! RUN
type: post
categories:
  - TypeScript
tags:
  - YAML
  - Pokemon
  - React
  - JSX
  - DevOps
  - Dashboards
---

What follows is an exploration into strongly-typed alternatives to writing templated YAML by hand (wait, what?). If you just want the answers, skip ahead! But part of this realization is the journey, as with most things.

## YAML

YAML is a markup language that, among other things, is often used to configure build pipelines, software packaging, and service deployment. YAML likely found itself here due to its simplicity: unlike JSON, you mostly don't need to worry about escaping quotes (or typing them) and special characters.

But YAML has some shortcomings that become apparent in large documents that are expected to be human-editable. It considers whitespace significant, generally, so it's easy to lose track of structural indentation when dealing with large documents (just trust me on this). Additionally, syntax errors are easy:

```yaml
# valid
Named1:
 - Has another
 - and another

# The lack of following : is a syntax error
Named2
  - Has another
  - and another
```

It's easy to accidentally make something a literal string instead of a list:

```yaml
A list:

 # this is an structured item with two sub items
 - Named1:
   - Has another
   - and another

 # this is a single item as a literal string
 # "Named2 - Has another - and another"
 - Named2
  - Has another
  - and another
```

And finally, it's tough to know what's truly valid according to an arbitrary schema. Take a snippet from a typical [.travis.yml](https://github.com/spotify/NFPlayerJS/blob/master/.travis.yml):

```yaml
language: node_js
before_install:
- npm i -g npm@6.8
cache: npm
node_js:
- '10'
```

How is the author supposed to know which keys are valid (e.g. that `language` is a valid key)? And what about the values? Which are lists, which are properties? Which are exclusive, or which depend on other keys and values being present?

To be fair, the majority of these issues are not unique to YAML. JSON, HTML, XML, CSS, and many more declarative languages all have the common problem of requiring tooling to encode relationships and conventions beyond basic syntax. But this hits YAML especially hard because it has found its way into the DevOps world (e.g. popularity) and has some ambiguous syntax (some examples shown above) in an attempt to be as human-readable and human-authorable as possible.

I've seen these issues worked around using several methods:

1. A validation tool, script, or build process that runs after the user has authored the YAML.
1. [Extensive documentation for 1](https://docs.travis-ci.com/user/customizing-the-build).
1. A CLI wizard or prompt that walks the user through the possibilities and then generates YAML.

## But Then Someone Needs Logic

Since we're in DevOps land, have you ever seen someone do this:

{% raw  %}
```yaml
# dashboards.yml
Dashboards:
{% for board in dashboards %}
  - name: {{ board.name }}
    metric: {{ board.metric }}
    unit: {% if board.unit %} {{ board.unit }} {% else %}ms{% endif %}
    query: SELECT {{ board.metric }} as m1 FROM data.time_series WHERE timestamp > {{ page.timestamp }}
{% endfor %}
```
{% endraw  %}

And then consumed like this:

```yaml
template: dashboards.yml
Dashboards: 
- name: Response Times
  metric: response_time_ms
- name: Request Rates
  metric: request_rate_ms
```

Effectively, templated YAML.

For the user, it's not the worst (it at least cuts down on boilerplate / repetition!), but still has all of the problems stated before.

For the developer of these templates (which _might_ be the same person as the user...), it's a nightmare. You are both defining a schema and producing some YAML that must conform to some _other_ schema because presumably the final generated YAML is consumed by a system you're _not_ writing. Additionally, most code editors and tools choke, since how could they be prepared to handle the exact combination of language (YAML) and string-template syntax (in this case something like [Jinja](https://jinja.palletsprojects.com/) or [Mustache](https://mustache.github.io/))? Most editors work around this today by creating specific modes for editing HTML in PHP, for example.

Again, this is not specific to YAML: PHP generating HTML, and even my own [Vash](https://github.com/kirbysayshi/vash/) come to mind.

This example also includes some SQL-like language that requires string interpolation. So we're two string-interpolated languages deep: twice the chance for error and need for manual testing.

Likely the only way to know if you've done everything correct in a system like this is to push to a CI server, and hope for useful feedback. The tooling is often too complicated (or impossible, if it relies on remote data or a hosted system) to install locally.

## Take a Moment to Breathe

Where are we?

This hypothetical example expects...

- a developer to author plain YAML...
- that is input to a script as the model to a template...
- that outputs YAML...
- that declares a configuration for some other system.

Let's name the three portions of this process:

- User: The developer writing the YAML.
- Template: The script that expands the YAML into more YAML.
- System X: The other system that accepts declarative YAML that is expected to conform to a schema. It's the entire reason we're using YAML.

How can we make this less error-prone?

We probably cannot rewrite System X, and why would we want to? It presumably does its job really well and is configured using an interoperable and well-defined data format: YAML!

The Template is probably doing more than just expanding the template. But for now, let's assume all it does is expand the template and push it somewhere. And no one said it has to receive a template, right? If there's nothing to expand, it will just pass the YAML through! (We hope...)

That means we can have the largest impact by improving the experience of the developer while they're authoring the YAML.

## A Solution If Everything Worked as You Expected

Three things would drastically improve this experience for the developer:

- Type safety, both syntactically and schema-wise, to reduce the amount of runtime validation and testing to near zero
- Excellent real time feedback loop due to IDE / editor support without needing to write custom plugins or modes
- A configuration paradigm that is widely understood and allows for unit encapsulation

After mulling on this, something that satisfies all three is type-safe JSX written in a language like TypeScript.

- TypeScript provides the type safety, and, as we'll see later, can also provide a good amount of schema validation due to its ergonomic and expressive type system ([tuples](https://www.typescriptlang.org/docs/handbook/basic-types.html#tuple) are one example). It offers default value setting and additional logic that can be statically checked, unlike a string template language.
- TypeScript and JSX are widely supported in multiple IDEs and language servers. [It even works in a web browser via the TS Playground!](https://www.typescriptlang.org/play/)
- JSX and React-like components, if you squint and tilt your brain a little, are actually an example of a declarative configuration paradigm augmented by a programming language (in this case TypeScript). They describe a UI using data, which is then rendered by another system (a web browser). Just like YAML does in our example. Components can also be encapsulated via functions, which allows for unit testing. Encapsulation allows for creature comforts like splitting up large units into separate files (wow!) using JavaScript's well-supported ES Modules.

Our dashboard example from before, likely written by one developer and used by many many others:

```tsx
// dashboard-template.tsx in a library called "shared-templates"

type ReactResult<C> = React.ReactElement<
  Parameters<typeof C>[0],
  typeof C
>;

export Dashboards(props: { children: ReactResult<Dashboard>[] }) {
  return <>{ props.children }</>;
}

type DashProps = {
  name: string;
  metric: 'response_time_ms' | 'request_rate_ms';
  unit?: 'ms';
  timestamp: number;
}

export function Dashboard({ name, metric, unit = 'ms', timestamp }: DashProps) {
  const query = `SELECT ${metric} as m1 FROM data.time_series WHERE m1.timestamp > ${timestamp}`;
  // Pretend these JSX YAML "elements" exist already, just for now.
  return <YamlMap>
    <YamlKeyVal key="name" value={name} />
    <YamlKeyVal key="metric" value={metric} />
    <YamlKeyVal key="unit" value={unit} />
    <YamlKeyVal key="query" value={query} />
  </YamlMap>
}
```

And the user would consume it like:

```tsx
import { Page, Dashboard, Dashboards } from 'shared-templates';

// Convention would be that the default export is the primary entrypoint
// so the "renderer" doesn't need to know the name of this root component.
// "Page" would come from whatever system is rendering this thing.
export default function (props: Page) {
  return (
    <Dashboards>
      <Dashboard
        name="Response Times"
        metric="response_time_ms"
        timestamp={props.page.timestamp}
      />
      <Dashboard
        name="Request Rates"
        metric="request_rates_ms"
        timestamp={props.page.timestamp}
      />
    </Dashboards>
  )
}
```

Why is this better than YAML templates?

1. The user/developer receives immediate feedback via code-completion and ubiquitous tooling. They will receive hints that `<Dashboard />` must be a child of `<Dashboards>`, and receive compile-time errors if any properties from `<Dashboard />` are missing.
1. The various units of this template are encapsulated, and can be shared. For example, the user could `import { Dashboard } from 'our-shared-templates';` and never need to know that YAML is even involved.
1. The developer can use logic and default-setting easily and clearly.
1. No one needs to worry about preserving the final whitespace to create valid YAML, a common problem with templating languages.

Unfortunately, not everything works as we would expect! At least not yet.

JSX as TypeScript has implemented it [treats the result type of JSX as opaque](https://www.typescriptlang.org/docs/handbook/jsx.html#the-jsx-result-type). It doesn't manifest greatly in the example above, but this choice places restrictions on what can and cannot be type-checked within JSX: React `children` cannot be strongly typed. You can specify that `children` must be present, but unfortunately it simplifies, eventually, into `{} | undefined | null`.

Something like this is impossible to enforce as incorrect behavior:

```tsx
<Dashboards>
  <Dashboard name="Response Times"/>
  <Dashboard name="Request Rates" />
  {/* This "div" should be an error but will be allowed! */}
  <div />
</Dashboards>
```

See the [full example link](https://www.typescriptlang.org/play/?jsx=2#code/JYWwDg9gTgLgBAJQKYEMDG8BmUIjgIilQ3wG4AocmATzCUWJmQGcBXAGxgB4BhOJAB4wkAOwAmzOAAoAdHJRQA5swBccFCOoBtALoBKOAF4AfOs2nDDdDBnJrAUXZIQo7uThwACgpQvhUZl5jLQAGHQAadzgecmMKKlp6TxwwSUsAbyiAeiy4ABUAC2BJAH12CAgAa2YSuGYYHBFFdmo4GjoxcLgoYEUCmAB+bNyAIQBVPLgASTyAcgBlOAA5AHk8mWG4ACl5gA0ZR2dXOGK4CDAUAEdWeg0xODEIJEkRCHgwImYkKAA3ekVRN9gGgTiJMNAQCgYMAICINh4cnB5hA4K84JCYP44AB3ApQtqJAC0imoIBEKHqwMk2Pojy6+JgBXoonuwHgnwg7D+zE2MBRKAJdDg7GAlXoAAM0EV2GIiCI1FJ0gBfOAAH1RHHYargrHESEwwBESDEel0USlwBlcrUdgwLA43HaSAgmDgABEKQUAEYQBRiYI6ChK+KYXUYGEid2en1+5hSD7nVReFLMAyZDxEGCsKCRrjGdIJ1IyC1W0RKrhZOLkJWUUMicOwqPMb2+qBieMptTpVG+JBqeo9JqkOBKtNRTPZ3P5wvMGTklzlytB2th6GNuVib5SMcZpBZnPSKIeLge5sxtvMYxHjxwE-R1v3edIQz4FiQERffKgZ74SvXjzpFkABU+RMnA4LsOU2KGoodQFBAHD3F69BEPczDXL0zTPGY9yYCglptCiaC4GAlr0F6rDwGyDxPC8bwAIRwEBWQ1jeN5cGIwA-MYFacdx14VqeLaxleHh6MuQA) demonstrating the lack of red squiggles.

Until JSX via TS supports generics in `JSX.Element`, we're kind of stuck with the above. It's better than strings, but still not quite eloquent enough to warrant the investment.

## An Aside About JSX for Those That Want To Know

> Feel free to skip ahead if you already "get" how JSX transpiles and works. I dug into this in order to better investigate an ergonomic alternative to JSX, and decide whether I should hew close to JSX's transpiled output or not.

JSX, since it transpiles to function calls, executes everything in reverse (inside-out) from how a markup language would actually be parsed (outside-in). It also adjusts `children` to be within the `props`, which mandates a bit of complexity.

```tsx
const React = {
  createElement: (
    cmp: string | (() => any),
    props: {} | null,
    ...children: any[]
  ) => {
    const element = {
      cmp,
      props: props ? { ...props, children } : { children }
    };
    console.log(element);
    return element;
  }
};

function D() {
  return (
    <div>
      <p>Hello</p>
    </div>
  );
}

D();
```

`D` above is transpiled to:

```tsx
function D() {
  return React.createElement("div", null,
    React.createElement("p", null, "Hello"));
}
```

And the output:

```
{ "cmp": "p", "props": { "children": [ "Hello" ] } } 
{ "cmp": "div", "props": { "children": [ { "cmp": "p", "props": { "children": [ "Hello" ] } } ] } } 
```

I've purposefully left the types in the above examples as "open" (using `any`) as possible. Once you try to narrow them, they [get  complex and nearly circular](https://www.typescriptlang.org/play?#code/C4TwDgpgBAygwgUQDYQLYQHbADwCgpQAKUEAHsJgCYDOUA3lAMYAWAlkpQE6YBcsiKdFgDaAXSgBfKAF56TNh24Y+8ZGkzAxkgDT4ocEuSq0AFGE4B7MNT6EAlDIB8-NUOAyoZy9dsPpz1UENXGdZOj1GVDA+OABuPXMrGyJ4iXjcADMAVwxGYFYLDCZuAEMKVw08AmIyCgwaORZ2Ll4XIJFxCV0CA1rjT0SfIj8AgXUsEJNI6P1tKEHk4gAfKAwspCQ5gDodpsVWwPHNUTsVMbdsQjm4Z3CCRkLqdwWAdVZgZjgFFqLZLyS9AQAPxyHZbBZzPY-SSAqB8BhQpSSBwlWiEdL3R7uCDtdxhWHTboEebeZKvd6fb5KPRpCKPCwoLZICwAcxMOKOdniBG4wCynCKHLcqVwuAeGCeUAAShASnkPHdirLyrjcLTMjk8gUigAREwORW8-lFEyw7CUVgAN0csII2DAjgAEjjmdgAPQOs1ui3WvRctWivX+oA).

The important summary:

- JSX transpiles to Function calls
- Those Function calls output a _description_ of the Component and the props it will receive (including its `children` descriptions)
- The description(s) are walked, and the Components executed, to eventually output commands / mutations / instructions against a DOM (or another target)

We can either try to hew close to JSX's transpiled output, or go with something simpler or more ergonomic. Back to our dashboard example:

```tsx
<Dashboards>
  <Dashboard name="Response Times"/>
  <Dashboard name="Request Rates" />
</Dashboards>
```

Straight functions:

```tsx
Dashboards(
  null, // props...
  // "children" become varargs
  Dashboard({ name: 'Response Times' }),
  Dashboard({ name: 'Request Rates' }),
)
```

Straight functions with 1:1 between props & children:

```tsx
Dashboards({
  children: [
    Dashboard({ name: 'Response Times' }),
    Dashboard({ name: 'Request Rates' }),
  ]
})
```

Arrays / s-expression-like:

```tsx
[Dashboards,
  null,
  [Dashboard, { name: 'Response Times' }],
  [Dashboard, { name: 'Request Rates' }],
]
```

And there's the s-expression + varargs version too that I'll skip for now.

So there are lots of options, but none standout as amazing. How to choose? These two questions might help:

1. How will the developer specify the schema and data restrictions (e.g. what's the authoring experience like)?
1. What is the least ambiguous syntax for a human to write and read?

It also turns out that while React / JSX need the general concept of `children` due to accommodating HTML's flexibility, we probably don't need that at all: we know and are likely required to specify the exact hierarchy to comply with System X's schema.

Ok, back to solutions.

## A Solution Today

If JSX is out, then an alternative that works today is to just use functions (yay, even fewer tools and concepts!).

We have two problems to solve then:

1. What do they look like? e.g. What is the API and what syntax will we use? We want to allow the developer to specify the schema and data restrictions using the least ambiguous syntax possible.
1. How do we actually output YAML? (We skipped this problem when talking about our hopeful JSX solution...) SPOILER: We're going to cheat a bit!

Let's tackle both!

### This Definitely Works

I'm sick of `Dashboards`, let's switch to something more fun. Like Pokemon! Let's describe the restrictions:

- A "bench" can contain between 1 - 6 "Pokemon"
- A "Pokemon" has some data, like "name", "level", etc.
- A "Pokemon" can have between 1 - 4 "moves"
- A "move" has a name and some statistics, like "power".

In YAML (just the data, no rules):

```yaml
bench:
  - name: Squirtle
    level: 27
    moves:
      - name: Bubble Beam
        power: 45
      - name: Water Gun
        power: 40
  - name: Charizard
    level: 54
    moves:
      - name: Flamethrower
        power: 90
      - name: Ember
        power: 40
```

Now, let's encode the "rules":

```ts
function Bench(props: {
  pokemon: [
    ReturnType<typeof Pokemon>,
    ReturnType<typeof Pokemon>?,
    ReturnType<typeof Pokemon>?,
    ReturnType<typeof Pokemon>?,
    ReturnType<typeof Pokemon>?,
    ReturnType<typeof Pokemon>?
  ];
}) {
  return {
    bench: props.pokemon
  };
}
```

Some things to note here:

- We've encoded the 1-6 pokemon by using [TS tuple syntax](https://www.typescriptlang.org/docs/handbook/basic-types.html#tuple). The `?` allows for optional pokemon slots!
- We're using [`ReturnType`](https://www.typescriptlang.org/docs/handbook/utility-types.html#returntypet) to say "Whatever the `Pokemon` component returns" rather than some sort of `React.ElementType` or `JSX.Element` or otherwise intermediate generic representation.
- We've named the `children` explicitly as what they are, in this case `pokemon`. There's no need to have an implicit convention for `children` when we're dealing with strongly typed functions as opposed to open-ended hierarchical config (or HTML).
- We're returning just a simple JS object. I looked into building YAML directly via AST, and unfortunately hit some obstacles due to [types being out of date](https://github.com/eemeli/yaml/issues/102). Since my main mission here is type-safe config and not a JS -> YAML React Reconciler, we're going to cheat (as SPOILED above!). Turns out it's very easy to convert JSON to YAML!

These "rules" in use look like this:

```tsx
export default function render() {
  return Bench({
    pokemon: [
      Pokemon({
        name: "Squirtle",
        level: 45,
        moves: [
          Move({ name: "Bubble Beam" }),
        ]
      })
    ]
  });
}
```

Note that the `Move` component does not specify the `power` value, since that is now handled via an exhaustive union! Additionally we've encoded all valid names and tied them to their statistics (obviously if this were a full Pokemon game we'd have a _lot_ more moves!).

```tsx
function Move(props: {
  name: "Bubble Beam" | "Water Gun" | "Flamethrower" | "Ember";
}) {
  switch (props.name) {
    case "Bubble Beam": {
      return { ...props, power: 45 };
    }

    case "Ember": {
      return { ...props, power: 40 };
    }

    case "Flamethrower": {
      return { ...props, power: 90 };
    }

    case "Water Gun": {
      return { ...props, power: 40 };
    }

    default: {
      const _n: never = props.name;
      _n;
    }
  }
}
```

Checkout the [the full example](https://www.typescriptlang.org/play/#code/GYVwdgxgLglg9mABAIQKaQBYAoAOAnOHAZwC5EBvAKEURzgGtUBbBMgbWpsQCVUoQ8YACoBPHKgA8UMajjBEABQbMEAPgA0nGr36DR4qTLmLlLMKoD8mrjz4DhMw+ONLGZy9a477+ydOfyrirmVlq2ug4G-rKBpmqhNt56jtEucSGcALoA3JQAvgCUFJx4doLFNgBG6BAYZPiERAB0dG4InHm5eZSUoJCwCCZtYLgExGRUNGAAhkyoZABEAMoAjiAweFAANqgLiAA+iAsAwhjTeDAAXucAJgu5NDsAbqhbZGAgTNV4D4gsL6REBxEmVIn4jPIALJwF4eMJJMFOGKIaGwhJeUG+JHGVGoOEgiJY1JQmF4ixZLpFSaIUoRCpcJqMhrEDpdHp9aDwJC40aNCacGZzRbIECVSo7FCoWZ7Q4LADq0ygqDwiAA4uAZUcAGJbWZ8DAEADuys1CwAol8TZT6URDTAoLVELziE1BagqWEINMiKgjiKxRK0NL+TYaLT7BREIyWmMiOpaHBjXgyAAWACsiE6YW6nu9vvNlrwCxDofD5XIUaZsfjdCTqYADJnfjQczYvT7tbq5lADYmTSWbGWkBXo8y4wm64gAJyNrM2Vtcdv5hVKlXqsDF+mD0GR0fVifKhtN7M9Gw3VDAaYgLZQAeLhBEKCIAD6YHeqBeKoAvLRY669c2XBDi+YCAd0Lb5D0qAAB50JsiDnpe15PhyAwjGOEyFPSwFoJgWDUjQrTBOwYQ0EEZj4aRXBuosqzrJsOwLJ4oaIM8rxkAATAA7Mxob-KggLAixXA8hWNF+qK4q+kGTB7IUvEsaJiDifKirKmqGqZgUClcJkVHyVR5EIJRwnKXqiynOcVy3ExVGPB+7GIGmKY6TQ-GCXZImkvhZlCp2eo9kaJpaa5XkvD5KkWt8cnaZ5eksYUYTxVpXRAA). Don't worry, it's short.

And of course, if we put something where it doesn't belong, we get errors.

```tsx
export default function render() {
  return Bench({
    pokemon: [
      Pokemon({
        name: "Squirtle",
        level: 45,
        moves: [
          Move({ name: "Bubble Beam" }),
          // Type '"Charizard"' is not assignable to type
          // '"Bubble Beam" | "Water Gun" | "Flamethrower" | "Ember"'.ts(2322)
          Pokemon({
            name: "Charizard",
            level: 55,
            moves: [Move({ name: "Flamethrower" })]
          })
        ]
      })
    ]
  });
}
```

Unfortunately those errors are not as helpful as we'd like. Since TypeScript is structurally-typed, it's comparing properties and their values. The first one it finds not matching is `name`, and then complains that the literals do not match (`"Charizard"` vs `Move` names).

Before we move on though, just to prove that this works:

```tsx
export default function render() {
  return Bench({
    pokemon: [
      Pokemon({
        name: "Squirtle",
        level: 27,
        moves: [
          Move({ name: "Bubble Beam" }),
          Move({ name: "Water Gun" }),
        ]
      }),
      Pokemon({
        name: "Charizard",
        level: 54,
        moves: [
          Move({ name: "Flamethrower" }),
          Move({ name: "Ember" }),
        ]
      })
    ]
  });
}

import yaml from 'js-yaml';
const rendered = yaml.safeDump(render())
const expected = '' +
`bench:
  - name: Squirtle
    level: 27
    moves:
      - name: Bubble Beam
        power: 45
      - name: Water Gun
        power: 40
  - name: Charizard
    level: 54
    moves:
      - name: Flamethrower
        power: 90
      - name: Ember
        power: 40
`

console.log(rendered === expected); // true!
console.log(rendered)
console.log(expected)
```

### More Easily-Read Errors

If we want better developer errors, we have to move towards an even _more_ declarative syntax, at the cost of worse authoring ergonomics and greater type complexity (just look at the [full type declarations for React](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6bd457dec0fde7ac2b89b3b0dfca23b8e9eb9185/types/react/index.d.ts#L102) or the example [`React.createElement` in the playground above](https://www.typescriptlang.org/play?#code/C4TwDgpgBAygwgUQDYQLYQHbADwCgpQAKUEAHsJgCYDOUA3lAMYAWAlkpQE6YBcsiKdFgDaAXSgBfKAF56TNh24Y+8ZGkzAxkgDT4ocEuSq0AFGE4B7MNT6EAlDIB8-NUOAyoZy9dsPpz1UENXGdZOj1GVDA+OABuPXMrGyJ4iXjcADMAVwxGYFYLDCZuAEMKVw08AmIyCgwaORZ2Ll4XIJFxCV0CA1rjT0SfIj8AgXUsEJNI6P1tKEHk4gAfKAwspCQ5gDodpsVWwPHNUTsVMbdsQjm4Z3CCRkLqdwWAdVZgZjgFFqLZLyS9AQAPxyHZbBZzPY-SSAqB8BhQpSSBwlWiEdL3R7uCDtdxhWHTboEebeZKvd6fb5KPRpCKPCwoLZICwAcxMOKOdniBG4wCynCKHLcqVwuAeGCeUAAShASnkPHdirLyrjcLTMjk8gUigAREwORW8-lFEyw7CUVgAN0csII2DAjgAEjjmdgAPQOs1ui3WvRctWivX+oA)). Our functions need to return something that cannot be structurally-matched by TS so it gives a very clear and concise error. We'd also need to create an intermediate function rather than outputting structures directly by our "components". [And, we'd have to write a much more complex renderer to then walk the declarative structure and convert it to JSON / YAML. I tried, and it's not even type safe!](https://www.typescriptlang.org/play?#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-xgSkL+HENiCx4L2F5D8MID2-slnkz+ds7Qwi8VXMGcYuYFhA7x21AoLQxKVnNI2AAQn2Y-IqqNIC4C4E4OllS8gzI2EIdhGBNC-E8LiSAkgomZKfvePx4gDAOTFRgAA1MqyFULoXMPYU-PZLjWVDzEBYDAVgeX0paTqkFChMyGhOAeAylRECmsqVoyR0jtDqCfssjVwFvWLAEOs-5GxAWu2BaCxSSyKkaphb4+FQSkViBRVZFhGKyBYvjjir1UKCXUwOOYMoChrBOtCKS24FKL5ZPQtSimRbA1xGZXqmV4gTicrwNy95Ky+XojiIK8VChRXislSyxtYg5WGEVbiVV6qNVhC1bXI0Cgh1svEEak17arkMv3EVUN2QiFZhKDOiQ+hcI1tEeI11jB1ACA9UVTNfyfVQpEmsjZa72YlvJZSytmhg3HpfW8u9a6W1tpWcBd53BqnIXXtxBp+LmGwr8QEuNbAE30U6JbXFa6CWwXyjyjdvSOldJ6e0-pb6JDFHPLEoZcxDlZC0KbLQt69obvrdKpd9cOUxFbTyztAqrS9sgP24Vg6G2sdHQq+ASrJ2RquQSi1UqDnDpXU6jdFqQU7oNLGW1bp7U-o1S6thmJr3NgYwBADHGgOVJA1s8DfFulKWg9J2DMaEOIqQ4m2z6GYP8PYTmhxVbC1rtw0RgjeHiMUbJaR8jP9wuMGo7R7txna3Mfk6x5tZmuP8u7bx4VfalUSrk-quuonx0qrVVJrZs7ZOLoNYp39ymt2WrU9GG1B7tOOt-XpqRF6KaGaiAl+9KzAPEss3te9wkGAEvwfkzQk2BBcJiLM+8lCeHRrhQhmby3HOrcCQAKTYgAeSaJsOkBhmn9Jm0422yFQhLJ4apMAtBNLIA0alByTkHLIBo-icKkV2QsBmew177DPvrHe6gXypkUBxWgAlZ77pFvcIqVA904MsoBm3teHG204jAxPl7NiABHLIGAcCMCENbTOHgABMAB2TB7yO7Y97u+FA39Z4agRtnL+FG-6u0Z8AjUvxEbFHDvTlWjPceoFZ7-SnHO7Zc+QfPPnadICU8F+AkXKyHhwD25AAAYgAVVgPr9gfBIBsT4GgXXHgADiE8AASjLIDDCUusZx7C5TulAloPA4xGV+8dwAdTt2BEPoew-h-eZjt04uSaoBII5PQAAvAgFBydyhzQAFgAKx07+QznHseWfc-Z5g+Xs9FfA352r4Xd889i4L33SX3OZel5VlLnnuEleVxV9XjXlTjjXj75AF+zcgA)

So it's probably not worth it. But if you have a better idea, try it and let's talk! I probably just missed something.

## Summary

You can strongly-type, compile-time validate, and add logic to YAML (or any data format, really) by using TypeScript to generate YAML-compatible JSON structures.

Back to our original example, converted to this paradigm:

```ts
function Dashboards(props: { dashboards: ReturnType<typeof Dashboard>[] }) {
  return { Dashboards: props.dashboards };
}

function Dashboard(props: {
  name: string;
  metric: "response_time_ms" | "request_rate_ms";
  timestamp: number;
  unit?: string;
}) {
  const unit = props.unit || "ms";
  return {
    ...props,
    unit,
    query: `SELECT ${props.metric} as m1 FROM data.time_series WHERE timestamp > ${props.timestamp}`
  };
}

function render({ timestamp }: { timestamp: number }) {
  return Dashboards({
    dashboards: [
      Dashboard({
        name: "Response Times",
        metric: "response_time_ms",
        timestamp
      }),
      Dashboard({ name: "Request Rates", metric: "request_rate_ms", timestamp })
    ]
  });
}

import yaml from "js-yaml";
const rendered = yaml.safeDump(render({ timestamp: Date.now() }));

console.log(rendered);
```

We get some great YAML!

```yaml
Dashboards:
  - name: Response Times
    metric: response_time_ms
    timestamp: 1584927255103
    unit: ms
    query: >-
      SELECT response_time_ms as m1 FROM data.time_series WHERE timestamp >
      1584927255103
  - name: Request Rates
    metric: request_rate_ms
    timestamp: 1584927255103
    unit: ms
    query: >-
      SELECT request_rate_ms as m1 FROM data.time_series WHERE timestamp >
      1584927255103
```

And, it was completely type safe, using the built-in capabilities and paradigms of TypeScript, with excellent authoring experience, and we could even write unit tests if we wanted.

Thanks for making it this far on this extremely long post! If you have better ideas, or just thoughts in general, please let me know. This post took weeks of on and off thinking and tinkering, as I learned about the limitations of JSX via TS and how the React typings work. I am also [not the first to consider the shortcomings of YAML at scale](https://github.com/dvdsgl/ts-yaml). 

> Special thanks to Jose Falcon for providing feedback on this post.
