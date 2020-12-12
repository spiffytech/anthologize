import { useRef, KeyboardEvent } from "react";
import "twin.macro";
import { observer } from "mobx-react-lite";

import "./Item.css";
import ItemList from "./ItemList";

import appState from "../lib/appState";
import type { ItemTree } from "../lib/appState";

function getItemInputs(ref: HTMLInputElement) {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("article.item input.main")
  );
  const currentIndex = inputs.indexOf(ref);
  return { inputs, currentIndex };
}

const ItemInput = observer(function ItemInput({ item }: { item: ItemTree }) {
  const inputRef = useRef<HTMLInputElement>(null);
  console.log("Ref:", inputRef);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.shiftKey && event.key === "Tab") {
      event.preventDefault();
      appState.unindent(item);
    } else if (event.key === "Tab") {
      event.preventDefault();
      appState.indent(item);
    } else if (event.key === "ArrowUp") {
      const { inputs, currentIndex } = getItemInputs(inputRef.current!);
      inputs[currentIndex - 1]?.focus();
    } else if (event.key === "ArrowDown") {
      const { inputs, currentIndex } = getItemInputs(inputRef.current!);
      inputs[currentIndex + 1]?.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      appState.insertNewItem(item, true);
    } else {
      console.log(event.key);
    }
  }

  return (
    <>
      <input
        className="main"
        value={item.text}
        onChange={(e) => appState.setItemText(item, e.target.value)}
        placeholder="Empty item..."
        tw="absolute -top-full focus:(static bg-red-200) w-64 h-16 block"
        ref={inputRef}
        onKeyDown={onKeyDown}
        // React nukes our ref when we rearrange the tree because keys only work
        // for siblings, not cousins. So we have to manually track the
        // currently-focused element so we can refocus it when the DOM tree gets
        // shuffled.
        onFocus={() => appState.setFocus(item)}
        autoFocus={appState.autoFocus === item}
      />
      <p tw="bg-gray-200 w-64 h-16" onClick={() => inputRef.current!.focus()}>
        {item.text}
      </p>
    </>
  );
});

function ItemComponent({ item }: { item: ItemTree }) {
  return (
    <>
      <li>
        <article className="item">
          <button
            onClick={(e) => {
              e.preventDefault();
              appState.insertNewItem(item, false);
            }}
            tabIndex={-1}
          >
            Insert before
          </button>

          <ItemInput item={item} />
          <p>
            Sort Order: {item.sortOrder} / {item.id}
          </p>
          <button
            onClick={(e) => {
              e.preventDefault();
              appState.insertNewItem(item, true);
            }}
            tabIndex={-1}
          >
            Insert after
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              appState.indent(item);
            }}
            tabIndex={-1}
          >
            Indent
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              appState.unindent(item);
            }}
            tabIndex={-1}
          >
            Unindent
          </button>
        </article>
      </li>
      <ItemList items={item.children} />
    </>
  );
}

export default observer(ItemComponent);
