# Setup
```bash
# Install pnpm
npm install -g pnpm@latest-11
# Install dependencies & environment variables
pn install
cp ./apps/backend/.env.example ./apps/backend/.env
# Run the app
pn -r --parallel dev
```

# Struggles & decisions
## Auth in web frontend
Initially, I created a useMe() hook that uses Tanstack Query to query the backend for the current user. Then I passed current user data got from this hook to the RouterProvider as a router context. Basically, it looked something like this: 
```tsx
const router = createRouter({
    ...
    context: {
      user: undefined!,
    },
});

function InnerApp() {
    const { data: user } = useMe();
    return <RouterProvider router={router} context={{ user }} />;
}
```

After that, I used `beforeLoad` function in createFileRoute to protect routes that require authentication. It looked something like this:
```tsx
export const route = createFileRoute("/_protected")({
    beforeLoad: async ({ context }) => {
        if (!context.user) {
            throw redirect("/login");
        }
    },
});
```

The idea seemed good, but the code didn't work. It turned out the `beforeLoad` function were called before the useMe() hook result returned, that means the `context.user` was `undefined`. There'are some workarounds to fix this issue. One of them is to use `router.invalidate` to force a reload of the protected route after the user is authenticated:

```tsx
function InnerApp() {
    const { data: user } = useMe();
    useEffect(() => {
        if (user) {
            router.invalidate();
        }
    }, [user]);
    return <RouterProvider router={router} context={{ user }} />;
}
```

There is also another workaround. That is to pass the `queryClient` of Tanstack Query directly as a router context and use it inside `beforeLoad`. I decided to use this workaround because it seemed cleaner and more straightforward. You can find the implementation in below files:

- [`./apps/frontend/src/main.ts`](./apps/frontend/src/main.ts)
- [`./apps/frontend/src/routes/__root.tsx`](./apps/frontend/src/routes/__root.tsx)
- [`./apps/frontend/src/routes/_public.tsx`](./apps/frontend/src/routes/_public.tsx)

## Login Redirection Issue
While implementing the login feature, I encountered a bug where the router didn't redirect to the homepage after a successful login. I was using `queryClient.invalidateQueries({ queryKey: ["me"] })` followed by `router.invalidate()` to re-trigger the `beforeLoad` check (which is responsible for redirecting authenticated users away from the login page).

The problem was that `invalidateQueries` marks the cache as stale and schedules a background refetch. When `router.invalidate()` immediately runs the `beforeLoad` function, `context.queryClient.ensureQueryData` sees the stale unauthenticated cache and returns it instantly instead of waiting for the new data. Thus, the redirect condition `if (user)` was bypassed.

To fix this, I replaced `invalidateQueries` with `removeQueries`:

```tsx
if (res.ok) {
    setError(null);
    // Clear the old unauthenticated cache entirely so ensureQueryData is forced to fetch fresh data
    queryClient.removeQueries({ queryKey: ["me"] });
    
    // Trigger beforeLoad which will now await the fresh auth state
    await router.invalidate();
    return;
}
```

This ensures the cache is completely cleared, forcing `ensureQueryData` in the `beforeLoad` function to await the new data and successfully trigger the redirect.
