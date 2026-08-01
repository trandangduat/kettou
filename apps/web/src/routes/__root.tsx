import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";

import "../styles.css";
import { NavBar } from "./-components/navbar";

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
