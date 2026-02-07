import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// In production with same-origin deployment, use empty string to connect to same host
const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER_URL || '';

// ICE servers configuration (STUN/TURN)
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

/**
 * Custom hook for WebRTC functionality
 * @param {string} roomId - The meeting room ID
 * @param {string} userId - The current user's ID
 * @param {string} userName - The current user's display name
 * @returns {object} WebRTC state and controls
 */
export function useWebRTC(roomId, userId, userName) {
    const [localStream, setLocalStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [peers, setPeers] = useState({});
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);

    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const peersRef = useRef({});

    // Initialize local media stream
    const initLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            localStreamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            setError('Could not access camera/microphone. Please check permissions.');
            return null;
        }
    }, []);

    // Create a new RTCPeerConnection for a remote user
    const createPeerConnection = useCallback((remoteUserId, remoteUserName) => {
        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks to the peer connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        // Handle incoming tracks from remote peer
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            setPeers((prev) => ({
                ...prev,
                [remoteUserId]: {
                    ...prev[remoteUserId],
                    stream: remoteStream,
                },
            }));
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', {
                    target: remoteUserId,
                    candidate: event.candidate,
                });
            }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log(`Connection state with ${remoteUserId}:`, peerConnection.connectionState);
        };

        // Store the peer connection
        peersRef.current[remoteUserId] = {
            peerConnection,
            userName: remoteUserName || remoteUserId,
            stream: null,
        };

        setPeers((prev) => ({
            ...prev,
            [remoteUserId]: {
                peerConnection,
                userName: remoteUserName || remoteUserId,
                stream: null,
            },
        }));

        return peerConnection;
    }, []);

    // Handle incoming offer
    const handleOffer = useCallback(async (payload) => {
        const { caller, sdp, callerName } = payload;
        console.log('Received offer from:', caller);

        let peerConnection = peersRef.current[caller]?.peerConnection;
        if (!peerConnection) {
            peerConnection = createPeerConnection(caller, callerName);
        }

        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            socketRef.current.emit('answer', {
                target: caller,
                caller: socketRef.current.id,
                sdp: peerConnection.localDescription,
                callerName: userName,
            });
        } catch (err) {
            console.error('Error handling offer:', err);
        }
    }, [createPeerConnection, userName]);

    // Handle incoming answer
    const handleAnswer = useCallback(async (payload) => {
        const { caller, sdp } = payload;
        console.log('Received answer from:', caller);

        const peerConnection = peersRef.current[caller]?.peerConnection;
        if (peerConnection) {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
            } catch (err) {
                console.error('Error handling answer:', err);
            }
        }
    }, []);

    // Handle incoming ICE candidate
    const handleIceCandidate = useCallback(async (payload) => {
        const { candidate, sender } = payload;
        const pc = peersRef.current[sender]?.peerConnection;
        if (pc && candidate) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error('Error adding ICE candidate:', err);
            }
        }
    }, []);

    // Handle new user connecting
    const handleUserConnected = useCallback(async (remoteUserId) => {
        console.log('User connected:', remoteUserId);

        const peerConnection = createPeerConnection(remoteUserId);

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socketRef.current.emit('offer', {
                target: remoteUserId,
                caller: socketRef.current.id,
                sdp: peerConnection.localDescription,
                callerName: userName,
            });
        } catch (err) {
            console.error('Error creating offer:', err);
        }
    }, [createPeerConnection, userName]);

    // Handle user disconnecting
    const handleUserDisconnected = useCallback((remoteUserId) => {
        console.log('User disconnected:', remoteUserId);

        if (peersRef.current[remoteUserId]) {
            peersRef.current[remoteUserId].peerConnection?.close();
            delete peersRef.current[remoteUserId];

            setPeers((prev) => {
                const newPeers = { ...prev };
                delete newPeers[remoteUserId];
                return newPeers;
            });
        }
    }, []);

    // Handle incoming chat message
    const handleChatMessage = useCallback((message) => {
        setMessages((prev) => [...prev, message]);
    }, []);

    // Send chat message
    const sendMessage = useCallback((content) => {
        if (socketRef.current && content.trim()) {
            const message = {
                sender: userName,
                content: content.trim(),
                timestamp: Date.now(),
                isOwn: false,
            };
            socketRef.current.emit('chat-message', { roomId, message });
            // Add to local messages with isOwn flag
            setMessages((prev) => [...prev, { ...message, isOwn: true }]);
        }
    }, [roomId, userName]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    // Toggle camera
    const toggleCamera = useCallback(async () => {
        if (!localStreamRef.current) return;

        if (isCameraOff) {
            // Camera is off, turn it on
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = newStream.getVideoTracks()[0];

                // Remove old stopped track if exists
                const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
                if (oldVideoTrack) {
                    localStreamRef.current.removeTrack(oldVideoTrack);
                }

                // Add new track to local stream
                localStreamRef.current.addTrack(newVideoTrack);

                // Replace track in all peer connections
                Object.values(peersRef.current).forEach(({ peerConnection }) => {
                    const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video' || s.track === null);
                    if (sender) {
                        sender.replaceTrack(newVideoTrack);
                    }
                });

                // Force re-render by creating new stream reference
                setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
                setIsCameraOff(false);
            } catch (err) {
                console.error('Error turning camera on:', err);
            }
        } else {
            // Camera is on, turn it off
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.stop();
                setIsCameraOff(true);
            }
        }
    }, [isCameraOff]);

    // Stop screen sharing
    const stopScreenShare = useCallback(async () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
            setScreenStream(null);
        }

        setIsScreenSharing(false);

        // Restore camera video track to peer connections
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                Object.values(peersRef.current).forEach(({ peerConnection }) => {
                    const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                });
            }
        }
    }, []);

    // Start screen sharing
    const startScreenShare = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            screenStreamRef.current = stream;
            setScreenStream(stream);
            setIsScreenSharing(true);

            const screenTrack = stream.getVideoTracks()[0];

            // Replace video track in all peer connections
            Object.values(peersRef.current).forEach(({ peerConnection }) => {
                const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });

            // Handle when user stops sharing via browser UI
            screenTrack.onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            console.error('Error starting screen share:', err);
            setError('Could not start screen sharing.');
        }
    }, [stopScreenShare]);

    // Toggle screen share
    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            await stopScreenShare();
        } else {
            await startScreenShare();
        }
    }, [isScreenSharing, startScreenShare, stopScreenShare]);

    // Leave the meeting
    const leaveMeeting = useCallback(() => {
        // Close all peer connections
        Object.values(peersRef.current).forEach(({ peerConnection }) => {
            peerConnection?.close();
        });
        peersRef.current = {};
        setPeers({});

        // Stop screen share if active
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
            setScreenStream(null);
        }

        // Stop local stream tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
        }

        // Disconnect socket
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        setIsConnected(false);
        setMessages([]);
    }, []);

    // Initialize WebRTC connection
    useEffect(() => {
        if (!roomId || !userId) return;

        const init = async () => {
            // Get local media first
            const stream = await initLocalStream();
            if (!stream) return;

            // Connect to signaling server
            socketRef.current = io(SIGNALING_SERVER_URL);

            socketRef.current.on('connect', () => {
                console.log('Connected to signaling server');
                setIsConnected(true);
                socketRef.current.emit('join-room', roomId, socketRef.current.id);
            });

            socketRef.current.on('user-connected', handleUserConnected);
            socketRef.current.on('user-disconnected', handleUserDisconnected);
            socketRef.current.on('offer', handleOffer);
            socketRef.current.on('answer', handleAnswer);
            socketRef.current.on('ice-candidate', handleIceCandidate);
            socketRef.current.on('chat-message', handleChatMessage);

            socketRef.current.on('disconnect', () => {
                console.log('Disconnected from signaling server');
                setIsConnected(false);
            });

            socketRef.current.on('connect_error', (err) => {
                console.error('Connection error:', err);
                setError('Could not connect to signaling server.');
            });
        };

        init();

        // Cleanup on unmount
        return () => {
            leaveMeeting();
        };
    }, [roomId, userId, initLocalStream, handleUserConnected, handleUserDisconnected, handleOffer, handleAnswer, handleIceCandidate, handleChatMessage, leaveMeeting]);

    return {
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
    };
}

export default useWebRTC;
