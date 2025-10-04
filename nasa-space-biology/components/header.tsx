import Link from "next/link"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex flex-1 items-center">
          <Link href="/" className="flex items-center gap-3">
            <svg className="h-12 w-12" viewBox="0 0 110 92" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="55" cy="46" r="44" fill="#0B3D91" />
              <ellipse cx="55" cy="46" rx="28" ry="6" fill="white" transform="rotate(-15 55 46)" />
              <circle cx="78" cy="28" r="8" fill="#FC3D21" />
              <path d="M30 46 L80 46 M55 21 L55 71" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="font-mono text-sm font-bold text-foreground">Stellar Mind AI</div>
          </Link>
        </div>
        <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
          <a
            href="#features"
            className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#knowledge"
            className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Knowledge Base
          </a>
          <a href="#access" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">
            Access
          </a>
        </nav>
        <div className="flex-1" />
      </div>
    </header>
  )
}
