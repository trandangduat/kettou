import type { DurakEngine, MatchState } from "@mini-games/game-card-durak";
import type { Dispatch, SetStateAction } from "react";

type MatchViewParams = {
    match: MatchState;
    setMatch: Dispatch<SetStateAction<MatchState>>;
    user: any;
    engine: DurakEngine;
};

export function MatchView({ match, setMatch, user, engine }: MatchViewParams) {
    return <>This is Durak match view</>;
}
