import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
    useEffect(() => {
        fetch("/api/me")
            .then((res) => res.text())
            .then((data) => {
                console.log(data);
            });
    }, []);
    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
            <p className="mt-4 text-lg"></p>
        </div>
    );
}
