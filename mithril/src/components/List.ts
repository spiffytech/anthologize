import Debug from "debug";
import m from "mithril";

import { removeFromTree } from "../lib/shared/Bullet";

import ItemAdder from "../lib/actions/ItemAdder";

import type ActionManager from "../lib/ActionManager";

import type Item from "../lib/shared/Item";
import type Bullet from "../lib/shared/Bullet";

import type ViewState from "../lib/ViewState";

const debug = Debug("anthologize:list-component");

function getChildren(root: Bullet, bullets: Bullet[], index: number) {
  const children = [];
  for (let cursor = index + 1; cursor < bullets.length; cursor++) {
    if (bullets[cursor].parent === root.parent) break;
    if (bullets[cursor].parent === root.id) {
      children.push(cursor);
    }
  }

  return children;
}

const ListComponent: m.ClosureComponent<{
  tree: Bullet[];
  treeIndex: number;
  items: Map<string, Item>;
  viewState: ViewState;
  actionManager: ActionManager;
}> = () => {
  return {
    view(vnode) {
      const { tree, treeIndex, items, viewState, actionManager } = vnode.attrs;

      const bullet = tree[treeIndex];
      const selfNode = items.get(bullet.itemId)!;

      const isInFocus = viewState.isInFocus(bullet);

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
          const insertionParams = viewState.insertAtCurrentPosition(
            // TODO: Do I actually want to copy this from Workflowy?
            /*
        treeIndex !== 0 &&
          inputEl?.selectionEnd === 0 &&
          selfNode.body.length > 0
          */
            false
          );
          if (insertionParams === null) return;

          const action = new ItemAdder(
            "",
            tree,
            items,
            insertionParams.after,
            insertionParams.parent
          );
          actionManager.perform(action, (bullet) => viewState.setFocus(bullet));
        } else if (
          event.ctrlKey &&
          event.shiftKey &&
          (event.key === "Backspace" || event.key === "Delete")
        ) {
          viewState.arrowUp();
          removeFromTree(tree, bullet, items);
        } else {
          console.log(event.key);
        }
        m.redraw();
      }

      const renderedText = m(
        "output",
        {
          for: `item-input-${bullet.id}`,
          class: "bg-gray-200 w-64 h-16 block",
          onclick: () => {
            viewState.setFocus(bullet);
            m.redraw();
          },
          role: "textbox",
          ariaReadonly: "false",
        },
        selfNode.body || "Empty node"
      );

      const input = m("textarea", {
        // The id attr is for tying the <output> element to its data source
        id: `item-input-${bullet.id}`,
        class: `${
          isInFocus ? "static" : "-top-full absolute"
        } focus:bg-red-200 w-64 h-16 block border`,
        tabindex: -1,
        oncreate: (vnode) => {
          if (isInFocus) (vnode.dom as HTMLTextAreaElement).focus();
        },
        onupdate: (vnode) => {
          if (isInFocus) (vnode.dom as HTMLTextAreaElement).focus();
        },
        value: selfNode.body,
        oninput: (e: any) => {
          selfNode.body = e.target.value;
          m.redraw();
        },
        placeholder: "Empty item...",
        onkeydown: onKeyDown,
        onfocus: () => {
          if (viewState.isInFocus(bullet)) return;
          viewState.setFocus(bullet);
          m.redraw();
        },
        onblur: () => {
          viewState.removeFocus(bullet);
          m.redraw();
        },
      });

      const children = getChildren(bullet, tree, treeIndex);

      debug("self id: %O", bullet.id);
      debug("children: %O", children);
      return m(
        "ul.ml-8",

        m(
          "li",
          { key: bullet.id },
          m(
            "article",
            m("p", bullet.sortOrder, " / ", bullet.id),
            input,
            isInFocus ? null : renderedText
          )
        ),

        ...children.map((childIndex) =>
          m(ListComponent, {
            tree,
            treeIndex: childIndex,
            items,
            viewState,
            actionManager,
            key: tree[childIndex].id,
          })
        )
      );
    },
  };
};

export default ListComponent;
