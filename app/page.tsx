'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'bot'
  content: string
  timestamp: Date
  isLoading?: boolean
}

const AGENT_ID = '68fffb3e7a5fe55ab8c48187'

export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: 'Hello! I am the Website Content Assistant. Ask me anything about this site, our services, background, or how to get in touch.',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Detect dark mode preference
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(darkModeQuery.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    darkModeQuery.addEventListener('change', handler)
    return () => darkModeQuery.removeEventListener('change', handler)
  }, [])

  // Load conversation from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chatbot_messages')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(
          parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        )
      } catch (e) {
        console.error('Failed to load messages:', e)
      }
    }
  }, [])

  // Save conversation to localStorage
  useEffect(() => {
    localStorage.setItem('chatbot_messages', JSON.stringify(messages))
  }, [messages])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setError(null)
    setIsLoading(true)

    // Add loading bot message
    const loadingId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        role: 'bot',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      },
    ])

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          agent_id: AGENT_ID,
          session_id: 'chatbot-session',
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Agent error')
      }

      // Extract response text from raw_response or response
      let botReply = ''
      if (data.raw_response) {
        botReply = data.raw_response
      } else if (typeof data.response === 'string') {
        botReply = data.response
      } else if (data.response?.answer) {
        botReply = data.response.answer
      } else {
        botReply =
          JSON.stringify(data.response) || 'Unable to process response'
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                content: botReply,
                isLoading: false,
              }
            : m
        )
      )
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Connection error. Please try again.'
      setError(errorMsg)

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                content: `Error: ${errorMsg}`,
                isLoading: false,
              }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async () => {
    if (messages.length === 0) return

    // Find last user message
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user')
    if (lastUserIdx === -1) return

    const actualIdx = messages.length - 1 - lastUserIdx
    const lastUserMessage = messages[actualIdx]

    // Remove bot response after last user message if it exists
    const filteredMessages = messages.slice(0, actualIdx + 1)
    setMessages(filteredMessages)

    // Resend
    setInputValue(lastUserMessage.content)
    setError(null)
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'bot',
        content:
          'Hello! I am the Website Content Assistant. Ask me anything about this site, our services, background, or how to get in touch.',
        timestamp: new Date(),
      },
    ])
    setError(null)
    setInputValue('')
  }

  const bgClass = isDark ? 'bg-slate-900' : 'bg-white'
  const textClass = isDark ? 'text-white' : 'text-gray-900'
  const borderClass = isDark ? 'border-slate-700' : 'border-gray-200'
  const mutedClass = isDark ? 'text-gray-400' : 'text-gray-500'
  const inputBgClass = isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'
  const userBubbleClass = isDark
    ? 'bg-blue-600 text-white'
    : 'bg-blue-500 text-white'
  const botBubbleClass = isDark
    ? 'bg-slate-800 text-white'
    : 'bg-gray-200 text-gray-900'

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      {/* Main content area */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className={`w-full max-w-md p-8 text-center border ${borderClass}`}>
          <h1 className="text-3xl font-bold mb-4">Welcome to Patel Khush</h1>
          <p className="text-lg mb-6">
            Need help? Click the chat button at the bottom-right corner to get started.
          </p>
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
              isDark ? 'bg-blue-600' : 'bg-blue-500'
            } text-white`}
          >
            <MessageCircle size={32} />
          </div>
        </Card>
      </div>

      {/* Floating Widget Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isDark
            ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400'
        } text-white shadow-lg z-40 active:scale-95`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-96 rounded-lg border ${borderClass} shadow-2xl flex flex-col transition-all duration-300 z-40 animate-in slide-in-from-bottom-4 ${bgClass}`}
          role="dialog"
          aria-label="Chat window"
          aria-modal="true"
        >
          {/* Header */}
          <div
            className={`border-b ${borderClass} p-4 flex items-center justify-between ${
              isDark ? 'bg-slate-800' : 'bg-gray-50'
            }`}
          >
            <h2 className="font-semibold flex items-center gap-2">
              <MessageCircle size={20} />
              Chat Assistant
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4" ref={scrollAreaRef}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.role === 'user' ? userBubbleClass : botBubbleClass
                    } break-words`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span
                            className={`h-2 w-2 rounded-full animate-bounce ${
                              isDark ? 'bg-gray-400' : 'bg-gray-600'
                            }`}
                            style={{ animationDelay: '0s' }}
                          />
                          <span
                            className={`h-2 w-2 rounded-full animate-bounce ${
                              isDark ? 'bg-gray-400' : 'bg-gray-600'
                            }`}
                            style={{ animationDelay: '0.2s' }}
                          />
                          <span
                            className={`h-2 w-2 rounded-full animate-bounce ${
                              isDark ? 'bg-gray-400' : 'bg-gray-600'
                            }`}
                            style={{ animationDelay: '0.4s' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 opacity-70`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Error Display */}
          {error && (
            <div className={`px-4 py-2 border-t ${borderClass} ${isDark ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-800'}`}>
              <p className="text-sm mb-2">{error}</p>
              <button
                onClick={handleRetry}
                className={`text-sm font-medium flex items-center gap-1 ${
                  isDark ? 'text-red-200 hover:text-red-100' : 'text-red-700 hover:text-red-900'
                }`}
              >
                <RotateCcw size={14} />
                Retry
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className={`border-t ${borderClass} p-4 space-y-2`}>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                type="text"
                placeholder="Ask me anything about this site…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className={`flex-1 ${inputBgClass} ${textClass} placeholder:${mutedClass}`}
                aria-label="Message input"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                size="sm"
                className="px-3"
                aria-label="Send message"
              >
                <Send size={18} />
              </Button>
            </form>

            {messages.length > 1 && (
              <button
                onClick={handleClearChat}
                className={`w-full text-xs py-1 rounded transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-slate-800'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
