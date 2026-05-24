import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
    return (
        <div className="p-8">
            <h1 className="text-4xl">
                Welcome to <b>DuelHub</b>
            </h1>
            <div>
                <Link to="/games/$gameId" params={{ gameId: "dice-territory" }}>
                    Dice Territory
                </Link>
            </div>
        </div>
    );
}
