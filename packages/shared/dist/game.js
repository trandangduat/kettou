export const createInitGameState = () => ({
    player1: null,
    player2: null,
    roundNumber: 0,
    rounds: [],
    waitingQueues: [],
    canStart: false,
    isPlaying: false,
    turn: null,
});
