import { sha256, utf8Bytes } from "#sha256";
import { EVALUATION_HASH_VERSION } from "#types";

/**
 * A subject's bucket, 0 through 99.
 *
 * The input is frozen: the flag key is inside the hash so two flags at 10% do
 * not pick the same users, and the version segment makes the algorithm
 * versionable. Changing the input, its separators or the version reshuffles
 * everybody already bucketed, so the version constant carries the version
 * rather than being edited in place.
 */
export function bucketFor(flagKey: string, value: string): number {
  const digest = sha256(
    utf8Bytes(`${flagKey}:${EVALUATION_HASH_VERSION}:${value}`),
  );
  const view = new DataView(
    digest.buffer,
    digest.byteOffset,
    digest.byteLength,
  );

  return view.getUint32(0, false) % 100;
}
