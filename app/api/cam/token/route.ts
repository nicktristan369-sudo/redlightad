import { NextRequest, NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "R3VhpTOESfpa4z5z05SjjQ"
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "ieiu_IMgS79kwWIGiwIL8NQ8HyTGIrjzNuoS1V_l49E"

export async function POST(req: NextRequest) {
  try {
    const { roomName, participantName, isHost } = await req.json()
    if (!roomName || !participantName) {
      return NextResponse.json({ error: "Missing roomName or participantName" }, { status: 400 })
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      ttl: "4h",
    })

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: isHost === true,       // only host can publish video/audio
      canSubscribe: true,                // everyone can watch
      canPublishData: true,              // chat messages
    })

    const token = await at.toJwt()
    return NextResponse.json({
      token,
      wsUrl: process.env.LIVEKIT_WS_URL || "ws://76.13.154.9:7880",
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}
