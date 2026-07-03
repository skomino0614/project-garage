import { Link } from "@tanstack/react-router";

export function GarageNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">PG</span>
          Project Garage
        </Link>
        <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
          <Link to="/select" className="transition-colors hover:text-foreground">車を選ぶ</Link>
          <Link to="/ask" className="transition-colors hover:text-foreground">質問</Link>
        </nav>
      </div>
    </header>
  );
}
