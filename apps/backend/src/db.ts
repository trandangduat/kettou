import Database from "better-sqlite3";
const db = new Database("database/sqlite.db");

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const migrations = [
    {
        version: 1,
        sql: `
          CREATE TABLE users (
              id TEXT PRIMARY KEY,
              password TEXT NOT NULL,
              avatarUrls TEXT
          );

          CREATE TABLE games (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL DEFAULT '',
              description TEXT,
              rules TEXT
          );

          CREATE TABLE matches (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              status TEXT NOT NULL,
              game_id TEXT NOT NULL,
              started_at TEXT NOT NULL,
              ended_at TEXT,

              FOREIGN KEY (game_id) REFERENCES games(id),

              CHECK (type IN ('CUSTOM', 'RANKED')),
              CHECK (status IN ('PLAYING', 'ENDED'))
          );

          CREATE TABLE match_players (
              match_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              result TEXT,
              elo_before REAL,
              elo_after REAL,

              PRIMARY KEY (match_id, user_id),

              FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
              FOREIGN KEY (user_id) REFERENCES users(id),

              CHECK (result IN ('WIN', 'LOSS', 'DRAW', 'FORFEIT'))
          );

          CREATE TABLE match_game_states (
              match_id TEXT NOT NULL,
              state TEXT NOT NULL,
              end_state TEXT,

              FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
          );

          CREATE TABLE game_elos (
              game_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              elo REAL NOT NULL,

              PRIMARY KEY (game_id, user_id),
              FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

              CHECK (elo >= 0)
          );

          CREATE INDEX idx_match_players_user_id ON match_players(user_id);
          `,
    },
];

const migrate = db.transaction(() => {
    for (const migration of migrations) {
        const { version, sql } = migration;
        const checkExistVersion = db
            .prepare(`SELECT 1 FROM migrations WHERE version = ?`)
            .get(version);

        if (!checkExistVersion) {
            db.exec(sql);
            db.prepare(`INSERT INTO migrations(version) VALUES (?)`).run(
                version,
            );
        }
    }
});

migrate();

const games = [
    {
        id: "dice-territory",
        name: "Dice Territory",
        description: "Dice territory game",
        rules: "this is dice territory rules",
    },
    {
        id: "card-durak",
        name: "Durak",
        description: "Durak card game",
        rules: "this is durak rules",
    },
];

for (const game of games) {
    db.prepare(
        `INSERT INTO games(id, name, description, rules)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          rules = excluded.rules`,
    ).run(game.id, game.name, game.description, game.rules);
}

export default db;
