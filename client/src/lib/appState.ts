import { makeAutoObservable, observable, toJS } from "mobx";

import { Item, create as createItem, getSortOrder } from "./item";

export interface ItemTree extends Item {
  parent: ItemTree | null;
  children: ItemTree[];
}

function itemTreeComparator(a: ItemTree, b: ItemTree): -1 | 0 | 1 {
  // mudder handles insertions between 'x' and 'y' by making the in-between
  // value 'xx', so prefixes need to get sorted after longer strings
  if (a.sortOrder.startsWith(b.sortOrder)) return -1;

  // Apply regular alphabetical sort from here
  return a.sortOrder < b.sortOrder ? -1 : 1;
}

export class AppState {
  tree: ItemTree = {
    text: "Root",
    id: "root",
    parent: null,
    parentId: null,
    sortOrder: "m",
    children: [],
  };

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
    console.log("Running indenter...");
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
    if (item === this.tree || item.parent === this.tree) return;
    const [, uncle] = this.getNeighbors(item.parent!);
    const uncles = this.getSiblings(item.parent!);
    const siblings = this.getSiblings(item);
    const indexAmongSiblings = siblings.indexOf(item);
    siblings.splice(indexAmongSiblings, 1);
    item.parentId = item.parent!.parentId;
    item.sortOrder = getSortOrder(item.parent, uncle);
    item.parent = item.parent!.parent;
    uncles.push(item);
    uncles.sort(itemTreeComparator);
  }

  /**
   * Traverses the tree one level at a time, applying an optional callback to
   * each encountered value
   */
  walkTree(cb?: (item: ItemTree) => void): void {
    // Have to create a new array, otherwise we're modifying the underlying
    // array and will accidentally append all values in the tree to the tree
    // root
    const toTraverse: ItemTree[] = [this.tree, ...this.tree.children];
    for (let curr of toTraverse) {
      if (cb) cb(curr);
      toTraverse.push(...curr.children);
    }
  }

  /*
  focusPrevious(item: ItemTree): void {
    function findDeepestChild(item: ItemTree): ItemTree {
      let ret = item;
      while (true) {
        if (ret.children.length > 0) {
          ret = ret.children[ret.children.length - 1];
          continue;
        }
        break;
      }
      return ret;
    }

    const [olderSibling] = this.getNeighbors(item);
    const parent = item.parent;
    console.log("previous", toJS(olderSibling), toJS(parent), toJS(item));
    if (!olderSibling) {
      if (parent) {
        this.setFocus(parent);
      }
      return;
    }
    this.setFocus(findDeepestChild(olderSibling));
  }

  focusNext(item: ItemTree): void {
    // Go deeper before going lateral
    if (item.children.length > 0) {
      this.setFocus(item.children[0]);
      return;
    }
    const [, youngerSibling] = this.getNeighbors(item);
    // Return our neighbor if we can't go deeper
    if (youngerSibling) {
      this.setFocus(youngerSibling);
      return;
    }
    if (item === this.tree) return;
    // Work our way up the tree until we find _someone_ with a sibling
    let cursor = item.parent!;
    console.log("Starting with parent", toJS(cursor));
    while (true) {
      const [, cursorSibling] = this.getNeighbors(cursor);
      console.log("Evaluating", toJS(cursorSibling));
      if (cursorSibling) {
        this.setFocus(cursorSibling);
        return;
      } else if (cursor === this.tree) {
        // We reached the top of the tree and found no more neighbors
        return;
      } else {
        cursor = cursor.parent!;
      }
    }
  }
  */

  getNewItemParent(currentItem: ItemTree): ItemTree {
    // If the user hits 'enter' on the root of a new indentation level we want
    // to add the new item to the top of the indented set, like Workflowy does.
    if (currentItem.children.length > 0 || currentItem === this.tree) {
      return currentItem;
    }
    return currentItem.parent!;
  }

  insertNewItem(currentItem: ItemTree, insertAfterItem: boolean): ItemTree {
    const currentItemNeighbors = this.getNeighbors(currentItem);
    const [previous, next] = insertAfterItem
      ? [currentItem, currentItemNeighbors[1]]
      : [currentItemNeighbors[0], currentItem];
    console.log("new neighbors", toJS(previous), toJS(next));

    const parent = this.getNewItemParent(currentItem);
    const insertAtNewLevel = parent === currentItem;
    const newItem = createItem(
      { parentId: parent.id },
      insertAtNewLevel ? null : previous,
      insertAtNewLevel ? parent.children[0] : next
    );
    console.log("new item", toJS(newItem));
    const newItemTree: ItemTree = observable({
      ...newItem,
      children: [],
      parent,
    });
    parent.children.push(newItemTree);
    parent.children.sort(itemTreeComparator);

    return newItemTree;
  }

  deleteItem(item: ItemTree) {
    // TODO: If we're zoomed in, handle deleting the zoom level root
    if (item === this.tree) return;

    const siblings = this.getSiblings(item);
    const indexAmongSiblings = siblings.indexOf(item);
    siblings.splice(indexAmongSiblings, 1);
  }

  /**
   * Returns the nodes immediately before+after the supplied item in the
   * parent's children array, or null if the item is at the beginning and/or end
   * of its generation
   */
  getNeighbors(item: ItemTree): [ItemTree | null, ItemTree | null] {
    // No parent means we're operating at the tree root
    const siblings = this.getSiblings(item);
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
    // No parent means it's the tree root
    return item.parent?.children ?? [];
  }

  setItemText(item: Item, text: string) {
    item.text = text;
  }
}

export class ViewState {
  autoFocus: ItemTree | null = null;

  constructor(private appState: AppState) {
    makeAutoObservable(this);
  }

  setFocus(item: ItemTree): void {
    this.autoFocus = item;
  }

  unFocus(item: ItemTree): void {
    // Just in case onFocus/onBlur fire in a weird order when moving between
    // list items
    if (this.autoFocus === item) this.autoFocus = null;
  }
}

export const appState = new AppState();
export const viewState = new ViewState(appState);
