import { useRef } from "react";
import "twin.macro";
import { observer } from "mobx-react-lite";

import "./Item.css";
import appState from "../lib/appState";
import type { Item } from "../lib/item";

function ItemComponent({ item }: { item: Item }) {
  const [previous, next] = appState.siblings.get(item)!;

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <li>
      <article>
        <button
          onClick={(e) => {
            e.preventDefault();
            appState.insertNewItem(previous, item);
          }}
        >
          Insert before
        </button>

        <input
          value={item.text}
          onChange={(e) => (item.text = e.target.value)}
          placeholder="Empty item..."
          tw="absolute -top-full focus:(static bg-red-200) w-64 h-16 block"
          ref={inputRef}
        />
        <p tw="bg-gray-200 w-64 h-16" onClick={() => inputRef.current!.focus()}>
          {item.text}
        </p>
        <button
          onClick={(e) => {
            e.preventDefault();
            appState.insertNewItem(item, next);
          }}
        >
          Insert after
        </button>
      </article>
    </li>
  );
}

export default observer(ItemComponent);
