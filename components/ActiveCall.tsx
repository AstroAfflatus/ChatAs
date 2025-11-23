import React, { useEffect, useRef, useState, useContext } from 'react';
import { ref, set, onValue, update, push, remove, serverTimestamp } from 'firebase/database';
import { db, AppContext } from '../App';
import { ChatContact } from '../types';
import { PhoneOff, Mic, MicOff, Video, VideoOff, SwitchCamera, Phone } from 'lucide-react';
import { playRingtone, stopRingtone } from '../services/tone';

interface ActiveCallProps {
    callId: string;
    isIncoming: boolean;
    callData?: any;
    targetUser?: ChatContact;
    callType?: 'voice' | 'video';
    onClose: () => void;
}

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
};

export const ActiveCall: React.FC<ActiveCallProps> = ({ callId, isIncoming, callData, targetUser, callType, onClose }) => {
    const { user } = useContext(AppContext);
    const [status, setStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended'>('ringing');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    
    const pc = useRef<RTCPeerConnection>(new RTCPeerConnection(servers));
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const generatedCallId = useRef(isIncoming ? callData.id : `call_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`);

    // Helper to log errors
    const handleError = (msg: string, err: any) => {
        console.error(msg, err);
        // In a real app, show toast
    };

    useEffect(() => {
        const currentCallId = generatedCallId.current;
        const callDocRef = ref(db, `calls/${currentCallId}`);
        const offerCandidates = ref(db, `calls/${currentCallId}/offerCandidates`);
        const answerCandidates = ref(db, `calls/${currentCallId}/answerCandidates`);

        const initCall = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: (callType || callData?.type) === 'video', 
                    audio: true 
                });
                
                setLocalStream(stream);
                stream.getTracks().forEach(track => {
                    pc.current.addTrack(track, stream);
                });

                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                pc.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        const targetRef = isIncoming ? answerCandidates : offerCandidates;
                        push(targetRef, event.candidate.toJSON());
                    }
                };

                pc.current.ontrack = (event) => {
                    const rStream = new MediaStream();
                    event.streams[0].getTracks().forEach(track => rStream.addTrack(track));
                    setRemoteStream(rStream);
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream;
                };

                if (!isIncoming) {
                    // Create Offer
                    const offerDescription = await pc.current.createOffer();
                    await pc.current.setLocalDescription(offerDescription);

                    const newCall = {
                        id: currentCallId,
                        callerId: user?.uid,
                        calleeId: targetUser?.uid,
                        type: callType,
                        offer: {
                            type: offerDescription.type,
                            sdp: offerDescription.sdp,
                        },
                        status: 'ringing',
                        startTime: serverTimestamp()
                    };

                    await set(callDocRef, newCall);
                    playRingtone();
                } else {
                    // Answer Call
                    // Usually we wait for user to click "Accept"
                    // handled in the render return with specific buttons
                    playRingtone();
                }

                // Listen for changes
                onValue(callDocRef, (snapshot) => {
                    const data = snapshot.val();
                    if (!data) return;

                    if (!isIncoming && data.answer && !pc.current.currentRemoteDescription) {
                        const answerDescription = new RTCSessionDescription(data.answer);
                        pc.current.setRemoteDescription(answerDescription);
                        setStatus('connected');
                        stopRingtone();
                    }

                    if (data.status === 'ended' || data.status === 'rejected') {
                        stopRingtone();
                        setStatus('ended');
                        setTimeout(onClose, 2000);
                    }
                });

                // Candidates Logic
                const candidateSource = isIncoming ? offerCandidates : answerCandidates;
                onValue(candidateSource, (snapshot) => {
                   snapshot.forEach((child) => {
                       const candidate = new RTCIceCandidate(child.val());
                       pc.current.addIceCandidate(candidate).catch(e => console.error(e));
                   });
                });

            } catch (err) {
                handleError("Media Error", err);
                onClose();
            }
        };

        if (!isIncoming || status === 'connecting') {
            initCall();
        }

        return () => {
            stopRingtone();
            localStream?.getTracks().forEach(t => t.stop());
            pc.current.close();
        };
    }, [isIncoming, status]); // Re-run when status changes to connecting (answer clicked)

    const answerCall = async () => {
        stopRingtone();
        setStatus('connecting'); // Triggers the media setup in useEffect
        
        // Wait briefly for useEffect to set up PC
        setTimeout(async () => {
            if (!callData?.offer) return;
            
            try {
                const offerDescription = new RTCSessionDescription(callData.offer);
                await pc.current.setRemoteDescription(offerDescription);
    
                const answerDescription = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answerDescription);
    
                const answer = {
                    type: answerDescription.type,
                    sdp: answerDescription.sdp,
                };
    
                await update(ref(db, `calls/${generatedCallId.current}`), { answer, status: 'active' });
                setStatus('connected');
            } catch (e) {
                handleError("Answer Error", e);
            }
        }, 1000);
    };

    const endCall = async () => {
        const callRef = ref(db, `calls/${generatedCallId.current}`);
        if (isIncoming && status === 'ringing') {
            await update(callRef, { status: 'rejected' });
        } else {
            await update(callRef, { status: 'ended' });
        }
        stopRingtone();
        onClose();
    };

    // Toggle Mute
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    // Toggle Video
    const toggleVideo = () => {
         if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    // Incoming Call Screen
    if (isIncoming && status === 'ringing') {
        return (
            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 animate-fade-in text-white">
                 <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary mb-6 animate-pulse">
                    <img src={callData?.callerPhoto || 'https://picsum.photos/200'} className="w-full h-full object-cover"/>
                 </div>
                 <h2 className="text-2xl font-bold mb-2">Incoming {callData?.type} Call...</h2>
                 <p className="mb-12 text-gray-400">Someone is calling you</p>
                 
                 <div className="flex space-x-8">
                     <button onClick={endCall} className="p-4 bg-red-500 rounded-full hover:bg-red-600 transition-transform hover:scale-110">
                         <PhoneOff size={32} />
                     </button>
                     <button onClick={answerCall} className="p-4 bg-green-500 rounded-full hover:bg-green-600 transition-transform hover:scale-110 animate-bounce">
                         <Phone size={32} />
                     </button>
                 </div>
            </div>
        );
    }

    const isVideo = (callType || callData?.type) === 'video';

    return (
        <div className="absolute inset-0 z-50 bg-gray-900 flex flex-col">
            <div className="flex-1 relative overflow-hidden">
                {/* Remote Video (Full Screen) */}
                {isVideo && (
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline
                        className="w-full h-full object-cover"
                    />
                )}
                {!isVideo && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
                        <div className="w-32 h-32 rounded-full bg-gray-700 mb-4 flex items-center justify-center">
                            <span className="text-4xl">👤</span>
                        </div>
                        <h2 className="text-xl text-white">{status === 'connected' ? 'Connected' : 'Calling...'}</h2>
                    </div>
                )}

                {/* Local Video (PiP) */}
                {isVideo && (
                    <div className="absolute top-4 right-4 w-28 h-40 bg-black rounded-lg overflow-hidden border border-white/20 shadow-lg">
                        <video 
                            ref={localVideoRef} 
                            autoPlay 
                            muted 
                            playsInline
                            className="w-full h-full object-cover transform scale-x-[-1]" 
                        />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="h-24 bg-black/80 backdrop-blur-md flex items-center justify-around px-8 pb-4">
                <button onClick={toggleMute} className={`p-3 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}>
                    {isMuted ? <MicOff /> : <Mic />}
                </button>
                
                <button onClick={endCall} className="p-4 bg-red-600 rounded-full text-white shadow-lg transform hover:scale-105 transition-all">
                    <PhoneOff size={28} />
                </button>

                {isVideo && (
                    <button onClick={toggleVideo} className={`p-3 rounded-full ${isVideoOff ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}>
                        {isVideoOff ? <VideoOff /> : <Video />}
                    </button>
                )}
            </div>
        </div>
    );
};