import "twin.macro";
import { observer } from "mobx-react-lite";

import ItemComponent from "./Item";
import appState from "../lib/appState";
import type { Item } from "../lib/item";

function ItemList({
  items,
  parentId,
}: {
  items: Item[];
  parentId: string | null;
}) {
  return (
    <ul tw="ml-8">
      {items.map((item) =>
        item.parent !== parentId ? (
          <ItemList
            items={items.filter((i) => i.parent === item.parent)}
            parentId={item.parent}
            key={item.id}
          />
        ) : (
          <ItemComponent item={item} key={item.id} />
        )
      )}
      <button
        onClick={(e) => {
          e.preventDefault();
          appState.insertNewItem(items[items.length - 1], null, true);
        }}
      >
        Add to end of list
      </button>
    </ul>
  );
}

export default observer(ItemList);
