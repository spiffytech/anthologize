import { Context, createElement } from "@bikeshaving/crank";
import { renderer } from "@bikeshaving/crank/dom";
import axios from "axios";
import Debug from "debug";
import page from "page";

import Graph from "./lib/Graph";
import Lineage from "./lib/Lineage";
import ViewState from "./lib/ViewState";

import Item from "./components/Item";
import Login from "./components/Login";

const debug = Debug("anthologize:index");

async function* initSse(refresh: () => void) {
  while (true) {
    yield null;
    await new Promise((resolve) => {
      const sse = new EventSource("/api/app/event-bus", {
        withCredentials: true,
      });
    });
  }
}

async function* App(this: Context) {
  const debugSse = Debug("anthologize:app:sse");

  this.addEventListener("tree-changed", () => {
    this.refresh();
  });

  const graph = new Graph();
  const rootLineage = new Lineage(graph, []);
  const viewState = new ViewState({ lineage: rootLineage });

  debugSse("Connecting to event bus");
  const connectingMessage = <div>Connecting...</div>;
  yield connectingMessage;

  debugSse("Validating auth");
  const response = await fetch("/api/auth/check", { credentials: "include" });
  if (response.status >= 400) {
    debugSse("We are unauthenticated");
    page("/login");
    return;
  }
  debugSse("We are authenticated");

  let sse: EventSource;
  try {
    const initSse = () => {
      debugSse("Initializing EventSource");
      sse = new EventSource("/api/app/event-bus", {
        withCredentials: true,
      });
      sse.addEventListener("heartbeat", (event) => {
        console.log(event);
      });
      sse.onopen = () => {
        debugSse("EventSource initialized");
        this.refresh();
      };

      sse.onerror = (err) => {
        console.error(err);
        // Firefox doesn't automatically reconnect if the server closes the connection
        if (sse.readyState === 2) sse = initSse();
        this.refresh();
      };

      return sse;
    };
    sse = initSse();

    for await (let props of this) {
      if (sse.readyState === 0) {
        yield connectingMessage;
      } else if (sse.readyState === 1) {
        yield <Item lineage={rootLineage} viewState={viewState} />;
      } else {
        yield <div>Connection to the server was closed</div>;
      }
    }
  } finally {
    debugSse("closing the connection");
    sse!.close();
  }
}

function* Router(this: Context) {
  const debugRouter = Debug("anthologize:router");

  debugRouter("Initializing router");
  const routes = {
    "/": () => <App />,
    "/login": () => <Login />,
  };

  let component = <div>Loading router...</div>;

  Object.entries(routes).forEach(([route, handler]) =>
    page(route, () => {
      component = handler();
      this.refresh();
    })
  );
  page(() => {
    component = <div>404'd!!1</div>;
    this.refresh();
  });
  debugRouter("Routes defined");
  // We need page to perfom the initial dispatch, but perform it asynchronously
  // so we don't get a "we're already refreshing" erro when the route handler
  // calls this.refresh()
  requestAnimationFrame(() => {
    page.start();
    debugRouter("Router booted");
  });

  while (true) {
    debugRouter("Displaying route %O", component);
    yield component;
  }
}

debug("Rendering crank.js");
renderer.render(<Router />, document.body);
debug("Attached app to document.body");
