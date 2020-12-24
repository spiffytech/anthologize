export interface User {
  email: string;
  scrypt: string;
  salt: string;
  lastSeen: string;
}

export interface Session {
  id: number;
  email: string;
  lastSeen: string;
}
export type NewSession = Omit<Session, "id">;
