import { GameRegistry } from "@mini-games/core";
import {
    gameId as diceTerritoryId,
    createEngine as createDiceTerritoryEngine,
} from "@mini-games/game-dice-territory";

export const setUpGameEngines = () => {
    GameRegistry.register(diceTerritoryId, createDiceTerritoryEngine());
};
