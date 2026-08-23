import { ImageOff } from "lucide-react";

type ProductImagePlaceholderProps = {
  className?: string;
  label?: string;
};

export function ProductImagePlaceholder({
  className = "",
  label = "画像準備中",
}: ProductImagePlaceholderProps) {
  return (
    <div
      aria-hidden
      className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-b border-border/60 bg-gradient-to-br from-muted/30 via-muted/10 to-background px-4 text-center ${className}`}
    >
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative flex flex-col items-center gap-2 text-muted-foreground">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/70">
          <ImageOff className="h-4 w-4" aria-hidden />
        </div>
        <span className="text-[10px] font-medium tracking-wider">{label}</span>
      </div>
    </div>
  );
}
