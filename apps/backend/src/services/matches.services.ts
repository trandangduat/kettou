import { Round, Player, Room, MatchType } from "shared";
import db from "../db.js";

export const createMatch = ({
    room,
    type,
    startedAt,
}: {
    room: Room;
    type: MatchType;
    startedAt: number;
}) => {
    const { id, gameId, players } = room;

    // create match
    db.prepare(
        `INSERT INTO matches(id, type, status, game_id, started_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(id, type, "PLAYING", gameId, startedAt);

    // insert match players
    const insertPlayer = db.prepare(
        `INSERT INTO match_players (match_id, user_id, player_slot) VALUES (?, ?, ?)`,
    );
    const insertManyPlayers = db.transaction((players: Player[]) => {
        for (let i = 0; i < players.length; i++) {
            insertPlayer.run(id, players[i].userId, i);
        }
    });
    insertManyPlayers(players);
};

export const saveEndedMatch = ({
    room,
    endedAt,
}: {
    room: Room;
    endedAt: number;
}) => {
    const { id, status, endState, rounds } = room;
    const { winnerUserId, playerPoints } = endState;

    // update match status
    db.prepare(
        `UPDATE matches SET status = ?, ended_at = ?, winner_id = ? WHERE id = ?`,
    ).run(status, endedAt, endState.winnerUserId, id);

    // update players status
    const updatePlayer = db.prepare(`
      UPDATE match_players SET score = ?, result = ? WHERE match_id = ? AND user_id = ?`);

    const updateManyPlayers = db.transaction(
        (playerPoints: Record<string, number>) => {
            for (let playerId in playerPoints) {
                let score = playerPoints[playerId];
                let isDraw = !winnerUserId;
                let isWinner = playerId === winnerUserId;
                let result = isDraw ? "DRAW" : isWinner ? "WIN" : "LOSS";
                updatePlayer.run(score, result, id, playerId);
            }
        },
    );
    updateManyPlayers(playerPoints);

    // insert players moves
    const insertMove = db.prepare(
        `INSERT INTO match_moves(match_id, player_id, move, move_number) VALUES (?, ?, ?, ?)`,
    );
    const insertManyMoves = db.transaction((rounds: Round[]) => {
        for (let i = 0; i < rounds.length; i++) {
            const { move, playerId } = rounds[i];
            insertMove.run(id, playerId, JSON.stringify(move), i);
        }
    });
    insertManyMoves(rounds);
};
