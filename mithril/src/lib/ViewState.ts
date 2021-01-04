import Debug from "debug";

import { addToTree, create as createBullet } from "../lib/shared/Bullet";
import { create as createItem } from "../lib/shared/Item";
import { between as sortBetween } from "../lib/shared/sortOrder";

import type Bullet from "../lib/shared/Bullet";
import type Item from "../lib/shared/Item";

const debug = Debug("anthologize:viewstate");

export default class ViewState {
  #focusedIndex: number | null;
  #tree: Bullet[];
  #items: Map<string, Item>;
  #ownerEmail: string;

  constructor({
    focusedIndex,
    tree,
    items,
    ownerEmail,
  }: {
    focusedIndex?: number;
    tree: Bullet[];
    items: Map<string, Item>;
    ownerEmail: string;
  }) {
    this.#focusedIndex = focusedIndex ?? null;
    this.#tree = tree;
    this.#items = items;
    this.#ownerEmail = ownerEmail;
  }

  isInFocus(bullet: Bullet): boolean {
    return (
      this.#focusedIndex !== null && bullet === this.#tree[this.#focusedIndex]
    );
  }

  setFocus(bullet: Bullet): void {
    this.#focusedIndex = this.#tree.findIndex((b) => b === bullet);
    debug("Set focus to %O", bullet);
  }

  removeFocus(bullet: Bullet) {
    if (this.#focusedIndex === null) return;
    if (this.#tree[this.#focusedIndex] !== bullet) return;
    this.#focusedIndex = null;
  }

  arrowUp(): Bullet | null {
    if (this.#focusedIndex === null) return null;
    if (this.#focusedIndex === 0) return null;
    this.setFocus(this.#tree[this.#focusedIndex - 1]);
    return this.#tree[this.#focusedIndex];
  }

  arrowDown(): Bullet | null {
    if (this.#focusedIndex === null) return null;
    if (this.#focusedIndex === this.#tree.length - 1) return null;
    this.setFocus(this.#tree[this.#focusedIndex + 1]);
    return this.#tree[this.#focusedIndex];
  }

  insertAtCurrentPosition(
    addAsOlder = false
  ): { after: Bullet; parent: string } | null {
    if (this.#focusedIndex === null) {
      debug("Nothing focused, refusing to insert new item");
      return null;
    }

    const self = this.#tree[this.#focusedIndex];
    const adjacent = this.#tree[this.#focusedIndex + (addAsOlder ? -1 : 1)];

    if (addAsOlder && self.parent === null) {
      throw new Error("Cannot insert prior against the root");
    }

    const parent = (() => {
      if (self.parent === null) return self.id;
      if (addAsOlder) return self.parent;
      if (adjacent && adjacent.parent === self.id) {
        return self.id;
      }
      return self.parent;
    })();

    return { after: self, parent };
  }

  indent() {
    if (this.#focusedIndex === null) return;
    if (
      !this.#tree[this.#focusedIndex - 1] ||
      this.#tree[this.#focusedIndex].parent ===
        this.#tree[this.#focusedIndex - 1].id
    ) {
      return;
    }

    this.#tree[this.#focusedIndex].parent = this.#tree[
      this.#focusedIndex - 1
    ].id;
  }

  unindent() {
    if (this.#focusedIndex === null) return;
    const parent = this.#tree.find(
      (b) => b.id === this.#tree[this.#focusedIndex!].parent
    )!;
    if (!this.#tree[this.#focusedIndex - 1] || parent.parent === null) {
      return;
    }

    debug(
      "Setting item %s to parent %s",
      this.#tree[this.#focusedIndex].id,
      parent.parent
    );
    this.#tree[this.#focusedIndex].parent = parent.parent;
  }
}
