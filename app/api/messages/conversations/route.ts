import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all users the current user has conversations with
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
        receiver: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Group by conversation partner
    const conversationsMap = new Map()

    messages.forEach((message) => {
      const otherUser =
        message.senderId === session.user.id ? message.receiver : message.sender
      
      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: message,
          unreadCount: 0,
        })
      }

      // Count unread messages from this user
      if (
        message.receiverId === session.user.id &&
        !message.read
      ) {
        const conv = conversationsMap.get(otherUser.id)
        conv.unreadCount++
      }
    })

    const conversations = Array.from(conversationsMap.values())

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
