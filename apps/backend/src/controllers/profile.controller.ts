import { RequestHandler } from "express";
import { getAvatarPresignedUrls, updateAvatarToDb } from "../services/profile.services.js";
import { UserAvatar } from "@mini-games/core";

export const getAvatarPresigned: RequestHandler = async (req, res) => {
    if (!req.body) {
        return res.status(400).send("No request body");
    }
    try {
        const { id: userId } = req.user;
        const { type } = req.body;
        const presignedUrls = await getAvatarPresignedUrls(userId, type);
        return res.status(200).json(presignedUrls);
    } catch (err) {
        return res.status(401).send(err.toString());
    }
};

export const updateAvatar: RequestHandler = async (req, res) => {
  if (!req.body) {
      return res.status(400).send("No request body");
  }
  try {
      const { id: userId } = req.user;
      const avaUrls: UserAvatar = req.body;
      updateAvatarToDb(userId, avaUrls);
      return res.status(200);
  } catch (err) {
      return res.status(401).send(err.toString());
  }
}
