export interface GameMove {
    r: number;
    c: number;
    len: number;
}

export interface Player {
    userId: string;
    username: string;
}

export interface GameRound {
    move: GameMove | null;
    diceNumber: number;
    playerId: number;
}

export interface EndGameState {
    winnerUserId: string | null;
    playerPoints: Record<string, number>;
}

export type RoomStatus = "WAITING" | "READY" | "PLAYING" | "ENDED";

export interface Room {
    gameId: string;
    status: RoomStatus;
    players: Player[];
    roundNumber: number;
    rounds: GameRound[];
    turn: number;
    waitingQueues: Player[];
    endState: EndGameState | null;
}

export const initRoom = ({ gameId }: { gameId: string }): Room => ({
    gameId,
    status: "WAITING",
    players: [],
    roundNumber: 0,
    rounds: [],
    turn: 0,
    waitingQueues: [],
    endState: null,
});

export const getRoomKey = (roomId: string) => {
    return `room:${roomId}`;
};

export const debugRoom = (room: Room) => {
    console.log("room:", JSON.stringify(room, null, 2));
};

export const updateRoomReadyStatus = ({ room }: { room: Room }): Room => {
    if (room.players.length === 2) {
        room = {
            ...room,
            status: "READY",
        };
    } else {
        room = {
            ...room,
            status: "WAITING",
        };
    }
    return room;
};

export const moveOnToNextRound = ({ room }: { room: Room }): Room => {
    const totalPlayers = room.players.length;
    if (room.roundNumber > 0) {
        room = {
            ...room,
            roundNumber: room.roundNumber + 1,
            turn: (room.turn + 1) % totalPlayers,
        };
    }
    return room;
};

export const endGame = ({ room }: { room: Room }): Room => {
    const { rounds } = room;
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

    room = {
        ...room,
        status: "ENDED",
        endState: {
            winnerUserId: winners.length > 1 ? null : winners[0][0],
            playerPoints: points,
        },
    };
    return room;
};

export const addMove = ({
    room,
    move,
}: {
    room: Room;
    move: GameMove;
}): Room => {
    const { roundNumber, rounds } = room;
    const newRounds = [...rounds];
    newRounds[roundNumber - 1].move = move;
    room = {
        ...room,
        rounds: newRounds,
    };
    room = moveOnToNextRound({ room });
    return room;
};
