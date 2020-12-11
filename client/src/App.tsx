import { observer } from "mobx-react-lite";
import "twin.macro";

import ItemList from "./components/ItemList";
import appState from "./lib/appState";

function App() {
  return <ItemList items={appState.items} />;
}

export default observer(App);
