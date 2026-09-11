import {
    Link,
    Outlet,
    createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";

import "../styles.css";
import { NavBar } from "./-components/navbar";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import { socket } from "#/socket";

interface RootRouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
    component: RootComponent,
});

function RootComponent() {
    const [currentMatchInfo, setCurrentMatchInfo] = useState<{
        gameId: string;
        matchId: string;
    } | null>(null);

    useEffect(() => {
        socket.on(
            "current-match:updated",
            (data: { gameId: string; matchId: string } | null) => {
                setCurrentMatchInfo(data);
            },
        );
        return () => {
            socket.off("current-match:updated");
        };
    }, []);
    return (
        <>
            <NavBar />
            <div className="mt-26 max-w-7xl w-full mx-auto">
                <Outlet />
            </div>
            <Toaster
                position="top-center"
                toastOptions={{
                    className:
                        "!bg-card !border !text-card-foreground !p-4 !px-5 !rounded-xl lowercase",
                    success: {
                        iconTheme: {
                            primary: "oklch(59.6% 0.145 163.225)",
                            secondary: "white",
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: "oklch(0.704 0.191 22.216)",
                            secondary: "white",
                        },
                    },
                }}
            />
            {currentMatchInfo && (
                <div className="bg-card p-4 fixed right-0 bottom-0 m-15 rounded-lg">
                    <p>You are currently in a match.</p>
                    <p>
                        Click{" "}
                        <Link
                            className="text-primary hover:underline"
                            to="/$gameId/$matchId"
                            params={{
                                gameId: currentMatchInfo.gameId,
                                matchId: currentMatchInfo.matchId,
                            }}
                        >
                            here
                        </Link>{" "}
                        to go to the match.
                    </p>
                </div>
            )}
            <TanStackDevtools
                config={{
                    position: "bottom-right",
                }}
                plugins={[
                    {
                        name: "TanStack Router",
                        render: <TanStackRouterDevtoolsPanel />,
                    },
                ]}
            />
        </>
    );
}
