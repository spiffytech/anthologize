import "twin.macro";
import { observer } from "mobx-react-lite";

import ItemComponent from "./Item";
import appState from "../lib/appState";
import type { Item } from "../lib/item";

function ItemList({ items, parent }: { items: Item[]; parent: string | null }) {
  return (
    <ul>
      {items.map((item) =>
        item.parent !== parent ? (
          <ItemList items={items} parent={item.parent} key={item.id} />
        ) : (
          <ItemComponent item={item} key={item.id} />
        )
      )}
      <button
        onClick={(e) => {
          e.preventDefault();
          appState.insertNewItem(items[items.length - 1], null);
        }}
      >
        Add to end of list
      </button>
    </ul>
  );
}

export default observer(ItemList);
