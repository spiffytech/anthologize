import m from "mithril";

import type Graph from "../lib/Graph";
import type Lineage from "../lib/Lineage";
import type ViewState from "../lib/ViewState";

const ItemInput: m.Component<{
  graph: Graph;
  lineage: Lineage;
  viewState: ViewState;
}> = {
  view(vnode) {
    const { graph, viewState, lineage } = vnode.attrs;
    const isInFocus = viewState.isInFocus(lineage);

    function onKeyDown(event: any) {
      if (event.shiftKey && event.key === "Tab") {
        event.preventDefault();
        viewState.unindent();
      } else if (event.key === "Tab") {
        event.preventDefault();
        viewState.indent();
      } else if (event.key === "ArrowUp") {
        viewState.arrowUp();
      } else if (event.key === "ArrowDown") {
        viewState.arrowDown();
      } else if (event.key === "Enter") {
        event.preventDefault();
        viewState.insertAtCurrentPosition();
      } else if (
        event.ctrlKey &&
        event.shiftKey &&
        (event.key === "Backspace" || event.key === "Delete")
      ) {
        viewState.arrowUp();
        lineage.kill();
      } else {
        console.log(event.key);
      }
    }

    const renderedText = m(
      "output",
      {
        for: `item-input-${lineage.node.id}`,
        class: "bg-gray-200 w-64 h-16 block",
        onclick: () => viewState.setFocus(lineage),
        role: "textbox",
        "aria-readonly": "false",
      },
      lineage.node.text || "Empty node"
    );

    return isInFocus
      ? m("textarea", {
          id: `item-input-${lineage.node.id}`,
          class: `${
            isInFocus ? "static" : "-top-full absolute"
          } focus:bg-red-200 w-64 h-16 block border`,
          oncreate: (vnode) => {
            if (isInFocus) {
              (vnode.dom as HTMLInputElement).focus();
            }
          },
          value: lineage.node.text,
          oninput: (e: any) => (lineage.node.text = e.target.value),
          placeholder: "Empty item...",
          onkeydown: onKeyDown,
          onfocus: () => viewState.setFocus(lineage),
          onblur: () => viewState.removeFocus(lineage),
        })
      : renderedText;
  },
};

const ItemComponent: m.Component<{
  graph: Graph;
  lineage: Lineage;
  viewState: ViewState;
}> = {
  view(vnode) {
    const { graph, lineage, viewState } = vnode.attrs;

    return [
      m(
        "li",
        m(
          "article",
          m(
            "button",
            {
              onclick: (e: any) => {
                e.preventDefault();
                viewState.insertAtCurrentPosition(true);
              },
              tabIndex: -1,
            },
            "Insert before"
          ),

          m(ItemInput, { graph, lineage, viewState }),
          m(
            "button",
            {
              onclick: (e: any) => {
                e.preventDefault();
                viewState.insertAtCurrentPosition();
              },
              tabIndex: -1,
            },
            "Insert after"
          ),
          m(
            "button",
            {
              onclick: (e: any) => {
                e.preventDefault();
                viewState.unindent();
              },
              tabIndex: -1,
            },
            "<- Unindent"
          ),
          m(
            "button",
            {
              onclick: (e: any) => {
                e.preventDefault();
                viewState.indent();
              },
              tabIndex: -1,
            },
            "Indent ->"
          )
        )
      ),
      m(
        "li",
        m(
          "ul",
          { class: "ml-8" },
          lineage.children.map((l) =>
            m(ItemComponent, { graph, viewState, lineage: l })
          )
        )
      ),
    ];
  },
};

export default ItemComponent;
