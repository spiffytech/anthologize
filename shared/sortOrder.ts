import * as mudderAll from "mudder";

const mudder = mudderAll.alphabet;

export function between(after: string | null, before: string | null): string {
  return mudder.mudder(after ?? "a", before ?? "z")[0];
}
