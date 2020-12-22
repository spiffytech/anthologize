import * as mudderAll from "mudder";

const mudder = mudderAll.alphabet;

export default class Sorter {
  placeBetween(after: string | null, before: string | null): string {
    console.log("Placing between", after, before);
    return mudder.mudder(after ?? "a", before ?? "z")[0];
  }
}
