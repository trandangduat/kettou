import { Button } from "#/components/ui/button";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";

export interface BrowseHeaderProps {
    gameName?: string;
    roomCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onCreateMatch: () => void;
}

export function BrowseHeader({
    gameName,
    roomCount,
    searchQuery,
    onSearchChange,
    onCreateMatch,
}: BrowseHeaderProps) {
    return (
        <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-start gap-1">
                <h1 className="font-space-grotesk text-3xl font-bold uppercase tracking-tight text-foreground">
                    {gameName}
                </h1>
                <span className="text-sm text-muted-foreground">
                    {roomCount} rooms
                </span>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative">
                    <MagnifyingGlassIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search room..."
                        className="h-9 pl-9 pr-3 rounded-lg bg-card border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-border focus:ring-1 focus:ring-ring/40 transition w-44 focus:w-56"
                    />
                </div>

                <Button
                    onClick={onCreateMatch}
                    className="font-semibold gap-1.5 h-9 px-4 rounded-lg cursor-pointer"
                >
                    <PlusIcon className="size-4" weight="bold" />
                    <span>create match</span>
                </Button>
            </div>
        </div>
    );
}
