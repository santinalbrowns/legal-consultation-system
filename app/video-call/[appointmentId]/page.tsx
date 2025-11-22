"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Peer from "peerjs"

type Appointment = {
  id: string
  title: string
  client: { id: string; name: string }
  lawyer: { id: string; name: string }
}

export default function VideoCallPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params?.appointmentId as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [peerId, setPeerId] = useState<string>("")
  const [remotePeerId, setRemotePeerId] = useState<string>("")
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [error, setError] = useState("")

  const peerRef = useRef<Peer | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const currentCallRef = useRef<any>(null)

  useEffect(() => {
    if (!appointmentId) return

    // Load appointment details
    fetch(`/api/appointments/${appointmentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setAppointment(data)
        }
      })
      .catch((err) => {
        console.error("Failed to load appointment:", err)
        setError("Failed to load appointment")
      })

    // Initialize PeerJS with config
    const peer = new Peer({
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    })
    peerRef.current = peer

    peer.on("open", (id) => {
      setPeerId(id)
      console.log("My peer ID:", id)
    })

    peer.on("call", (call) => {
      console.log("Incoming call...")
      // Answer incoming call
      if (localStreamRef.current) {
        call.answer(localStreamRef.current)
        
        call.on("stream", (remoteStream) => {
          console.log("Received remote stream from incoming call")
          remoteStreamRef.current = remoteStream
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
          }
          setIsCallActive(true)
        })

        currentCallRef.current = call
      } else {
        // If no local stream yet, request it first
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            localStreamRef.current = stream
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream
            }
            call.answer(stream)
            
            call.on("stream", (remoteStream) => {
              remoteStreamRef.current = remoteStream
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream
              }
              setIsCallActive(true)
            })
            
            currentCallRef.current = call
          })
          .catch((err) => {
            console.error("Failed to get media for incoming call:", err)
            setError("Please allow camera/microphone access to answer the call")
          })
      }
    })

    peer.on("error", (err) => {
      console.error("Peer error:", err)
      setError("Connection error: " + err.message)
    })

    return () => {
      // Cleanup without navigating away
      if (currentCallRef.current) {
        currentCallRef.current.close()
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (peer) {
        peer.destroy()
      }
    }
  }, [appointmentId])

  async function startLocalStream() {
    try {
      console.log("Requesting camera/microphone access...")
      
      // Check if permissions are already granted
      if (navigator.permissions) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          console.log("Camera permission:", cameraPermission.state)
          console.log("Microphone permission:", micPermission.state)
        } catch (e) {
          console.log("Permission API not fully supported")
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      
      console.log("Got media stream:", stream)
      console.log("Video tracks:", stream.getVideoTracks())
      console.log("Audio tracks:", stream.getAudioTracks())
      
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      return true
    } catch (err: any) {
      console.error("Media access error:", err)
      let errorMessage = "Failed to access camera/microphone. "
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage += "Please allow camera and microphone permissions in your browser settings."
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage += "No camera or microphone found. Please connect a device."
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage += "Camera/microphone is already in use by another application."
      } else {
        errorMessage += err.message
      }
      
      setError(errorMessage)
      return false
    }
  }

  async function startCall() {
    if (!remotePeerId.trim()) {
      setError("Please enter the other person's Peer ID")
      return
    }

    if (!peerId) {
      setError("Your Peer ID is not ready yet. Please wait a moment.")
      return
    }

    const success = await startLocalStream()
    if (!success) return

    if (peerRef.current && localStreamRef.current) {
      console.log("Calling peer:", remotePeerId)
      const call = peerRef.current.call(remotePeerId, localStreamRef.current)
      
      call.on("stream", (remoteStream) => {
        console.log("Received remote stream")
        remoteStreamRef.current = remoteStream
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
        setIsCallActive(true)
        setError("")
      })

      call.on("error", (err) => {
        console.error("Call error:", err)
        setError("Call failed: " + err.message)
      })

      call.on("close", () => {
        console.log("Call closed")
        setIsCallActive(false)
      })

      currentCallRef.current = call
    }
  }

  function endCall() {
    console.log("Ending call...")
    
    if (currentCallRef.current) {
      currentCallRef.current.close()
      currentCallRef.current = null
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log("Stopped track:", track.kind)
      })
      localStreamRef.current = null
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }
    }
    
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop())
      remoteStreamRef.current = null
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
    }

    setIsCallActive(false)
    setRemotePeerId("")
    
    // Navigate back after cleanup
    setTimeout(() => {
      router.push("/dashboard")
    }, 500)
  }

  function toggleMute() {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  function toggleVideo() {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  async function answerCall() {
    console.log("Preparing to answer calls...")
    const success = await startLocalStream()
    if (success) {
      setError("")
      alert("Ready to receive calls! Share your Peer ID: " + peerId)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h1 className="text-white text-xl font-semibold">
            {appointment?.title || "Video Consultation"}
          </h1>
          {appointment && (
            <p className="text-gray-400 text-sm">
              {appointment.client.name} ↔ {appointment.lawyer.name}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Connection Info */}
        {!isCallActive && (
          <div className="bg-gray-800 rounded-lg p-6 mb-4">
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Your Peer ID (Share this with the other person)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={peerId}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(peerId)
                      alert("Peer ID copied!")
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Enter Other Person's Peer ID
                </label>
                <input
                  type="text"
                  value={remotePeerId}
                  onChange={(e) => setRemotePeerId(e.target.value)}
                  placeholder="Paste their Peer ID here"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startCall}
                  disabled={!peerId || !remotePeerId.trim()}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Call
                </button>
                <button
                  onClick={answerCall}
                  disabled={!peerId}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Wait for Call
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Remote Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isCallActive && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Waiting for other person...
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
              {appointment?.lawyer.name || appointment?.client.name || "Remote"}
            </div>
          </div>

          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
              You
            </div>
          </div>
        </div>

        {/* Controls */}
        {isCallActive && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-center gap-4">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full ${
                  isMuted ? "bg-red-600" : "bg-gray-700"
                } text-white hover:opacity-80`}
              >
                {isMuted ? "🔇" : "🎤"}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full ${
                  isVideoOff ? "bg-red-600" : "bg-gray-700"
                } text-white hover:opacity-80`}
              >
                {isVideoOff ? "📹" : "📷"}
              </button>
              <button
                onClick={endCall}
                className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700"
              >
                📞 End Call
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          .mirror {
            transform: scaleX(-1);
          }
        `}</style>
      </div>
    </div>
  )
}
