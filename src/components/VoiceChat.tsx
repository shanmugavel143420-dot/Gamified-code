import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import socket from '../socket';

interface VoiceChatProps {
  roomId: string;
  userId: string;
  isMicOn: boolean;
  peers: any[];
}

const VoiceChat: React.FC<VoiceChatProps> = ({ roomId, userId, isMicOn, peers: initialPeers }) => {
  const [peers, setPeers] = useState<any[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<any[]>([]);

  useEffect(() => {
    if (isMicOn) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
        streamRef.current = stream;
        
        // In a real app, we'd iterate through all other users in the room
        // and create peers for each. For this demo, we'll just set up the signaling.
        
        socket.on('signal', ({ from, signal }) => {
          const peer = peersRef.current.find(p => p.peerId === from);
          if (peer) {
            peer.peer.signal(signal);
          } else {
            const newPeer = createPeer(from, socket.id!, stream);
            peersRef.current.push({ peerId: from, peer: newPeer });
            newPeer.signal(signal);
          }
        });
      });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      socket.off('signal');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isMicOn]);

  const createPeer = (userToSignal: string, callerId: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('signal', { roomId, to: userToSignal, signal });
    });

    return peer;
  };

  return null; // This is a logic-only component for now
};

export default VoiceChat;
