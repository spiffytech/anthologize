import Action from "../Action";

import { create as createBullet } from "../../shared/Bullet";
import { create as createItem } from "../../shared/Item";
import { between as sortBetween } from "../../shared/sortOrder";

import type Bullet from "../../shared/Bullet";
import type Item from "../../shared/Item";

export default class ItemAdder extends Action<Bullet> {
  #owner: string;
  #after: Bullet;
  #indent: number;

  constructor(
    owner: string,
    bullets: Bullet[],
    items: Map<string, Item>,
    after: Bullet,
    indent: number
  ) {
    super(bullets, items);

    if (indent < 0) {
      throw new Error("Indent must be positive");
    }
    if (indent > after.indent + 1) {
      throw new Error("Cannot indent more than one space at a time");
    }

    this.#owner = owner;
    this.#after = after;
    this.#indent = indent;
  }

  run(): Bullet {
    const item = createItem("", this.#owner);
    this.items.set(item.id, item);

    const afterIndex = this.bullets.findIndex(
      (b) => b.bulletKey === this.#after.bulletKey
    );
    const adjacentBullet = this.bullets[afterIndex + 1];

    const sortOrder = sortBetween(
      this.#after.sortOrder,
      adjacentBullet?.sortOrder ?? null
    );
    const bullet = createBullet({
      sortOrder,
      indent: this.#indent,
      itemId: item.id,
      ownerEmail: this.#owner,
    });

    this.bullets.splice(0, 0, bullet);
    this.bullets.sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));

    return bullet;
  }

  serialize() {
    return {
      action: "addItem",
      after: this.#after.bulletKey,
      indent: this.#indent,
    };
  }
}
