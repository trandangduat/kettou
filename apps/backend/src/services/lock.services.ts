import { Mutex } from "async-mutex";

const matchLocks = new Map<string, Mutex>();

export const getLock = (matchId: string): Mutex => {
    if (!matchLocks.has(matchId)) {
        matchLocks.set(matchId, new Mutex());
    }
    return matchLocks.get(matchId)!;
};

export const withMatchLock = async<T>(matchId: string, fn: () => Promise<T>): Promise<T> => {
    const mutex = getLock(matchId);
    return await mutex.runExclusive(fn);
};

export const removeMatchLock = (matchId: string): void => {
    matchLocks.delete(matchId);
};
