import Debug from "debug";

import { addToTree, create as createBullet } from "../shared/Bullet";
import { create as createItem } from "../shared/Item";
import { between as sortBetween } from "../shared/sortOrder";

import type Bullet from "../shared/Bullet";
import type Item from "../shared/Item";

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
  ): { after: Bullet; indent: number } | null {
    if (this.#focusedIndex === null) {
      debug("Nothing focused, refusing to insert new item");
      return null;
    }

    const self = this.#tree[this.#focusedIndex];
    const adjacent = this.#tree[this.#focusedIndex + (addAsOlder ? -1 : 1)];

    if (addAsOlder && self.indent === 0) {
      throw new Error("Cannot insert prior against the root");
    }

    const indent = (() => {
      if (self.indent === 0) return self.indent + 1;
      if (addAsOlder) return self.indent;
      if (adjacent && adjacent.indent > self.indent) {
        return self.indent + 1;
      }
      return self.indent;
    })();

    return { after: self, indent };
  }

  indent() {
    if (this.#focusedIndex === null) return;
    if (
      !this.#tree[this.#focusedIndex - 1] ||
      this.#tree[this.#focusedIndex].indent ===
        this.#tree[this.#focusedIndex - 1].indent + 1
    ) {
      return;
    }

    const oldIndent = this.#tree[this.#focusedIndex].indent;
    this.#tree[this.#focusedIndex].indent += 1;

    let cursor = this.#focusedIndex + 1;
    while (this.#tree[cursor].indent > oldIndent) {
      this.#tree[cursor].indent += 1;
    }
  }

  unindent() {
    if (this.#focusedIndex === null) return;
    if (
      !this.#tree[this.#focusedIndex - 1] ||
      this.#tree[this.#focusedIndex].indent === 1
    ) {
      return;
    }

    const oldIndent = this.#tree[this.#focusedIndex].indent;
    this.#tree[this.#focusedIndex].indent -= 1;

    let cursor = this.#focusedIndex + 1;
    while (this.#tree[cursor].indent >= oldIndent) {
      this.#tree[cursor].indent -= 1;
    }
  }
}
