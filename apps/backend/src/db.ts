import Database from "better-sqlite3";
const db = new Database("database/sqlite.db");

db.pragma("foreign_keys = ON");

db.exec(
    `
  CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      description TEXT
  );

  CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      game_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      winner_id TEXT,

      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (winner_id) REFERENCES users(id),

      CHECK (type IN ('CUSTOM', 'RANKED')),
      CHECK (status IN ('PLAYING', 'ENDED'))
  );

  CREATE TABLE IF NOT EXISTS match_players (
      match_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      player_slot INTEGER NOT NULL,
      score INTEGER,
      result TEXT,

      PRIMARY KEY (match_id, user_id),
      UNIQUE (match_id, player_slot),

      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),

      CHECK (result in ('WIN', 'LOSS', 'DRAW', 'FORFEIT'))
  );

  CREATE TABLE IF NOT EXISTS match_moves (
      match_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      move TEXT NOT NULL,
      move_number INTEGER NOT NULL,

      PRIMARY KEY (match_id, move_number),

      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (match_id, player_id) REFERENCES match_players(match_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_match_players_user_id ON match_players(user_id);
  CREATE INDEX IF NOT EXISTS idx_match_moves_player_id ON match_moves(player_id);
`,
);

db.prepare(`INSERT OR IGNORE INTO games(id, description) VALUES (?, ?)`).run(
    "dice-territory",
    "Dice territory description",
);

export default db;
