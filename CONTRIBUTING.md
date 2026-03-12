# Contributing

Thanks for contributing to `usewatch-js`.

This project is intentionally small. Changes should keep the library readable, low-coupling and easy to maintain.

## Principles

- Keep the API small and predictable
- Prefer simple code over clever abstractions
- Avoid overengineering
- Do not add DOM bindings
- Do not add framework adapters or official framework integrations
- Keep browser and npm usage straightforward

## Local setup

```bash
git clone https://github.com/ygreis/usewatch-js.git
cd usewatch-js
npm install
```

## Development commands

```bash
npm run build
npm run lint
npm run test:run
```

What they do:

- `npm run build`: builds the npm entry, generates `.d.ts` files and the CDN bundle
- `npm run lint`: runs ESLint
- `npm run test:run`: runs the unit test suite once

## Commit style

This repository uses Conventional Commits and automatic releases through `semantic-release`.

Examples:

- `feat: add context sync option`
- `fix: avoid duplicate watcher notifications`
- `docs: clarify named state usage`
- `test: cover deep mutations`

Use clear commit messages so release automation can determine version bumps correctly.

## Pull requests

Before opening a PR:

- make sure `npm run lint` passes
- make sure `npm run test:run` passes
- make sure `npm run build` passes
- keep the change focused
- update tests when behavior changes
- update README only when it improves the practical introduction to the library

When opening a PR:

- describe the problem clearly
- explain the chosen approach
- mention tradeoffs if the change affects API or behavior

## Issues

Open an issue when you find a bug, want to discuss an API change, or want feedback before implementing something larger.

For proposals, include:

- the problem being solved
- the expected API shape
- why the change fits the project goals

## Scope reminder

`usewatch-js` should remain:

- small
- legible
- framework-free
- DOM-free
- practical for vanilla JavaScript and TypeScript

If a change pushes the project away from that, it probably belongs in another repository.
