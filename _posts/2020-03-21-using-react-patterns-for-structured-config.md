---
layout: post
title: Considering, Then Abandoning React for Structured Configuration YAML
oneliner: Ah! A wild string template full of logic appeared! RUN
type: post
categories:
  - TypeScript
tags:
  - YAML
  - Pokemon
---

What follows is an exploration into strongly-typed alternatives to writing YAML by hand. If you just want the answers, skip ahead. But part of this realization is the journey, as with most things.

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

```
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
1. Extensive documentation for 1.
1. A CLI wizard or prompt that walks the user through the possibilities and then generates YAML.

## But Then Someone Needs Logic

Have you ever seen someone do something like this:

```yaml
Dashboards:
{% for board in dashboards %}
  - name: {{ board.name }}
    metric: {{ board.metric }}
    unit: {% if board.unit %} {{ board.unit }} {% else %}ms{% endif %}
    query: SELECT {{ board.metric }} as m1 FROM data.time_series WHERE timestamp > {{ page.timestamp }}
{% endfor %}
```

And then described like this:

```yaml
template: dashboards.yml
Dashboards: 
- name: Response Times
  metric: response_time_ms
- name: Request Rates
  metric: request_rate_ms
```

Effectively, templated YAML.

For the user, it's not the worst, but still has all of the problems stated before.

For the developer of these templates (which _might_ be the same person as the user...), it's a nightmare. You are both defining a schema and producing some YAML that must conform to some _other_ schema because presumably the final generated YAML is consumed by a system you're not also writing. Additionally, most code editors and tools choke, since how could they be prepared to handle the exact combination of language (YAML) and string-template syntax (in this case something like [Jinja](https://jinja.palletsprojects.com/) or [Mustache](https://mustache.github.io/))? Most editors work around this today by creating specific modes for editing HTML in PHP, for example.

Again, this is not specific to YAML: PHP generating HTML, and even my own [Vash](https://github.com/kirbysayshi/vash/) come to mind.

This example also includes some SQL-like language that also requires string interpolation. So we're two string-interpolated languages deep: twice the chance for error and need for manual testing.

## A Solution in a Perfect World

What if we could have:

- type-safety, both syntactically and schema-wise
- integration with a majority of code editors and IDEs without writing custom plugins or new syntax extensions

In a perfect world, the solution is, actually, type-safe JSX written in a language like TypeScript.

Our dashboard example from before:

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
  return (<Dashboards>
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

Why is this better?

1. The user/developer receives code-completion and type safety. They will receive hints that `<Dashboard />` must be a child of `<Dashboards>`, and receive compile-time errors if any properties from `<Dashboard />` are missing.
1. The user/developer can consume templates from someone else without using strings. For example, the user could `import { Dashboard } from 'our-shared-templates';` and never need to know that YAML is even involved.
1. The developer can use logic and default-setting easily and clearly.
1. No on needs to worry about preserving the final whitespace of YAML, a common problem with intermediate templating languages.

Unfortunately, we don't live in a perfect world, yet. JSX as TypeScript has implemented it [treats the result type of JSX as opaque](https://www.typescriptlang.org/docs/handbook/jsx.html#the-jsx-result-type). It doesn't manifest greatly in the example above, but this choice places restrictions on what can and cannot be type-checked within JSX: React `children` cannot be strongly typed. You can specify that `children` must be present, but unfortunately it simplies, eventually, into something like `{} | undefined | null`.

Something like this is impossible to enforce:

```tsx
<Dashboards>
  <Dashboard name="Response Times"/>
  <Dashboard name="Request Rates" />
  {/* This "div" should be an error but will be allowed! */}
  <div />
</Dashboards>
```

[Full Example Link](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAJQKYEMDG8BmUIjgIilQ3wG4AocmATzCUWJmQGcBXAGxgB4BhOJAB4wkAOwAmzOAAoAdHJRQA5swBccFCOoBtALoBKOAF4AfOs2nDDdDBnJrAUXZIQo7uThwACgpQvhUZl5jLQAGHQAadzgecmMKKlp6TxwwSUsAbyiAeiy4ABUAC2BJAH12CAgAa2YSuGYYHBFFdmo4GjoxcLgoYEUCmAB+bNyAIQBVPLgASTyAcgBlOAA5AHk8mWG4ACl5gA0ZR2dXOGK4CDAUAEdWeg0xODEIJEkRCHgwImYkKAA3ekVRN9gGgTiJMNAQCgYMAICINh4cnB5hA4K84JCYP44AB3ApQtqJAC0imoIBEKHqwMk2Pojy6+JgBXoonuwHgnwg7D+zE2MBRKAJdDg7GAlXoAAM0EV2GIiCI1FJ0gBfOAAH1RHHYargrHESEwwBESDEel0USlwBlcrUdgwLA43HaSAgmDgABEKQUAEYQBRiYI6ChK+KYXUYGEid2en1+5hSD7nVReFLMAyZDxEGCsKCRrjGdIJ1IyC1W0RKrhZOLkJWUUMicOwqPMb2+qBieMptTpVG+JBqeo9JqkOBKtNRTPZ3P5wvMGTklzlytB2th6GNuVib5SMcZpBZnPSKIeLge5sxtvMYxHjxwE-R1v3edIQz4FiQERffKgZ74SvXjzpFkABU+RMnA4LsOU2KGoodQFBAHD3F69BEPczDXL0zTPGY9yYCglptCiaC4GAlr0F6rDwGyDxPC8bwAIRwEBWQ1jeN5cGIwA-MYFacdx14VqeLaxleHh6MuQA).

Until JSX via TS supports generics in `JSX.Element`, we're kind of stuck with "better than strings" but still not quite eloquent enough.

## A Solution Today

An alternative that works today is to just use functions, and avoid JSX completely.

We have two problems to solve then:

1. What do they look like? e.g. What is the API and what syntax will we use?
1. How do we actually output YAML? (We skipped this problem when talking about JSX...): SPOILERS! We're going to cheat a bit (later).

### Syntax

Assuming we stick to something close to the transpiled output of JSX, we have a few options. None are amazing.

But first, some background. JSX, since it transpiles to function calls, calls everything in reverse (inside-out) from how a markup language would actually be parsed (outside-in). It also adjusts `children` to be within the `props`, which mandates a bit of complexity.

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
- The description(s) are walked to eventually output a DOM (or another target)

We can either try to hew close to JSX's transpiled output, or go with something simpler or more ergonomic. First, back to our dashboard example:

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

But really, it comes down to two more important questions:

1. How will the developer specify the schema and data restrictions (e.g. what's the authoring experience like)?
1. What is the least ambiguous syntax for a human to write and read?

### Authoring Syntax

I'm sick of `Dashboards`, let's switch to something more fun. Like Pokemon! Let's describe the restrictions:

- A "bench" can contain between 1 - 6 "Pokemon"
- A "Pokemon" has some data, like "name", "level", etc.
- A "Pokemon" can have between 1 - 4 "moves"
- A "move" has some statistics, like "power".

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

- We've encoded the 1-6 pokemon by using [TS tuple syntax](https://www.typescriptlang.org/docs/handbook/basic-types.html#tuple).
- We're using `ReturnType` to say "Whatever the `Pokemon` component returns" rather than some sort of `React.ElementType` or `JSX.Element` or otherwise intermediate generic representation.
- We've named the `children` explicitly as what they are, in this case `pokemon`. There's no need to have an implcit convention for `children` when we're dealing with strongly typed objects.
- We're returning just a simple JS object. This is because we're actually going to cheat when it comes to YAML. It's much easier to convert from JSON-like to YAML than to manually build a YAML AST. I looked into using building YAML directly, and unfortunately hit some obstacles due to [types being out of date](https://github.com/eemeli/yaml/issues/102). Since my main mission here is type-safe config and not a JS -> YAML React Reconciler, we'll just cheat a bit. 

What usage looks like:

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

[The full example](https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABAIQKaQBYAoAOAnOHAZwC5EBvAKEURzgGtUBbBMgbWpsQCVUoQ8YACoBPHKgA8UMajjBEABQbMEAPgA0nGr36DR4qTLmLlLMKoD8mrjz4DhMw+ONLGZy9a477+ydOfyrirmVlq2ug4G-rKBpmqhNt56jtEucSGcALoA3JQAvgCUFJx4doLFNgBG6BAYZPiERAB0dG4InHm5eZSUoJCwCCZtYLgExGRUNGAAhkyoZABEAMoAjiAweFAANqgLiAA+iAsAwhjTeDAAXucAJgu5NDsAbqhbZGAgTNV4D4gsL6REBxEmVIn4jPIALJwF4eMJJMFOGKIaGwhJeUG+JHGVGoOEgiJY1JQmF4ixZLpFSaIUoRCpcJqMhrEDpdHp9aDwJC40aNCacGZzRbIECVSo7FCoWZ7Q4LADq0ygqDwiAA4uAZUcAGJbWZ8DAEADuys1CwAol8TZT6URDTAoLVELziE1BagqWEINMiKgjiKxRK0NL+TYaLT7BREIyWmMiOpaHBjXgyAAWACsiE6YW6nu9vvNlrwCxDofD5XIUaZsfjdCTqYADJnfjQczYvT7tbq5lADYmTSWbGWkBXo8y4wm64gAJyNrM2Vtcdv5hVKlXqsDF+mD0GR0fVifKhtN7M9Gw3VDAaYgLZQAeLhBEKCIAD6YHeqBeKoAvLRY669c2XCvoB3QtvkPSoAAHnQmyIOel7Xk+HIDCMY4TIU9JDpKmBYNSNCtME7BhDQQRmLhxFcG6iyrOsmw7AsnihogzyvGQABMADsjGhv8qCAsCTFcDyFZUX6orir6QZMHshTcUxwmIKJ8qKsqaoapmBRyVwmQUbJFGkQg5GCYpeqLKc5xXLcDEUY8H6sYgaYplpNC8fxNlCaSuEmUKnZ6j2RomhpzkeS8XlKRa3wyZp7k6UxhRhLFGldEAA).

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
          // Type '"Squirtle"' is not assignable to type
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

If we want better developer errors, we have to move towards an even _more_ declarative syntax, at the cost of worse authoring ergonomics and greater type complexity (just look at the [full type declarations for React](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6bd457dec0fde7ac2b89b3b0dfca23b8e9eb9185/types/react/index.d.ts#L102) or the example `React.createElement` in the playground above). Our functions need to return something that cannot be structurally-matched by TS so it gives a very clear and concise error. We'd also need to create an intermediate function rather than outputting structures directly by our "components". And, we'd have to write a much more complex renderer to then walk the declarative structure and convert it to JSON / YAML.

So it's probably not worth it. But if you have a better idea, try it and let's talk! I probably just missed something.

## Summary

You can strongly-type, compile-time validate, and add logic to YAML by using TypeScript to generate YAML-compatible JSON structures.

Back to our original example. If we convert it to this paradigm:

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

Thanks for making it this far on this extremely long post! If you have better ideas, or just thoughts in general, please let me know. This post took weeks of on and off thinking and tinkering, as I learned about the limitations of JSX via TS and how the React typings work.