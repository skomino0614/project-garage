type ProductImagePlaceholderProps = {
  className?: string;
  label?: string;
};

export function ProductImagePlaceholder({
  className = "",
  label = "画像なし（デモ商品）",
}: ProductImagePlaceholderProps) {
  return (
    <div
      aria-hidden
      className={`flex aspect-[4/3] w-full items-center justify-center border-b border-border/60 bg-muted/30 px-4 text-center ${className}`}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
