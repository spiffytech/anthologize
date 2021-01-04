export interface User {
  id: string;
  email: string;
  scrypt: string;
  salt: string;
  lastSeen: string;
}

export interface Session {
  id: number;
  user: string;
  lastSeen: string;
}
export type NewSession = Omit<Session, "id">;
