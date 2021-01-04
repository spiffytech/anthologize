import Action from "../Action";

import { create as createBullet } from "../../lib/shared/Bullet";
import { create as createItem } from "../../lib/shared/Item";
import { between as sortBetween } from "../../lib/shared/sortOrder";

import type Bullet from "../../lib/shared/Bullet";
import type Item from "../../lib/shared/Item";

export default class ItemAdder extends Action<Bullet> {
  #owner: string;
  #after: Bullet;
  #parent: string;

  constructor(
    owner: string,
    bullets: Bullet[],
    items: Map<string, Item>,
    after: Bullet,
    parent: string
  ) {
    super(bullets, items);

    this.#owner = owner;
    this.#after = after;
    this.#parent = parent;
  }

  run(): Bullet {
    const item = createItem("", this.#owner);
    this.items.set(item.id, item);

    const afterIndex = this.bullets.findIndex((b) => b.id === this.#after.id);
    const adjacentBullet = this.bullets[afterIndex + 1];

    const sortOrder = sortBetween(
      this.#after.sortOrder,
      adjacentBullet?.sortOrder ?? null
    );
    const bullet = createBullet({
      sortOrder,
      parent: this.#parent,
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
      after: this.#after.id,
      parent: this.#parent,
    };
  }
}
