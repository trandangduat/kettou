import type { Game } from "#/api/games";
import CardDurakImg from "#/assets/card-durak.png";
import DiceTerritoryImg from "#/assets/dice-territory.png";
import { SwordIcon } from "@phosphor-icons/react";
import cn from "cnfast";

const CARD_IMAGES: Record<string, string> = {
    "dice-territory": DiceTerritoryImg,
    "card-durak": CardDurakImg,
};

export interface GamesSidebarProps {
    games?: Game[];
    selectedGameId?: string;
    onSelectGame: (game: Game) => void;
}

export function GamesSidebar({
    games,
    selectedGameId,
    onSelectGame,
}: GamesSidebarProps) {
    return (
        <aside className="w-80 shrink-0 flex flex-col gap-3">
            <div className="flex items-center px-1">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Games
                </span>
            </div>

            <div className="flex flex-col gap-2">
                {games?.map((game) => {
                    const isActive = selectedGameId === game.id;
                    const thumb = CARD_IMAGES[game.id];

                    return (
                        <button
                            key={game.id}
                            onClick={() => onSelectGame(game)}
                            className={cn(
                                "group w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-all duration-200 cursor-pointer select-none",
                                isActive
                                    ? "bg-primary/10 border border-primary/25 shadow-xs"
                                    : "border border-transparent hover:bg-card/50",
                            )}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {thumb ? (
                                    <img
                                        src={thumb}
                                        alt={game.name}
                                        className={cn(
                                            "size-16 object-contain shrink-0 transition-all duration-200 ease-out group-hover:scale-105",
                                            isActive
                                                ? "grayscale-0 opacity-100"
                                                : "grayscale opacity-60 group-hover:opacity-85",
                                        )}
                                    />
                                ) : (
                                    <SwordIcon
                                        className={cn(
                                            "size-12 shrink-0 transition-colors duration-200",
                                            isActive
                                                ? "text-primary"
                                                : "text-muted-foreground/50 group-hover:text-muted-foreground/80",
                                        )}
                                    />
                                )}
                                <span
                                    className={cn(
                                        "font-space-grotesk font-bold uppercase tracking-tight text-xl truncate transition-colors duration-200",
                                        isActive
                                            ? "text-primary"
                                            : "text-muted-foreground/60 group-hover:text-foreground/90",
                                    )}
                                >
                                    {game.name}
                                </span>
                            </div>
                            {isActive && (
                                <div className="size-2 rounded-full bg-primary shrink-0 mr-1" />
                            )}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}
