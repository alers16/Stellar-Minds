"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { useAPI } from "@/APIContext"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function ChatInterface() {
  const { chat } = useAPI()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [chatUuid, setChatUuid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const ensureChat = useCallback(async () => {
    if (chatUuid) return chatUuid

    setIsInitializing(true)
    try {
      const response = await chat.create()
      const newUuid = response?.data?.chat_uuid
      if (!newUuid) {
        throw new Error("Chat service did not return an identifier.")
      }
      setChatUuid(newUuid)
      setError(null)
      return newUuid
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start the chat session."
      setError(message)
      throw err
    } finally {
      setIsInitializing(false)
    }
  }, [chat, chatUuid])

  useEffect(() => {
    ensureChat().catch((err) => {
      console.error("Failed to initialise chat", err)
    })
  }, [ensureChat])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setError(null)
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const activeChatUuid = await ensureChat()
      const response = await chat.sendMessage(activeChatUuid, {
        message: userMessage,
        metodo: "local",
      })

      const assistantReply = response?.data?.answer
      if (typeof assistantReply !== "string" || assistantReply.trim().length === 0) {
        throw new Error("The chat service returned an empty response.")
      }

      const cleanedAnswer = assistantReply.replace(/\\n/g, "\n")

      setMessages((prev) => [...prev, { role: "assistant", content: cleanedAnswer }])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch a response right now."
      setError(message)
      setMessages((prev) => [...prev, { role: "assistant", content: message }])
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedQuestions = [
    "How does microgravity affect plant growth?",
    "What are the effects of space radiation on cells?",
    "Tell me about recent ISS biology experiments",
    "How do astronauts' bodies adapt to space?",
  ]

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
      <div className="w-full max-w-4xl mx-auto">
        {messages.length === 0 ? (
          // Initial state - similar to Dora AI
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-4">
              <h1 className="font-mono text-5xl md:text-6xl font-bold text-balance">
                <span className="text-foreground">Stellar Mind AI</span>{" "}
                <span className="text-muted-foreground">Chatbot</span>
              </h1>
              <p className="font-mono text-xl md:text-2xl text-muted-foreground text-balance">
                One question away from discovery
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-3xl">
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about space biology research..."
                  className="w-full px-6 py-5 pr-32 font-mono text-lg bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/50"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading || isInitializing}
                  className="absolute right-2 top-1/2 -translate-y-1/2 font-mono gap-2"
                >
                  Generate
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>

            {error ? (
              <p className="text-sm font-mono text-red-300">{error}</p>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-3xl mt-8">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="px-4 py-3 text-left font-mono text-sm bg-card/30 backdrop-blur-sm border border-border/30 rounded-xl hover:bg-card/50 hover:border-primary/50 transition-all"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Chat messages view
          <div className="flex flex-col space-y-6">
            <div className="flex-1 space-y-6 mb-24">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-6 py-4 rounded-2xl font-mono ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card/50 backdrop-blur-sm border border-border/50 text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-6 py-4 rounded-2xl font-mono bg-card/50 backdrop-blur-sm border border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Fixed input at bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/50 p-4">
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="relative group">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    className="w-full px-6 py-4 pr-32 font-mono text-lg bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/50"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading || isInitializing}
                    className="absolute right-2 top-1/2 -translate-y-1/2 font-mono gap-2"
                  >
                    Send
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
              {error ? (
                <p className="mt-3 text-center text-sm font-mono text-red-300">{error}</p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
