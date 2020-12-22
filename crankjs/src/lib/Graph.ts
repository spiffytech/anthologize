import { Graph as Graphlib } from "graphlib";

import type { Edge } from "graphlib";

import Item from "./Item";
import ItemEdge from "./ItemEdge";
import Sorter from "./Sorter";
import { last } from "./utils";

export default class Graph {
  public readonly root: Item;

  #graph = new Graphlib({ directed: true });

  constructor() {
    this.root = new Item({ text: "root" });
    this.#graph.setNode(this.root.id, this.root);
  }

  placeChild(
    node: Item,
    parent: Item,
    after: ItemEdge | null,
    before: ItemEdge | null
  ): ItemEdge {
    const childSortOrder = new Sorter().placeBetween(
      after?.sortOrder ?? null,
      before?.sortOrder ?? null
    );

    if (!this.#graph.hasNode(node.id)) {
      this.#graph.setNode(node.id, node);
    }

    const edge = new ItemEdge({
      sortOrder: childSortOrder,
      from: parent,
      to: node,
    });
    this.#graph.setEdge(parent.id, node.id, edge);
    return edge;
  }

  appendToParent(node: Item, ancestors: ItemEdge[]) {
    // At the graph root
    if (ancestors.length === 0) return;

    const newSiblings = this.outboundEdges(last(ancestors).to);
    // At the item root. Shouldn't be able to get here (guarded by input
    // controls), but better safe than crash-y.
    this.placeChild(
      node,
      ancestors[ancestors.length - 1].to,
      newSiblings[newSiblings.length - 1] ?? null,
      null
    );
  }

  public outboundEdges(node: Item): ItemEdge[] {
    const edges: Edge[] = this.#graph.outEdges(node.id) as Edge[];
    const itemEdges: ItemEdge[] = edges.map((edge) =>
      this.#graph.edge(edge.v, edge.w)
    );
    return itemEdges.sort((a, b) => a.compare(b));
  }

  public nodeIndexUnderParent(
    node: Item,
    parent: Item
  ): { itemEdges: ItemEdge[]; nodeIndex: number } {
    if (node === this.root) {
      throw new Error(
        "We should never be looking for parents of the graph root"
      );
    }

    const itemEdges = this.outboundEdges(parent);
    return { itemEdges, nodeIndex: itemEdges.findIndex((n) => n.to === node) };
  }

  moveUp(node: Item, parent: Item) {
    const { itemEdges, nodeIndex } = this.nodeIndexUnderParent(node, parent);
    if (nodeIndex <= 0) return;

    const newAfter = itemEdges[nodeIndex - 2] ?? null;
    const newBefore = itemEdges[nodeIndex + 1] ?? null;
    const newSortOrder = new Sorter().placeBetween(
      newAfter?.sortOrder,
      newBefore?.sortOrder
    );
    itemEdges[nodeIndex].sortOrder = newSortOrder;
  }

  moveDown(node: Item, parent: Item) {
    const { itemEdges, nodeIndex } = this.nodeIndexUnderParent(node, parent);
    if (nodeIndex === itemEdges.length - 1) return;

    const newAfter = itemEdges[nodeIndex - 1] ?? null;
    const newBefore = itemEdges[nodeIndex + 2] ?? null;
    const newSortOrder = new Sorter().placeBetween(
      newAfter?.sortOrder,
      newBefore?.sortOrder
    );
    itemEdges[nodeIndex].sortOrder = newSortOrder;
  }

  pop(node: Item): Item {
    this.#graph.removeNode(node.id);
    return node;
  }

  changeParent(node: Item, newParent: Item, sortOrder: string): ItemEdge {
    const edgeFromNewParent = new ItemEdge({
      sortOrder,
      from: newParent,
      to: node,
    });
    this.pop(node);
    this.#graph.setEdge(newParent.id, node.id, edgeFromNewParent);
    return edgeFromNewParent;
  }
}
