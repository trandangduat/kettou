import { RequestHandler } from "express";
import db from "../db.js";
import { v6 as uuidv6 } from "uuid";

export const getRoomDetails: RequestHandler = (req, res) => {
    const { roomId } = req.params;
    const room = db.prepare(`SELECT * FROM rooms WHERE id = ?`).get(roomId);
    res.json(room);
};

export const createNewRoom: RequestHandler = (req, res) => {
    const { gameId } = req.params;
    const roomdId = uuidv6();
    const userId = req.user.userId;
    try {
        db.prepare(
            `INSERT INTO rooms(id, game_id, player1_id) VALUES (?, ?, ?)`,
        ).run(roomdId, gameId, userId);
        res.json({
            message: "Room created successfully",
            roomId: roomdId,
        });
    } catch (err) {
        return res.status(500).send(err);
    }
};
