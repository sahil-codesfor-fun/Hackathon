import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useGuardexStore from '@/store/useGuardexStore';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
    Shield, AlertTriangle, Play, Terminal,
    Camera, Mic, Activity, Clock, LogOut,
    Lock, AlertOctagon, UserCheck,
    RefreshCcw, Loader2, FileCode, Server,
    Maximize, Eye, Info, ChevronDown, Code2,
    Clipboard, Ban, MonitorUp, EyeOff, Smartphone, Waves
} from 'lucide-react';
import { AIBrawler } from '@/engine/AIBrawler';

const LANGUAGES = [
    { id: 'python', label: 'Python', ext: '.py', template: '# Write your solution here\ndef main():\n    print("Hello World")\n\nif __name__ == "__main__":\n    main()' },
    { id: 'c', label: 'C', ext: '.c', template: '#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}' },
    { id: 'cpp', label: 'C++', ext: '.cpp', template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}' },
    { id: 'java', label: 'Java', ext: '.java', template: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}' },
    { id: 'javascript', label: 'JavaScript', ext: '.js', template: '// Write your solution here\nconsole.log("Hello World");' },
    { id: 'csharp', label: 'C#', ext: '.cs', template: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello World");\n    }\n}' },
    { id: 'go', label: 'Go', ext: '.go', template: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World")\n}' },
    { id: 'ruby', label: 'Ruby', ext: '.rb', template: '# Write your solution here\nputs "Hello World"' },
    { id: 'rust', label: 'Rust', ext: '.rs', template: 'fn main() {\n    println!("Hello World");\n}' },
    { id: 'kotlin', label: 'Kotlin', ext: '.kt', template: 'fun main() {\n    println!("Hello World")\n}' },
    { id: 'php', label: 'PHP', ext: '.php', template: '<?php\necho "Hello World\\n";\n?>' },
    { id: 'typescript', label: 'TypeScript', ext: '.ts', template: '// Write your solution here\nconsole.log("Hello World");' },
    { id: 'r', label: 'R', ext: '.r', template: '# Write your solution here\ncat("Hello World\\n")' },
    { id: 'perl', label: 'Perl', ext: '.pl', template: '#!/usr/bin/perl\nprint "Hello World\\n";' },
    { id: 'swift', label: 'Swift', ext: '.swift', template: '// Write your solution here\nprint("Hello World")' },
];

export default function ExamEnvironment() {
    const {
        user, session, aiState, updateAI, addViolation,
        violations, penaltyConfig, submitSession, unfreeze, currentExam, resetSession, saveAnswer,
        engineState
    } = useGuardexStore();

    const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
    const [code, setCode] = useState(LANGUAGES[0].template);
    const [stdin, setStdin] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showStdin, setShowStdin] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showFsWarning, setShowFsWarning] = useState(false);
    const [activeQ, setActiveQ] = useState(0);
    const [questionCodes, setQuestionCodes] = useState({});
    const [fsCount, setFsCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pasteAttempts, setPasteAttempts] = useState(0);
    const [showPasteWarning, setShowPasteWarning] = useState(false);
    const [webcamStatus, setWebcamStatus] = useState('initializing');
    const [faceCount, setFaceCount] = useState(0);
    const [gazeDir, setGazeDir] = useState('center');
    const [gazeWarning, setGazeWarning] = useState(false);
    const [noFaceCount, setNoFaceCount] = useState(0);
    const [phoneWarning, setPhoneWarning] = useState(false);
    const [lastScreenHash, setLastScreenHash] = useState(null);

    const videoRef = useRef(null);
    const webcamVideoRef = useRef(null);
    const canvasWatermarkRef = useRef(null);
    const questionCanvasRef = useRef(null);
    const langMenuRef = useRef(null);
    const webcamStreamRef = useRef(null);
    const gazeAwayCountRef = useRef(0);
    const noFaceCountRef = useRef(0);
    const detectorRef = useRef(null);

    // --- Initialize question codes when exam loads ---
    useEffect(() => {
        if (currentExam?.questions) {
            const codes = {};
            currentExam.questions.forEach((q, i) => {
                codes[i] = q.template || LANGUAGES[0].template;
            });
            setQuestionCodes(codes);
            setCode(codes[0] || LANGUAGES[0].template);
        }
    }, [currentExam]);

    // --- Switch question ---
    const switchQuestion = useCallback((idx) => {
        setQuestionCodes(prev => ({ ...prev, [activeQ]: code }));
        setActiveQ(idx);
        setCode(questionCodes[idx] || currentExam?.questions?.[idx]?.template || LANGUAGES[0].template);
        setOutput('');
        setStdin('');
    }, [activeQ, code, questionCodes, currentExam]);

    const questions = currentExam?.questions || [];
    const currentQuestion = questions[activeQ];

    // --- Language change ---
    const handleLanguageChange = useCallback((lang) => {
        setSelectedLang(lang);
        setCode(lang.template);
        setShowLangMenu(false);
        setOutput('');
    }, []);

    // --- Close lang menu on outside click ---
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
                setShowLangMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Copy / Paste / Cut Blocking ---
    useEffect(() => {
        if (!penaltyConfig.copyPasteBlocked) return;

        const blockPaste = (e) => {
            e.preventDefault();
            setPasteAttempts(p => p + 1);
            setShowPasteWarning(true);
            setTimeout(() => setShowPasteWarning(false), 3000);
            addViolation('paste_attempt', `Paste blocked — clipboard injection attempt #${pasteAttempts + 1}`, 'high');
        };

        const blockCopy = (e) => {
            e.preventDefault();
            addViolation('copy_attempt', 'Copy blocked — attempted to copy exam content', 'medium');
        };

        const blockCut = (e) => {
            e.preventDefault();
            addViolation('cut_attempt', 'Cut blocked — attempted to cut content', 'medium');
        };

        document.addEventListener('paste', blockPaste);
        document.addEventListener('copy', blockCopy);
        document.addEventListener('cut', blockCut);

        return () => {
            document.removeEventListener('paste', blockPaste);
            document.removeEventListener('copy', blockCopy);
            document.removeEventListener('cut', blockCut);
        };
    }, [penaltyConfig.copyPasteBlocked, pasteAttempts, addViolation]);

    // --- Right Click Context Menu Block ---
    useEffect(() => {
        if (!penaltyConfig.rightClickBlocked) return;
        const blockContext = (e) => {
            e.preventDefault();
            addViolation('right_click', 'Right-click context menu blocked', 'low');
        };
        document.addEventListener('contextmenu', blockContext);
        return () => document.removeEventListener('contextmenu', blockContext);
    }, [penaltyConfig.rightClickBlocked, addViolation]);

    // --- Keyboard Shortcut Blocking (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+S, F12) ---
    useEffect(() => {
        const blockKeys = (e) => {
            // Block F12 (DevTools)
            if (e.key === 'F12') { e.preventDefault(); return; }
            // Block Ctrl+Shift+I / Ctrl+Shift+J (DevTools)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'i' || e.key === 'j')) { e.preventDefault(); return; }
            // Block Ctrl+U (View Source)
            if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); return; }
            // Block Ctrl+S (Save)
            if (e.ctrlKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); return; }
        };
        document.addEventListener('keydown', blockKeys);
        return () => document.removeEventListener('keydown', blockKeys);
    }, []);

    // --- Auto Fullscreen and AIBrawler Start ---
    useEffect(() => {
        const enterFs = async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                    setIsFullscreen(true);
                }
            } catch (e) {
                console.log('Fullscreen rejected');
            }
        };

        if (session.isActive) enterFs();

        const brawler = new AIBrawler({
            onViolation: (type, payload) => addViolation(type, `Browser AI Assistant detected [${payload.key || payload.type}]`, 'high', payload)
        });
        brawler.start();
        return () => brawler.stop();
    }, [session.isActive, addViolation]);

    // --- Run Code via OneCompiler API ---
    const handleRunCode = useCallback(async () => {
        if (isRunning || !code.trim()) return;
        setIsRunning(true);
        setOutput('> Compiling...\n> Language: ' + selectedLang.label + '\n> Please wait...');

        try {
            const res = await fetch('/api/compile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: selectedLang.id,
                    code,
                    stdin,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setOutput(`> ERROR [${res.status}]\n${data.error || 'Unknown error'}\n${data.stderr || ''}`);
            } else {
                let result = '';
                if (data.stdout) result += data.stdout;
                if (data.stderr) result += (result ? '\n' : '') + '⚠ STDERR:\n' + data.stderr;
                if (data.exception) result += (result ? '\n' : '') + '❌ EXCEPTION:\n' + data.exception;
                if (data.error) result += (result ? '\n' : '') + '❌ ERROR:\n' + data.error;
                if (!result) result = '> Program executed successfully (no output)';
                if (data.executionTime) result += '\n\n⏱ Execution: ' + data.executionTime + 'ms';
                setOutput(result);
            }
        } catch (err) {
            setOutput('> NETWORK ERROR\n' + err.message + '\n> Please check your connection.');
        } finally {
            setIsRunning(false);
        }
    }, [code, stdin, selectedLang, isRunning]);

    // --- Timer State Management ---
    useEffect(() => {
        const updateTimer = () => {
            if (session.isActive && session.endTime) {
                setTimeLeft(Math.max(0, session.endTime - Date.now()));
            }

            // Auto-unfreeze if frozen time is up
            if (session.isFrozen && session.frozenUntil && Date.now() >= session.frozenUntil) {
                unfreeze();
            }

            // HOD Unfreeze Check
            if (session.isFrozen && user) {
                const store = useGuardexStore.getState();
                const myReport = store.reports.find(r => r.studentId === user.id && r.unfreezeAction);
                if (myReport) {
                    unfreeze();
                    // Optional: mark report as completely resolved so it doesn't unfreeze again
                    store.resolveReport(myReport.id);
                }
            }
        };
        updateTimer();
        const inv = setInterval(updateTimer, 1000);
        return () => clearInterval(inv);
    }, [session.isActive, session.endTime, session.isFrozen, session.frozenUntil, unfreeze, user]);

    // --- DevTools Detection ---
    const [devToolsActive, setDevToolsActive] = useState(false);
    useEffect(() => {
        const interval = setInterval(() => {
            const threshold = 160;
            const isDevTools = window.outerHeight - window.innerHeight > threshold || window.outerWidth - window.innerWidth > threshold;
            setDevToolsActive(isDevTools);
            if (isDevTools) {
                addViolation('devtools_open', 'Developer Tools inspection window detected', 'high');
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [addViolation]);

    // --- Audio Level Monitoring ---
    const [micLevel, setMicLevel] = useState(0);
    const audioSpikeRef = useRef(0);
    useEffect(() => {
        let audioCtx;
        let analyser;
        let stream;
        let intervalId;
        const initAudio = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioCtx.createAnalyser();
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);

                // Human voice frequency analysis (300Hz - 3400Hz)
                const voiceBandStart = Math.floor(300 / (audioCtx.sampleRate / 2) * analyser.frequencyBinCount);
                const voiceBandEnd = Math.floor(3400 / (audioCtx.sampleRate / 2) * analyser.frequencyBinCount);

                analyser.fftSize = 256;
                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                intervalId = setInterval(() => {
                    analyser.getByteFrequencyData(dataArray);

                    // Total energy
                    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

                    // Voice band energy (PRD v2.1 Audio Anomaly)
                    const voiceEnergy = dataArray.slice(voiceBandStart, voiceBandEnd).reduce((a, b) => a + b, 0) / (voiceBandEnd - voiceBandStart);

                    setMicLevel(avg);
                    const now = Date.now();

                    if (voiceEnergy > 50 && now - audioSpikeRef.current > 15000) {
                        audioSpikeRef.current = now;
                        addViolation('audio_second_voice', `Conversational speech patterns detected (${Math.round(voiceEnergy)}) — audio clip saved for faculty review`, 'medium');
                    } else if (avg > penaltyConfig.audioSensitivity && now - audioSpikeRef.current > 10000) {
                        audioSpikeRef.current = now;
                        addViolation('audio_spike', `Loud ambient noise detected (${Math.round(avg)}dB)`, 'low');
                    }
                }, 3000);
            } catch (e) { console.error('Audio calibration failed:', e); }
        };
        initAudio();
        return () => { if (audioCtx) audioCtx.close(); if (stream) stream.getTracks().forEach(t => t.stop()); if (intervalId) clearInterval(intervalId); };
    }, [addViolation, penaltyConfig.audioSensitivity]);

    // --- macOS Floating Window Defence ---
    useEffect(() => {
        const handleBlur = () => { if (document.fullscreenElement && session.isActive) addViolation('macos_floating_overlay', 'Inferred macOS floating window detected', 'high'); };
        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [addViolation, session.isActive]);

    // --- Fullscreen Enforcement ---
    useEffect(() => {
        const handleFSChange = () => {
            if (!document.fullscreenElement && session.isActive) {
                setIsFullscreen(false);
                const count = fsCount + 1;
                setFsCount(count);
                addViolation('fullscreen_exit', `Fullscreen abandoned (#${count})`, count >= penaltyConfig.maxFullscreenExits ? 'critical' : 'high');
                if (count < penaltyConfig.maxFullscreenExits) setShowFsWarning(true);
                else setTimeout(() => submitSession(), 1000);
            } else if (document.fullscreenElement) {
                setIsFullscreen(true);
            }
        };
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, [fsCount, session.isActive, addViolation, submitSession, penaltyConfig.maxFullscreenExits]);

    // --- Question Rendering (Canvas) ---
    useEffect(() => {
        const canvas = questionCanvasRef.current;
        if (!canvas || !currentExam) return;
        const ctx = canvas.getContext('2d');
        const draw = () => {
            canvas.width = 450; canvas.height = 1200;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Exam title
            ctx.fillStyle = '#4a7c59'; ctx.font = '700 18px Inter, system-ui';
            ctx.fillText(currentExam.title.toUpperCase(), 30, 40);
            ctx.fillStyle = '#999'; ctx.font = '400 12px Inter, system-ui';
            ctx.fillText(currentExam.course || '', 30, 60);

            // Divider
            ctx.strokeStyle = '#e0e0d5'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(30, 75); ctx.lineTo(420, 75); ctx.stroke();

            let y = 100;
            // Current question
            const q = currentQuestion;
            if (q) {
                ctx.fillStyle = '#4a7c59'; ctx.font = '700 14px Inter, system-ui';
                ctx.fillText(`Q${activeQ + 1}. ${q.title || 'Untitled'}`, 30, y);
                y += 24;

                ctx.fillStyle = '#888'; ctx.font = '600 11px Inter, system-ui';
                ctx.fillText(`${q.marks || 0} Marks`, 30, y);
                y += 28;

                // Render description with word wrap
                if (q.description) {
                    ctx.fillStyle = '#444'; ctx.font = '400 13px Inter, system-ui';
                    const words = q.description.split(' ');
                    let line = '';
                    for (let n = 0; n < words.length; n++) {
                        let test = line + words[n] + ' ';
                        if (ctx.measureText(test).width > 380) {
                            ctx.fillText(line.trim(), 30, y);
                            line = words[n] + ' ';
                            y += 22;
                        } else {
                            line = test;
                        }
                    }
                    ctx.fillText(line.trim(), 30, y);
                    y += 30;
                }

                // Divider between question sections
                ctx.strokeStyle = '#e8e8e3'; ctx.lineWidth = 0.5;
                ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(420, y); ctx.stroke();
                y += 20;
            }

            // All questions overview
            ctx.fillStyle = '#999'; ctx.font = '600 10px Inter, system-ui';
            ctx.fillText(`ALL QUESTIONS (${questions.length})`, 30, y);
            y += 20;

            questions.forEach((qq, i) => {
                const isActive = i === activeQ;
                ctx.fillStyle = isActive ? '#4a7c59' : '#aaa';
                ctx.font = `${isActive ? '700' : '400'} 12px Inter, system-ui`;
                ctx.fillText(`${i + 1}. ${qq.title || 'Untitled'}  —  ${qq.marks} m`, 30, y);
                y += 22;
            });
        };
        draw();
    }, [currentExam, activeQ, currentQuestion, questions]);

    // --- Watermark (Optimized to redraw only on window resize or user change) ---
    const drawWatermark = useCallback(() => {
        const c = canvasWatermarkRef.current; if (!c) return;
        const ctx = c.getContext('2d');
        c.width = 500; c.height = window.innerHeight > 1200 ? window.innerHeight : 1200;
        ctx.clearRect(0, 0, 500, c.height); ctx.save(); ctx.rotate(-Math.PI / 4);
        ctx.font = '12px JetBrains Mono'; ctx.fillStyle = 'rgba(74,124,89,0.06)';
        const text = `${user?.name?.toUpperCase()} // ${user?.rollNo}`;
        for (let i = -10; i < 15; i++) for (let j = -10; j < 15; j++) ctx.fillText(text, i * 280, j * 140);
        ctx.restore();
    }, [user]);

    useEffect(() => {
        drawWatermark();
        window.addEventListener('resize', drawWatermark);
        return () => window.removeEventListener('resize', drawWatermark);
    }, [drawWatermark]);

    // --- Webcam Initialization (Robust) ---
    useEffect(() => {
        let stream = null;
        const initWebcam = async () => {
            try {
                setWebcamStatus('initializing');
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, facingMode: 'user' }
                });
                webcamStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => videoRef.current.play().catch(() => { });
                }
                if (webcamVideoRef.current) {
                    webcamVideoRef.current.srcObject = stream;
                    webcamVideoRef.current.onloadedmetadata = () => webcamVideoRef.current.play().catch(() => { });
                }
                setWebcamStatus('active');
                updateAI({ webcamActive: true });
            } catch (err) {
                console.error('Webcam error:', err);
                setWebcamStatus('error');
                addViolation('webcam_blocked', 'Webcam access denied or unavailable', 'critical');
            }
        };
        initWebcam();
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, [updateAI, addViolation]);

    // --- Face Detection & Gaze Tracking (using coco-ssd) ---
    useEffect(() => {
        let intervalId = null;
        let isAnalyzing = false;
        const initDetection = async () => {
            try {
                setWebcamStatus('loading_ai');
                const tf = await import('@tensorflow/tfjs');
                await tf.setBackend('webgl');
                await tf.ready();
                const cocoSsd = await import('@tensorflow-models/coco-ssd');
                const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
                detectorRef.current = model;
                setWebcamStatus('active');

                const analyzeFrame = async () => {
                    if (isAnalyzing) return;
                    const video = videoRef.current;
                    if (!video || video.readyState < 2 || !detectorRef.current) return;

                    isAnalyzing = true;
                    try {
                        const predictions = await detectorRef.current.detect(video);

                        // Count persons
                        const persons = predictions.filter(p => p.class === 'person' && p.score > 0.5);
                        // Phones / Device Detection (v2.1 Hardware Guard)
                        const phones = predictions.filter(p => (p.class === 'cell phone' || p.class === 'remote' || p.class === 'laptop') && p.score > 0.4);
                        const count = persons.length;
                        setFaceCount(count);
                        updateAI({ faceCount: count, faceDetected: count > 0 });

                        // Phone detected in frame
                        if (phones.length > 0) {
                            setPhoneWarning(true);
                            addViolation('phone_detected', `Hardware device [${phones[0].class}] detected in camera frame.`, 'critical', { device: phones[0].class });
                        }

                        // No person detected
                        if (count === 0) {
                            noFaceCountRef.current += 1;
                            setNoFaceCount(noFaceCountRef.current);
                            if (noFaceCountRef.current >= 3) {
                                setPhoneWarning(true);
                                addViolation('face_absent', `No face detected for ${noFaceCountRef.current * 2}s \u2014 possible mobile phone use`, 'high');
                                if (noFaceCountRef.current >= 8) {
                                    addViolation('face_absent_critical', 'Face absent for extended period \u2014 exam integrity compromised', 'critical');
                                }
                            }
                        } else {
                            noFaceCountRef.current = 0;
                            setNoFaceCount(0);
                            if (phones.length === 0) setPhoneWarning(false);
                        }

                        // Multiple persons (v2.1 Identity Guard)
                        if (count > 1) {
                            addViolation('second_student_in_frame', `Security Alert: ${count} persons detected. Unauthorized presence detected in frame.`, 'critical');
                        }

                        // Gaze direction from person bounding box position
                        if (count === 1) {
                            const [x, y, w, h] = persons[0].bbox;
                            const videoW = video.videoWidth || 320;
                            const videoH = video.videoHeight || 240;
                            const centerX = (x + w / 2) / videoW;
                            const centerY = (y + h / 2) / videoH;
                            const faceWidth = w / videoW;

                            let dir = 'center';
                            if (centerX < 0.25) dir = 'right';
                            else if (centerX > 0.75) dir = 'left';
                            else if (centerY < 0.15) dir = 'up';
                            else if (centerY > 0.75) dir = 'down';
                            else if (faceWidth < 0.15) dir = 'away';

                            setGazeDir(dir);
                            updateAI({ gaze: dir });

                            if (dir !== 'center') {
                                gazeAwayCountRef.current += 1;
                                if (gazeAwayCountRef.current >= 3) {
                                    setGazeWarning(true);
                                    addViolation('gaze_away', `Looking ${dir} for ${gazeAwayCountRef.current * 2}s \u2014 possible mobile/notes usage`, 'high');
                                }
                            } else {
                                gazeAwayCountRef.current = 0;
                                setGazeWarning(false);
                            }
                        }
                    } catch (err) {
                        console.error('Frame analysis error:', err);
                    } finally {
                        isAnalyzing = false;
                    }
                };

                // Run detection every 2.5 seconds to save CPU
                intervalId = setInterval(analyzeFrame, 2500);
            } catch (err) {
                console.error('Detection init error:', err);
                setWebcamStatus('error');
            }
        };

        // Delay start to let webcam warm up
        const timeout = setTimeout(initDetection, 3000);
        return () => {
            clearTimeout(timeout);
            if (intervalId) clearInterval(intervalId);
        };
    }, [addViolation, updateAI]);

    const formatTime = (ms) => {
        const s = Math.max(0, Math.floor(ms / 1000));
        return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    };

    if (session.isSubmitted) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#f9f9f6] text-[#1a1a1a]">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-[500px] bg-white border border-[#e0e0d5] p-12 text-center rounded-3xl shadow-xl">
                    <AlertOctagon size={64} className="mx-auto mb-6 text-red-500" />
                    <h1 className="text-2xl font-bold mb-4">SESSION_TERMINATED</h1>
                    <div className="bg-gray-50 border border-gray-100 p-6 text-left rounded-xl mb-8">
                        <div className="text-[10px] font-bold text-[#4a7c59] mb-4 uppercase">Final_Incident_Audit</div>
                        <div className="flex justify-between mb-2"><span className="text-xs text-gray-500">FINAL_SCORE:</span><span className="text-sm font-bold">{session.marks}</span></div>
                        <div className="text-[10px] text-red-500 mt-4 leading-relaxed font-mono">{session.freezeReason}</div>
                    </div>
                    <button className="w-full py-3 bg-[#4a7c59] text-white font-bold rounded-xl" onClick={resetSession}>RETURN_TO_PORTAL</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-white text-[#1a1a1a]">
            {/* Permanent Warning Banner */}
            <div className={`h-8 ${currentExam?.aiProctoringEnabled ? 'bg-red-600' : 'bg-gray-800'} text-white flex items-center justify-center font-bold text-[10px] tracking-widest uppercase px-4 shrink-0`}>
                {`⚠️ SECURE SESSION // ${currentExam?.aiProctoringEnabled ? 'AI PENALTIES ACTIVE' : 'AI MONITORING ONLY'} // COPY-PASTE BLOCKED // TAB SWITCHES BLOCKED`}
            </div>

            <header className="h-[70px] bg-[#fdfdfb] border-b border-[#e0e0d5] px-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Shield size={24} className="text-[#4a7c59]" />
                    <div><div className="text-sm font-bold">{user?.name}</div><div className="text-[9px] text-gray-400 font-mono uppercase">{user?.rollNo} // SECURE</div></div>
                </div>
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#4a7c59] animate-pulse" /><span className="text-[10px] font-bold text-[#4a7c59]">SYNC_LIVE</span></div>
                    <div className="text-2xl font-black tabular-nums">{formatTime(timeLeft)}</div>
                    <button className="px-6 py-2 border-2 border-red-500 text-red-500 font-bold text-[10px] rounded-lg hover:bg-red-50 transition-all uppercase" onClick={submitSession}>Terminate</button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Question Panel */}
                <section className="w-[450px] bg-[#fafafa] border-r border-[#e0e0d5] relative select-none flex flex-col">
                    <canvas ref={canvasWatermarkRef} className="absolute inset-0 z-20 pointer-events-none" />

                    {/* Question Navigation Tabs */}
                    {questions.length > 0 && (
                        <div className="px-4 pt-3 pb-0 flex items-center gap-1.5 overflow-x-auto z-30 shrink-0 border-b border-[#e0e0d5] bg-white">
                            {questions.map((q, i) => (
                                <button
                                    key={q.id || i}
                                    onClick={() => switchQuestion(i)}
                                    className={`px-3 py-2 rounded-t-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeQ === i
                                        ? 'bg-[#4a7c59] text-white'
                                        : 'text-gray-400 hover:bg-gray-100'
                                        }`}
                                >
                                    Q{i + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex-1 relative">
                        <canvas ref={questionCanvasRef} className="sticky top-0 w-full p-4 pointer-events-none z-10" />
                    </div>

                    {/* Question Nav Buttons */}
                    <div className="px-6 py-3 border-t border-[#e0e0d5] flex items-center justify-between z-30 bg-white/90 backdrop-blur-sm shrink-0">
                        <button
                            onClick={() => activeQ > 0 && switchQuestion(activeQ - 1)}
                            disabled={activeQ === 0}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase ${activeQ === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            ← Prev
                        </button>
                        <div className="text-[9px] font-bold text-gray-400 uppercase">
                            {activeQ + 1} / {questions.length} • {currentQuestion?.marks || 0}m
                        </div>
                        <button
                            onClick={() => activeQ < questions.length - 1 && switchQuestion(activeQ + 1)}
                            disabled={activeQ >= questions.length - 1}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase ${activeQ >= questions.length - 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Next →
                        </button>
                    </div>

                    <div className="px-6 py-2 z-30 bg-white/80 border-t border-[#e0e0d5]">
                        <div className="text-[9px] font-bold text-[#4a7c59]">SECURITY_BIT_RENDERED</div>
                        <div className="text-[8px] text-gray-400 uppercase tracking-tighter">Content is non-selectable to prevent data scraping</div>
                    </div>
                </section>

                {/* IDE Panel */}
                <section className="flex-1 flex flex-col bg-white">
                    {/* IDE Toolbar */}
                    <div className="h-10 bg-gray-50 border-b border-[#e0e0d5] flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            {/* Language Selector */}
                            <div className="relative" ref={langMenuRef}>
                                <button
                                    onClick={() => setShowLangMenu(!showLangMenu)}
                                    className="flex items-center gap-1.5 px-3 py-1 rounded border border-[#e0e0d5] bg-white text-[10px] font-bold uppercase hover:border-[#4a7c59] transition-all"
                                >
                                    <Code2 size={12} />
                                    {selectedLang.label}
                                    <ChevronDown size={10} />
                                </button>
                                {showLangMenu && (
                                    <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-[#e0e0d5] rounded-lg shadow-xl z-50 max-h-[300px] overflow-y-auto">
                                        {LANGUAGES.map((lang) => (
                                            <button
                                                key={lang.id}
                                                onClick={() => handleLanguageChange(lang)}
                                                className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#f0f7f0] transition-all ${selectedLang.id === lang.id ? 'bg-[#e8f5e8] font-bold text-[#4a7c59]' : 'text-gray-700'
                                                    }`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="font-mono text-[10px] text-gray-400 uppercase">
                                <FileCode size={14} className="inline mr-1" />
                                solution{selectedLang.ext}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                className="px-2 py-1 text-[9px] font-bold text-gray-500 border border-[#e0e0d5] rounded hover:bg-gray-100 transition-all uppercase"
                                onClick={() => setShowStdin(!showStdin)}
                            >
                                {showStdin ? 'HIDE_INPUT' : 'STDIN'}
                            </button>
                            <button
                                className={`flex items-center gap-1.5 px-4 py-1 rounded text-[10px] font-bold transition-all uppercase ${isRunning
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#4a7c59] text-white hover:bg-[#3d664a]'
                                    }`}
                                onClick={handleRunCode}
                                disabled={isRunning}
                            >
                                {isRunning ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        COMPILING...
                                    </>
                                ) : (
                                    <>
                                        <Play size={12} />
                                        RUN_SYNC
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Stdin Input (Collapsible) */}
                    <AnimatePresence>
                        {showStdin && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-b border-[#e0e0d5] bg-[#fefefe] overflow-hidden"
                            >
                                <div className="p-3">
                                    <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Standard_Input (stdin)</div>
                                    <textarea
                                        value={stdin ?? ''}
                                        onChange={e => setStdin(e.target.value)}
                                        placeholder="Enter input for your program..."
                                        spellCheck={false}
                                        className="w-full h-[60px] p-2 font-mono text-xs resize-none outline-none border border-[#e0e0d5] rounded bg-white"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Code Editor - Monaco Implementation */}
                    <div className="flex-1 min-h-0 relative">
                        <Editor
                            height="100%"
                            language={selectedLang.id === 'cpp' ? 'cpp' : selectedLang.id === 'c' ? 'c' : selectedLang.id === 'python' ? 'python' : selectedLang.id}
                            theme="vs-light"
                            value={code ?? ''}
                            onChange={(value) => {
                                setCode(value || '');
                                saveAnswer(currentExam.id, currentQuestion.id, value || '');
                            }}
                            onMount={(editor) => {
                                // Block copy/paste/cut within Monaco
                                editor.onKeyDown((e) => {
                                    if ((e.ctrlKey || e.metaKey) && (e.keyCode === 33 || e.keyCode === 52 || e.keyCode === 54)) {
                                        e.preventDefault();
                                        addViolation('prohibited_shortcut', 'Shortcut blocked in secure editor', 'medium');
                                    }
                                });
                                // Block monaco context menu
                                editor.onContextMenu((e) => {
                                    e.event.preventDefault();
                                });
                            }}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
                                lineHeight: 1.6,
                                padding: { top: 20 },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                contextmenu: false,
                                copyWithSyntaxHighlighting: false,
                                readOnly: session.isFrozen,
                                suggestOnTriggerCharacters: true,
                                quickSuggestions: true,
                            }}
                        />
                        {/* Security Overlay for Editor */}
                        <div
                            className="absolute inset-0 z-10 pointer-events-none"
                            onPaste={e => { e.preventDefault(); addViolation('paste_attempt', 'Paste blocked in code editor', 'high'); setShowPasteWarning(true); setTimeout(() => setShowPasteWarning(false), 3000); }}
                        />
                    </div>

                    {/* Output Panel */}
                    <div className="h-[140px] border-t border-[#e0e0d5] bg-gray-50 p-4 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                <Terminal size={12} />
                                System_IO
                            </div>
                            {isRunning && (
                                <div className="flex items-center gap-1 text-[9px] text-[#4a7c59] font-bold">
                                    <Loader2 size={10} className="animate-spin" />
                                    EXECUTING...
                                </div>
                            )}
                        </div>
                        <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">{output || '> Waiting for input...'}</pre>
                    </div>
                </section>

                {/* Proctoring HUD */}
                <section className="w-[320px] border-l border-[#e0e0d5] p-6 bg-[#fdfdfb] flex flex-col overflow-y-auto">
                    <div className="rounded-xl overflow-hidden border border-[#e0e0d5] mb-4 relative">
                        <div className="bg-gray-100 px-3 py-1.5 text-[8px] font-bold text-gray-400 uppercase flex items-center justify-between">
                            <span>Sensory_Feed</span>
                            <span className={`flex items-center gap-1 ${webcamStatus === 'active' ? 'text-green-500' : (webcamStatus === 'error' ? 'text-red-500' : 'text-orange-500')}`}>
                                <div className={`h-1.5 w-1.5 rounded-full ${webcamStatus === 'active' ? 'bg-green-500 animate-pulse' : (webcamStatus === 'error' ? 'bg-red-500' : 'bg-orange-500 animate-pulse')}`} />
                                {webcamStatus === 'active' ? 'LIVE' : webcamStatus === 'error' ? 'ERROR' : webcamStatus === 'loading_ai' ? 'LOADING_AI' : 'INITIALIZING'}
                            </span>
                        </div>
                        <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover bg-black" />
                        {/* Gaze direction overlay */}
                        {gazeDir !== 'center' && faceCount > 0 && (
                            <div className="absolute bottom-2 left-2 right-2 bg-red-600/90 text-white text-[9px] font-bold uppercase py-1 px-2 rounded text-center animate-pulse">
                                ⚠ LOOKING {gazeDir.toUpperCase()} — PHONE/NOTES DETECTED
                            </div>
                        )}
                        {faceCount === 0 && webcamStatus === 'active' && (
                            <div className="absolute bottom-2 left-2 right-2 bg-orange-500/90 text-white text-[9px] font-bold uppercase py-1 px-2 rounded text-center animate-pulse">
                                ⚠ NO FACE DETECTED — RETURN TO CAMERA
                            </div>
                        )}
                        {faceCount > 1 && (
                            <div className="absolute bottom-2 left-2 right-2 bg-red-700/90 text-white text-[9px] font-bold uppercase py-1 px-2 rounded text-center animate-pulse">
                                🚨 {faceCount} FACES — UNAUTHORIZED PERSON
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        {/* Engine Decision State */}
                        <div className="bg-[#1a1a1a] border border-gray-700 p-4 rounded-xl">
                            <div className="text-[9px] font-bold text-green-400 uppercase mb-3 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Engine_v2.0
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">ACTIVE_RULE:</span>
                                    <span className={`font-mono font-bold ${engineState?.activeRule ? 'text-red-400' : 'text-green-400'}`}>
                                        {engineState?.activeRule || 'NONE'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">LAST_ACTION:</span>
                                    <span className={`font-bold uppercase ${engineState?.lastDecision?.action === 'terminate' ? 'text-red-500' :
                                        engineState?.lastDecision?.action === 'freeze' ? 'text-orange-400' :
                                            engineState?.lastDecision?.action === 'flag' ? 'text-yellow-400' :
                                                'text-green-400'
                                        }`}>
                                        {engineState?.lastDecision?.action || 'CLEAN'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">EVENTS:</span>
                                    <span className="text-gray-300 font-mono">{engineState?.totalProcessedEvents || 0}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">AGENT:</span>
                                    <span className={`font-bold ${engineState?.agentHeartbeat ? 'text-green-400' : 'text-red-500 animate-pulse'}`}>
                                        {engineState?.agentHeartbeat ? 'CONNECTED' : 'LOST'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* AI Telemetry */}
                        <div className="bg-white border border-[#e0e0d5] p-4 rounded-xl">
                            <div className="text-[9px] font-bold text-gray-400 uppercase mb-3">AI_Telemetry</div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px]">
                                    <span>FACE_COUNT:</span>
                                    <span className={`font-bold ${faceCount === 1 ? 'text-[#4a7c59]' : faceCount === 0 ? 'text-orange-500' : 'text-red-500'}`}>
                                        {faceCount === 1 ? '1 ✓' : faceCount === 0 ? 'NONE ⚠' : `${faceCount} 🚨`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[10px] pt-1 border-t border-gray-50 mt-2">
                                    <span className="text-gray-400">AI PENALTIES:</span>
                                    <span className={`font-black uppercase ${currentExam?.aiProctoringEnabled ? 'text-red-600' : 'text-gray-400'}`}>
                                        {currentExam?.aiProctoringEnabled ? 'STRICT' : 'DISABLED'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span>GAZE:</span>
                                    <span className={`font-bold uppercase ${gazeDir === 'center' ? 'text-[#4a7c59]' : 'text-red-500 animate-pulse'}`}>
                                        {gazeDir === 'center' ? 'CENTER ✓' : `${gazeDir} ⚠`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span>EYES:</span>
                                    <span className={`font-bold ${faceCount > 0 && gazeDir === 'center' ? 'text-[#4a7c59]' : faceCount === 0 ? 'text-orange-500' : 'text-red-500'}`}>
                                        {faceCount > 0 && gazeDir === 'center' ? 'ON_SCREEN' : faceCount === 0 ? 'NOT_VISIBLE' : 'OFF_SCREEN'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span>MIC_LEVEL:</span>
                                    <div className="flex gap-0.5 mt-1">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <div key={i} className={`h-2 w-1 rounded-full ${i * 10 <= micLevel ? (micLevel > 75 ? 'bg-red-500' : 'bg-[#4a7c59]') : 'bg-gray-100'}`} />)}</div>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span>DEV_TOOLS:</span>
                                    <span className={devToolsActive ? 'text-red-500 font-bold' : 'text-gray-400'}>{devToolsActive ? 'OPENED' : 'LOCKED'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Phone Detection Warning */}
                        <AnimatePresence>
                            {(phoneWarning || gazeWarning) && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-red-50 border-2 border-red-200 p-3 rounded-xl"
                                >
                                    <div className="flex items-center gap-2 text-red-600 mb-1">
                                        <Smartphone size={14} />
                                        <span className="text-[10px] font-bold uppercase">Mobile Device Suspected</span>
                                    </div>
                                    <p className="text-[9px] text-red-500 leading-relaxed">
                                        {phoneWarning
                                            ? 'Your face is not visible. If you are looking at a phone, this will be reported.'
                                            : `You appear to be looking ${gazeDir}. Keep your eyes on the screen.`
                                        }
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="bg-white border border-[#e0e0d5] p-4 rounded-xl flex-1">
                            <div className="text-[9px] font-bold text-gray-400 uppercase mb-3">{`Violation_Log [${violations.length}]`}</div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {violations.map(v => (
                                    <div key={v.id} className="text-[9px] border-b border-gray-50 py-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-red-500 font-bold uppercase">{v.type}</span>
                                            {v.engineRule && <span className="text-[8px] font-mono px-1 py-0.5 bg-gray-100 rounded text-gray-500">{v.engineRule}</span>}
                                        </div>
                                        <div className="text-gray-400 mt-0.5">{v.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Fullscreen Warning Overlay */}
            <AnimatePresence>
                {showFsWarning && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md">
                        <div className="w-[400px] bg-white border-2 border-orange-500 p-10 rounded-3xl text-center">
                            <AlertTriangle size={48} className="text-orange-500 mx-auto mb-6 animate-bounce" />
                            <h2 className="text-xl font-bold mb-4">Fullscreen_Violation</h2>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed">{`Return to fullscreen immediately. WARNING ${fsCount} OF ${penaltyConfig.maxFullscreenExits - 1}. Next violation leads to zero marks.`}</p>
                            <button className="w-full py-4 bg-[#4a7c59] text-white font-bold rounded-xl" onClick={() => document.documentElement.requestFullscreen().then(() => setShowFsWarning(false))}>RE-ENTER_SECURE_MODE</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Paste Warning Toast */}
            <AnimatePresence>
                {showPasteWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10002] bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3"
                    >
                        <Ban size={18} />
                        <div>
                            <div className="font-bold text-sm">PASTE BLOCKED</div>
                            <div className="text-[10px] text-red-200">Clipboard operations are disabled during examination</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fullscreen Gate — must enter fullscreen to access exam */}
            <AnimatePresence>
                {!isFullscreen && session.isActive && !session.isSubmitted && !showFsWarning && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl">
                        <div className="w-[480px] bg-white p-12 rounded-3xl text-center shadow-2xl">
                            <MonitorUp size={56} className="text-[#4a7c59] mx-auto mb-6" />
                            <h2 className="text-2xl font-bold mb-3">FULLSCREEN REQUIRED</h2>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                                This assessment must be taken in fullscreen mode. Your session is locked until you enter fullscreen. Exiting fullscreen during the exam will be logged as a violation.
                            </p>
                            <button
                                className="w-full py-4 bg-[#4a7c59] text-white font-bold rounded-xl hover:bg-[#3d664a] transition-all text-sm uppercase tracking-widest"
                                onClick={() => document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { })}
                            >
                                ENTER_FULLSCREEN_MODE
                            </button>
                            <p className="text-[9px] text-gray-400 mt-4 uppercase tracking-wider">Press F11 if the button does not work</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Biometric Re-Verify */}
            <AnimatePresence>
                {aiState.reverifyStatus === 'required' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[10001] flex items-center justify-center bg-[#f9f9f6]/95 backdrop-blur-xl">
                        <div className="w-[450px] bg-white border border-[#e0e0d5] p-12 text-center rounded-3xl shadow-2xl">
                            <UserCheck size={56} className="text-[#4a7c59] mx-auto mb-8 animate-pulse" />
                            <h2 className="text-xl font-bold mb-4 uppercase tracking-widest">Biometric_Resync</h2>
                            <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden mb-8 border border-gray-100">
                                <video ref={webcamVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                            </div>
                            <button disabled={isVerifying} onClick={async () => { setIsVerifying(true); await new Promise(r => setTimeout(r, 1500)); updateAI({ reverifyStatus: 'ok', lastVerification: Date.now() }); setIsVerifying(false); }} className="w-full py-4 bg-[#4a7c59] text-white font-bold rounded-xl hover:bg-[#3d664a] transition-all">
                                {isVerifying ? 'SYNCING_IDENTITY...' : 'COMMENCE_SCAN'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Security Freeze Overlay */}
            <AnimatePresence>
                {session.isFrozen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[10005] flex items-center justify-center bg-red-950/90 backdrop-blur-2xl">
                        <div className="w-[500px] bg-white p-12 rounded-[40px] text-center shadow-2xl border-4 border-red-500">
                            <Lock size={64} className="text-red-600 mx-auto mb-8" />
                            <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter text-red-600">PROTOCOL_LOCKED</h2>
                            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl mb-8">
                                <div className="text-[10px] font-bold text-red-400 mb-2 uppercase tracking-widest">Violation_Trigger</div>
                                <p className="text-sm font-bold text-red-900 leading-relaxed mb-4">
                                    {session.freezeReason || 'Security Alert: Anomalous activity detected in your session node.'}
                                </p>
                                <div className="flex justify-between items-center text-[10px] font-bold text-red-400 uppercase">
                                    <span>Locked Until:</span>
                                    <span className="font-mono text-red-600">{session.frozenUntil ? new Date(session.frozenUntil).toLocaleTimeString() : 'INDEFINITE'}</span>
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase leading-relaxed font-medium">
                                The proctoring AI has temporarily suspended your session due to an integrity breach. Please remain in front of the camera. The session will automatically unlock after the cooldown period.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
