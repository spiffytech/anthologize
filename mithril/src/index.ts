import Debug from "debug";
import m from "mithril";

import ActionManager from "./lib/ActionManager";
import ViewState from "./lib/ViewState";

import type Item from "./lib/shared/Item";
import type Bullet from "./lib/shared/Bullet";

import ListComponent from "./components/List";
import Login from "./components/Login";

async function initSse(
  onConnecting: (close: () => void) => void,
  onCreate: (sse: EventSource) => void
) {
  const debugSse = Debug("anthologize:app:sse");

  function init() {
    debugSse("Connecting to event bus");
    const sse = new EventSource("/api/app/event-bus", {
      withCredentials: true,
    });
    sse.addEventListener("heartbeat", () => {
      debugSse("Received heartbeat");
    });
    sse.onopen = () => {
      debugSse("EventSource initialized");
      onCreate(sse);
    };

    sse.onerror = (err) => {
      debugSse("error: %O", err);
      onConnecting(() => {
        debugSse("Closing...");
        sse.close();
      });
      // Firefox doesn't automatically reconnect if the server closes the connection
      if (sse.readyState === 2) {
        initSse(onConnecting, onCreate);
      }
    };
  }
  init();
}

function App(): m.Component {
  const debug = Debug("anthologize:app");

  let connecting = true;

  const items: Map<string, Item> = new Map();
  const bullets: Bullet[] = [];

  const actionManager = new ActionManager();

  const viewState = new ViewState({ tree: bullets, items, ownerEmail: "" });

  let closeSse: () => unknown = () => null;

  return {
    view() {
      if (connecting) {
        return m("", "Connecting...");
      }

      if (bullets.length === 0) {
        return m("", "Loading data...");
      }
      return m(ListComponent, {
        tree: bullets,
        treeIndex: 0,
        items: items,
        viewState: viewState,
        actionManager: actionManager,
      });
    },

    async oncreate() {
      debug("Validating auth");
      const response = await fetch("/api/auth/check", {
        credentials: "include",
      });
      if (response.status >= 400) {
        debug("We are unauthenticated");
        m.route.set("/login");
        return;
      }
      debug("We are authenticated");

      initSse(
        (close) => {
          closeSse = close;
          connecting = true;
          m.redraw();
        },
        (sse) => {
          sse.addEventListener("all-data", ((event: MessageEvent) => {
            const {
              bullets: bulletsIn,
              items: itemsIn,
            }: { bullets: Bullet[]; items: Item[] } = JSON.parse(event.data);
            console.log(bulletsIn, itemsIn);
            bullets.splice(0, 0, ...bulletsIn);
            itemsIn.forEach((item) => items.set(item.id, item));
            m.redraw();
          }) as any);

          connecting = false;
          //m.redraw();
        }
      );
    },

    onbeforeremove() {
      closeSse();
    },
  };
}

m.route(document.getElementById("app")!, "/", {
  "/": App,
  "/login": Login,
});
