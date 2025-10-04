import Image from "next/image"
import Link from "next/link"
import { ChevronDown, MessageCircle, Orbit, Radar } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import stellarMindsLogo from "@/resources/stellar minds logo sin fondo.png"

const searcherLinks = [
  {
    name: "Chat Assistant",
    href: "/chat",
    description: "Conversational search across mission knowledge.",
    icon: MessageCircle,
  },
  {
    name: "Knowledge Graph",
    href: "/graph",
    description: "Navigate interconnected research entities in 3D.",
    icon: Orbit,
  },
  {
    name: "Assay Finder",
    href: "/assay-finder",
    description: "Surface experimental assays grouped by technology.",
    icon: Radar,
  },
]

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
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 font-mono text-sm uppercase tracking-[0.3em] text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
              Searchers <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[280px] border-border/60 bg-background/95 text-foreground">
              <DropdownMenuLabel className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Exploration tools
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/60" />
              {searcherLinks.map((item) => (
                <DropdownMenuItem key={item.href} asChild className="px-3 py-2">
                  <Link href={item.href} className="flex items-start gap-3">
                    <item.icon className="mt-0.5 h-4 w-4 text-primary" />
                    <span>
                      <span className="block font-mono text-sm text-foreground">{item.name}</span>
                      <span className="block text-xs text-muted-foreground">{item.description}</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 font-mono text-sm uppercase tracking-[0.3em] text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
              Mission Architects <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[240px] border-border/60 bg-background/95 text-foreground">
              <DropdownMenuLabel className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Coming soon
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem disabled className="px-3 py-2 text-xs text-muted-foreground">
                Mission tools will appear here shortly.
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 font-mono text-sm uppercase tracking-[0.3em] text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
              Investors <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[240px] border-border/60 bg-background/95 text-foreground">
              <DropdownMenuLabel className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Coming soon
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem disabled className="px-3 py-2 text-xs text-muted-foreground">
                Investor resources forthcoming.
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="flex-1" />
      </div>
    </header>
  )
}
