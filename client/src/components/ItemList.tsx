import React from "react";
import "twin.macro";
import { observer } from "mobx-react-lite";

import ItemComponent from "./Item";
import appState from "../lib/appState";
import type { ItemTree } from "../lib/appState";
//import type { Item } from '../lib/item';

function ItemList({
  items,
  parent,
}: {
  items: ItemTree[];
  parent: ItemTree | null;
}) {
  console.log(
    "children",
    items.map((item) => item.children)
  );
  return (
    <ul tw="ml-8">
      {items.map((item) => (
        <React.Fragment key={item.value.id}>
          <ItemComponent item={item} key={item.value.id + "-item"} />
          {item.children.length > 0 ? (
            <ItemList
              items={item.children}
              parent={item}
              key={item.value.id + "-children"}
            />
          ) : null}
        </React.Fragment>
      ))}
      <button
        onClick={(e) => {
          e.preventDefault();
          appState.insertNewItem(items[items.length - 1] ?? null, true);
        }}
      >
        Add to end of list
      </button>
    </ul>
  );
}

export default observer(ItemList);
