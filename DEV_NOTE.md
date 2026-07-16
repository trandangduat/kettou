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

## The function object parameter problem
Take a look at this code:
```tsx
const endGame = ({ roomState }: { roomState: Room }) => {
  roomState = {
    ...roomState,
    status: "ENDED"
  }
}

let room: Room = {
  status: "PLAYING"
}

endGame({ roomState: room });
```
After writing this code, I naively thought that the `endGame` function would change the `room` object status from "PLAYING" to "ENDED". That's not what happened. Initially, `roomState` pointed to `room`, that means whatever modifications were to applied to `roomState` would be applied to `room` as well. However, in the endGame function, when `roomState` was assigned to the {...roomState, status: "ENDED"} object, it already lost it reference to the origin `room` object, thus there're no modifications to the `room` object.

Here's the simple fix:

```tsx
const endGame = ({ roomState }: { roomState: Room }): Room => {
  roomState = {
    ...roomState,
    status: "ENDED"
  }
  return roomState;
}

let room: Room = {
  status: "PLAYING"
}

room = endGame({ roomState: room });
```

## Refactor code to handle multiple games instead of one
Create a `GameRegistry` class inside a core package that manages the registration and retrieval of game engines. Each game has it own package that exports the game engine and registers it with the `GameRegistry`. In backend, all games will be registered using `setUpGameEngines` in file `backend/src/games.ts`.

## Slow TypeScript diagnostics / IntelliSense after edits
Editor diagnostics (red underlines, popups) started taking ~6–7 seconds after code changes, in both Cursor and Zed. The app source itself is small; the bottleneck was TypeScript checking the backend.

Running `tsc --noEmit --extendedDiagnostics` in `apps/backend` showed roughly:
- Check time ~4.7s, total ~5.6s
- Memory ~1 GB
- Very high symbol / instantiation counts

`apps/web` stayed relatively fast (~1.6s total). File counts were similar between apps; the difference came from dependency types. The biggest backend-only contributor was `redis` / `@redis/client` (especially `multi()` and `RedisClientType`). This matches a known issue: [redis/node-redis#2975](https://github.com/redis/node-redis/issues/2975) (`RedisClientType` is expensive to typecheck). Upgrading within `redis@5.12.x` was unlikely to help; `redis@6` reports were mixed.

**Fix:** keep the real `createClient().connect()` client, but export it through a narrow local `RedisClient` / `RedisMulti` interface that only declares the methods this backend uses (`get`, `set`, `del`, `zAdd`, `zRem`, `zRange`, `multi` / `exec`). Cast once at the boundary in `apps/backend/src/redis.ts` so service files never pull in the full Redis generic type graph.

After that change, backend diagnostics dropped to roughly:
- Check time ~0.4s, total ~1.3s
- Memory ~191 MB
- Instantiations from ~735k down to ~17k

If you add a new Redis command later, extend those narrow interfaces in `redis.ts` instead of exporting the library’s full client type.
