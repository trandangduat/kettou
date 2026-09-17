import { EmptyRooms } from "./empty-rooms";
import { RoomCard } from "./room-card";
import type { Match } from "./types";

export interface RoomGridProps {
    matches: Match[];
    searchQuery: string;
    gameId?: string;
}

export function RoomGrid({ matches, searchQuery, gameId }: RoomGridProps) {
    if (matches.length === 0) {
        return <EmptyRooms searchQuery={searchQuery} />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
                <RoomCard
                    match={match}
                    fallbackGameId={gameId}
                    key={match.id}
                />
            ))}
        </div>
    );
}
