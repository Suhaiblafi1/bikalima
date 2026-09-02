/**
 * `vite-imagetools` import queries.
 *
 * `vite/client` declares `*.jpg` and friends, but a specifier carrying a query
 * (`photo.jpg?w=400;800&format=webp&as=srcset`) does not match that pattern —
 * TypeScript matches the whole specifier, query included. These declarations
 * cover the two shapes used in this app; anything else stays an error on
 * purpose, so a typo in a query is caught at build time rather than becoming
 * an `any` that ships a broken `srcset`.
 */

declare module "*&as=srcset" {
  /** Candidate URLs with `w` descriptors, ready for a `srcset` attribute. */
  const srcset: string;
  export default srcset;
}

declare module "*&as=metadata" {
  const metadata: { src: string; width: number; height: number; format: string };
  export default metadata;
}
