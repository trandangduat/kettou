import { v6 as uuidv6 } from "uuid";

export interface Move {
    r: number;
    c: number;
    len: number;
}

export interface Player {
    userId: string;
    username: string;
    elo: number;
}

export interface Round {
    move: Move | null;
    diceNumber: number;
    playerId: number;
}

export interface EndGameState {
    winnerUserId: string | null;
    playerPoints: Record<string, number>;
}

export type MatchStatus = "WAITING" | "READY" | "PLAYING" | "ENDED";
export type MatchType = "CUSTOM" | "RANKED";

export interface Match {
    id: string;
    gameId: string;
    matchType: MatchType;
    status: MatchStatus;
    players: Player[];
    roundNumber: number;
    rounds: Round[];
    turn: number;
    waitingQueues: Player[];
    endState: EndGameState | null;
}

export const initMatch = ({
    gameId,
    matchType,
}: {
    gameId: string;
    matchType: MatchType;
}): Match => ({
    id: uuidv6(),
    gameId,
    matchType,
    status: "WAITING",
    players: [],
    roundNumber: 0,
    rounds: [],
    turn: 0,
    waitingQueues: [],
    endState: null,
});

export const debugMatch = (m: Match) => {
    console.log("match:", JSON.stringify(m, null, 2));
};

export const updateMatchReadyStatus = ({
    match: match,
}: {
    match: Match;
}): Match => {
    if (match.players.length === 2) {
        match = {
            ...match,
            status: "READY",
        };
    } else {
        match = {
            ...match,
            status: "WAITING",
        };
    }
    return match;
};

export const moveOnToNextRound = ({
    match: match,
}: {
    match: Match;
}): Match => {
    const totalPlayers = match.players.length;
    if (match.roundNumber > 0) {
        match = {
            ...match,
            roundNumber: match.roundNumber + 1,
            turn: (match.turn + 1) % totalPlayers,
        };
    }
    return match;
};

export const endMatch = ({ match: match }: { match: Match }): Match => {
    const { rounds } = match;
    const points: Record<string, number> = {};

    let highestScore = 0;

    for (let { playerId, move } of rounds) {
        points[playerId] ??= 0;
        points[playerId] += move ? move.len * move.len : 0;
        highestScore = Math.max(highestScore, points[playerId]);
    }

    let winners = Object.entries(points).filter(
        ([playerId, score]) => score === highestScore,
    );

    match = {
        ...match,
        status: "ENDED",
        endState: {
            winnerUserId: winners.length > 1 ? null : winners[0][0],
            playerPoints: points,
        },
    };
    return match;
};

export const addMove = ({
    match,
    move,
}: {
    match: Match;
    move: Move;
}): Match => {
    const { roundNumber, rounds } = match;
    const newRounds = [...rounds];
    newRounds[roundNumber - 1].move = move;
    match = {
        ...match,
        rounds: newRounds,
    };
    match = moveOnToNextRound({ match: match });
    return match;
};
