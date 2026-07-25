import cn from "cnfast";
import CardDurakImg from "#/assets/card-durak.png";
import DiceTerritoryImg from "#/assets/dice-territory.png";

const CardImages: Record<string, string> = {
    "dice-territory": DiceTerritoryImg,
    "card-durak": CardDurakImg,
};

type GamesCarousalProps = {
    games: any;
    selectedGames: string[];
    setSelectedGames: React.Dispatch<React.SetStateAction<string[]>>;
    isLoadingGames: boolean;
    isInMm: boolean;
};

function GamesCarousal({
    games,
    selectedGames,
    setSelectedGames,
    isLoadingGames,
    isInMm,
}: GamesCarousalProps) {
    if (isLoadingGames) return null;

    const handleSelectGame = (gameId: string) => {
        setSelectedGames((prev) =>
            prev.includes(gameId)
                ? prev.filter((id) => id !== gameId)
                : [...prev, gameId],
        );
    };

    return (
        <div className={cn("grid grid-cols-5 gap-6", isInMm ? "pointer-events-none" : "")}>
            {games.map((game: any) => (
                <GameCard
                    game={game}
                    onClick={handleSelectGame}
                    isSelected={selectedGames.includes(game.id)}
                />
            ))}
        </div>
    );
}

type GameCardProps = {
    game: any;
    isSelected: boolean;
    onClick: (gameId: string) => void;
};

function GameCard({ game, isSelected, onClick }: GameCardProps) {
    return (
        <div
            onClick={() => onClick(game.id)}
            className={cn(
                "p-4 rounded-2xl aspect-3/4 bg-secondary/50 border outline-2 outline-transparent flex flex-col gap-2 justify-between items-center transition",
                isSelected ? "outline-primary" : "hover:outline-accent grayscale brightness-60 hover:grayscale-0 hover:brightness-100",
            )}
        >
          <div className="aspect-square">
            <img className={cn(isSelected ? "" : "")} src={CardImages[game.id]} alt={game.id} />
          </div>
          <div>
            <p className="text-xl tracking-tight font-semibold lowercase">{game.name}</p>
          </div>
          <div className="bg-secondary/40 border backdrop-blur-2xl p-2 w-full rounded-full">
            <p className="text-sm text-center"><b className="text-muted-foreground">elo:</b> 1268</p>
          </div>
        </div>
    );
}

export default GamesCarousal;
