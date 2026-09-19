/**
 * The same visual language as the viewer: cool paper, ink, monospace citations,
 * and a signature that looks like one. The app lives inside the Sanity Dashboard,
 * so it stays quiet and lets the dashboard chrome frame it.
 */
export const styles = `
:root {
  --paper: #eceff3;
  --paper-sunk: #e3e7ed;
  --ink: #12161c;
  --ink-soft: #4a5464;
  --rule: #c3cad4;
  --floor: #14504a;
  --ceiling: #8c2f39;
  --open: #9a6410;
}

@media (prefers-color-scheme: dark) {
  :root {
    --paper: #141821;
    --paper-sunk: #1b202b;
    --ink: #e7eaef;
    --ink-soft: #97a1b2;
    --rule: #2f3846;
    --floor: #5fbfae;
    --ceiling: #e08a92;
    --open: #d8a23f;
  }
}

* { box-sizing: border-box; }

html, body, #root {
  width: 100%;
  min-height: 100%;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font: 16px/1.55 ui-serif, Georgia, serif;
}

main { max-width: 46rem; margin-inline: auto; padding: 2rem 1rem 5rem; }

h1 { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 1.6rem; margin: 0 0 .5rem; letter-spacing: -.01em; }
h2 { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 1.15rem; margin: .2rem 0 1rem; line-height: 1.3; }

.lede, .muted, .empty, footer { color: var(--ink-soft); }
.lede { margin: 0 0 .75rem; }
.empty { border: 1px dashed var(--rule); padding: 1.25rem; }

.rule-note {
  border-left: 3px solid var(--open);
  background: var(--paper-sunk);
  padding: .75rem 1rem;
  margin: 0 0 2rem;
  font-size: .9375rem;
  color: var(--ink-soft);
}

.eyebrow {
  font-family: ui-monospace, monospace; font-size: .6875rem; letter-spacing: .1em;
  text-transform: uppercase; color: var(--ink-soft); margin: 0 0 .35rem;
}

article { border: 1px solid var(--rule); border-left: 3px solid var(--open); background: var(--paper-sunk); padding: 1.25rem 1.5rem; margin-bottom: 2rem; }

.sides { display: grid; gap: 1rem; margin-bottom: 1rem; }
@media (min-width: 40rem) { .sides { grid-template-columns: 1fr 1fr; } }
.side { border-top: 1px solid var(--rule); padding-top: .6rem; }
.cite { font-family: ui-monospace, monospace; font-size: .8125rem; margin: 0 0 .2rem; }
.cite a { color: inherit; }
.heading { font-size: .875rem; color: var(--ink-soft); margin: 0 0 .4rem; }
blockquote { margin: 0; font-size: .9375rem; color: var(--ink-soft); }

.history { list-style: none; padding: 0; margin: 0 0 1.25rem; font-size: .8125rem; color: var(--ink-soft); font-family: ui-monospace, monospace; }
.history li { padding: .2rem 0; border-top: 1px dotted var(--rule); }
.history .when { color: var(--ink); }
.history .note { display: block; font-family: ui-serif, Georgia, serif; }

form { display: grid; gap: 1rem; border-top: 1px solid var(--rule); padding-top: 1.25rem; }
label { display: grid; gap: .35rem; }
label > span { font-size: .8125rem; color: var(--ink-soft); }

select, textarea, input {
  font: inherit; color: var(--ink); background: var(--paper);
  border: 1px solid var(--rule); border-radius: 0; padding: .5rem .6rem; width: 100%;
}
textarea { resize: vertical; }

/* The signature line is a line, not a box. */
.sign input {
  border: 0; border-bottom: 1px solid var(--ink); background: transparent;
  font-family: ui-serif, Georgia, serif; font-style: italic; font-size: 1.15rem;
  padding: .3rem .1rem;
}

button {
  justify-self: start; font: inherit; font-family: ui-sans-serif, system-ui, sans-serif;
  background: var(--ink); color: var(--paper); border: 0; padding: .6rem 1.1rem; cursor: pointer;
}
button:disabled { opacity: .4; cursor: not-allowed; }
button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
  outline: 2px solid var(--ink); outline-offset: 2px;
}

.hint, .error { font-size: .8125rem; margin: 0; }
.hint { color: var(--ink-soft); }
.error { color: var(--ceiling); }

footer { border-top: 1px solid var(--rule); padding-top: 1rem; font-size: .8125rem; }
code { font-family: ui-monospace, monospace; font-size: .9em; }
`
