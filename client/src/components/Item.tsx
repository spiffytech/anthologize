import { useEffect, useRef, KeyboardEvent, Fragment } from "react";
import "twin.macro";
import { observer } from "mobx-react-lite";

import "./Item.css";
import ItemList from "./ItemList";

import appState from "../lib/appState";
import type { ItemTree } from "../lib/appState";

function ItemComponent({ item }: { item: ItemTree }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.shiftKey && event.key === "Tab") {
      event.preventDefault();
      appState.unindent(item);
    } else if (event.key === "Tab") {
      event.preventDefault();
      appState.indent(item);
    } else if (event.key === "Enter") {
      event.preventDefault();
      appState.insertNewItem(item, true);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      appState.focusPrevious(item);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      appState.focusNext(item);
    } else {
      console.log(event.key);
    }
  }

  console.log("focus?", item.id, item.focus);

  useEffect(() => {
    if (item.focus) inputRef.current?.focus();
  });

  return (
    <>
      <li>
        <article>
          <button
            onClick={(e) => {
              e.preventDefault();
              appState.insertNewItem(item, false);
            }}
          >
            Insert before
          </button>

          <input
            value={item.text}
            onChange={(e) => appState.setItemText(item, e.target.value)}
            placeholder="Empty item..."
            tw="absolute -top-full focus:(static bg-red-200) w-64 h-16 block"
            ref={inputRef}
            onKeyDown={onKeyDown}
          />
          <p
            tw="bg-gray-200 w-64 h-16"
            onClick={() => inputRef.current!.focus()}
          >
            {item.text}
          </p>
          <p>
            Sort Order: {item.sortOrder} / {item.id}
          </p>
          <button
            onClick={(e) => {
              e.preventDefault();
              appState.insertNewItem(item, true);
            }}
          >
            Insert after
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              appState.indent(item);
            }}
          >
            Indent
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              appState.unindent(item);
            }}
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
