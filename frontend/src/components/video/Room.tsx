import React, { useEffect, useRef } from 'react';
import { Room as TwilioRoom, Participant, RemoteParticipant, LocalParticipant } from 'twilio-video';

interface RoomProps {
    roomName: string;
    room: TwilioRoom;
    participants: Participant[];
}

const ParticipantTrack = ({ participant }: { participant: Participant }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const trackSubscribed = (track: any) => {
            if (track.kind === 'video') {
                track.attach(videoRef.current);
            } else if (track.kind === 'audio') {
                track.attach(audioRef.current);
            }
        };

        const trackUnsubscribed = (track: any) => {
            track.detach();
        };

        participant.on('trackSubscribed', trackSubscribed);
        participant.on('trackUnsubscribed', trackUnsubscribed);

        participant.tracks.forEach(publication => {
            const pub = publication as any;
            if (pub.isSubscribed && pub.track) {
                trackSubscribed(pub.track);
            }
        });

        return () => {
            participant.off('trackSubscribed', trackSubscribed);
            participant.off('trackUnsubscribed', trackUnsubscribed);
        };
    }, [participant]);

    return (
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-lg border border-white/10 group">
            <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
            <audio ref={audioRef} autoPlay />
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <p className="text-white text-xs font-medium">
                    {participant.identity} {(participant as any).isLocal ? '(You)' : ''}
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
                <ParticipantTrack participant={room.localParticipant} />
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
