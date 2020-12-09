import { makeAutoObservable } from "mobx";

import { Item, create as createItem } from "./item";

type InsertionTuple = [Item | null, Item | null];

export class AppState {
  value = 0;
  items: Item[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  setParent(item: Item, parent: Item | null) {
    if (!parent?.id) return;
    item.parent = parent.id;
  }

  insertNewItem(
    previous: Item | null,
    next: Item | null,
    insertAfterCurrent: boolean
  ): Item {
    // If the user hits 'enter' on the root of a new indentation level we want
    // to add the new item to the top of the indented set, like Workflowy does.
    const parent =
      insertAfterCurrent && next?.parent !== previous?.parent && next !== null
        ? previous?.id ?? null
        : previous?.parent ?? null;
    const newItem = createItem({ parent }, previous, next);
    this.items.push(newItem);
    this.items.sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));
    return newItem;
  }

  get siblings(): Map<Item, InsertionTuple> {
    const tuples = this.items.map((item, index): [Item, InsertionTuple] => {
      const previous = index === 0 ? null : this.items[index - 1];
      const next =
        index === this.items.length - 1 ? null : this.items[index + 1];
      return [item, [previous, next]];
    });
    return new Map(tuples);
  }
}

export default new AppState();
