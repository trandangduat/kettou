import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setUpGameEngines } from "./games";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

setUpGameEngines();

const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    context: {
        queryClient,
    },
});

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

const rootElement = document.getElementById("app")!;

function InnerApp() {
    return <RouterProvider router={router} context={{ queryClient }} />;
}

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <QueryClientProvider client={queryClient}>
            <InnerApp />
            <Toaster
                position="top-center"
                toastOptions={{
                    className:
                        "!bg-accent !border !text-foreground !p-4 !px-5 !rounded-xl lowercase",
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
        </QueryClientProvider>,
    );
}
