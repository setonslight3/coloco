'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface VoiceChatProps {
  socket: Socket;
  teamId: string;
  teammateIds: string[];
  isVoiceActive: boolean;
}

export function VoiceChat({ socket, teamId, teammateIds, isVoiceActive }: VoiceChatProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<{ [playerId: string]: RTCPeerConnection }>({});

  useEffect(() => {
    if (!isVoiceActive) {
      cleanupVoice();
      return;
    }

    startVoiceSession();

    socket.on('voice:signal', async ({ senderPlayerId, signal }: { senderPlayerId: string; signal: any }) => {
      let pc = peerConnections.current[senderPlayerId];
      if (!pc) {
        pc = createPeerConnection(senderPlayerId);
      }

      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('voice:signal', {
            targetPlayerId: senderPlayerId,
            signal: { sdp: pc.localDescription }
          });
        }
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });

    return () => {
      cleanupVoice();
      socket.off('voice:signal');
    };
  }, [isVoiceActive, teamId]);

  const startVoiceSession = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        setIsConnected(true);

        for (const targetId of teammateIds) {
          const pc = createPeerConnection(targetId);
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('voice:signal', {
            targetPlayerId: targetId,
            signal: { sdp: pc.localDescription }
          });
        }
      }
    } catch (err) {
      setIsConnected(true);
    }
  };

  const createPeerConnection = (targetPlayerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice:signal', {
          targetPlayerId,
          signal: { candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      const audioEl = new Audio();
      audioEl.srcObject = event.streams[0];
      audioEl.autoplay = true;
    };

    peerConnections.current[targetPlayerId] = pc;
    return pc;
  };

  const cleanupVoice = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    setIsConnected(false);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }
    socket.emit('voice:state', { isMuted: nextMuted, isDeafened });
  };

  const toggleDeafen = () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);
    if (nextDeafened) {
      setIsMuted(true);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
    }
    socket.emit('voice:state', { isMuted: nextDeafened || isMuted, isDeafened: nextDeafened });
  };

  if (!isVoiceActive) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-400 text-xs font-semibold select-none">
        <Radio className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">Voice Paused (Naming)</span>
        <span className="sm:hidden">Voice Off</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-navy-800 border border-sky-200 dark:border-navy-700 rounded-2xl px-3 py-1.5 shadow-xs select-none">
      <div className="flex items-center gap-1.5 mr-1">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">
          Team Voice
        </span>
      </div>

      <button
        onClick={toggleMute}
        aria-label="Toggle Mute"
        className={`p-1.5 rounded-xl transition-colors border ${
          isMuted
            ? 'bg-rose-100 text-rose-600 border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800'
            : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-navy-700 dark:text-sky-300 dark:border-navy-600'
        }`}
        title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
      >
        {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      </button>

      <button
        onClick={toggleDeafen}
        aria-label="Toggle Deafen"
        className={`p-1.5 rounded-xl transition-colors border ${
          isDeafened
            ? 'bg-rose-100 text-rose-600 border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800'
            : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-navy-700 dark:text-sky-300 dark:border-navy-600'
        }`}
        title={isDeafened ? 'Undeafen' : 'Deafen'}
      >
        {isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
