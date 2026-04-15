'use client';
import { useState } from 'react';
import useGuardexStore from '@/store/useGuardexStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BookOpen, GraduationCap, ArrowRight, UserCheck, ShieldCheck, Loader2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
    const { login } = useGuardexStore();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    const [selectedRole, setSelectedRole] = useState(null);
    const [showGoogleMock, setShowGoogleMock] = useState(false);

    const handleLogin = async (role, customName = null, loginEmail = null) => {
        if (role === 'student' && !email && !loginEmail) {
            alert('Please enter your institutional email or use Google Sign-in.');
            return;
        }
        setLoading(true);
        await new Promise(r => setTimeout(r, 1500));
        const defaultName = role.charAt(0).toUpperCase() + role.slice(1) + " Test User";
        login(role, customName || defaultName, loginEmail || email);
        setLoading(false);
    };

    const triggerGoogleLogin = (role) => {
        setSelectedRole(role);
        setShowGoogleMock(true);
    };

    const completeGoogleLogin = (mockEmail, mockName) => {
        setShowGoogleMock(false);
        handleLogin(selectedRole, mockName, mockEmail);
    };

    return (
        <div className="flex h-screen items-center justify-center bg-[#f9f9f6] text-[#1a1a1a] font-sans relative">
            <div className="flex w-[1000px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/[0.05]">

                {/* Left Side: Illustration / Brand */}
                <div className="hidden w-1/2 bg-[#4a7c59] p-16 lg:flex flex-col justify-between text-white">
                    <div>
                        <div className="flex items-center gap-3 mb-10">
                            <ShieldCheck size={32} />
                            <span className="text-xl font-bold tracking-tight text-white">GUARDEX</span>
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
                                <div className="text-sm text-white/60">Real-time biometric gaze tracking.</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-lg"><Shield size={20} /></div>
                            <div>
                                <div className="font-semibold">Secure Sandboxing</div>
                                <div className="text-sm text-white/60">Environment lockdown and control.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Options */}
                <div className="w-full lg:w-1/2 p-12 flex flex-col justify-center">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-bold mb-2">Portal Gateway</h2>
                        <p className="text-[#5c5c5c] text-sm italic uppercase tracking-widest font-bold opacity-60">Authentication Node // Security Protocol V1.2</p>
                    </div>

                    <div className="space-y-4">
                        {!loading ? (
                            <>
                                {/* Student Section */}
                                <div className="p-6 border-2 border-[#e0e0d5] rounded-2xl space-y-4 hover:border-[#4a7c59] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                                            <GraduationCap />
                                        </div>
                                        <div>
                                            <div className="font-bold">Student Portal</div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-tighter">Institutional Account Required</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => triggerGoogleLogin('student')}
                                            className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-xs"
                                        >
                                            <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" alt="Google" className="w-5 h-5" />
                                            Sign in with Google
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <div className="h-px bg-gray-100 flex-1" />
                                            <span className="text-[8px] text-gray-400 font-bold uppercase">or manage manually</span>
                                            <div className="h-px bg-gray-100 flex-1" />
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="email"
                                                placeholder="Enter institutional email..."
                                                className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl outline-[#4a7c59] text-xs"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                            <button
                                                onClick={() => handleLogin('student')}
                                                className="absolute right-2 top-2 p-1.5 bg-[#4a7c59] text-white rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity"
                                            >
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Faculty Section */}
                                <div className="p-6 border-2 border-[#e0e0d5] rounded-2xl flex items-center justify-between hover:border-[#4a7c59] transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-[#4a7c59]/10 transition-colors">
                                            <BookOpen className="text-gray-600 group-hover:text-[#4a7c59]" />
                                        </div>
                                        <div>
                                            <div className="font-bold">Faculty Access</div>
                                            <button
                                                onClick={() => triggerGoogleLogin('admin')}
                                                className="text-[10px] font-bold text-[#4a7c59] uppercase hover:underline flex items-center gap-1 mt-1"
                                            >
                                                <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" alt="G" className="w-3 h-3" />
                                                Google Auth Preferred
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleLogin('admin')}
                                        className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-[#4a7c59] hover:text-white transition-all"
                                    >
                                        <ArrowRight size={18} />
                                    </button>
                                </div>

                                {/* HOD Section */}
                                <div className="p-6 border-2 border-orange-50 rounded-2xl flex items-center justify-between hover:border-orange-500 transition-all group bg-orange-50/20">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-orange-100 rounded-lg text-orange-500">
                                            <ShieldAlert />
                                        </div>
                                        <div>
                                            <div className="font-bold text-orange-600">HOD Command</div>
                                            <button
                                                onClick={() => triggerGoogleLogin('admin')}
                                                className="text-[10px] font-bold text-orange-400 uppercase hover:underline flex items-center gap-1 mt-1"
                                            >
                                                <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" alt="G" className="w-3 h-3" />
                                                Verified Corporate Login
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleLogin('admin', 'HOD_IT_Department')}
                                        className="p-3 bg-orange-100 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                                    >
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="py-20 text-center flex flex-col items-center gap-6">
                                <Loader2 className="animate-spin text-[#4a7c59]" size={48} />
                                <div>
                                    <div className="font-bold text-xl mb-2">Authenticating Profile</div>
                                    <div className="text-sm text-gray-400">Verifying institutional credentials and scanning biometric nodes...</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <AnimatePresence>
                {showGoogleMock && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-white w-[400px] rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 pb-4 text-center">
                                <img src="https://www.gstatic.com/images/branding/googlelogo/1x/googlelogo_color_92x30dp.png" alt="Google" className="h-6 mx-auto mb-6" />
                                <h3 className="text-xl font-medium mb-1">Choose an account</h3>
                                <p className="text-sm text-gray-500 mb-8">to continue to <span className="text-[#4a7c59] font-bold">Guardex Education</span></p>

                                <div className="space-y-4">
                                    {[
                                        { emailId: 'himanshu.edu@university.in', name: 'Himanshu Gahalyan' },
                                        { emailId: 'sahil.hod@university.in', name: 'Sahil Admin' }
                                    ].map((acc, i) => (
                                        <button
                                            key={i}
                                            onClick={() => completeGoogleLogin(acc.emailId, acc.name)}
                                            className="w-full flex items-center gap-3 p-3 border-t border-gray-100 hover:bg-gray-50 transition-all text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                                {acc.name[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{acc.name}</div>
                                                <div className="text-xs text-gray-400">{acc.emailId}</div>
                                            </div>
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => completeGoogleLogin('new.student@university.in', 'New User')}
                                        className="w-full flex items-center gap-3 p-3 border-t border-gray-100 hover:bg-gray-50 transition-all text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                            <UserCheck size={16} />
                                        </div>
                                        <div className="text-sm font-medium text-gray-600">Use another account</div>
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 text-[10px] text-gray-400 text-center leading-relaxed">
                                To continue, Google will share your name, email address, language preference, and profile picture with Guardex Education.
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-6 text-[#5c5c5c]/40 text-xs font-medium">
                GUARDEX ACADEMIC PROCTORING // VERSION 1.0.4
            </div>
        </div>
    );
}
