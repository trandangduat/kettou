import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import type { Player } from "@mini-games/core";

export interface PlayerSlotProps {
    player?: Player;
    isHost?: boolean;
}

export function PlayerSlot({ player, isHost }: PlayerSlotProps) {
    return (
        <div className="flex flex-col items-center gap-1 w-20">
            <div className="relative">
                <Avatar className="size-13">
                    {player ? (
                        <AvatarImage src={player.avatarUrls?.small} />
                    ) : (
                            <AvatarFallback className="bg-muted/50 text-muted-foreground text-lg">
                            ?
                        </AvatarFallback>
                    )}
                </Avatar>
                {isHost && (
                    <span
                        className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-foreground/80 ring-2 ring-card"
                        title="Host"
                    />
                )}
            </div>
            <span className="text-sm font-space-grotesk tracking-tight font-bold truncate max-w-full text-center">
                {player ? (
                    player.userId
                ) : (
                    <span className="text-muted-foreground/40 italic">open slot</span>
                )}
            </span>
        </div>
    );
}
