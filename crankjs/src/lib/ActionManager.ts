import Action from "./Action";

export default class ActionManager {
  private history: Action<unknown>[] = [];

  perform<T>(
    action: Action<T>,
    optimisticCb: (val: T) => void = () => undefined
  ) {
    optimisticCb(action.run());

    this.history.push(action);
  }
}
