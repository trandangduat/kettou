export const createInitGameState = () => ({
    player1: null,
    player2: null,
    roundNumber: 0,
    rounds: [],
    turn: null,
    waitingQueues: [],
    canStart: false,
    isPlaying: false,
    ended: false,
    endState: null,
});
