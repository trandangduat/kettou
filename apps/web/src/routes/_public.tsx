import { fetchMe } from "#/api/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_public")({
    beforeLoad: async ({ context }) => {
        console.log(context.queryClient);
        const user = await context.queryClient.ensureQueryData({
            queryKey: ["me"],
            queryFn: fetchMe,
            retry: false,
        });
        console.log(user);
        if (user) {
            throw redirect({ to: "/" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <Outlet />;
}
