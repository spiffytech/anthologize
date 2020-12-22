import Item from "./Item";
import { last } from "./utils";

import type Lineage from "./Lineage";

import Sorter from "./Sorter";

export default class ViewState {
  #focusedLineage: Lineage | null;

  constructor({ lineage }: { lineage: Lineage }) {
    this.#focusedLineage = lineage;
  }

  isInFocus(lineage: Lineage): boolean {
    return lineage.node === this.#focusedLineage?.node;
  }

  setFocus(lineage: Lineage): void {
    this.#focusedLineage = lineage;
    console.log("Set focus", lineage);
  }

  removeFocus(lineage: Lineage) {
    if (this.#focusedLineage !== lineage) return;
    this.#focusedLineage = null;
  }

  arrowUp(): Lineage | null {
    if (!this.#focusedLineage) return null;
    if (this.#focusedLineage.isRoot) return null;

    let [olderSibling] = this.#focusedLineage.neighbors;
    if (olderSibling && !olderSibling.hasChildren) {
      this.#focusedLineage = olderSibling;
      return null;
    }
    if (!olderSibling) {
      this.#focusedLineage = this.#focusedLineage.parent;
      return this.#focusedLineage;
    }

    let relative = olderSibling;
    while (relative.hasChildren) {
      relative = last(relative.children);
    }

    this.setFocus(relative);
    return relative;
  }

  arrowDown(): Lineage | null {
    if (!this.#focusedLineage) return null;

    if (this.#focusedLineage.hasChildren) {
      this.#focusedLineage = this.#focusedLineage.children[0];
      return null;
    }

    let relative = this.#focusedLineage;
    while (true) {
      if (relative.isRoot) return null;
      const [, youngerSibling] = relative.neighbors;
      if (youngerSibling) {
        this.setFocus(youngerSibling);
        return youngerSibling;
      }
      relative = relative.parent!;
    }
  }

  insertAtCurrentPosition(addAsOlder = false): void {
    if (!this.#focusedLineage) return;

    const node = new Item({ text: "" });

    if (this.#focusedLineage.isRoot || this.#focusedLineage.hasChildren) {
      console.log("Inserting firstborn");
      this.setFocus(this.#focusedLineage.prependFirstborn(node));
    } else if (addAsOlder) {
      console.log("Inserting older");
      this.setFocus(this.#focusedLineage.addOlderSibling(node));
    } else {
      console.log("Inserting younger");
      this.setFocus(this.#focusedLineage.addYoungerSibling(node));
    }
  }

  indent() {
    if (!this.#focusedLineage) return;
    if (this.#focusedLineage.isRoot) return;

    const [olderSibling] = this.#focusedLineage.neighbors;
    if (!olderSibling) return;

    const sortOrder = new Sorter().placeBetween(
      last(olderSibling.children)?.edge?.sortOrder ?? null,
      null
    );
    this.setFocus(olderSibling.adopt(this.#focusedLineage, sortOrder));
  }

  unindent() {
    if (!this.#focusedLineage) return;
    if (this.#focusedLineage.isRoot || this.#focusedLineage.parent?.isRoot) {
      return;
    }

    console.log("Unindenting");
    const parent = this.#focusedLineage.parent!;
    const [, before] = parent.neighbors;

    const sortOrder = new Sorter().placeBetween(
      parent.edge!.sortOrder,
      before?.edge?.sortOrder ?? null
    );

    this.setFocus(parent.parent!.adopt(this.#focusedLineage, sortOrder));
  }
}
