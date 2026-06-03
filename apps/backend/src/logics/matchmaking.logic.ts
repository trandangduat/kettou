export type QueuePlayer = {
    userId: string;
    elo: number;
    joinedAt: number;
};

const WAIT_THRESHOLD = 3; //seconds
const ELO_EXPAND_DELTA = 50;

const getAllowedRange = (a: QueuePlayer) => {
    let waitTime = (Date.now() - a.joinedAt) / 1000;
    let totalExpands = Math.ceil(waitTime / WAIT_THRESHOLD);
    return {
        minElo: Math.max(0, a.elo - ELO_EXPAND_DELTA * totalExpands),
        maxElo: a.elo + ELO_EXPAND_DELTA * totalExpands,
    };
};

export const canMatch = (a: QueuePlayer, b: QueuePlayer) => {
    let rangeA = getAllowedRange(a);
    let rangeB = getAllowedRange(b);
    let largerMinElo = Math.max(rangeA.minElo, rangeB.minElo);
    let smallerMaxElo = Math.min(rangeA.maxElo, rangeB.maxElo);
    return smallerMaxElo >= largerMinElo;
};
