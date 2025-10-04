import Image from "next/image"
import Link from "next/link"
import stellarMindsLogo from "@/resources/stellar minds logo sin fondo.png"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex flex-1 items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={stellarMindsLogo}
              alt="Stellar Minds logo"
              width={48}
              height={48}
              priority
              className="h-12 w-12 object-contain"
            />
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
