import { fetchMe } from "#/api/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$gameId/_protected")({
    beforeLoad: async ({ context }) => {
        const user = await context.queryClient.ensureQueryData({
            queryKey: ["me"],
            queryFn: fetchMe,
            retry: false,
        });
        if (!user) {
            throw redirect({ to: "/login" });
        }
        return { user };
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <Outlet />;
}
