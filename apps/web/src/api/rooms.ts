const getAllRoomsOfGame = async (gameId: string) => {
    try {
        const res = await fetch(`/api/games/${gameId}/rooms`);
        const rooms = await res.json();
        return rooms;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const getRoom = async (roomId: string) => {
    try {
        const res = await fetch(`/api/rooms/${roomId}`);
        const room = await res.json();
        return room;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export { getAllRoomsOfGame, getRoom };
