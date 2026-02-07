/* eslint-disable no-unused-vars */
import Navbar from "../../components/LandingComponents/Navbar/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  PhoneOff,
  MessageSquare,
  Users,
  Waves,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWebRTC } from "../../hooks/useWebRTC";

export default function MeetingPage() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  
  // Generate a simple user ID (in production, this would come from auth)
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);
  const [userName] = useState(() => `User ${Math.floor(Math.random() * 1000)}`);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  
  const {
    localStream,
    screenStream,
    peers,
    isMuted,
    isCameraOff,
    isScreenSharing,
    isConnected,
    error,
    messages,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
    leaveMeeting,
  } = useWebRTC(roomId || "default-room", userId, userName);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  // Attach screen stream to video element
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Handle leaving the meeting
  const handleLeaveMeeting = () => {
    leaveMeeting();
    navigate("/meetings");
  };
  
  // Handle sending message
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput("");
    }
  };

  // Get array of peers for rendering
  const peerEntries = Object.entries(peers);
  
  // Calculate grid columns based on total participants
  const totalParticipants = 1 + peerEntries.length; // local + remote
  const getGridCols = () => {
    if (totalParticipants <= 1) return "grid-cols-1";
    if (totalParticipants <= 2) return "grid-cols-2";
    if (totalParticipants <= 4) return "grid-cols-2";
    if (totalParticipants <= 6) return "grid-cols-3";
    return "grid-cols-4";
  };

  // Generate initials from name
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Avatar colors
  const avatarColors = [
    "from-blue-600 to-indigo-700",
    "from-purple-600 to-pink-600",
    "from-emerald-600 to-teal-600",
    "from-orange-600 to-red-600",
    "from-cyan-600 to-blue-600",
    "from-rose-600 to-pink-600",
  ];

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#0D0F16] text-slate-900 dark:text-[#F1F5F9] transition-colors duration-300 flex flex-col overflow-hidden font-sans">
      <Navbar />

      <main className="flex-1 pt-20 pb-4 px-4 md:px-6 max-w-[1800px] mx-auto w-full flex gap-4 overflow-hidden relative">
        {/* Left Side: Video Grid Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden z-10">
          {/* Header Info */}
          <div className="flex items-center justify-between px-2">
            <div className="min-w-0">
              <h1 className="text-sm md:text-lg font-black flex items-center gap-2 truncate uppercase tracking-tight">
                Meeting: {roomId || "Default Room"}
                {isConnected && (
                  <span className="px-2 py-0.5 bg-red-600 text-[9px] text-white rounded font-bold animate-pulse">
                    LIVE
                  </span>
                )}
                {!isConnected && !error && (
                  <span className="px-2 py-0.5 bg-yellow-600 text-[9px] text-white rounded font-bold flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" />
                    CONNECTING
                  </span>
                )}
              </h1>
            </div>

            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 px-4 py-2 rounded-2xl border border-blue-100 dark:border-blue-800/30 shadow-sm">
              <Users size={14} className="text-blue-600" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest hidden sm:block">
                {totalParticipants} Participant{totalParticipants !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-2 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Video Grid */}
          <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-hidden">
            <div className={`grid ${getGridCols()} gap-3 md:gap-5 w-full h-full max-w-[1200px] max-h-[800px]`}>
              {/* Local Video */}
              <motion.div
                layout
                className={`relative rounded-[2.5rem] flex items-center justify-center border-2 transition-all shadow-xl overflow-hidden border-white dark:border-[#2A2E3B] bg-white dark:bg-[#181B26] ${isScreenSharing ? 'ring-4 ring-blue-500/50' : ''}`}
              >
                {/* Show screen share if active, otherwise show camera */}
                {isScreenSharing && screenStream ? (
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain rounded-[2.3rem] bg-black"
                  />
                ) : localStream && !isCameraOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-[2.3rem]"
                  />
                ) : (
                  <div
                    className={`w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${avatarColors[0]} flex items-center justify-center text-3xl md:text-5xl font-black text-white shadow-2xl relative z-10 transition-transform duration-500 hover:rotate-12`}
                  >
                    {getInitials(userName)}
                  </div>
                )}

                <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl z-20">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">
                    You ({userName})
                  </span>
                  {isMuted && <MicOff size={14} className="text-red-400" />}
                  {isScreenSharing && <MonitorUp size={14} className="text-blue-400" />}
                </div>
              </motion.div>

              {/* Remote Peers */}
              {peerEntries.map(([peerId, peer], index) => (
                <motion.div
                  key={peerId}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative rounded-[2.5rem] flex items-center justify-center border-2 transition-all shadow-xl overflow-hidden border-white dark:border-[#2A2E3B] bg-white dark:bg-[#181B26]"
                >
                  {peer.stream ? (
                    <PeerVideo stream={peer.stream} />
                  ) : (
                    <div
                      className={`w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${avatarColors[(index + 1) % avatarColors.length]} flex items-center justify-center text-3xl md:text-5xl font-black text-white shadow-2xl relative z-10 transition-transform duration-500 hover:rotate-12`}
                    >
                      {getInitials(peer.userName || peerId)}
                    </div>
                  )}

                  <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-2xl z-20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">
                      {peer.userName || `Peer ${index + 1}`}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Controls */}
          <div className="bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-4 mx-auto w-fit md:w-full max-w-4xl backdrop-blur-md">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 ${isMuted ? "bg-red-500 text-white shadow-red-500/20" : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D]"}`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button
                onClick={toggleCamera}
                className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 ${isCameraOff ? "bg-red-500 text-white shadow-red-500/20" : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D]"}`}
                title={isCameraOff ? "Turn camera on" : "Turn camera off"}
              >
                {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>
              <button 
                onClick={toggleScreenShare}
                className={`hidden sm:flex p-4 rounded-2xl transition-all shadow-md ${isScreenSharing ? "bg-blue-600 text-white shadow-blue-600/30" : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-blue-600 hover:text-white"}`}
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? <MonitorOff size={22} /> : <MonitorUp size={22} />}
              </button>
              <button className="hidden sm:flex p-4 rounded-2xl bg-slate-100 dark:bg-[#2A2E3B] hover:bg-emerald-600 hover:text-white transition-all shadow-md">
                <Waves size={22} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`p-4 rounded-2xl transition-all shadow-md flex items-center gap-2 ${isChatOpen ? "bg-blue-600 text-white shadow-blue-600/30" : "bg-slate-100 dark:bg-[#2A2E3B] hover:bg-slate-200 dark:hover:bg-[#353A4D]"}`}
              >
                <MessageSquare size={22} />
                <span className="hidden md:block text-xs font-bold uppercase tracking-widest">
                  Chat
                </span>
                {messages.length > 0 && !isChatOpen && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              <button 
                onClick={handleLeaveMeeting}
                className="bg-red-600 hover:bg-red-700 px-6 md:px-8 py-4 rounded-2xl text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-red-900/30 flex items-center gap-3 active:scale-95 transition-all"
              >
                <PhoneOff size={22} />
                <span className="hidden lg:block">Leave</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Chat */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="fixed bottom-4 right-4 left-4 top-20 lg:relative lg:top-0 lg:left-0 lg:right-0 lg:w-[320px] xl:w-[360px] bg-white dark:bg-[#181B26] border border-slate-200 dark:border-[#2A2E3B] rounded-[3rem] flex flex-col shadow-2xl z-[100] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <h2 className="font-black text-sm flex items-center gap-2 uppercase tracking-tighter">
                  <MessageSquare size={16} className="text-blue-600" /> Live
                  Feed
                </h2>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-8">
                    No messages yet. Start the conversation!
                  </div>
                )}
                {messages.map((msg, index) => (
                  <div key={index} className={`space-y-2 ${msg.isOwn ? "text-right" : ""}`}>
                    {!msg.isOwn && (
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] font-bold text-white">
                          {getInitials(msg.sender)}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {msg.sender}
                        </span>
                      </div>
                    )}
                    {msg.isOwn && (
                      <span className="text-[9px] font-black text-blue-600 uppercase mr-2 tracking-widest">
                        You
                      </span>
                    )}
                    <div className={`${msg.isOwn ? "bg-blue-600 text-white rounded-tr-none inline-block" : "bg-slate-100 dark:bg-[#0D0F16] rounded-tl-none"} p-4 rounded-[1.8rem] text-[13px] leading-relaxed shadow-sm text-left`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-50 dark:bg-black/10 border-t border-slate-100 dark:border-white/5">
                <div className="relative group">
                  <input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                    className="w-full bg-white dark:bg-[#0D0F16] border border-slate-200 dark:border-[#2A2E3B] rounded-2xl py-4 pl-5 pr-14 text-sm outline-none focus:border-blue-600 transition-all shadow-inner"
                    placeholder="Message team..."
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-2 top-2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg active:scale-90 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Component to render remote peer video
function PeerVideo({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover rounded-[2.3rem]"
    />
  );
}
