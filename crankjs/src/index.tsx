import { Context, createElement } from "@bikeshaving/crank";
import { renderer } from "@bikeshaving/crank/dom";

import Graph from "./lib/Graph";
import Lineage from "./lib/Lineage";
import ViewState from "./lib/ViewState";

import Item from "./components/Item";

const graph = new Graph();
const rootLineage = new Lineage(graph, []);
const viewState = new ViewState({ lineage: rootLineage });

function App(this: Context) {
  this.addEventListener("tree-changed", () => {
    this.refresh();
  });
  return <Item lineage={rootLineage} viewState={viewState} />;
}

renderer.render(<App />, document.body);
