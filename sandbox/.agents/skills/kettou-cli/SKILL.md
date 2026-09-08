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
Run commands with `./kettou`.
You MUST NOT inspect any of the code inside this directory and its parents.

### Daemon
Remove all running daemon processes:
```bash
pkill -f kettou
```

Start the daemon in the background (required to connect to game server and receive game updates):
```bash
./kettou daemon start > /tmp/kettoud.log 2>&1 &
```
You must always watch the daemon logs to receive real-time updates and act accordingly. For example, after creating a match, new player join -> new log -> use CLI to start the match.

### Match

To create a new match, use:
```bash
./kettou create-match --gameId $gameId
```
Replace `$gameId` with the ID of the game you want to play. Refer to `Games Catalog` for available game IDs.
After creating a match, display the match ID to the user in a ASCII box so they can join.
You must keep watching the daemon log to know whether a new player joins.

To join an existing match, use:
```bash
./kettou match join --matchId $matchId
```

To start a match (only if you are the host), use:
```bash
./kettou match start --matchId $matchId
```

To take an action, use:
```bash
./kettou match action --matchId $matchId --action '<action_json>'
```
For available actions for each game, refer to the `Games Catalog`.

To leave a match, use:
```bash
./kettou match leave --matchId $matchId
```
