import type Bullet from "../shared/Bullet";
import type Item from "../shared/Item";

export default abstract class Action<T> {
  constructor(
    protected bullets: Bullet[],
    protected items: Map<string, Item>
  ) {}

  abstract run(): T;
  abstract serialize(): Record<string, unknown> & { action: string };
}
