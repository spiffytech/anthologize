import { customAlphabet } from "nanoid";

// Similar to the base32 alphabet. Easy to say aloud over the phone (no
// capitals, symbols), no lookalike letters, no vowels and fewer leetspeak
// numbers to prevent curse words
const nanoid = customAlphabet("245689bcdfghjkmnpqrstvwxyza", 16);

export default class Item {
  public id: string;
  public text: string;

  static mkBlankItem(): Item {
    return new Item({ text: "" });
  }

  constructor({ text }: { text: string }) {
    this.id = nanoid().replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1-$2-$3-$4");
    this.text = text;
  }
}
