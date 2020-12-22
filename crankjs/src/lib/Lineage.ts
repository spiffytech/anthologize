import Item from "./Item";
import { last } from "./utils";

import type ItemEdge from "./ItemEdge";
import type Graph from "./Graph";

export default class Lineage {
  readonly #graph: Graph;
  readonly pathFromRoot: ItemEdge[];
  readonly node: Item;

  constructor(graph: Graph, ancestors: ItemEdge[]) {
    this.#graph = graph;
    this.node = last(ancestors)?.to ?? this.#graph.root;
    this.pathFromRoot = ancestors;
  }

  get isRoot() {
    return this.pathFromRoot.length === 0;
  }

  get edge(): ItemEdge | null {
    if (this.isRoot) return null;
    return last(this.pathFromRoot);
  }

  get hasChildren() {
    return this.children.length > 0;
  }

  get parent(): Lineage | null {
    if (this.isRoot) return null;
    return new Lineage(
      this.#graph,
      this.pathFromRoot.slice(0, this.pathFromRoot.length - 1)
    );
  }

  appendToMyPath(edge: ItemEdge): ItemEdge[] {
    return [...this.pathFromRoot, edge];
  }

  get children(): Lineage[] {
    return this.#graph
      .outboundEdges(this.node)
      .map((edge) => new Lineage(this.#graph, this.appendToMyPath(edge)));
  }

  get siblings(): Lineage[] | null {
    if (this.isRoot) return null;
    const { itemEdges: siblings } = this.#graph.nodeIndexUnderParent(
      this.node,
      this.parent?.node!
    );
    return siblings.map(
      (edge) => new Lineage(this.#graph, this.appendToMyPath(edge))
    );
  }

  get neighbors(): [Lineage | null, Lineage | null] {
    if (this.isRoot) return [null, null];
    const { nodeIndex, itemEdges: siblings } = this.#graph.nodeIndexUnderParent(
      this.node,
      this.parent!.node
    );
    const [older, younger] = [
      siblings[nodeIndex - 1] ?? null,
      siblings[nodeIndex + 1] ?? null,
    ];
    return [
      older
        ? new Lineage(this.#graph, this.parent!.appendToMyPath(older))
        : null,
      younger
        ? new Lineage(this.#graph, this.parent!.appendToMyPath(younger))
        : null,
    ];
  }

  prependFirstborn(node: Item): Lineage {
    const edge = this.#graph.placeChild(
      node,
      this.node,
      null,
      this.children[0]?.edge ?? null
    );

    console.log(
      "New ancestors:",
      this.appendToMyPath(edge),
      `(Appended to: ${this.node.id})`
    );
    return new Lineage(this.#graph, this.appendToMyPath(edge));
  }

  addOlderSibling(node: Item): Lineage {
    if (this.isRoot) {
      throw new Error("Shouldn't be trying to add a sibling to the graph root");
    }

    const [olderSibling] = this.neighbors;
    const edge = this.#graph.placeChild(
      node,
      this.parent!.node,
      this.edge,
      olderSibling?.edge ?? null
    );

    return new Lineage(this.#graph, this.parent!.appendToMyPath(edge));
  }

  addYoungerSibling(node: Item): Lineage {
    if (this.isRoot) {
      throw new Error("Shouldn't be trying to add a sibling to the graph root");
    }

    const [, youngerSibling] = this.neighbors;
    console.log(
      "new edge",
      this.pathFromRoot.map((ancestor) => [ancestor.from.id, ancestor.to.id]),
      this.parent?.node.id,
      this.edge,
      youngerSibling?.edge
    );
    console.log(
      node,
      this.parent!.node,
      this.edge,
      youngerSibling?.edge ?? null
    );
    const edge = this.#graph.placeChild(
      node,
      this.parent!.node,
      this.edge,
      youngerSibling?.edge ?? null
    );

    console.log(
      "New ancestors:",
      this.appendToMyPath(edge),
      `(Created after: ${this.node.id})`
    );
    return new Lineage(this.#graph, this.parent!.appendToMyPath(edge));
  }

  adopt(lineage: Lineage, sortOrder: string): Lineage {
    if (lineage.isRoot) {
      throw new Error("Can't adopt a graph root");
    }

    const edge = this.#graph.changeParent(lineage.node, this.node, sortOrder);

    return new Lineage(this.#graph, this.appendToMyPath(edge));
  }

  kill() {
    this.#graph.kill(this.node);
  }
}
