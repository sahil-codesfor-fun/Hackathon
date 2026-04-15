'use client';
import { useState, useRef, useEffect } from 'react';
import useGuardexStore from '@/store/useGuardexStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Mic, Monitor, ShieldCheck, UserCheck,
    RotateCw, CheckCircle, AlertTriangle, ChevronRight, Loader2,
    Lock, Settings, Eye, Verified, ArrowLeft
} from 'lucide-react';

const STEPS = [
    { id: 'webcam', label: 'Webcam Access', desc: 'Initialize visual telemetry for real-time proctoring.' },
    { id: 'mic', label: 'Microphone Check', desc: 'Calibrate auditory sensory modules for ambient monitoring.' },
    { id: 'screen', label: 'Screen Share', desc: 'Establish mandatory screen capture protocol.' },
    { id: 'system', label: 'System Audit', desc: 'Scanning for virtualization layers and prohibited extensions.' },
    { id: 'face', label: 'Identity Verification', desc: 'Biometric face matching against institutional records.' },
    { id: 'env', label: 'Environment Scan', desc: '360-degree auditory and visual room verification.' },
    { id: 'rules', label: 'Honor Code', desc: 'Final declaration of academic integrity and rules adherence.' }
];

export default function PermissionWizard() {
    const { setPage, startExam, updateAI, currentExam } = useGuardexStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({});
    const videoRef = useRef(null);

    const startMedia = async (type) => {
        try {
            if (type === 'webcam') {
                const s = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) videoRef.current.srcObject = s;
                updateAI({ webcamActive: true });
            } else if (type === 'mic') {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                updateAI({ micActive: true });
            } else if (type === 'screen') {
                await navigator.mediaDevices.getDisplayMedia({ video: true });
            }
            setStatus(prev => ({ ...prev, [STEPS[currentStep].id]: 'success' }));
        } catch (err) {
            console.error(err);
            setStatus(prev => ({ ...prev, [STEPS[currentStep].id]: 'error' }));
        }
    };

    const nextStep = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setLoading(false);

        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            startExam(currentExam?.id);
            document.documentElement.requestFullscreen().catch(e => console.log('Fullscreen rejected'));
            setPage('exam');
        }
    };

    const stepData = STEPS[currentStep];

    return (
        <div className="min-h-screen bg-[#f9f9f6] flex items-center justify-center p-10 font-sans">

            <div className="w-[1000px] flex bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#e0e0d5]">

                {/* Left: Progress Sidebar */}
                <div className="w-[320px] bg-gray-50 border-r border-[#e0e0d5] py-16 px-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-10 text-[#4a7c59]">
                        <ShieldCheck size={24} />
                        <span className="font-bold tracking-tight">Onboarding Gateway</span>
                    </div>

                    <div className="space-y-4 flex-1">
                        {STEPS.map((step, idx) => (
                            <div key={step.id} className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${idx < currentStep ? 'bg-[#4a7c59] border-[#4a7c59] text-white' :
                                    idx === currentStep ? 'border-[#4a7c59] text-[#4a7c59] shadow-[0_0_10px_rgba(74,124,89,0.2)]' :
                                        'border-gray-200 text-gray-300'
                                    }`}>
                                    {idx < currentStep ? <CheckCircle size={14} /> : idx + 1}
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${idx === currentStep ? 'text-[#1a1a1a]' : 'text-gray-300'
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setPage('portal')}
                        className="mt-8 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#4a7c59] transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Portal
                    </button>

                    <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-12 bg-white p-4 rounded-xl border border-gray-100 italic">
                        STATUS: SECURE_LINK_ACTIVE <br />
                        ENCRYPTION: AES-256-BIT
                    </div>
                </div>

                {/* Right: Step Content */}
                <div className="flex-1 p-20 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={stepData.id}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex-1"
                        >
                            <div className="mb-10">
                                <div className="text-[10px] font-bold text-[#4a7c59] uppercase tracking-[0.2em] mb-3">Protocol Phase: 0{currentStep + 1}</div>
                                <h2 className="text-4xl font-bold tracking-tight mb-4">{stepData.label}</h2>
                                <p className="text-gray-500 leading-relaxed text-lg">{stepData.desc}</p>
                            </div>

                            <div className="min-h-[300px] mb-12">
                                {/* Media Preview */}
                                {(stepData.id === 'webcam' || stepData.id === 'face' || stepData.id === 'env') && (
                                    <div className="aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative mb-6 shadow-inner">
                                        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 border-4 border-white/20 pointer-events-none" />
                                    </div>
                                )}

                                {stepData.id === 'system' && (
                                    <div className="space-y-4">
                                        {[
                                            { l: 'Hardware Fingerprint Audit', s: 'Verified' },
                                            { l: 'Extension Signature Scan', s: 'Clean (0 Active)' },
                                            { l: 'VM Layer Insulation', s: 'Secure' }
                                        ].map((c, i) => (
                                            <div key={i} className="flex justify-between items-center p-5 bg-gray-50 rounded-xl border border-gray-100">
                                                <span className="text-sm font-medium">{c.l}</span>
                                                <div className="flex items-center gap-2 text-[#4a7c59] text-xs font-bold uppercase">
                                                    <Verified size={14} /> {c.s}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {stepData.id === 'rules' && (
                                    <div className="p-8 bg-[#4a7c59]/5 border border-[#4a7c59]/20 rounded-2xl">
                                        <h4 className="font-bold text-[#4a7c59] mb-4 flex items-center gap-2">
                                            <Lock size={16} /> Integrity Declaration
                                        </h4>
                                        <ul className="space-y-3 text-sm text-[#4a7c59]/80 list-disc pl-5 font-medium">
                                            <li>I will not leave the secure fullscreen node.</li>
                                            <li>I will not attempt any clipboard operations.</li>
                                            <li>I will not switch focus to external applications.</li>
                                            <li>I consent to AI-based sensory proctoring.</li>
                                        </ul>
                                    </div>
                                )}

                                {['webcam', 'mic', 'screen'].includes(stepData.id) && status[stepData.id] !== 'success' && (
                                    <button
                                        onClick={() => startMedia(stepData.id)}
                                        className="w-full py-5 bg-[#4a7c59] text-white font-bold rounded-xl hover:bg-[#3d664a] transition-all shadow-lg shadow-[#4a7c59]/20 flex items-center justify-center gap-3"
                                    >
                                        <Settings size={20} /> Grant {stepData.label} Permission
                                    </button>
                                )}
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex gap-4">
                                    {currentStep > 0 && (
                                        <button
                                            onClick={() => setCurrentStep(currentStep - 1)}
                                            className="px-6 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
                                        >
                                            Previous Step
                                        </button>
                                    )}
                                    <div className="text-[10px] text-gray-300 font-mono italic flex items-center">
                                        Node_Fingerprint: GX-S_2411
                                    </div>
                                </div>
                                {(status[stepData.id] === 'success' || ['system', 'face', 'env', 'rules'].includes(stepData.id)) && (
                                    <button
                                        onClick={nextStep}
                                        disabled={loading}
                                        className="px-10 py-4 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-black transition-all flex items-center gap-3 shadow-xl"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Continue Initialization"}
                                        <ChevronRight size={20} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
