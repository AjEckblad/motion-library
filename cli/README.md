# motion-library

Hand-made web animations: springs, page transitions, text, scroll, particles, fluids, chrome and shaders. Each one is a single plain-JavaScript file with no dependencies, and comes with notes on why it feels right.

```sh
npx motion-library add confetti --pieces 300 --gravity 0.6
```

That writes `src/animations/confetti.js` (or `animations/confetti.js` if you have no `src` folder) with your settings in its `PARAMS` line.

## Use it

Every animation's default export draws into a container, sizes itself to it, and returns a cleanup function.

```js
import confetti from './animations/confetti.js';

const stop = confetti(document.querySelector('#hero')); // give the container a size
// later, e.g. when a component unmounts:
stop();
```

In React that's a `useEffect` that returns `stop`; in Vue, `onMounted` and `onUnmounted`; in a web component, `connectedCallback` and `disconnectedCallback`.

## Commands

| Command | What it does |
|---|---|
| `npx motion-library list [category]` | All animations, or one category |
| `npx motion-library info <id>` | What it does, how it works, the settings you can tune |
| `npx motion-library add <id> [--setting value]` | Copy it into your project, tuned. `--dir` picks the folder, `--html` writes a standalone page, `--force` overwrites |
| `npx motion-library prompt <id>` | A prompt for an AI coding assistant to fit it into your project |

Settings are checked against each animation's range: unknown names are ignored, and values outside the range are clamped (you'll see a note when that happens).

## Licence

MIT-0. Use it in anything, including paid work, change it freely, no credit needed.
