import { getAllGames } from "#/api/games";
import { Button } from "#/components/ui/button";
import { Divider } from "#/components/ui/divider";
import {
    ArrowRightIcon,
    ClockIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import cn from "cnfast";

export const Route = createFileRoute("/browse/")({
    component: RouteComponent,
});

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar"

export function PlayersAvatarGroup() {
  return (
    <AvatarGroup>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
    </AvatarGroup>
  )
}
function RouteComponent() {
    const { data: games, isLoading: isLoadingGames } = useQuery({
        queryKey: ["list-games"],
        queryFn: getAllGames,
    });
    return (
        <div className="flex flex-row w-full">
            <div className="flex-2 flex flex-col gap-4 p-4 pr-8">
                <p className="uppercase text-xs tracking-wider font-semibold">Games</p>
                <div className="flex flex-col gap-4">
                    <GameItem isActive={false} />
                    <GameItem isActive={true} />
                    <GameItem isActive={false} />
                </div>
            </div>
            <div className="flex-8 bg-card border rounded-md p-8 w-full flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                    <p className="lowercase text-2xl font-semibold tracking-tight">Dice territory</p>
                    <div>
                      <Button className="font-semibold text-lg">
                          + create match
                      </Button>
                    </div>
                </div>
                <Divider text="⎛⎝ ≽ > ⩊ < ≼ ⎠⎞" />
                <div className="grid grid-cols-4 gap-8">
                    <RoomItem />
                    <RoomItem />
                    <RoomItem />
                    <RoomItem />
                    <RoomItem />
                    <RoomItem />
                </div>
            </div>
        </div>
    );
}

function GameItem({ isActive }: { isActive: boolean }) {
    return (
        <>
            <div
                className={cn(
                    "lowercase flex flex-row justify-between items-center transition cursor-pointer text-shadow-2xs",
                    isActive ? " text-primary" : "text-muted-foreground/67 hover:text-foreground",
                )}
            >
                <p className="font-semibold text-xl tracking-tight">dice territory</p>
                <span>67</span>
            </div>
        </>
    );
}

function RoomItem() {
    return (
        <div className="">
            <div className="flex flex-col gap-2">
                <PlayersAvatarGroup />
                <span className="text-muted-foreground text-sm flex flex-row gap-1 items-center">
                    <UserIcon className="size-4" />
                    user1
                </span>
                <span className="text-muted-foreground text-sm flex flex-row gap-1 items-center">
                    <ClockIcon className="size-4" />
                    <p>4 minutes ago</p>
                </span>
                <Link
                    to="#"
                    className="font-bold flex gap-2 items-center transition hover:text-primary hover:underline"
                >
                    <p>join</p> <ArrowRightIcon className="size-4" />
                </Link>
            </div>
        </div>
    );
}
