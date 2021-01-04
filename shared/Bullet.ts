import ids from "./ids";

import type Item from "./Item";

export default interface Bullet {
  id: string;
  ownerEmail: string | null;
  bulletKey: string;
  itemId: string;
  parent: string | null;
  sortOrder: string;
}

export function create(userNode: Omit<Bullet, "id" | "bulletKey">): Bullet {
  return {
    ...userNode,
    id: ids(),
    bulletKey: ids(),
  };
}

export function addToTree(tree: Bullet[], bullets: Bullet[]) {
  tree.splice(0, 0, ...bullets);
  tree.sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1));
}

export function removeFromTree(
  tree: Bullet[],
  bullet: Bullet,
  items: Map<string, Item>
) {
  if (bullet.parent === null) return;

  const index = tree.findIndex((b) => b === bullet);
  tree.splice(index, 1);
  const itemInUse = tree.filter((b) => b.itemId === bullet.itemId).length > 0;
  if (!itemInUse) items.delete(bullet.itemId);
}
