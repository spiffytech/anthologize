import { makeAutoObservable, toJS } from "mobx";

import { Item, create as createItem } from "./item";

interface Tree<T> {
  value: T;
  parent: Tree<T> | null;
  children: Tree<T>[];
}

export type ItemTree = Tree<Item>;

export class AppState {
  value = 0;
  items: Map<string, Item> = new Map();

  constructor() {
    makeAutoObservable(this);
  }

  get itemTree(): Tree<Item>[] {
    // Adapted from https://stackoverflow.com/a/40732240/191438
    function arrayToTree(values: Item[]) {
      const hashTable = new Map<string, ItemTree>();
      values.forEach((value) =>
        hashTable.set(value.id, {
          value: { ...value, sortOrder: "" },
          parent: null,
          children: [] as ItemTree[],
        })
      );
      const dataTree: Tree<Item>[] = [];
      values.forEach((value) => {
        if (value.parent) {
          hashTable.get(value.parent)!.children.push(hashTable.get(value.id)!);
          hashTable
            .get(value.parent)!
            .children.sort((a, b) =>
              a.value.sortOrder < b.value.sortOrder ? -1 : 1
            );
          hashTable.get(value.id)!.parent = hashTable.get(value.parent)!;
        } else {
          dataTree.push(hashTable.get(value.id)!);
        }
      });
      return dataTree;
    }
    return arrayToTree(Array.from(this.items.values()));
  }

  indent(item: ItemTree) {
    const [previous] = this.getSiblings(item);
    // Indenting the first child would be double-indenting something, that
    // doesn't make sense
    //
    // Index could be -1 if indenting at the tree root where we have no parent,
    // and hence no siblings
    console.log("previous", previous);
    if (!previous) return;
    this.items.get(item.value.id)!.parent = previous.value.id;
  }

  insertNewItem(item: ItemTree | null, insertAfterItem: boolean): Item {
    if (!item) {
      const newItem = createItem({ parent: null }, null, null);
      this.items.set(newItem.id, newItem);
      return newItem;
    }
    // If the user hits 'enter' on the root of a new indentation level we want
    // to add the new item to the top of the indented set, like Workflowy does.
    const parent =
      (item?.children.length ?? 0) > 0
        ? item.value.id
        : item.parent?.value.id ?? null;
    const siblings =
      parent === item.value.id ? item.children : this.getSiblings(item);
    const previous = insertAfterItem ? item : siblings[0];
    const next = insertAfterItem ? siblings[1] : item;
    const newItem = createItem(
      { parent },
      previous?.value ?? null,
      next?.value ?? null
    );
    this.items.set(newItem.id, newItem);

    return newItem;
  }

  getSiblings(item: ItemTree): [ItemTree | null, ItemTree | null] {
    // No parent means we're operating at the tree root
    const siblings = item.parent ? item.parent.children : this.itemTree;
    const indexAmongSiblings = siblings.indexOf(item);
    console.log("indexAmongSiblings", indexAmongSiblings, siblings);
    return [
      siblings[indexAmongSiblings - 1] ?? null,
      siblings[indexAmongSiblings + 1] ?? null,
    ];
  }

  setItemText(item: Item, text: string) {
    const i = this.items.get(item.id)!;
    i.text = text;
  }
}

export default new AppState();
