import { makeAutoObservable, toJS } from "mobx";

import { Item, create as createItem, getSortOrder } from "./item";

export interface ItemTree extends Item {
  parent: ItemTree | null;
  children: ItemTree[];
}

function itemTreeComparator(a: ItemTree, b: ItemTree): -1 | 0 | 1 {
  return a.sortOrder < b.sortOrder ? -1 : 1;
}

export class AppState {
  value = 0;
  items: ItemTree[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  /*
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
  */

  indent(item: ItemTree) {
    const [newParent] = this.getNeighbors(item);
    // Indenting the first child would be double-indenting something, that
    // doesn't make sense
    //
    // Index could be -1 if indenting at the tree root where we have no parent,
    // and hence no siblings
    if (!newParent) return;

    const oldSiblings = this.getSiblings(item);
    const indexAmongOldSiblings = oldSiblings.indexOf(item);
    oldSiblings.splice(indexAmongOldSiblings, 1);

    const newSiblings = newParent.children;
    const toInsertAfter =
      newSiblings.length > 0 ? newSiblings[newSiblings.length - 1]! : null;
    item.parentId = newParent.id;
    item.parent = newParent;
    item.sortOrder = getSortOrder(toInsertAfter ?? null, null);
    item.parent.children.push(item);
    item.parent.children.sort(itemTreeComparator);
  }

  unindent(item: ItemTree) {
    // Top of the tree
    if (!item.parent) return;
    const [, uncle] = this.getNeighbors(item.parent);
    const uncles = this.getSiblings(item.parent);
    const siblings = this.getSiblings(item);
    const indexAmongSiblings = siblings.indexOf(item);
    siblings.splice(indexAmongSiblings, 1);
    item.parentId = item.parent?.parentId;
    item.sortOrder = getSortOrder(item.parent, uncle);
    item.parent = item.parent?.parent;
    uncles.push(item);
    uncles.sort(itemTreeComparator);
  }

  insertNewItem(currentItem: ItemTree | null, insertAfterItem: boolean): Item {
    // Handles the first item in the tree
    if (!currentItem) {
      const newItem = createItem({ parentId: null }, null, null);
      const newItemTree: ItemTree = {
        ...newItem,
        children: [],
        parent: null,
      };
      this.items.push(newItemTree);
      return newItem;
    }

    const currentItemNeighbors = this.getNeighbors(currentItem);
    const [previous, next] = insertAfterItem
      ? [currentItem, currentItemNeighbors[1]]
      : [currentItemNeighbors[0], currentItem];
    console.log("new neighbors", toJS(previous), toJS(next));

    const newItem = createItem(
      { parentId: currentItem.parent?.id ?? null },
      previous,
      next
    );
    console.log("new item", toJS(newItem));
    const newItemTree: ItemTree = {
      ...newItem,
      children: [],
      parent: currentItem.parent,
    };
    const siblings = this.getSiblings(currentItem);
    siblings.push(newItemTree);
    siblings.sort(itemTreeComparator);

    // If the user hits 'enter' on the root of a new indentation level we want
    // to add the new item to the top of the indented set, like Workflowy does.
    const shouldIndent = insertAfterItem && currentItem.children.length > 0;
    if (shouldIndent) this.indent(newItemTree);

    return newItem;
  }

  /**
   * Returns the nodes immediately before+after the supplied item in the
   * parent's children array, or null if the item is at the beginning and/or end
   * of its generation
   */
  getNeighbors(item: ItemTree): [ItemTree | null, ItemTree | null] {
    // No parent means we're operating at the tree root
    const siblings = item.parent?.children ?? this.items;
    const indexAmongSiblings = siblings.indexOf(item);
    console.log("indexAmongSiblings", indexAmongSiblings, toJS(siblings));
    return [
      siblings.length > 0 ? siblings[indexAmongSiblings - 1] : null,
      indexAmongSiblings < siblings.length - 1
        ? siblings[indexAmongSiblings + 1]
        : null,
    ];
  }

  getSiblings(item: ItemTree): ItemTree[] {
    return item.parent?.children ?? this.items;
  }

  setItemText(item: Item, text: string) {
    item.text = text;
  }
}

export default new AppState();
