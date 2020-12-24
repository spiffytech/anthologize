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

async function* App(this: Context) {
  const debugSse = Debug("anthologize:app:sse");

  this.addEventListener("tree-changed", () => {
    this.refresh();
  });

  const graph = new Graph();
  const rootLineage = new Lineage(graph, []);
  const viewState = new ViewState({ lineage: rootLineage });

  debugSse("Connecting to event bus");
  yield <div>Connecting...</div>;

  let sse: EventSource | null = null;
  try {
    while (true) {
      try {
        try {
          debugSse("Validating auth");
          await axios.get("/api/auth/check", { withCredentials: true });
          debugSse("We are authenticated");
        } catch {
          debugSse("We are unauthenticated");
          page("/login");
          return;
        }

        debugSse("Initializing EventSource");
        sse = await new Promise<EventSource>((resolve, reject) => {
          const sse = new EventSource("/api/app/event-bus", {
            withCredentials: true,
          });
          sse.onmessage = (event) => {
            console.log(event);
          };
          sse.onopen = () => resolve(sse);

          sse.onerror = reject;
        });
        debugSse("EventSource initialized");

        yield <Item lineage={rootLineage} viewState={viewState} />;
        for await (let props of this) {
          yield <Item lineage={rootLineage} viewState={viewState} />;
        }
      } catch (ex) {
        debugSse("EventSource promise rejected with %O", ex);
        yield <div>We can't connect to the server right now</div>;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  } finally {
    sse?.close();
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
