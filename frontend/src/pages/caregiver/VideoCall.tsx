import { Video, Mic, MicOff, VideoOff, Phone, FileText, Edit, Heart, Thermometer, Activity, X, MessageSquare } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTwilioVideo } from '../../hooks/useTwilioVideo';
import Room from '../../components/video/Room';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';
import { useCallStore } from '../../store/callStore';
import { callActions } from '../../hooks/useCallSignaling';
import axios from 'axios';

const CaregiverVideoCall = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showPrescription, setShowPrescription] = useState(false);
    const [message, setMessage] = useState('');
    const [callTime, setCallTime] = useState(0);

    const [diagnosis, setDiagnosis] = useState("");
    const [severity, setSeverity] = useState("mild");
    const [medicines, setMedicines] = useState([
        { name: "", dosage: "", frequency: "", duration: "" }
    ]);
    const [advice, setAdvice] = useState("");

    const { activeCallId, callStatus } = useCallStore();

    // Room name is passed directly from signaling (e.g. consultation-abc123)
    const roomName = id || 'default';
    const identityRef = useRef(`caregiver-${Date.now()}`);
    const identity = identityRef.current;

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
            console.log('Elderly joined:', participant.identity);
        },
        onParticipantDisconnected: (participant) => {
            console.log('Elderly left:', participant.identity);
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
        if (activeCallId) {
            callActions.endCall(activeCallId, '');
        }
        navigate('/caregiver/dashboard');
    };

    // Listen for call ended by other side
    useEffect(() => {
        if (callStatus === 'ended') {
            disconnectFromRoom();
            navigate('/caregiver/dashboard');
        }
    }, [callStatus]);

    const handleSavePrescription = async () => {
        if (!diagnosis.trim()) {
            alert("Please enter a diagnosis");
            return;
        }

        if (!medicines[0].name || !medicines[0].dosage || !medicines[0].duration) {
            alert("Please fill all medicine fields");
            return;
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5004/api`}/prescriptions`, {
                patientId: '65de1234567890abcdef1234', // Mock patient ID or get from appointment
                diagnosis,
                severity,
                medicines,
                advice
            });

            alert("Prescription saved and sent successfully");
            setShowPrescription(false);
        } catch (err) {
            console.error(err);
            alert("Failed to save prescription");
        }
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Connecting to elderly...</p>
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
                    <Button onClick={() => navigate('/caregiver/dashboard')} className="bg-primary hover:bg-primary/90">
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col lg:flex-row">
            {/* Main Video Area */}
            <div className="flex-1 relative">
                {room ? (
                    <Room
                        roomName={roomName}
                        room={room}
                        participants={participants}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl text-white">👤</span>
                            </div>
                            <p className="text-white text-xl">Waiting for elderly to join...</p>
                        </div>
                    </div>
                )}

                {/* Call Timer */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900/80 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm font-medium">
                    {formatTime(callTime)}
                </div>

                {/* Control Bar */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-gray-900/80 backdrop-blur-md rounded-full px-6 py-4">
                    <Button
                        variant={isMuted ? 'destructive' : 'secondary'}
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={handleToggleAudio}
                    >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant={!isVideoOn ? 'destructive' : 'secondary'}
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={handleToggleVideo}
                    >
                        {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full h-14 w-14"
                        onClick={handleEndCall}
                    >
                        <Phone className="h-6 w-6 rotate-[135deg]" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={() => setShowPrescription(true)}
                    >
                        <FileText className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={() => setIsChatOpen(!isChatOpen)}
                    >
                        <MessageSquare className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Right Sidebar - Elderly Info */}
            <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <h3 className="font-display text-xl font-semibold text-gray-900">Patient Information</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Real-time vitals and history</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                    {/* Patient Details */}
                    <div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
                        <div className="mb-3">
                            <p className="font-semibold text-gray-900">Kriya Mehta</p>
                            <p className="text-sm text-gray-600">Age: 72 • Female</p>
                        </div>
                        <div className="text-xs text-gray-600">
                            Blood Group: B+ • High Blood Pressure
                        </div>
                    </div>

                    {/* Vital Signs */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 text-sm italic">Vital Signs</h4>
                        <div className="rounded-lg p-4 space-y-3 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Heart className="h-4 w-4 text-red-500" />
                                    <span className="text-sm text-gray-700">Heart Rate</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">72 bpm</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Activity className="h-4 w-4 text-primary" />
                                    <span className="text-sm text-gray-700">BP</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">130/85 mmHg</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Thermometer className="h-4 w-4 text-orange-500" />
                                    <span className="text-sm text-gray-700">Temp</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">98.6°F</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-4">
                        <Button variant="outline" className="w-full justify-start" onClick={() => setShowPrescription(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Write Prescription
                        </Button>
                    </div>
                </div>
            </div>

            {/* Prescription Modal */}
            {showPrescription && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                        <Button variant="ghost" className="absolute right-4 top-4" onClick={() => setShowPrescription(false)}>
                            <X />
                        </Button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">Medical Prescription</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                                <Input placeholder="Enter diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none">
                                    <option value="mild">Mild</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="severe">Severe</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 border-b pb-2">Medicines</h3>
                                {medicines.map((m, i) => (
                                    <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <Input placeholder="Name" value={m.name} onChange={e => {
                                            const arr = [...medicines]; arr[i].name = e.target.value; setMedicines(arr);
                                        }} />
                                        <Input placeholder="Dosage" value={m.dosage} onChange={e => {
                                            const arr = [...medicines]; arr[i].dosage = e.target.value; setMedicines(arr);
                                        }} />
                                        <Input placeholder="Freq" value={m.frequency} onChange={e => {
                                            const arr = [...medicines]; arr[i].frequency = e.target.value; setMedicines(arr);
                                        }} />
                                        <Input placeholder="Dur" value={m.duration} onChange={e => {
                                            const arr = [...medicines]; arr[i].duration = e.target.value; setMedicines(arr);
                                        }} />
                                    </div>
                                ))}
                                <Button variant="secondary" className="w-full" onClick={() => setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "" }])}>
                                    + Add Another Medicine
                                </Button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Advice & Notes</label>
                                <Textarea className="min-h-[100px]" placeholder="Enter health advice..." value={advice} onChange={e => setAdvice(e.target.value)} />
                            </div>

                            <Button className="w-full h-12 text-lg font-bold" onClick={handleSavePrescription}>
                                Save & Send to Patient
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaregiverVideoCall;
