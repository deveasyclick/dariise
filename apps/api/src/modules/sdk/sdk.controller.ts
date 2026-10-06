import type { Context } from "hono";

import { requireApiKey, type ApiKeyEnv } from "../../middleware/api-key.js";
import type { SdkService } from "./sdk.service.js";
import { SDK_CONFIG_CACHE_CONTROL } from "./sdk.types.js";

/** `W/"abc"` and `"abc"` address the same entity, so both are accepted. */
function ifNoneMatch(header: string | undefined): string | null {
  if (!header) return null;

  return header.trim().replace(/^W\//i, "").replace(/^"|"$/g, "");
}

export class SdkController {
  constructor(private readonly service: SdkService) {}

  /** The one endpoint an SDK key may call: one environment's configuration. */
  async config(c: Context<ApiKeyEnv>): Promise<Response> {
    const access = requireApiKey(c);
    const config = await this.service.load(access);
    const etag = `"${config.version}"`;
    const headers = {
      ETag: etag,
      "Cache-Control": SDK_CONFIG_CACHE_CONTROL,
    };

    // Nothing changed since the client's last fetch, so nothing is sent. The
    // SDK keeps evaluating from the snapshot it already has.
    if (ifNoneMatch(c.req.header("if-none-match")) === config.version) {
      return c.body(null, 304, headers);
    }

    return c.json(config, 200, headers);
  }
}
