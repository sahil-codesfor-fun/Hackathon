'use client';
import { useState } from 'react';
import useGuardexStore from '@/store/useGuardexStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BookOpen, GraduationCap, ArrowRight, UserCheck, ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { login } = useGuardexStore();
    const [loading, setLoading] = useState(false);

    const handleLogin = async (role) => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        login(role, role.charAt(0).toUpperCase() + role.slice(1) + " Test User");
        setLoading(false);
    };

    return (
        <div className="flex h-screen items-center justify-center bg-[#f9f9f6] text-[#1a1a1a] font-sans">
            <div className="flex w-[1000px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/[0.05]">

                {/* Left Side: Illustration / Brand */}
                <div className="hidden w-1/2 bg-[#4a7c59] p-16 lg:flex flex-col justify-between text-white">
                    <div>
                        <div className="flex items-center gap-3 mb-10">
                            <ShieldCheck size={32} />
                            <span className="text-xl font-bold tracking-tight">GUARDEX</span>
                        </div>
                        <h1 className="text-4xl font-semibold leading-tight mb-6">
                            Ensuring Academic <br /> Excellence & Integrity.
                        </h1>
                        <p className="text-white/80 text-lg">
                            A professional proctoring solution designed for modern educational institutions.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-lg"><UserCheck size={20} /></div>
                            <div>
                                <div className="font-semibold">AI Surveillance</div>
                                <div className="text-sm text-white/60 text-xs text-xs">Real-time biometric gaze tracking.</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-lg"><Shield size={20} /></div>
                            <div>
                                <div className="font-semibold">Secure Sandboxing</div>
                                <div className="text-sm text-white/60 text-xs text-xs">Environment lockdown and control.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Options */}
                <div className="w-full lg:w-1/2 p-16 flex flex-col justify-center">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                        <p className="text-[#5c5c5c]">Please select your portal to continue.</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => handleLogin('student')}
                            disabled={loading}
                            className="w-full flex items-center justify-between p-6 border-2 border-[#e0e0d5] rounded-xl hover:border-[#4a7c59] hover:bg-[#4a7c59]/[0.02] transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-[#4a7c59]/10 transition-colors">
                                    <GraduationCap className="text-gray-600 group-hover:text-[#4a7c59]" />
                                </div>
                                <div className="text-left text-left">
                                    <div className="font-bold">Student Portal</div>
                                    <div className="text-sm text-gray-500">Access your assigned examinations.</div>
                                </div>
                            </div>
                            <ArrowRight className="text-gray-300 group-hover:text-[#4a7c59] transition-colors" />
                        </button>

                        <button
                            onClick={() => handleLogin('admin')}
                            disabled={loading}
                            className="w-full flex items-center justify-between p-6 border-2 border-[#e0e0d5] rounded-xl hover:border-[#4a7c59] hover:bg-[#4a7c59]/[0.02] transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-[#4a7c59]/10 transition-colors">
                                    <BookOpen className="text-gray-600 group-hover:text-[#4a7c59]" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold">Command Center</div>
                                    <div className="text-sm text-gray-500">Manage exams and monitor integrity.</div>
                                </div>
                            </div>
                            <ArrowRight className="text-gray-300 group-hover:text-[#4a7c59] transition-colors" />
                        </button>
                    </div>

                    <div className="mt-12 text-center">
                        <AnimatePresence>
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center justify-center gap-3 text-[#4a7c59] font-semibold"
                                >
                                    <Loader2 className="animate-spin" size={20} />
                                    Initiating Secure Session...
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>

            <div className="absolute bottom-6 text-[#5c5c5c]/40 text-xs font-medium">
                GUARDEX ACADEMIC PROCTORING // VERSION 1.0.4
            </div>
        </div>
    );
}
