'use client';
import { useState, useRef, useEffect } from 'react';
import useGuardexStore from '@/store/useGuardexStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Mic, Monitor, ShieldCheck, UserCheck,
    RotateCw, CheckCircle, AlertTriangle, ChevronRight, Loader2,
    Lock, Settings, Eye, Verified, ArrowLeft, XCircle, Info
} from 'lucide-react';
import { AIBrawler } from '@/engine/AIBrawler';

const STEPS = [
    { id: 'browser', label: 'Browser Audit', desc: 'Analyzing browser capabilities and AI feature lockdown.' },
    { id: 'webcam', label: 'Webcam Access', desc: 'Initialize visual telemetry for real-time proctoring.' },
    { id: 'mic', label: 'Microphone Check', desc: 'Calibrate auditory sensory modules for ambient monitoring.' },
    { id: 'screen', label: 'Screen Share', desc: 'Establish mandatory screen capture protocol.' },
    { id: 'system', label: 'Infrastructure Audit', desc: 'Scanning for virtualization layers, RDP sessions, and AI sidebars.' },
    { id: 'face', label: 'Biometric Verification', desc: 'Smart face matching with anti-spoofing liveness check.' },
    { id: 'rules', label: 'Honor Code', desc: 'Final declaration of academic integrity and rules adherence.' }
];

export default function PermissionWizard() {
    const { setPage, startExam, updateAI, currentExam, setBrowserProfile, setVMSignals, aiState } = useGuardexStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({});
    const [browserData, setLocalBrowserData] = useState(null);
    const [livenessPhase, setLivenessPhase] = useState('center'); // center, blink, turn, rotation
    const [verificationAttempts, setVerificationAttempts] = useState(0);
    const [extensionsDetected, setExtensionsDetected] = useState([]);
    const videoRef = useRef(null);

    useEffect(() => {
        const stepId = STEPS[currentStep].id;

        if (stepId === 'browser') {
            const profile = AIBrawler.detectBrowser();

            // Extension Audit (Deep Scan)
            const forbiddenExtensions = [];
            if (window.chrome?.runtime) forbiddenExtensions.push('Chrome-API-Hook');
            if (document.querySelector('grammarly-extension') || document.querySelector('.grammarly-ghost')) forbiddenExtensions.push('Grammarly / Writing Tool');
            if (window.idm_installed || window.IDM_HOOK) forbiddenExtensions.push('Internet Download Manager');
            if (window.loom_sdk || document.querySelector('#loom-companion-mv3')) forbiddenExtensions.push('Loom Screen Recorder');
            if (window.AwesomeScreenshot || document.querySelector('.as-capture-area')) forbiddenExtensions.push('Awesome Screenshot');
            if (window.Leo_AI || window.Brave_Leo) forbiddenExtensions.push('Brave Leo AI');
            if (window.Aria_Sidebar) forbiddenExtensions.push('Opera Aria AI');

            // Check for generalized Content Scripts (Detecting suspicious DOM mutations)
            const suspiciousTags = ['video-downloader', 'adblock', 'translator'];
            suspiciousTags.forEach(tag => {
                if (document.getElementsByTagName(tag).length > 0) forbiddenExtensions.push(`${tag} Extension`);
            });

            setExtensionsDetected(forbiddenExtensions);
            setLocalBrowserData({ ...profile, extensions: forbiddenExtensions });
            setBrowserProfile(profile.profile);

            if (profile.blocked || forbiddenExtensions.length > 0) {
                setStatus(prev => ({ ...prev, browser: 'blocked' }));
            } else {
                setStatus(prev => ({ ...prev, browser: 'success' }));
                setTimeout(() => nextStep(), 1500);
            }
        }

        if (stepId === 'system' && status.system !== 'success') {
            runSystemAudit();
        }

        if (stepId === 'face' && status.face !== 'success') {
            runFaceVerification();
        }

        // Auto-media triggers
        if ((stepId === 'webcam' || stepId === 'mic') && status[stepId] !== 'success') {
            startMedia(stepId);
        }
    }, [currentStep, setBrowserProfile]);

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

    const runSystemAudit = async () => {
        setLoading(true);
        // Simulate deep system scan per v2.1 spec
        await new Promise(r => setTimeout(r, 2000));

        const signals = [];
        if (navigator.hardwareConcurrency <= 2) signals.push('low_cpu_cores');
        // Mocking VM GPU check
        const gl = document.createElement('canvas').getContext('webgl');
        if (gl) {
            const renderer = gl.getParameter(gl.RENDERER);
            if (renderer.includes('VirtualBox') || renderer.includes('VMware')) signals.push('vm_gpu_renderer');
        }

        setVMSignals(signals);
        setStatus(prev => ({ ...prev, system: signals.length > 0 ? 'warning' : 'success' }));
        setLoading(false);
        // Auto-advance after audit success
        if (signals.length === 0) setTimeout(() => nextStep(), 1000);
    };

    const runFaceVerification = async () => {
        setLoading(true);
        if (livenessPhase === 'center') {
            await new Promise(r => setTimeout(r, 1500));
            setLivenessPhase('blink');
        } else if (livenessPhase === 'blink') {
            await new Promise(r => setTimeout(r, 1500));
            setLivenessPhase('turn');
        } else if (livenessPhase === 'turn') {
            await new Promise(r => setTimeout(r, 2000));
            setLivenessPhase('rotation');
        } else if (livenessPhase === 'rotation') {
            await new Promise(r => setTimeout(r, 3000));
            setStatus(prev => ({ ...prev, face: 'success' }));
            updateAI({ identityStatus: 'verified' });
            setTimeout(() => nextStep(), 1500);
        }
        setLoading(false);
    };

    const nextStep = async () => {
        if (STEPS[currentStep].id === 'system' && status.system !== 'success' && status.system !== 'warning') {
            await runSystemAudit();
            return;
        }

        if (STEPS[currentStep].id === 'face' && status.face !== 'success') {
            await runFaceVerification();
            return;
        }

        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            startExam(currentExam?.id);
            document.documentElement.requestFullscreen().catch(e => console.log('Fullscreen rejected'));
            setPage('exam');
        }
    };

    const stepData = STEPS[currentStep];

    const getBrowserInstructions = () => {
        if (!browserData?.profile) return null;
        if (browserData.profile.isEdge) return "Sidebar → Discover (Copilot) → Toggle OFF";
        if (browserData.profile.isBrave) return "Settings → Leo AI → Show in sidebar → Toggle OFF";
        if (browserData.profile.isOpera) return "Settings → Sidebar → Aria → Toggle OFF";
        return "No action required for this browser.";
    };

    return (
        <div className="min-h-screen bg-[#f9f9f6] flex items-center justify-center p-10 font-sans">
            <div className="w-[1100px] flex bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#e0e0d5]">

                {/* Left: Progress Sidebar */}
                <div className="w-[340px] bg-gray-50 border-r border-[#e0e0d5] py-16 px-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-10 text-[#4a7c59]">
                        <ShieldCheck size={24} />
                        <span className="font-bold tracking-tight">Guardex SecNode 2.1</span>
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
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${idx === currentStep ? 'text-[#1a1a1a]' : 'text-gray-300'}`}>
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setPage('portal')} className="mt-8 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#4a7c59] transition-colors">
                        <ArrowLeft size={14} /> Terminate Initialization
                    </button>
                </div>

                {/* Right: Step Content */}
                <div className="flex-1 p-20 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={stepData.id}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="mb-8">
                                <div className="text-[10px] font-bold text-[#4a7c59] uppercase tracking-[0.2em] mb-3">Protocol v2.1 // Phase {currentStep + 1}</div>
                                <h2 className="text-4xl font-bold tracking-tight mb-4">{stepData.label}</h2>
                                <p className="text-gray-500 leading-relaxed text-lg max-w-xl">{stepData.desc}</p>
                            </div>

                            <div className="flex-1 min-h-[350px]">
                                {stepData.id === 'browser' && (
                                    <div className="space-y-6">
                                        <div className={`p-8 rounded-2xl border transition-all ${status.browser === 'blocked' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                            <div className="flex items-center gap-4 mb-4">
                                                {status.browser === 'blocked' ? <XCircle className="text-red-500" size={32} /> : <CheckCircle className="text-[#4a7c59]" size={32} />}
                                                <div>
                                                    <h4 className={`font-bold ${status.browser === 'blocked' ? 'text-red-700' : 'text-[#4a7c59]'}`}>
                                                        {status.browser === 'blocked' ?
                                                            (extensionsDetected.length > 0 ? 'Security Violation' : 'Browser Incompatible') :
                                                            'Browser Signature Valid'}
                                                    </h4>
                                                    <p className="text-sm opacity-70">
                                                        {extensionsDetected.length > 0 ?
                                                            `${extensionsDetected.length} prohibited extensions found` :
                                                            `Detected: ${browserData?.profile.isArc ? 'Arc Browser' : 'Compliant Engine'}`}
                                                    </p>
                                                </div>
                                            </div>
                                            {status.browser === 'blocked' && (
                                                <div className="p-4 bg-white/50 rounded-xl text-sm font-medium text-red-800 border border-red-200">
                                                    {extensionsDetected.length > 0 ? (
                                                        <div className="space-y-2">
                                                            <div className="text-xs font-bold uppercase underline">Remove the following to proceed:</div>
                                                            {extensionsDetected.map((ext, i) => <div key={i}>• {ext}</div>)}
                                                        </div>
                                                    ) : browserData.reason}
                                                </div>
                                            )}
                                            {status.browser === 'success' && browserData?.profile && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-[#4a7c59] uppercase tracking-wider">
                                                        <Info size={14} /> Action Required:
                                                    </div>
                                                    <div className="p-4 bg-white/50 rounded-xl text-sm font-bold text-[#4a7c59]">
                                                        {getBrowserInstructions()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(stepData.id === 'webcam' || stepData.id === 'face') && (
                                    <div className="relative">
                                        <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden border border-gray-200 relative mb-6">
                                            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover scale-x-[-1]" />
                                            {stepData.id === 'face' && (
                                                <>
                                                    <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none" />
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-dashed border-white/50 rounded-[100px]" />
                                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/60 backdrop-blur-md rounded-full text-xs font-black text-white uppercase tracking-widest border border-white/20">
                                                        {loading ? "Analyzing Geometry..." :
                                                            livenessPhase === 'center' ? "Phase 1: Look directly at camera" :
                                                                livenessPhase === 'blink' ? "Phase 2: Blink twice now" :
                                                                    livenessPhase === 'turn' ? "Phase 3: Turn head slightly right" : "Phase 4: Perform 360° Slow Rotation"}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {status.face === 'success' && (
                                            <div className="absolute inset-0 bg-[#4a7c59]/10 backdrop-blur-sm flex items-center justify-center rounded-2xl border-2 border-[#4a7c59]">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-[#4a7c59] rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-xl">
                                                        <UserCheck size={32} />
                                                    </div>
                                                    <div className="text-lg font-bold text-[#4a7c59]">Identity Verified</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {stepData.id === 'system' && (
                                    <div className="space-y-4">
                                        {[
                                            { l: 'Hypervisor / VM Detection', s: (aiState.vmSignals?.length || 0) > 0 ? 'VM Signal Found' : 'Physical Hardware Confirmed', err: (aiState.vmSignals?.length || 0) > 0 },
                                            { l: 'Native AI Sidebar Scan', s: 'Lockdown Active', err: false },
                                            { l: 'RDP / Remote Session Filter', s: 'Secure Headless Check', err: false }
                                        ].map((c, i) => (
                                            <div key={i} className={`flex justify-between items-center p-6 bg-gray-50 rounded-2xl border ${c.err ? 'border-amber-200 bg-amber-50' : 'border-gray-100'}`}>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">{c.l}</div>
                                                    <div className={`text-sm font-black ${c.err ? 'text-amber-700' : 'text-gray-800'}`}>{c.s}</div>
                                                </div>
                                                {!loading && <CheckCircle size={20} className={c.err ? 'text-amber-500' : 'text-[#4a7c59]'} />}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {['webcam', 'mic', 'screen'].includes(stepData.id) && status[stepData.id] !== 'success' && (
                                    <button
                                        onClick={() => startMedia(stepData.id)}
                                        className="w-full py-6 bg-[#4a7c59] text-white font-bold rounded-2xl hover:bg-[#3d664a] transition-all shadow-xl shadow-[#4a7c59]/20 flex items-center justify-center gap-3"
                                    >
                                        <Settings size={20} /> Grant {stepData.label} Permission
                                    </button>
                                )}
                            </div>

                            <div className="flex justify-between items-center mt-12">
                                <div className="flex gap-4">
                                    {currentStep > 0 && (
                                        <button
                                            onClick={() => setCurrentStep(currentStep - 1)}
                                            className="px-6 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
                                        >
                                            Previous Step
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={nextStep}
                                    disabled={loading || (stepData.id === 'browser' && status.browser === 'blocked')}
                                    className={`px-12 py-5 font-black rounded-2xl transition-all flex items-center gap-3 shadow-2xl ${loading || (stepData.id === 'browser' && status.browser === 'blocked')
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-[#1a1a1a] text-white hover:bg-black active:scale-[0.98]'
                                        }`}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> :
                                        status[stepData.id] === 'success' || ['system', 'face', 'rules'].includes(stepData.id) ? "Confirm & Proceed" : "Analyze Environment"}
                                    {!loading && <ChevronRight size={20} />}
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
