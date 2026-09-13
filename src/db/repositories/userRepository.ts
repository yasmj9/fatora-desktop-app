import { getDatabaseAsync } from "../client";
import { AppUser } from "../../types/user";

export const userRepository = {
  /**
   * Returns total count of registered app users.
   */
  async getUserCount(): Promise<number> {
    const db = await getDatabaseAsync();
    const rows = await db.select<{ count: number }>("SELECT COUNT(*) as count FROM app_users");
    if (rows && rows.length > 0) {
      return Number(rows[0].count) || 0;
    }
    return 0;
  },

  /**
   * Get all registered users.
   */
  async getUsers(): Promise<AppUser[]> {
    const db = await getDatabaseAsync();
    const rows = await db.select<AppUser>("SELECT * FROM app_users ORDER BY id ASC");
    return rows || [];
  },

  /**
   * Find a user by username (case-insensitive).
   */
  async getUserByUsername(username: string): Promise<AppUser | null> {
    const db = await getDatabaseAsync();
    const rows = await db.select<AppUser>(
      "SELECT * FROM app_users WHERE LOWER(username) = LOWER(?) LIMIT 1",
      [username.trim()]
    );
    if (rows && rows.length > 0) {
      return rows[0];
    }
    return null;
  },

  /**
   * Create the initial administrator user account.
   */
  async createUser(username: string, passwordHash: string, mustChangePassword = false): Promise<AppUser> {
    const db = await getDatabaseAsync();
    const cleanUsername = username.trim();
    const mustChangeVal = mustChangePassword ? 1 : 0;

    const res = await db.execute(
      "INSERT INTO app_users (username, password_hash, must_change_password, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
      [cleanUsername, passwordHash, mustChangeVal]
    );

    const newId = res.lastInsertId || 1;
    const user = await this.getUserByUsername(cleanUsername);
    if (user) return user;

    return {
      id: newId,
      username: cleanUsername,
      password_hash: passwordHash,
      must_change_password: mustChangeVal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  /**
   * Update password for a specific user and update must_change_password flag.
   */
  async updatePassword(username: string, newPasswordHash: string, mustChangePassword = false): Promise<boolean> {
    const db = await getDatabaseAsync();
    const cleanUsername = username.trim();
    const mustChangeVal = mustChangePassword ? 1 : 0;

    await db.execute(
      "UPDATE app_users SET password_hash = ?, must_change_password = ?, updated_at = datetime('now') WHERE LOWER(username) = LOWER(?)",
      [newPasswordHash, mustChangeVal, cleanUsername]
    );

    return true;
  },

  /**
   * Emergency reset: Resets user's password hash to 123456 and sets must_change_password = 1.
   */
  async emergencyResetUserPassword(username: string, resetPasswordHash: string): Promise<boolean> {
    const db = await getDatabaseAsync();
    const cleanUsername = username.trim();

    await db.execute(
      "UPDATE app_users SET password_hash = ?, must_change_password = 1, updated_at = datetime('now') WHERE LOWER(username) = LOWER(?)",
      [resetPasswordHash, cleanUsername]
    );

    return true;
  },

  /**
   * Emergency reset all: Resets all users to default password '123456' and sets must_change_password = 1.
   */
  async emergencyResetAllUsers(resetPasswordHash: string): Promise<boolean> {
    const db = await getDatabaseAsync();

    await db.execute(
      "UPDATE app_users SET password_hash = ?, must_change_password = 1, updated_at = datetime('now')",
      [resetPasswordHash]
    );

    return true;
  }
};
