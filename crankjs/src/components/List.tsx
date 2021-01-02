import { Context, createElement } from "@bikeshaving/crank";

import { removeFromTree } from "../shared/Bullet";

import ItemAdder from "../lib/actions/ItemAdder";

import type ActionManager from "../lib/ActionManager";

import type Item from "../shared/Item";
import type Bullet from "../shared/Bullet";

import type ViewState from "../lib/ViewState";

export default function ListComponent(
  this: Context,
  {
    tree,
    treeIndex,
    items,
    viewState,
    actionManager,
  }: {
    tree: Bullet[];
    treeIndex: number;
    items: Map<string, Item>;
    viewState: ViewState;
    actionManager: ActionManager;
  }
) {
  const self = tree[treeIndex];
  const selfNode = items.get(self.itemId)!;

  const isInFocus = viewState.isInFocus(self);

  // When we unindent we have to refresh the _grandparent_. When dragging and
  // dropping, we have to refresh both ends of the drag-and-drop, _and_ any
  // 'clone' nodes elsewhere in the tree matching the new parent. Basically, we
  // have to rerender arbitrary places in the tree, so we might as well rerender
  // the whole tree, rather than keep track of exactly what needs rerendering.
  const emitTreeChanged = () => {
    this.dispatchEvent(new CustomEvent("tree-changed", { bubbles: true }));
  };

  let inputEl: HTMLTextAreaElement | null = null;

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
        insertionParams.indent
      );
      actionManager.perform(action, (bullet) => viewState.setFocus(bullet));
    } else if (
      event.ctrlKey &&
      event.shiftKey &&
      (event.key === "Backspace" || event.key === "Delete")
    ) {
      viewState.arrowUp();
      removeFromTree(tree, self, items);
    } else {
      console.log(event.key);
    }
    emitTreeChanged();
  }

  const childrenToRender = [];
  let cursor = treeIndex + 1;
  while (tree[cursor] && tree[cursor].indent > self.indent) {
    if (tree[cursor].indent === self.indent + 1) {
      childrenToRender.push(cursor);
    }
    cursor += 1;
  }

  const renderedText = (
    <output
      for={`item-input-${self.bulletKey}`}
      class="bg-gray-200 w-64 h-16 block"
      onclick={() => {
        viewState.setFocus(self);
        emitTreeChanged();
      }}
      role="textbox"
      ariaReadonly="false"
    >
      {selfNode.body || "Empty node"}
    </output>
  );

  const input = (
    <textarea
      id={`item-input-${self.bulletKey}`}
      class={`${
        isInFocus ? "static" : "-top-full absolute"
      } focus:bg-red-200 w-64 h-16 block border`}
      tabindex={-1}
      crank-ref={(el: HTMLTextAreaElement) => {
        requestAnimationFrame(() => {
          inputEl = el;
          if (isInFocus) el.focus();
        });
      }}
      value={selfNode.body}
      oninput={(e: any) => {
        selfNode.body = e.target.value;
        this.refresh();
      }}
      placeholder="Empty item..."
      onkeydown={onKeyDown}
      onfocus={() => {
        if (viewState.isInFocus(self)) return;
        viewState.setFocus(self);
        emitTreeChanged();
      }}
      onblur={() => {
        viewState.removeFocus(self);
        emitTreeChanged();
      }}
    />
  );

  return (
    <ul class="ml-8">
      <li crank-key={self.bulletKey}>
        <article>
          <p>#{self.sortOrder}</p>
          {input}
          {isInFocus ? null : renderedText}
        </article>
      </li>
      {childrenToRender.length > 0 ? (
        <ul class="ml-8">
          {childrenToRender.map((childIndex) => (
            <ListComponent
              tree={tree}
              treeIndex={childIndex}
              items={items}
              viewState={viewState}
              actionManager={actionManager}
            />
          ))}
        </ul>
      ) : null}
    </ul>
  );
}
