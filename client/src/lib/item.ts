import * as mudderAll from "mudder";
import { customAlphabet } from "nanoid";

const mudder = mudderAll.alphabet.mudder.bind(mudderAll.alphabet);

// Similar to the base32 alphabet. Easy to say aloud over the phone (no
// capitals, symbols), no lookalike letters, no vowels and fewer leetspeak
// numbers to prevent curse words
const nanoid = customAlphabet("245689bcdfghjkmnpqrstvwxyza", 16);

export interface Item {
  id: string;
  parentId: string | null;
  sortOrder: string;
  text: string;
}

interface NewItem extends Omit<Item, "id" | "sortOrder" | "text"> {
  text?: Item["text"] | null;
}

function generateId(): string {
  const nano = nanoid();
  // Hyphenate the ID to make it easier for people to read out to each other
  return nano.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1-$2-$3-$4");
}

export function getSortOrder(previous: Item | null, next: Item | null) {
  return mudder(previous?.sortOrder ?? "", next?.sortOrder ?? "")[0];
}

export function create(
  seed: NewItem,
  previous: Item | null,
  next: Item | null
): Item {
  console.log(
    "setting sort order",
    mudder(previous?.sortOrder ?? "", next?.sortOrder ?? "")[0]
  );
  return {
    ...seed,
    id: generateId(),
    text: seed.text ?? "",
    sortOrder: getSortOrder(previous, next),
  };
}
