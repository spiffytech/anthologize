import { createElement } from "@bikeshaving/crank";
import { renderer } from "@bikeshaving/crank/dom";

import Graph from "./lib/Graph";
import Lineage from "./lib/Lineage";
import ViewState from "./lib/ViewState";

import Item from "./components/Item";

const graph = new Graph();
const rootLineage = new Lineage(graph, []);
const viewState = new ViewState({ lineage: rootLineage });

renderer.render(
  <Item lineage={rootLineage} viewState={viewState} />,
  document.body
);
