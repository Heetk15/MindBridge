import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Mic, MicOff, VideoOff, Phone, MessageSquare, User, X } from 'lucide-react';
import { useTwilioVideo } from '../../hooks/useTwilioVideo';
import Room from '../../components/video/Room';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';

const ElderlyVideoCall = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [callTime, setCallTime] = useState(0);

    const roomName = `consultation-${id || 'default'}`;
    const identity = `elderly-${Date.now()}`;

    const {
        room,
        participants,
        isConnecting,
        error,
        connectToRoom,
        disconnectFromRoom,
        toggleAudio,
        toggleVideo
    } = useTwilioVideo({
        identity,
        roomName,
        onParticipantConnected: (participant) => {
            console.log('Caregiver joined:', participant.identity);
        },
        onParticipantDisconnected: (participant) => {
            console.log('Caregiver left:', participant.identity);
        }
    });

    const mockMessages = [
        { id: 1, sender: 'doctor', text: 'Hello! How are you feeling today?', time: '10:01 AM' },
        { id: 2, sender: 'patient', text: 'I have been experiencing headaches for the past 2 days.', time: '10:02 AM' },
    ];

    useEffect(() => {
        connectToRoom();
        const timer = setInterval(() => setCallTime(prev => prev + 1), 1000);
        return () => {
            disconnectFromRoom();
            clearInterval(timer);
        };
    }, []);

    const handleToggleAudio = () => {
        toggleAudio();
        setIsMuted(!isMuted);
    };

    const handleToggleVideo = () => {
        toggleVideo();
        setIsVideoOn(!isVideoOn);
    };

    const handleEndCall = () => {
        disconnectFromRoom();
        navigate('/elderly/dashboard');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isConnecting) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-white text-lg">Connecting to caregiver...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4">
                        <X className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <Button onClick={() => navigate('/elderly/dashboard')} className="bg-primary hover:bg-primary/90">
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <header className="bg-gray-900/90 backdrop-blur-md border-b border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/10">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-lg">Dr. Anita Sharma</p>
                            <p className="text-sm text-gray-400">MindBridge Healthcare Professional</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-inner",
                            room ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        )}>
                            <span className={cn("w-2 h-2 rounded-full", room ? "bg-green-500 animate-pulse" : "bg-yellow-500")}></span>
                            {room ? 'LIVE CONNECTION' : 'CONNECTING...'}
                        </div>
                        <span className="text-gray-300 font-mono text-lg bg-gray-800 px-3 py-1 rounded-lg border border-gray-700">{formatTime(callTime)}</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Area */}
                <div className="flex-1 relative bg-black">
                    {room ? (
                        <Room
                            roomName={roomName}
                            room={room}
                            participants={participants}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center animate-pulse">
                                <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6 shadow-2xl border border-gray-700">
                                    <span className="text-6xl">👤</span>
                                </div>
                                <p className="text-white text-2xl font-display font-bold">Establishing Secure Link...</p>
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-gray-900/60 backdrop-blur-xl rounded-2xl px-8 py-5 border border-white/10 shadow-2xl">
                        <Button
                            variant={isMuted ? 'destructive' : 'secondary'}
                            size="icon"
                            className="rounded-xl h-14 w-14 shadow-lg hover:scale-105 transition-transform"
                            onClick={handleToggleAudio}
                        >
                            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                        </Button>
                        <Button
                            variant={!isVideoOn ? 'destructive' : 'secondary'}
                            size="icon"
                            className="rounded-xl h-14 w-14 shadow-lg hover:scale-105 transition-transform"
                            onClick={handleToggleVideo}
                        >
                            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="rounded-2xl h-16 w-16 shadow-xl hover:scale-110 active:scale-95 transition-all mx-4 rotate-[135deg]"
                            onClick={handleEndCall}
                        >
                            <Phone className="h-8 w-8" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-xl h-14 w-14 shadow-lg hover:scale-105 transition-transform"
                            onClick={() => setIsChatOpen(!isChatOpen)}
                        >
                            <MessageSquare className="h-6 w-6" />
                        </Button>
                    </div>
                </div>

                {/* Chat Panel */}
                {isChatOpen && (
                    <div className="absolute inset-y-0 right-0 z-20 md:static md:w-96 bg-gray-800 border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gray-900/50">
                            <h3 className="font-bold text-white text-xl flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Chat
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white hover:bg-white/10">
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                            {mockMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn('flex flex-col', msg.sender === 'patient' ? 'items-end' : 'items-start')}
                                >
                                    <div
                                        className={cn(
                                            'max-w-[85%] rounded-2xl px-4 py-3 shadow-md',
                                            msg.sender === 'patient'
                                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                                : 'bg-gray-700 text-white rounded-bl-none border border-white/10'
                                        )}
                                    >
                                        <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                    </div>
                                    <p className="text-[10px] mt-1.5 font-bold uppercase tracking-widest opacity-40 text-white">
                                        {msg.time}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-white/10 bg-gray-900/50">
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="flex-1 bg-gray-700/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-primary/20 h-12"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && message.trim()) {
                                            setMessage('');
                                        }
                                    }}
                                />
                                <Button
                                    size="icon"
                                    className="bg-primary hover:bg-primary/90 h-12 w-12 shadow-lg"
                                    disabled={!message.trim()}
                                >
                                    <MessageSquare className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ElderlyVideoCall;
