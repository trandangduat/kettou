import { GameRegistry } from "@mini-games/core";
import { gameDefinition as diceTerritory } from "@mini-games/game-dice-territory";
import { gameDefinition as durak } from "@mini-games/game-card-durak";
import { MatchView as DiceTerritoryMatchView } from "./dice-territory/match-view";
import { MatchView as DurakMatchView } from "./card-durak/match-view";

export const setUpGameEngines = () => {
    GameRegistry.register(diceTerritory.id, diceTerritory.createEngine());
    GameRegistry.register(durak.id, durak.createEngine());
};

export const GameUI = {
    [diceTerritory.id]: DiceTerritoryMatchView,
    [durak.id]: DurakMatchView,
};
