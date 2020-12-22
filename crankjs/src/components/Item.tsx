import { Context, createElement } from "@bikeshaving/crank";

import type Lineage from "../lib/Lineage";
import type ViewState from "../lib/ViewState";

export default function ItemComponent(
  this: Context,
  { lineage, viewState }: { lineage: Lineage; viewState: ViewState }
) {
  const isInFocus = viewState.isInFocus(lineage);

  // When we unindent we have to refresh the _grandparent_. Rather than prop
  // drilling, we just emit an event so everything the whole way up the tree can
  // refresh so we know we're good.
  this.addEventListener("tree-changed", (event) => {
    this.refresh();
  });
  const emitTreeChanged = () => {
    this.refresh();
    this.dispatchEvent(
      new CustomEvent("tree-changed", { bubbles: true, detail: { lineage } })
    );
  };

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
    emitTreeChanged();
  }

  const renderedText = (
    <output
      for={`item-input-${lineage.node.id}`}
      class="bg-gray-200 w-64 h-16 block"
      onclick={() => {
        viewState.setFocus(lineage);
        this.refresh();
      }}
      role="textbox"
      ariaReadonly="false"
    >
      {lineage.node.text || "Empty node"}
    </output>
  );

  const input = (
    <textarea
      id={`item-input-${lineage.node.id}`}
      class={`${
        isInFocus ? "static" : "-top-full absolute"
      } focus:bg-red-200 w-64 h-16 block border`}
      tabindex={-1}
      crank-ref={(el: HTMLTextAreaElement) => {
        setTimeout(() => {
          if (isInFocus) el.focus();
        }, 0);
      }}
      value={lineage.node.text}
      oninput={(e: any) => {
        lineage.node.text = e.target.value;
        this.refresh();
      }}
      placeholder="Empty item..."
      onkeydown={onKeyDown}
      onfocus={() => {
        viewState.setFocus(lineage);
        emitTreeChanged();
      }}
      onblur={() => {
        viewState.removeFocus(lineage);
        emitTreeChanged();
      }}
    />
  );

  const children = !lineage.hasChildren
    ? null
    : lineage.children.map((child) => (
        <li crank-key={child.node.id}>
          <ItemComponent lineage={child} viewState={viewState} />
        </li>
      ));

  return (
    <ul class="ml-8">
      <li crank-key={lineage.node.id}>
        <article>
          {input}
          {isInFocus ? null : renderedText}
        </article>
      </li>
      {children}
    </ul>
  );
}
