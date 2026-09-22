export interface Page<T> {
  data: T[];
  /** Opaque; pass it back as `?cursor=` to fetch the next page. */
  nextCursor: string | null;
}
