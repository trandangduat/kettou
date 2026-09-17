export interface EmptyRoomsProps {
    searchQuery?: string;
}

export function EmptyRooms({ searchQuery }: EmptyRoomsProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl border border-dashed border-border/40 bg-card/20">
            <div className="text-3xl select-none opacity-80 text-muted-foreground">
                ⎛⎝ ≽ &gt; ⩊ &lt; ≼ ⎠⎞
            </div>
            <p className="text-sm font-medium text-muted-foreground">
                {searchQuery
                    ? "no matching rooms found"
                    : "no open rooms right now"}
            </p>
        </div>
    );
}
