import { customAlphabet } from "nanoid";

// Similar to the base32 alphabet. Easy to say aloud over the phone (no
// capitals, symbols), no lookalike letters, no vowels and fewer leetspeak
// numbers to prevent curse words
const alphabet = "245689bcdfghjkmnpqrstvwxyza";

export default function (length = 16) {
  const nanoid = customAlphabet(alphabet, length);
  return nanoid().replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1-$2-$3-$4");
}
