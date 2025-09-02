
import { useRef, useState } from 'react';

export function useWebRTC() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const initializePeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to other peer via WebSocket
      }
    };

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
  };

  const startCall = async (isVideo = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });

      setLocalStream(stream);
      initializePeerConnection();

      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });

      const offer = await peerConnection.current?.createOffer();
      await peerConnection.current?.setLocalDescription(offer);

      // Send offer to other peer via WebSocket
      setIsCallActive(true);
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const endCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnection.current?.close();
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
  };

  return {
    localStream,
    remoteStream,
    isCallActive,
    startCall,
    endCall,
  };
}
