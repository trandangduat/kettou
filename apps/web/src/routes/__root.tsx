import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";

import "../styles.css";
import { NavBar } from "./-components/navbar";
import { Toaster } from "react-hot-toast";

interface RootRouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
    component: RootComponent,
});

function RootComponent() {
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
