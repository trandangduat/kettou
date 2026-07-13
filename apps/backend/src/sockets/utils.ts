export const getUserRoomKey = (userId: string) => `user:${userId}`;
export const getLobbyRoomKey = (gameId: string) => `lobby:${gameId}`;
export const getMatchmakingRoomKey = (gameId: string) => `matchmaking:${gameId}`;
