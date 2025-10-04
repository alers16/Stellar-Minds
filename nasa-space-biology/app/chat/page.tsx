import { ChatInterface } from "@/components/chat-interface"
import { SpaceBackground } from "@/components/space-background"

export default function ChatPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <SpaceBackground />
      <ChatInterface />
    </main>
  )
}
