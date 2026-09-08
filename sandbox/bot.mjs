import http from "http";
import { calculateBoards } from "../packages/game-dice-territory/src/logic.js";
import { BOARD_WIDTH, BOARD_HEIGHT } from "../packages/game-dice-territory/src/constants.js";
import { redis } from "../apps/backend/src/redis.js";

const matchId = process.argv[2] || "eQgo5NVz";
const myUserId = "kusssso";

function sendDaemonRequest(reqPath, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const req = http.request({
            socketPath: "/tmp/kettoud.sock",
            path: reqPath,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data),
            },
        }, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });
        req.on("error", reject);
        req.write(data);
        req.end();
    });
}

function evaluateMove(matchState, playerId, move) {
    const L = move.len;
    const simulatedMatch = {
        gameState: {
            rounds: [
                ...matchState.gameState.rounds,
                { playerId, diceNumber: L, move }
            ]
        }
    };

    let mobilityScore = 0;
    for (let d = 1; d <= 4; d++) {
        const nextBoards = calculateBoards(BOARD_WIDTH, BOARD_HEIGHT, simulatedMatch, playerId, d);
        mobilityScore += nextBoards.countValidMoves;
    }

    const advancementScore = move.r + L - 1;
    const centerColDist = Math.abs((move.c + (L - 1) / 2) - 6.5);
    const centerScore = 6.5 - centerColDist;

    return mobilityScore * 2.0 + advancementScore * 5.0 + centerScore * 1.5;
}

function pickBestMove(matchState, playerId, diceNumber) {
    const { isAValidMove, countValidMoves } = calculateBoards(
        BOARD_WIDTH,
        BOARD_HEIGHT,
        matchState,
        playerId,
        diceNumber
    );

    if (countValidMoves === 0) return null;

    let bestMove = null;
    let bestScore = -Infinity;

    for (let r = 1; r <= BOARD_HEIGHT; r++) {
        for (let c = 1; c <= BOARD_WIDTH; c++) {
            if (isAValidMove[r][c]) {
                const move = { r, c, len: diceNumber };
                const score = evaluateMove(matchState, playerId, move);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
        }
    }

    return bestMove;
}

function printBoard(matchState) {
    const { board } = calculateBoards(BOARD_WIDTH, BOARD_HEIGHT, matchState, myUserId, 1);
    console.log("\n--- Current Board (kusssso=■, opponent=□) ---");
    for (let r = BOARD_HEIGHT; r >= 1; r--) {
        let line = String(r).padStart(2, " ") + " |";
        for (let c = 1; c <= BOARD_WIDTH; c++) {
            const val = board[r][c];
            if (val === 1) line += " ■";
            else if (val === 2) line += " □";
            else line += " .";
        }
        console.log(line);
    }
    console.log("     " + Array.from({length: BOARD_WIDTH}, (_, i) => String(i + 1).padStart(2, " ")).join(""));
    console.log("---------------------------------------------\n");
}

let isActing = false;

async function checkAndPlay() {
    if (isActing) return;
    try {
        const raw = await redis.get(`match:${matchId}`);
        if (!raw) {
            console.log(`[Bot] Match ${matchId} not found in redis.`);
            return;
        }
        const matchState = JSON.parse(raw);
        const { status, players, gameState } = matchState;

        if (status === "WAITING") {
            return;
        }

        if (status === "READY") {
            const isHost = players[0]?.userId === myUserId;
            if (isHost) {
                isActing = true;
                console.log(`[Bot] Both players connected! Starting match ${matchId}...`);
                await sendDaemonRequest("/match/start", matchId);
                console.log(`[Bot] Match started!`);
                isActing = false;
            }
            return;
        }

        if (status === "ENDED") {
            console.log(`[Bot] Match ${matchId} ended!`);
            console.log(`[Bot] Result:`, JSON.stringify(matchState.endState, null, 2));
            printBoard(matchState);
            process.exit(0);
        }

        if (status === "PLAYING") {
            const currentTurnPlayer = players[gameState.turn]?.userId;
            if (currentTurnPlayer !== myUserId) {
                return;
            }

            const rounds = gameState.rounds || [];
            const lastRound = rounds[rounds.length - 1];

            const needToRoll = (
                rounds.length === 0 ||
                lastRound.playerId !== myUserId ||
                lastRound.move !== null
            );

            if (needToRoll) {
                isActing = true;
                console.log(`[Bot] It is my turn! Rolling dice...`);
                await sendDaemonRequest("/match/action", {
                    matchId,
                    action: { type: "ROLL_DICE" },
                });
                isActing = false;
                return;
            }

            if (lastRound && lastRound.playerId === myUserId && lastRound.move === null) {
                const diceNumber = lastRound.diceNumber;
                console.log(`[Bot] Rolled dice: ${diceNumber}. Calculating best move...`);
                const bestMove = pickBestMove(matchState, myUserId, diceNumber);
                if (!bestMove) {
                    console.log(`[Bot] No valid moves available for len ${diceNumber}. Turn will skip.`);
                    return;
                }

                isActing = true;
                console.log(`[Bot] Placing square at (r: ${bestMove.r}, c: ${bestMove.c}, len: ${bestMove.len})...`);
                await sendDaemonRequest("/match/action", {
                    matchId,
                    action: {
                        type: "MOVE",
                        move: bestMove,
                    },
                });
                console.log(`[Bot] Move submitted successfully!`);
                printBoard(matchState);
                isActing = false;
            }
        }
    } catch (err) {
        console.error(`[Bot Error]:`, err);
        isActing = false;
    }
}

console.log(`[Bot] Watching match ${matchId} for player ${myUserId}...`);
setInterval(checkAndPlay, 800);
