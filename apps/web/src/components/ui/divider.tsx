export function Divider({ text = "OR" }) {
  return (
    <div className="flex items-center gap-4">
      {/* Left */}
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />

      <span className="shrink-0 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {text}
      </span>

      {/* Right */}
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
    </div>
  );
}
