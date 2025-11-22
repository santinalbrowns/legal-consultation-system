"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

type User = {
  id: string
  name: string
  role: string
}

type Message = {
  id: string
  content: string
  createdAt: string
  sender: User
  receiver: User
}

type Conversation = {
  user: User
  lastMessage: Message
  unreadCount: number
}

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const initialUserId = searchParams?.get("userId")
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<User[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
    loadContacts()
  }, [])

  async function loadContacts() {
    try {
      const response = await fetch("/api/users/contacts")
      const data = await response.json()
      if (Array.isArray(data)) {
        setContacts(data)
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
    }
  }

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId)
      const interval = setInterval(() => loadMessages(selectedUserId), 5000)
      return () => clearInterval(interval)
    }
  }, [selectedUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  async function loadConversations() {
    try {
      const response = await fetch("/api/messages/conversations")
      const data = await response.json()
      if (Array.isArray(data)) {
        setConversations(data)
      } else {
        console.error("Invalid conversations data:", data)
        setConversations([])
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
      setConversations([])
    }
  }

  async function loadMessages(userId: string) {
    try {
      const response = await fetch(`/api/messages?userId=${userId}`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setMessages(data)
      } else {
        console.error("Invalid messages data:", data)
        setMessages([])
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      setMessages([])
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUserId) return

    setLoading(true)
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUserId,
          content: newMessage,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        await loadMessages(selectedUserId)
        await loadConversations()
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedConversation = conversations?.find((c) => c.user.id === selectedUserId)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Messages</h1>
            <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
          <div className="grid md:grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">Conversations</h2>
                <button
                  onClick={() => {
                    const modal = document.getElementById('newMessageModal') as HTMLDialogElement
                    modal?.showModal()
                  }}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  + New
                </button>
              </div>
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div>
                  {conversations.map((conv) => (
                    <button
                      key={conv.user.id}
                      onClick={() => setSelectedUserId(conv.user.id)}
                      className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 text-left ${
                        selectedUserId === conv.user.id ? "bg-indigo-50" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{conv.user.name}</p>
                          <p className="text-xs text-gray-500">{conv.user.role}</p>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conv.lastMessage.content}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-1">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conv.lastMessage.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="md:col-span-2 flex flex-col">
              {selectedUserId ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation?.user.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedConversation?.user.role}
                    </p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.sender.id !== selectedUserId
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwn
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? "text-indigo-200" : "text-gray-500"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={loading || !newMessage.trim()}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      <dialog id="newMessageModal" className="rounded-lg p-0 backdrop:bg-black backdrop:bg-opacity-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">New Message</h3>
            <button
              onClick={() => {
                const modal = document.getElementById('newMessageModal') as HTMLDialogElement
                modal?.close()
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                No contacts available. Book an appointment first.
              </p>
            ) : (
              contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    setSelectedUserId(contact.id)
                    const modal = document.getElementById('newMessageModal') as HTMLDialogElement
                    modal?.close()
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-xs text-gray-500">{contact.role}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </dialog>
    </div>
  )
}
