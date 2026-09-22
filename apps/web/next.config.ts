import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// Load `apps/web/.env` explicitly, before the build inlines `NEXT_PUBLIC_*`.
// This runs in Node only, so the client bundle never sees dotenv. Next compiles
// this file to CommonJS, which is why `__dirname` is available here.
loadEnv({ path: resolve(__dirname, ".env"), quiet: true });

const nextConfig: NextConfig = {};

export default nextConfig;
