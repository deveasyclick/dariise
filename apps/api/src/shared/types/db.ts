import type { Database } from "../../db/client.js";

export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
