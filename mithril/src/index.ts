import m from "mithril";

import Graph from "./lib/Graph";
import Lineage from "./lib/Lineage";
import ViewState from "./lib/ViewState";

import ItemComponent from "./components/Item";

const App: m.Component<
  {},
  { graph: Graph; viewState: ViewState; rootLineage: Lineage }
> = {
  oninit(vnode) {
    vnode.state.graph = new Graph();
    vnode.state.rootLineage = new Lineage(vnode.state.graph, []);
    vnode.state.viewState = new ViewState({
      lineage: vnode.state.rootLineage,
    });
  },

  view(vnode) {
    const { graph, viewState } = vnode.state;
    return m(
      "ul",
      m(ItemComponent, {
        graph,
        viewState,
        lineage: vnode.state.rootLineage,
      })
    );
  },
};

m.route(document.getElementById("app")!, "/", {
  "/": App,
});
