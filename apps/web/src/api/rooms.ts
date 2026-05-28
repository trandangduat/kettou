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

export { getRoom };
