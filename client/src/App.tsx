import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import "twin.macro";

import ItemList from "./components/ItemList";
import appState from "./lib/appState";

function App() {
  console.log("tree", appState.itemTree);
  console.log("items", toJS(appState.items));
  return <ItemList items={appState.itemTree} parent={null} />;
}

export default observer(App);
