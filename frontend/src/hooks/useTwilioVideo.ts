import { useState, useCallback, useRef, useEffect } from 'react';
import Video, { Room, Participant, LocalVideoTrack, LocalAudioTrack } from 'twilio-video';
import axios from 'axios';

interface UseTwilioVideoProps {
    identity: string;
    roomName: string;
    onParticipantConnected?: (participant: Participant) => void;
    onParticipantDisconnected?: (participant: Participant) => void;
}

export const useTwilioVideo = ({
    identity,
    roomName,
    onParticipantConnected,
    onParticipantDisconnected
}: UseTwilioVideoProps) => {
    const [room, setRoom] = useState<Room | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connectToRoom = useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        try {
            // Get token from backend
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004/api/v1'}/video/token`, {
                identity,
                room: roomName
            });

            const { token } = response.data;

            const newRoom = await Video.connect(token, {
                name: roomName,
                audio: true,
                video: { width: 640 }
            });

            setRoom(newRoom);

            const participantConnected = (participant: Participant) => {
                setParticipants(prev => [...prev, participant]);
                onParticipantConnected?.(participant);
            };

            const participantDisconnected = (participant: Participant) => {
                setParticipants(prev => prev.filter(p => p !== participant));
                onParticipantDisconnected?.(participant);
            };

            newRoom.on('participantConnected', participantConnected);
            newRoom.on('participantDisconnected', participantDisconnected);

            newRoom.participants.forEach(participantConnected);

            setIsConnecting(false);
        } catch (err: any) {
            console.error('Twilio Error:', err);
            setError(err.message || 'Failed to connect to video room');
            setIsConnecting(false);
        }
    }, [identity, roomName, onParticipantConnected, onParticipantDisconnected]);

    const disconnectFromRoom = useCallback(() => {
        if (room) {
            room.disconnect();
            setRoom(null);
            setParticipants([]);
        }
    }, [room]);

    const toggleAudio = useCallback(() => {
        if (room) {
            room.localParticipant.audioTracks.forEach(publication => {
                if (publication.track) {
                    if (publication.track.isEnabled) {
                        publication.track.disable();
                    } else {
                        publication.track.enable();
                    }
                }
            });
        }
    }, [room]);

    const toggleVideo = useCallback(() => {
        if (room) {
            room.localParticipant.videoTracks.forEach(publication => {
                if (publication.track) {
                    if (publication.track.isEnabled) {
                        publication.track.disable();
                    } else {
                        publication.track.enable();
                    }
                }
            });
        }
    }, [room]);

    useEffect(() => {
        return () => {
            if (room) {
                room.disconnect();
            }
        };
    }, [room]);

    return {
        room,
        participants,
        isConnecting,
        error,
        connectToRoom,
        disconnectFromRoom,
        toggleAudio,
        toggleVideo
    };
};
