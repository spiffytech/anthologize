import ids from "./ids";

export default interface Item {
  id: string;
  body: string;
  owner: string;
}

export function create(owner: string, body?: string): Item {
  return {
    id: ids(),
    owner,
    body: body ?? "",
  };
}
