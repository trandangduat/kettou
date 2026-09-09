---
name: kettou-cli
description: Use when user wants to play a duel (1v1) game with you.
---

# Games Catalog

## Dice Territory
### Id 
`dice-territory`
  
### Rules
- Gameboard size is 12x12 (144 cells).
- Players take turns rolling a die and placing a square.
- The rolled number represents the side length of the square to place.
- For the first move, the square must touch the bottom of the board (row 1).
- For subsequent moves, the square must share at least one edge with a previously claimed square by the same player.
- The square must sit inside the board and cannot overlap any previously claimed cells by either player.
- If no valid move can be placed, the turn is skipped automatically.
- The game ends when both players consecutively cannot make a valid move. The player with the highest total claimed area wins.

### State Snapshot
```jsonc
{
  // Current round number (starts at 1)
  "roundNumber": 1,
  // Index of the player whose turn it is (0 or 1)
  "turn": 0,
  // History of rounds played
  "rounds": [
    {
      // ID of the player for this round
      "playerId": "user-1",
      // Number rolled on the dice (1 to 6)
      "diceNumber": 3,
      // Placed square, or null if skipped or not yet placed
      "move": {
        // 1-based row of the square's bottom edge (1 to 12)
        "r": 1,
        // 1-based column of the square's left edge (1 to 12)
        "c": 1,
        // Side length of the square (matches diceNumber)
        "len": 3
      }
    }
  ]
}
```

### Actions
- **Roll Dice**: Roll the dice at the start of your turn.
  ```json
  { "type": "ROLL_DICE" }
  ```
- **Place Square**: Place a square of length `len` at bottom-left position `(r, c)`.
  ```json
  {
    "type": "MOVE",
    "move": {
      "r": 1,
      "c": 1,
      "len": 3
    }
  }
  ```

## Card Durak
### Id 
`card-durak`

## Rules
- Follow the rules of Card Durak.

# Match State
```jsonc
{
  // Unique match identifier
  "id": "eQgo5NVz",
  // ID of the game being played (e.g. "dice-territory", "card-durak")
  "gameId": "dice-territory",
  // Type of match: "CUSTOM" or "RANKED"
  "matchType": "CUSTOM",
  // Match lifecycle status: "WAITING" | "READY" | "PLAYING" | "ENDED"
  // - WAITING: waiting for players to join
  // - READY: all players joined, ready to start (host can start)
  // - PLAYING: game is in progress
  // - ENDED: game has completed
  "status": "PLAYING",
  // List of players in the match (players[0] is the host)
  "players": [
    {
      // Unique user ID of the player
      "userId": "user-1",
      // Player's ELO rating for this game
      "elo": 1200,
      // Player connection status: "ONLINE" | "OFFLINE"
      "status": "ONLINE"
    }
  ],
  // Game-specific state object (refer to State Snapshot under Games Catalog)
  "gameState": {
    // Dynamic game state. Each game may have its own state schema.
  },
  // Result details when match concludes (null or undefined while match is ongoing)
  "endState": {
    // User ID of the winning player, or null if the match is a draw
    "winnerId": "user-1",
    // Reason why the match ended (e.g. "BOTH_IMMOVABLE", "EMPTY_HAND", "FORFEIT", "PLAYER_DISCONNECTED")
    "reason": "BOTH_IMMOVABLE",
    // Final scores mapped by player userId (optional, game-dependent)
    "scores": {
      "user-1": 42,
      "user-2": 35
    }
  },
  // Unix timestamp (in milliseconds) when the match was created
  "createdAt": 1715000000000
}
```

# Interactive Flow 
You MUST NOT inspect any of the code inside this directory and its parents.

## Runtime Protocol

- Treat `/tmp/kettoud.log` as an event stream. Keep a persistent `lastReadLine` cursor: read existing lines once, then only read and process new lines in order. If the log is binary, use an incremental byte cursor preserving complete newline-delimited records; never reread the full log or run full-file `strings` on each poll.
- Read the log immediately after daemon startup and every CLI action. While waiting, wait exactly 3 seconds between incremental reads. Never use a longer sleep, `tail -f`, or an arbitrary maximum wait; continue until `ENDED`, the user leaves/stops, or the daemon fails. A shell/tool timeout is not a game timeout.
- Report meaningful events such as joins, readiness, turn changes, skips, actions, and completion; do not report empty polls.
- In Dice Territory, `move: null` is ambiguous: after `ROLL_DICE` it can mean the rolled move is still awaiting placement, not that the turn was skipped. Treat it as skipped only when the action acknowledgement reports a skip or a subsequent state update advances the turn/round without a move. If the same player's turn remains active after a roll, choose and submit `MOVE` before rolling again.

### Daemon
Run daemon cleanup as a separate command/tool call. Never combine it with daemon startup, because `pkill -f kettou` can match the shell command that is about to start the daemon:
```bash
pkill -f kettou
```

Immediately start the daemon in the background (required to connect to game server and receive game updates):
```bash
nohup ./kettou daemon start </dev/null > /tmp/kettoud.log 2>&1 &
```

Read `/tmp/kettoud.log` immediately after startup. Once `Daemon started` is present, proceed with match creation or joining; do not wait for an arbitrary additional startup period. Always continue watching the daemon log and act on events. For example, after creating a match, a `READY` update means a player joined and the host should start the match immediately.

### Match

If the user asked to create a new match, use:
```bash
./kettou create-match --gameId $gameId
```
Replace `$gameId` with the ID of the game you want to play. Refer to `Games Catalog` for available game IDs.
After creating a match, display the match ID to the user in a ASCII box so they can join.

Do not wait for the second player before displaying the match ID. Continue the fixed 3-second log polling loop while the match is `WAITING`.

If the user asked to join an existing match, use:
```bash
./kettou match join --matchId $matchId
```

To start a match if you are the host, use:
```bash
./kettou match start --matchId $matchId
```

To take an action, use:
```bash
./kettou match action --matchId $matchId --action '<action_json>'
```
For available actions for each game, refer to the `Games Catalog`.

After each action, read the daemon log immediately, then continue polling it every 3 seconds. When the log reports that it is this agent's turn, act without an extra backoff. When it reports `ENDED`, announce the result and stop polling that match.

To leave a match, use:
```bash
./kettou match leave --matchId $matchId
```
