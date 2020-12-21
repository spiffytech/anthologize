import type Item from "./Item";

export default class ItemEdge {
  public sortOrder: string;
  public from: Item;
  public to: Item;

  constructor({
    sortOrder,
    from,
    to,
  }: {
    sortOrder: string;
    from: Item;
    to: Item;
  }) {
    this.sortOrder = sortOrder;
    this.from = from;
    this.to = to;
  }

  compare(compareTo: ItemEdge): -1 | 0 | 1 {
    if (this === compareTo) return 0;
    return this.sortOrder < compareTo.sortOrder ? -1 : 1;
  }
}
