import { Button } from "#/components/ui/button";
import {
    CaretDownIcon,
    CheckIcon,
    FunnelIcon,
    HashIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    SortAscendingIcon,
    SortDescendingIcon,
    UserIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

export type SearchTarget = "matchId" | "userId";
export type MatchStatusFilter = "ALL" | "PLAYING" | "WAITING";
export type SortOrder = "desc" | "asc";

// Reusable hook to handle clicks outside of dropdown menus
function useClickOutside<T extends HTMLElement = HTMLElement>(
    handler: () => void,
) {
    const ref = useRef<T>(null);
    const savedHandler = useRef(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                savedHandler.current();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return ref;
}

/* -------------------------------------------------------------------------- */
/* Sub-component: BrowseHeaderTitle                                           */
/* -------------------------------------------------------------------------- */
export interface BrowseHeaderTitleProps {
    gameName?: string;
    matchCount: number;
}

export function BrowseHeaderTitle({
    gameName,
    matchCount,
}: BrowseHeaderTitleProps) {
    return (
        <div className="flex flex-row items-baseline justify-between gap-4">
            <h1 className="font-space-grotesk text-3xl font-bold uppercase tracking-tight text-foreground">
                {gameName}
            </h1>
            <div className="font-space-grotesk text-3xl uppercase tracking-tight select-none">
                <span className="font-bold text-white">{matchCount}</span>{" "}
                <span className="font-light text-muted-foreground/70">
                    matches
                </span>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Sub-component: BrowseSearchInput                                           */
/* -------------------------------------------------------------------------- */
export interface BrowseSearchInputProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    searchTarget: SearchTarget;
    onSelectSearchTarget: (target: SearchTarget) => void;
}

export function BrowseSearchInput({
    searchQuery,
    onSearchChange,
    searchTarget,
    onSelectSearchTarget,
}: BrowseSearchInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

    return (
        <div className="relative flex items-center h-9 rounded-lg bg-card border border-border/60 focus-within:border-border focus-within:ring-1 focus-within:ring-ring/40 transition">
            {/* Search target dropdown selector (Match ID vs User ID) */}
            <div className="relative h-full" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="h-full px-2.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition cursor-pointer select-none"
                >
                    {searchTarget === "matchId" ? (
                        <>
                            <HashIcon className="size-3.5 text-muted-foreground" />
                            <span>Match ID</span>
                        </>
                    ) : (
                        <>
                            <UserIcon className="size-3.5 text-muted-foreground" />
                            <span>User ID</span>
                        </>
                    )}
                    <CaretDownIcon
                        className={`size-3 text-muted-foreground transition-transform duration-150 ${
                            isOpen ? "rotate-180" : ""
                        }`}
                    />
                </button>

                {isOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-32 py-1 rounded-lg bg-card border border-border/80 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                        <button
                            type="button"
                            onClick={() => {
                                onSelectSearchTarget("matchId");
                                setIsOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 flex items-center justify-between text-xs transition cursor-pointer hover:bg-muted/60 ${
                                searchTarget === "matchId"
                                    ? "text-foreground font-semibold bg-muted/40"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <HashIcon className="size-3.5" />
                                <span>Match ID</span>
                            </div>
                            {searchTarget === "matchId" && (
                                <CheckIcon className="size-3 text-primary" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onSelectSearchTarget("userId");
                                setIsOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 flex items-center justify-between text-xs transition cursor-pointer hover:bg-muted/60 ${
                                searchTarget === "userId"
                                    ? "text-foreground font-semibold bg-muted/40"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <UserIcon className="size-3.5" />
                                <span>User ID</span>
                            </div>
                            {searchTarget === "userId" && (
                                <CheckIcon className="size-3 text-primary" />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Inner divider */}
            <div className="h-4 w-px bg-border/60" />

            {/* Search text input */}
            <div className="relative flex items-center h-full">
                <MagnifyingGlassIcon className="size-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={
                        searchTarget === "matchId"
                            ? "Search match ID..."
                            : "Search user ID..."
                    }
                    className="h-full pl-8 pr-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none w-36 sm:w-48 transition-all"
                />
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Sub-component: BrowseStatusFilter                                          */
/* -------------------------------------------------------------------------- */
export interface BrowseStatusFilterProps {
    statusFilter: MatchStatusFilter;
    onSelectStatusFilter: (filter: MatchStatusFilter) => void;
}

const STATUS_FILTER_OPTIONS: Array<{
    value: MatchStatusFilter;
    label: string;
    dot?: string;
}> = [
    { value: "ALL", label: "All Status" },
    { value: "WAITING", label: "Waiting", dot: "bg-amber-400" },
    { value: "PLAYING", label: "Playing", dot: "bg-emerald-400" },
];

export function BrowseStatusFilter({
    statusFilter,
    onSelectStatusFilter,
}: BrowseStatusFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="h-9 px-3 rounded-lg bg-card border border-border/60 hover:border-border text-sm text-foreground/90 hover:text-foreground flex items-center gap-1.5 transition cursor-pointer select-none"
            >
                <FunnelIcon className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">
                    {statusFilter === "ALL"
                        ? "All Status"
                        : statusFilter === "WAITING"
                          ? "Waiting"
                          : "Playing"}
                </span>
                <CaretDownIcon
                    className={`size-3 text-muted-foreground transition-transform duration-150 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-36 py-1 rounded-lg bg-card border border-border/80 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                    {STATUS_FILTER_OPTIONS.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                                onSelectStatusFilter(item.value);
                                setIsOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 flex items-center justify-between text-xs transition cursor-pointer hover:bg-muted/60 ${
                                statusFilter === item.value
                                    ? "text-foreground font-semibold bg-muted/40"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {item.dot && (
                                    <span
                                        className={`size-1.5 rounded-full ${item.dot}`}
                                    />
                                )}
                                <span>{item.label}</span>
                            </div>
                            {statusFilter === item.value && (
                                <CheckIcon className="size-3 text-primary" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Sub-component: BrowseSortOrder                                             */
/* -------------------------------------------------------------------------- */
export interface BrowseSortOrderProps {
    sortOrder: SortOrder;
    onSelectSortOrder: (order: SortOrder) => void;
}

export function BrowseSortOrder({
    sortOrder,
    onSelectSortOrder,
}: BrowseSortOrderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="h-9 px-3 rounded-lg bg-card border border-border/60 hover:border-border text-sm text-foreground/90 hover:text-foreground flex items-center gap-1.5 transition cursor-pointer select-none"
            >
                {sortOrder === "desc" ? (
                    <SortDescendingIcon className="size-3.5 text-muted-foreground" />
                ) : (
                    <SortAscendingIcon className="size-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-medium">
                    {sortOrder === "desc" ? "Newest first" : "Oldest first"}
                </span>
                <CaretDownIcon
                    className={`size-3 text-muted-foreground transition-transform duration-150 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-36 py-1 rounded-lg bg-card border border-border/80 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                    <button
                        type="button"
                        onClick={() => {
                            onSelectSortOrder("desc");
                            setIsOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 flex items-center justify-between text-xs transition cursor-pointer hover:bg-muted/60 ${
                            sortOrder === "desc"
                                ? "text-foreground font-semibold bg-muted/40"
                                : "text-muted-foreground"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <SortDescendingIcon className="size-3.5" />
                            <span>Newest first</span>
                        </div>
                        {sortOrder === "desc" && (
                            <CheckIcon className="size-3 text-primary" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onSelectSortOrder("asc");
                            setIsOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 flex items-center justify-between text-xs transition cursor-pointer hover:bg-muted/60 ${
                            sortOrder === "asc"
                                ? "text-foreground font-semibold bg-muted/40"
                                : "text-muted-foreground"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <SortAscendingIcon className="size-3.5" />
                            <span>Oldest first</span>
                        </div>
                        {sortOrder === "asc" && (
                            <CheckIcon className="size-3 text-primary" />
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main Component: BrowseHeader                                               */
/* -------------------------------------------------------------------------- */
export interface BrowseHeaderProps {
    gameName?: string;
    roomCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onCreateMatch: () => void;
    searchTarget?: SearchTarget;
    onSearchTargetChange?: (target: SearchTarget) => void;
    statusFilter?: MatchStatusFilter;
    onStatusFilterChange?: (filter: MatchStatusFilter) => void;
    sortOrder?: SortOrder;
    onSortOrderChange?: (order: SortOrder) => void;
}

export function BrowseHeader({
    gameName,
    roomCount,
    searchQuery,
    onSearchChange,
    onCreateMatch,
    searchTarget: searchTargetProp,
    onSearchTargetChange,
    statusFilter: statusFilterProp,
    onStatusFilterChange,
    sortOrder: sortOrderProp,
    onSortOrderChange,
}: BrowseHeaderProps) {
    const [internalSearchTarget, setInternalSearchTarget] =
        useState<SearchTarget>("matchId");
    const [internalStatusFilter, setInternalStatusFilter] =
        useState<MatchStatusFilter>("ALL");
    const [internalSortOrder, setInternalSortOrder] =
        useState<SortOrder>("desc");

    const searchTarget = searchTargetProp ?? internalSearchTarget;
    const statusFilter = statusFilterProp ?? internalStatusFilter;
    const sortOrder = sortOrderProp ?? internalSortOrder;

    const handleSelectSearchTarget = (target: SearchTarget) => {
        setInternalSearchTarget(target);
        onSearchTargetChange?.(target);
    };

    const handleSelectStatusFilter = (filter: MatchStatusFilter) => {
        setInternalStatusFilter(filter);
        onStatusFilterChange?.(filter);
    };

    const handleSelectSortOrder = (order: SortOrder) => {
        setInternalSortOrder(order);
        onSortOrderChange?.(order);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Top row: Game Title and Match Count */}
            <BrowseHeaderTitle
                gameName={gameName}
                matchCount={roomCount}
            />

            {/* Bottom row: Search (Match ID / User ID), Status Filter, Sort, Create Match */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search bar with Match ID / User ID selector */}
                    <BrowseSearchInput
                        searchQuery={searchQuery}
                        onSearchChange={onSearchChange}
                        searchTarget={searchTarget}
                        onSelectSearchTarget={handleSelectSearchTarget}
                    />

                    {/* Status Filter (Playing / Waiting / All) */}
                    <BrowseStatusFilter
                        statusFilter={statusFilter}
                        onSelectStatusFilter={handleSelectStatusFilter}
                    />

                    {/* Sort Order Button (Ascending / Descending by time) */}
                    <BrowseSortOrder
                        sortOrder={sortOrder}
                        onSelectSortOrder={handleSelectSortOrder}
                    />
                </div>

                {/* Create Match button */}
                <Button
                    onClick={onCreateMatch}
                    className="font-semibold gap-1.5 h-9 px-4 rounded-lg cursor-pointer"
                >
                    <PlusIcon className="size-4" weight="bold" />
                    <span>create match</span>
                </Button>
            </div>
        </div>
    );
}
