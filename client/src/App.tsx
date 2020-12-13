import { observer } from "mobx-react-lite";
import "twin.macro";

import Item from "./components/Item";
import { appState } from "./lib/appState";

function App() {
  return (
    <>
      <ul>
        <Item item={appState.tree} />
      </ul>
      <button
        onClick={(e) => {
          e.preventDefault();
          appState.insertNewItem(appState.tree, true);
        }}
      >
        Add to end of list
      </button>
    </>
  );
}

export default observer(App);
