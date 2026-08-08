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
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );

        CREATE TABLE games (
            id TEXT PRIMARY KEY,
            description TEXT
        );

        CREATE TABLE matches (
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

        CREATE TABLE match_players (
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

        CREATE TABLE match_moves (
            match_id TEXT NOT NULL,
            player_id TEXT NOT NULL,
            move TEXT NOT NULL,
            move_number INTEGER NOT NULL,

            PRIMARY KEY (match_id, move_number),

            FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
            FOREIGN KEY (match_id, player_id) REFERENCES match_players(match_id, user_id)
        );

        CREATE INDEX idx_match_players_user_id ON match_players(user_id);
        CREATE INDEX idx_match_moves_player_id ON match_moves(player_id);
        `,
    },
    {
        version: 2,
        sql: `
        ALTER TABLE users ADD COLUMN elo INTEGER DEFAULT 1000;
        UPDATE users SET elo = 1000 WHERE elo IS NULL;
        `,
    },
    {
        version: 3,
        sql: `
        ALTER TABLE games ADD COLUMN rules TEXT;

        PRAGMA foreign_keys = OFF;

        CREATE TABLE new_matches (
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

        INSERT INTO new_matches (id, type, status, game_id, started_at, ended_at)
        SELECT id, type, status, game_id, started_at, ended_at FROM matches;

        DROP TABLE matches;
        ALTER TABLE new_matches RENAME TO matches;

        CREATE TABLE new_match_players (
          match_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          result TEXT,
          elo_before REAL,
          elo_after REAL,

          PRIMARY KEY (match_id, user_id),
          FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id),

          CHECK (result in ('WIN', 'LOSS', 'DRAW', 'FORFEIT'))
        );

        INSERT INTO new_match_players (match_id, user_id, result)
        SELECT match_id, user_id, result FROM match_players;
        DROP TABLE match_players;
        ALTER TABLE new_match_players RENAME TO match_players;

        PRAGMA foreign_keys = ON;

        CREATE TABLE match_game_states (
          match_id TEXT NOT NULL,
          state TEXT NOT NULL,
          end_state TEXT,

          FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
        );

        DROP TABLE match_moves;
        `,
    },
    {
        version: 4,
        sql: `
        ALTER TABLE games ADD COLUMN name TEXT NOT NULL DEFAULT '';
        `,
    },
    {
        version: 5,
        sql: `
        CREATE TABLE game_elos (
          game_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          elo REAL NOT NULL,

          PRIMARY KEY (game_id, user_id),
          FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

          CHECK (elo >= 0)
        );

        ALTER TABLE users DROP COLUMN elo;
        `,
    },
    {
        version: 6,
        sql: `
        ALTER TABLE users ADD COLUMN avatarUrls TEXT;
        `
    }
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
