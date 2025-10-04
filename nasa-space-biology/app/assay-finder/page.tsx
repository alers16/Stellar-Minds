import { AssayFinder } from "@/components/assay-finder"
import { SpaceBackground } from "@/components/space-background"

export default function AssayFinderPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <SpaceBackground />
      <AssayFinder />
    </main>
  )
}
