import { cp } from "node:fs/promises";

// `tsc` emits only JavaScript, so the .mjml assets have to be copied beside it
// or `node dist/server.js` boots with no templates to render.
await cp(
  new URL("../src/modules/email/templates/", import.meta.url),
  new URL("../dist/modules/email/templates/", import.meta.url),
  { recursive: true },
);
