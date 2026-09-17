import cn from "cnfast";

export function Divider({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  text?: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      className={cn(
        "bg-border/60",
        orientation === "vertical" ? "w-px self-stretch shrink-0" : "h-px w-full",
        className,
      )}
    />
  );
}
