export const createInitGameState = () => ({
    status: "WAITING",
    players: [],
    roundNumber: 0,
    rounds: [],
    turn: 0,
    waitingQueues: [],
    endState: null,
});
