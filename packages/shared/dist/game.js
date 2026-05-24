export const createInitGameState = () => ({
    status: "WAITING",
    player1: null,
    player2: null,
    roundNumber: 0,
    rounds: [],
    turn: null,
    waitingQueues: [],
    endState: null,
});
