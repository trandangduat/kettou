import Database from "better-sqlite3";
const db = new Database("./database/sqlite.db");

db.pragma("foreign_keys = ON");

db.exec(
    `
  CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      description TEXT
  );

  CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      player1_id INTEGER,
      player2_id INTEGER,

      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id),

      CHECK (player1_id <> player2_id)
  );
`,
);

db.prepare(`INSERT OR IGNORE INTO games(id, description) VALUES (?, ?)`).run(
    "dice-territory",
    "Dice territory description",
);

export default db;
