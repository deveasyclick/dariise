import "dotenv/config";

import type { z } from "zod";

import { ConfigSchema } from "./schema.js";

export type Config = z.infer<typeof ConfigSchema>;

const parsed = ConfigSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${details}`);
}

const env: Config = parsed.data;

const environment = env.nodeEnv;
const isProduction = environment === "production";

export { env, environment, isProduction };
