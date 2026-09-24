import { useState, useRef, useEffect } from "react";
import { PaperPlaneRightIcon, ChatCircleDotsIcon } from "@phosphor-icons/react";
import { Button } from "#/components/ui/button";
import type { Match } from "@mini-games/core";

export interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    time: string;
    isSystem?: boolean;
    isYou?: boolean;
}

export interface BanterBoxCardProps {
    match: Match<any>;
    currentUserName: string;
}

export function BanterBoxCard({ match, currentUserName }: BanterBoxCardProps) {
    const myName = currentUserName || "You";
    const hostPlayerId = match.players?.[0]?.userId;
    const opponentPlayerId = match.players?.[1]?.userId;

    const otherPlayer =
        match.players?.find((p) => p.userId && p.userId !== currentUserName)?.userId ||
        (currentUserName === hostPlayerId ? opponentPlayerId : hostPlayerId) ||
        "Challenger";

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "demo-1",
            sender: otherPlayer,
            text: "Ready when you are! Good luck 🎲",
            time: "4m ago",
            isYou: false,
        },
        {
            id: "demo-2",
            sender: myName,
            text: "Good luck! Let's see who gets the better rolls.",
            time: "3m ago",
            isYou: true,
        },
        {
            id: "demo-3",
            sender: otherPlayer,
            text: "This territory is mine 😉",
            time: "1m ago",
            isYou: false,
        },
    ]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages((prev) =>
            prev.map((msg) => {
                if (!msg.id.startsWith("demo-")) return msg;
                return {
                    ...msg,
                    sender: msg.isYou ? myName : otherPlayer,
                };
            }),
        );
    }, [myName, otherPlayer]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputText.trim();
        if (!trimmed) return;

        const newMsg: ChatMessage = {
            id: String(Date.now()),
            sender: currentUserName,
            text: trimmed,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            isYou: true,
        };

        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex-1 min-h-0 flex flex-col rounded-lg bg-card border border-border/60 overflow-hidden shadow-xs">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-space-grotesk font-bold uppercase tracking-tight text-sm sm:text-base">
                    <ChatCircleDotsIcon className="size-4 sm:size-5" weight="bold" />
                    <span>BANTER BOX</span>
                </div>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-1.5 text-xs">
                {messages.map((msg) => {
                    if (msg.isSystem) {
                        return (
                            <div
                                key={msg.id}
                                className="text-muted-foreground/70 text-[11px] italic py-0.5"
                            >
                                * {msg.text}
                            </div>
                        );
                    }

                    const isMsgYou = Boolean(msg.isYou || msg.sender === currentUserName);

                    return (
                        <div
                            key={msg.id}
                            className="leading-snug wrap-break-word"
                        >
                            <span
                                className={`font-space-grotesk font-bold ${
                                    isMsgYou
                                        ? "text-primary"
                                        : "text-white/75"
                                }`}
                            >
                                {msg.sender}
                            </span>
                            <span className="text-muted-foreground mr-1">:</span>
                            <span className="text-foreground/90 font-sans">
                                {msg.text}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
                onSubmit={handleSendMessage}
                className="h-10 px-3 border-t border-border/60 flex items-center gap-2 bg-muted/5 focus-within:bg-muted/10 transition-colors shrink-0"
            >
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 min-w-0 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 border-none outline-none focus:outline-none focus:ring-0"
                />
                <Button
                    type="submit"
                    size="icon-xs"
                    disabled={!inputText.trim()}
                    className="size-7 cursor-pointer shrink-0 rounded-md disabled:opacity-30"
                >
                    <PaperPlaneRightIcon className="size-3.5" weight="fill" />
                </Button>
            </form>
        </div>
    );
}
