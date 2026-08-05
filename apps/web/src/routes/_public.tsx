import { meQueryOptions } from "#/api/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_public")({
    beforeLoad: async ({ context }) => {
        const user = await context.queryClient.fetchQuery(meQueryOptions);
        if (user) {
            throw redirect({ to: "/" });
        }
    },

    component: RouteComponent,
});

function RouteComponent() {
    return <Outlet />;
}
