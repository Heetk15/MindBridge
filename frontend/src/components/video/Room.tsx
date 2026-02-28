import React, { useEffect, useRef } from 'react';
import { Room as TwilioRoom, Participant, RemoteParticipant, LocalParticipant } from 'twilio-video';

interface RoomProps {
    roomName: string;
    room: TwilioRoom;
    participants: Participant[];
}

const ParticipantTrack = ({ participant, isLocal = false }: { participant: Participant; isLocal?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const attachTrack = (track: any) => {
            if (track.kind === 'video' && videoRef.current) {
                track.attach(videoRef.current);
            } else if (track.kind === 'audio' && audioRef.current) {
                track.attach(audioRef.current);
            }
        };

        const detachTrack = (track: any) => {
            track.detach();
        };

        // For local participant, tracks are already available via publication.track
        // For remote participants, tracks come via trackSubscribed event
        participant.tracks.forEach((publication: any) => {
            if (publication.track) {
                attachTrack(publication.track);
            }
            // For remote: listen for track to be subscribed
            publication.on?.('subscribed', attachTrack);
            publication.on?.('unsubscribed', detachTrack);
        });

        // Listen for new tracks added after initial connection (remote)
        participant.on('trackSubscribed', attachTrack);
        participant.on('trackUnsubscribed', detachTrack);

        // Also listen for trackPublished to handle late-arriving publications
        const handleTrackPublished = (publication: any) => {
            if (publication.track) {
                attachTrack(publication.track);
            }
            publication.on?.('subscribed', attachTrack);
            publication.on?.('unsubscribed', detachTrack);
        };
        participant.on('trackPublished', handleTrackPublished);

        return () => {
            participant.off('trackSubscribed', attachTrack);
            participant.off('trackUnsubscribed', detachTrack);
            participant.off('trackPublished', handleTrackPublished);
            // Detach all tracks on cleanup
            participant.tracks.forEach((publication: any) => {
                if (publication.track) {
                    publication.track.detach();
                }
            });
        };
    }, [participant]);

    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-lg border border-white/10 group">
            <video ref={videoRef} autoPlay muted={isLocal} playsInline className="w-full h-full object-cover" />
            {!isLocal && <audio ref={audioRef} autoPlay />}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <p className="text-white text-xs font-medium">
                    {participant.identity} {isLocal ? '(You)' : ''}
                </p>
            </div>
        </div>
    );
};

const Room: React.FC<RoomProps> = ({ room, participants }) => {
    return (
        <div className="w-full h-full p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900">
            {/* Local Participant */}
            <div className="relative">
                <ParticipantTrack participant={room.localParticipant} isLocal={true} />
            </div>

            {/* Remote Participants */}
            {participants.map(participant => (
                <div key={participant.sid} className="relative">
                    <ParticipantTrack participant={participant} />
                </div>
            ))}

            {participants.length === 0 && (
                <div className="flex items-center justify-center border-2 border-dashed border-gray-700 rounded-xl">
                    <p className="text-gray-500 font-medium">Waiting for others to join...</p>
                </div>
            )}
        </div>
    );
};

export default Room;
