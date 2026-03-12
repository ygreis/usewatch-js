# usewatch-js

Minimal reactive state for modern JavaScript.

Small, framework-free state primitives for local state, shared contexts and optional cross-tab sync.

## Index

- [Overview](#overview)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Local State](#local-state)
- [Named State](#named-state)
- [createContext](#createcontext)
- [Sync Between Tabs](#sync-between-tabs)
- [API Overview](#api-overview)
- [Contributing](#contributing)
- [License](#license)

## Overview

`usewatch-js` is a small reactive state library for vanilla JavaScript and TypeScript.

- No DOM bindings
- No framework adapters
- No official React/Vue wrappers
- Small public API
- Optional `BroadcastChannel` sync for named states

This repository only contains the library. The full documentation site will live in a separate `dev-hub` project.

## Installation

<details open>
<summary><strong>npm</strong></summary>

```bash
npm install usewatch-js
```

</details>

<details>
<summary><strong>CDN global</strong></summary>

```html
<script src="https://unpkg.com/usewatch-js/dist/usewatch-js.min.js"></script>
<script>
  const count = usewatchJs.setState(0);

  usewatchJs.useWatch((state) => {
    console.log(state.value);
  }, [count]);

  count.value += 1;
</script>
```

</details>

<details>
<summary><strong>CDN ESM</strong></summary>

```html
<script type="module">
  import { setState, useWatch } from "https://unpkg.com/usewatch-js/dist/index.js";

  const count = setState(0);

  useWatch((state) => {
    console.log(state.value);
  }, [count]);

  count.value += 1;
</script>
```

</details>

## Basic Usage

```ts
import { setState, useWatch } from "usewatch-js";

const count = setState(0);

useWatch((state) => {
  console.log("count:", state.value);
}, [count]);

count.value += 1;
```

```ts
import { createContext } from "usewatch-js";

const app = createContext();
const theme = app.useState("theme", "dark");

app.useWatch((state) => {
  console.log("theme:", state.value);
}, [theme]);
```

## Local State

Use `setState(value)` for a local anonymous state.

```ts
import { setState, useWatch } from "usewatch-js";

const count = setState(0);

useWatch((state) => {
  console.log(state.value);
}, [count]);

count.value++;
```

## Named State

Use `useState(key, initialValue?)` when you want to create or recover a named state.

```ts
import { useState } from "usewatch-js";

const user = useState("user", { name: "John" });

user.value.name = "Jane";

console.log(user.value.name);
```

## createContext

Use `createContext()` to isolate a state registry and its watchers.

```ts
import { createContext } from "usewatch-js";

const app = createContext();

const count = app.setState(0);
const theme = app.useState("theme", "dark");

app.useWatch((countState, themeState) => {
  console.log(countState.value, themeState.value);
}, [count, theme]);
```

## Sync Between Tabs

Named states can synchronize between tabs with `BroadcastChannel`.

- Same origin only
- No persistence
- Good for lightweight tab-to-tab updates

```ts
import { useState } from "usewatch-js";

const theme = useState("theme", "dark", {
  syncTabs: true,
});

theme.value = "light";
```

## API Overview

- `setState`: creates a local state or creates/updates a named state when used with a key.
- `useState`: gets or creates a named state in the current context.
- `useWatch`: subscribes to one or more states and returns an unsubscribe function.
- `createContext`: creates an isolated state registry with its own `setState`, `useState` and `useWatch`.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup, workflow and contribution guidelines.

## License

MIT. See [`LICENSE.md`](./LICENSE.md).
