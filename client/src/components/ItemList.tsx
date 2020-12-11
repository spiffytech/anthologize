import React from "react";
import "twin.macro";
import { observer } from "mobx-react-lite";

import ItemComponent from "./Item";
import type { ItemTree } from "../lib/appState";

function ItemList({ items }: { items: ItemTree[] }) {
  if (items.length === 0) return null;

  return (
    <ul tw="ml-8">
      {items.map((item) => (
        <ItemComponent item={item} key={item.id + "-item"} />
      ))}
    </ul>
  );
}

export default observer(ItemList);
