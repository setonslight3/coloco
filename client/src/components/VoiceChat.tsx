'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio, AlertCircle, RefreshCw } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface VoiceChatProps {
  socket: Socket;
  matchId: string;
  teamId: string;
  myPlayerId: string;
  teammateIds: string[];
  isVoiceActive: boolean;
  onVoiceStateChange?: (state: { isMuted: boolean; isDeafened: boolean; isConnected: boolean }) => void;
  peerVoiceStates?: { [playerId: string]: { isMuted?: boolean; isDeafened?: boolean } };
  externalMuteToggle?: number;
  externalDeafenToggle?: number;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ]
};

export function VoiceChat({
  socket,
  matchId,
  teamId,
  myPlayerId,
  teammateIds,
  isVoiceActive,
  onVoiceStateChange,
  peerVoiceStates,
  externalMuteToggle,
  externalDeafenToggle
}: VoiceChatProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<{ [playerId: string]: RTCPeerConnection }>({});
  const pendingCandidates = useRef<{ [playerId: string]: RTCIceCandidateInit[] }>({});
  const remoteAudiosRef = useRef<{ [playerId: string]: HTMLAudioElement }>({});

  useEffect(() => {
    if (!isVoiceActive) {
      cleanupVoice();
      return;
    }

    startVoiceSession();

    const handleSignal = async ({ senderPlayerId, signal }: { senderPlayerId: string; signal: any }) => {
      try {
        let pc = peerConnections.current[senderPlayerId];
        if (!pc) {
          pc = createPeerConnection(senderPlayerId);
        }

        if (signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          // Drain any queued ICE candidates for this peer
          const queued = pendingCandidates.current[senderPlayerId] || [];
          for (const cand of queued) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (err) {
              console.warn('ICE drain error:', err);
            }
          }
          pendingCandidates.current[senderPlayerId] = [];

          if (signal.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('voice:signal', {
              matchId,
              targetPlayerId: senderPlayerId,
              signal: { sdp: pc.localDescription }
            });
          }
        } else if (signal.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            if (!pendingCandidates.current[senderPlayerId]) {
              pendingCandidates.current[senderPlayerId] = [];
            }
            pendingCandidates.current[senderPlayerId].push(signal.candidate);
          }
        }
      } catch (err) {
        console.warn('WebRTC signal processing notice:', err);
      }
    };

    socket.on('voice:signal', handleSignal);

    return () => {
      cleanupVoice();
      socket.off('voice:signal', handleSignal);
    };
  }, [isVoiceActive, teamId, myPlayerId, teammateIds.join(',')]);

  const startVoiceSession = async () => {
    setMicError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setMicError('Audio devices not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      localStreamRef.current = stream;
      setIsConnected(true);

      // Deterministic politeness negotiation:
      // If myPlayerId < targetId, this peer initiates the offer.
      // If myPlayerId > targetId, this peer adds local stream and waits for the offer.
      for (const targetId of teammateIds) {
        if (!targetId || targetId === myPlayerId) continue;

        const pc = createPeerConnection(targetId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const isInitiator = myPlayerId < targetId;
        if (isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('voice:signal', {
            matchId,
            targetPlayerId: targetId,
            signal: { sdp: pc.localDescription }
          });
        }
      }
    } catch (err: any) {
      console.warn('Microphone access warning:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Mic blocked. Click to retry.');
      } else {
        setMicError('Mic unavailable. Click to retry.');
      }
      setIsConnected(false);
    }
  };

  const createPeerConnection = (targetPlayerId: string): RTCPeerConnection => {
    if (peerConnections.current[targetPlayerId]) {
      return peerConnections.current[targetPlayerId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks if already available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice:signal', {
          matchId,
          targetPlayerId,
          signal: { candidate: event.candidate.toJSON() }
        });
      }
    };

    pc.ontrack = (event) => {
      let audioEl = remoteAudiosRef.current[targetPlayerId];
      if (!audioEl) {
        audioEl = new Audio();
        audioEl.autoplay = true;
        audioEl.setAttribute('playsinline', 'true');
        remoteAudiosRef.current[targetPlayerId] = audioEl;
      }
      audioEl.srcObject = event.streams[0];
      audioEl.muted = isDeafened;
      audioEl.play().catch((e) => {
        console.log('Autoplay deferred until user interaction:', e);
      });
    };

    peerConnections.current[targetPlayerId] = pc;
    return pc;
  };

  const cleanupVoice = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    Object.values(peerConnections.current).forEach((pc) => {
      try {
        pc.close();
      } catch (e) {
        // Safe close
      }
    });
    peerConnections.current = {};
    pendingCandidates.current = {};

    Object.values(remoteAudiosRef.current).forEach((a) => {
      try {
        a.pause();
        a.srcObject = null;
      } catch (e) {
        // Safe cleanup
      }
    });
    remoteAudiosRef.current = {};
    setIsConnected(false);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    socket.emit('voice:state', { matchId, isMuted: nextMuted, isDeafened });
  };

  const toggleDeafen = () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);

    // Mute/unmute all incoming audio elements
    Object.values(remoteAudiosRef.current).forEach((audio) => {
      if (audio) audio.muted = nextDeafened;
    });

    if (nextDeafened) {
      setIsMuted(true);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
    }
    socket.emit('voice:state', {
      matchId,
      isMuted: nextDeafened || isMuted,
      isDeafened: nextDeafened
    });
  };

  // Notify parent of voice state changes
  useEffect(() => {
    if (onVoiceStateChange) {
      onVoiceStateChange({ isMuted, isDeafened, isConnected });
    }
  }, [isMuted, isDeafened, isConnected, onVoiceStateChange]);

  // Handle external toggles from teammates list
  const prevMuteTrigger = useRef(externalMuteToggle);
  useEffect(() => {
    if (externalMuteToggle !== undefined && externalMuteToggle !== prevMuteTrigger.current) {
      prevMuteTrigger.current = externalMuteToggle;
      toggleMute();
    }
  }, [externalMuteToggle]);

  const prevDeafenTrigger = useRef(externalDeafenToggle);
  useEffect(() => {
    if (externalDeafenToggle !== undefined && externalDeafenToggle !== prevDeafenTrigger.current) {
      prevDeafenTrigger.current = externalDeafenToggle;
      toggleDeafen();
    }
  }, [externalDeafenToggle]);

  // Mute individual peer audio when remote audios change or peerVoiceStates update
  useEffect(() => {
    if (!peerVoiceStates) return;
    Object.entries(peerVoiceStates).forEach(([pid, st]) => {
      const audio = remoteAudiosRef.current[pid];
      if (audio) {
        audio.muted = isDeafened || Boolean(st?.isMuted);
      }
    });
  }, [peerVoiceStates, isDeafened]);

  if (!isVoiceActive) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-400 text-xs font-semibold select-none">
        <Radio className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">Voice Paused (Naming)</span>
        <span className="sm:hidden">Voice Off</span>
      </div>
    );
  }

  if (micError) {
    return (
      <button
        type="button"
        onClick={startVoiceSession}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold select-none hover:bg-rose-100 transition-colors"
        title="Click to grant mic permission"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{micError}</span>
        <span className="sm:hidden">Mic Off</span>
        <RefreshCw className="w-3 h-3 ml-0.5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-navy-800 border border-sky-200 dark:border-navy-700 rounded-2xl px-3 py-1.5 shadow-xs select-none">
      <div className="flex items-center gap-1.5 mr-1">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">
          Team Voice
        </span>
      </div>

      <button
        type="button"
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
        type="button"
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
