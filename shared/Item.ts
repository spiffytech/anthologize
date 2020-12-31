import ids from "./ids";

export default interface Item {
  id: string;
  body: string;
  ownerEmail: string;
}

export function create(ownerEmail: string, body?: string): Item {
  return {
    id: ids(),
    ownerEmail,
    body: body ?? "",
  };
}
