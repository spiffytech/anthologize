import { useRef } from "react";
import "twin.macro";
import { observer } from "mobx-react-lite";

import "./Item.css";
import appState from "../lib/appState";
import type { ItemTree } from "../lib/appState";

function ItemComponent({ item }: { item: ItemTree }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
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
          value={item.value.text}
          onChange={(e) => appState.setItemText(item.value, e.target.value)}
          placeholder="Empty item..."
          tw="absolute -top-full focus:(static bg-red-200) w-64 h-16 block"
          ref={inputRef}
        />
        <p tw="bg-gray-200 w-64 h-16" onClick={() => inputRef.current!.focus()}>
          {item.value.text}
        </p>
        <p>
          Sort Order: {item.value.sortOrder} / {JSON.stringify(item.value)}
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
      </article>
    </li>
  );
}

export default observer(ItemComponent);
