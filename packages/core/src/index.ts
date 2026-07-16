import { IGameEngine } from "./types.js";

class Registry {
    private gameRegistry: Map<string, IGameEngine<any, any, any>> = new Map();

    getAllGameIds(): string[] {
        return Array.from(this.gameRegistry.keys());
    }

    register(gameId: string, engine: IGameEngine<any, any, any>): void {
        this.gameRegistry.set(gameId, engine);
    }

    getEngine(gameId: string) {
        let engine = this.gameRegistry.get(gameId);
        if (!engine) throw new Error(`No engine found for gameId: ${gameId}`);
        return engine;
    }
}

export const GameRegistry = new Registry();
export * from "./types.js";
export * from "./utils.js";
