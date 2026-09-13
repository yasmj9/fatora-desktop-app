export interface AppUser {
  id: number;
  username: string;
  password_hash: string;
  must_change_password: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: number;
  username: string;
  must_change_password: boolean;
}
