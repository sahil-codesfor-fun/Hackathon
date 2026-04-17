'use client';
import { useState } from 'react';
import useGuardexStore from '@/store/useGuardexStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Clock, AlertCircle, ChevronRight,
    LogOut, Shield, User, BookOpen, Calendar,
    CheckCircle2, HelpCircle, MessageSquare, History,
    Search, ExternalLink, Camera, X, Award, ShieldCheck,
    FileSearch, Download, Share2, ArrowLeft
} from 'lucide-react';

export default function StudentExamPortal() {
    const { user, exams, setPage, logout, setCurrentExam, sendTicket } = useGuardexStore();
    const [activeTab, setActiveTab] = useState('assigned');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketData, setTicketData] = useState({ subject: '', message: '' });
    const [ticketSuccess, setTicketSuccess] = useState(false);

    // Filter exams assigned to this student
    const myExams = exams?.filter(e => e.assignedStudents.includes(user.id)) || [];

    const pastSubmissions = [
        {
            id: 'S_992',
            title: 'Data Structures & Algorithms',
            score: 88,
            date: 'Mar 12, 2026',
            status: 'verified',
            instructor: 'Dr. Sarah Jenkins',
            violations: 0,
            durationSpent: '84 min',
            integrityScore: '99.2%'
        },
        {
            id: 'S_881',
            title: 'Database Management Systems',
            score: 94,
            date: 'Feb 28, 2026',
            status: 'verified',
            instructor: 'Prof. Michael Chen',
            violations: 1,
            durationSpent: '110 min',
            integrityScore: '96.5%'
        }
    ];

    const handleLaunch = (examId) => {
        setCurrentExam(examId);
        setPage('wizard');
    };

    return (
        <div className="min-h-screen bg-[#f9f9f6] text-[#1a1a1a] font-sans overflow-x-hidden">

            {/* Top Navbar */}
            <header className="h-[80px] bg-white border-b border-[#e0e0d5] px-10 flex items-center justify-between sticky top-0 z-50 shadow-sm shadow-black/[0.02]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={logout}>
                        <ArrowLeft size={16} className="text-gray-400 group-hover:text-[#4a7c59] transition-colors" />
                        <div className="flex items-center gap-2">
                            <Shield size={24} className="text-[#4a7c59]" />
                            <span className="font-bold tracking-tight text-lg">GUARDEX</span>
                        </div>
                    </div>
                    <div className="h-6 w-px bg-gray-200" />
                    <nav className="flex gap-8 text-sm font-medium">
                        <button
                            onClick={() => setActiveTab('assigned')}
                            className={`pb-7 -mb-7 transition-all ${activeTab === 'assigned' ? 'text-[#4a7c59] border-b-2 border-[#4a7c59]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Assigned Examinations
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`pb-7 -mb-7 transition-all ${activeTab === 'past' ? 'text-[#4a7c59] border-b-2 border-[#4a7c59]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Past Submissions
                        </button>
                        <button
                            onClick={() => setActiveTab('support')}
                            className={`pb-7 -mb-7 transition-all ${activeTab === 'support' ? 'text-[#4a7c59] border-b-2 border-[#4a7c59]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Institutional Support
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-sm font-bold uppercase tracking-tight">{user?.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono italic">{user?.email} // {user?.rollNo}</div>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-500"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto py-16 px-10">

                <AnimatePresence mode="wait">
                    {activeTab === 'assigned' && (
                        <motion.div
                            key="assigned" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        >
                            <section className="mb-16">
                                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4a7c59]/10 text-[#4a7c59] text-[10px] font-bold tracking-widest uppercase">
                                    ACTIVE_INVENTORY
                                </div>
                                <h2 className="text-4xl font-bold tracking-tight mb-4">Pending Assessments</h2>
                                <p className="text-gray-500 max-w-2xl leading-relaxed">
                                    The sessions below are cleared for launch. Ensure your environment matches the institutional guidelines before initializing the protocol.
                                </p>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {myExams.map((exam, idx) => (
                                    <motion.div
                                        key={exam.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white border border-[#e0e0d5] rounded-2xl p-8 hover:shadow-xl hover:shadow-black/[0.04] transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-10">
                                            <div className="p-4 rounded-xl bg-gray-50 group-hover:bg-[#4a7c59]/5 transition-colors">
                                                <BookOpen size={28} className="text-gray-400 group-hover:text-[#4a7c59]" />
                                            </div>
                                            <div className="px-3 py-1 rounded-full border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                Node: {exam.id}
                                            </div>
                                        </div>

                                        <div className="mb-10">
                                            <div className="text-xs font-semibold text-[#4a7c59] mb-1 uppercase tracking-wider">{exam.course}</div>
                                            <h3 className="text-2xl font-bold tracking-tight mb-4">{exam.title}</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{exam.description}</p>
                                        </div>

                                        <div className="flex gap-6 mb-10 pb-10 border-b border-gray-50">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400"><Clock size={16} /> {exam.duration} Min</div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400"><FileText size={16} /> {exam.totalMarks} Points</div>
                                        </div>

                                        <button
                                            onClick={() => handleLaunch(exam.id)}
                                            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#4a7c59] text-white font-bold hover:bg-[#3d664a] transition-all shadow-lg shadow-[#4a7c59]/10"
                                        >
                                            Initialize Secure Session <ChevronRight size={18} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'past' && (
                        <motion.div
                            key="past" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        >
                            <section className="mb-12">
                                <h2 className="text-4xl font-bold tracking-tight mb-4">Submission History</h2>
                                <p className="text-gray-500 leading-relaxed">Verified transcripts and integrity scores for your previous attempts.</p>
                            </section>

                            <div className="bg-white border border-[#e0e0d5] rounded-2xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase">Assessment</th>
                                            <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase">Score</th>
                                            <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase">Date</th>
                                            <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase">Integrity</th>
                                            <th className="px-8 py-5"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {pastSubmissions.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <div className="text-xs font-bold">{user?.name}</div>
                                                        <div className="text-[9px] text-gray-400 font-mono lower-case lowercase truncate max-w-[150px]">{user?.email}</div>
                                                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter mt-1">{user?.role === 'admin' ? (user.name.includes('HOD') ? 'Academic Head' : 'Subject Faculty') : 'Academic Head'}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-bold text-xl">{s.score}/100</td>
                                                <td className="px-8 py-6 text-sm text-gray-500">{s.date}</td>
                                                <td className="px-8 py-6">
                                                    <span className="flex items-center gap-2 text-[#4a7c59] text-[10px] font-bold uppercase">
                                                        <CheckCircle2 size={14} /> Verified
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => setSelectedSubmission(s)}
                                                        className="p-3 bg-white border border-gray-100 rounded-xl text-[#4a7c59] hover:bg-[#4a7c59] hover:text-white transition-all shadow-sm"
                                                    >
                                                        <ExternalLink size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'support' && (
                        <motion.div
                            key="support" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="max-w-3xl"
                        >
                            <section className="mb-12">
                                <h2 className="text-4xl font-bold tracking-tight mb-4">Support Enclave</h2>
                                <p className="text-gray-500 leading-relaxed">Need technical or administrative assistance? Our team is active 24/7 during assessment windows.</p>
                            </section>

                            <div className="grid grid-cols-1 gap-6">
                                {[
                                    { q: 'Network failure during session?', a: 'Guardex caches your progress every 30 seconds. Re-login immediately to resume within the lockout window.', icon: Shield },
                                    { q: 'Webcam not initializing?', a: 'Ensure no other applications (Zoom/Teams) are using the camera. Clear browser permissions and refresh.', icon: Camera },
                                    { q: 'Rules & Violations Policy?', a: 'Refer to the Student Integrity Handbook v2.1 for escalation details and manual audit requests.', icon: BookOpen }
                                ].map((item, i) => (
                                    <div key={i} className="bg-white border border-[#e0e0d5] p-8 rounded-2xl flex gap-6">
                                        <div className="p-4 rounded-xl bg-gray-50 h-fit text-[#4a7c59]">
                                            <item.icon size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-2">{item.q}</h4>
                                            <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 p-8 bg-[#4a7c59] text-white rounded-3xl flex items-center justify-between shadow-xl shadow-[#4a7c59]/20">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-white/10 rounded-2xl">
                                        <MessageSquare size={32} />
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold">Contact Institutional Admin</div>
                                        <div className="text-white/60 text-sm">Escalate suspicious flags or request manual review.</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowTicketModal(true)}
                                    className="px-8 py-4 bg-white text-[#4a7c59] font-bold rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Open Support Ticket
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>

            {/* Submission Detail Modal */}
            <AnimatePresence>
                {selectedSubmission && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-10"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-[#f9f9f6] w-[800px] rounded-[40px] shadow-2xl overflow-hidden flex"
                        >
                            {/* Sidebar of Modal */}
                            <div className="w-[280px] bg-white border-r border-[#e0e0d5] p-12 flex flex-col">
                                <div className="p-4 bg-[#4a7c59]/5 rounded-2xl mb-8 w-fit text-[#4a7c59]">
                                    <Award size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Official Transcript</h3>
                                <div className="space-y-6 mt-8">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Session Node</div>
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-[#4a7c59]">{selectedSubmission.id}</code>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</div>
                                        <div className="flex items-center gap-2 text-[#4a7c59] text-xs font-bold uppercase"><ShieldCheck size={14} /> Verified</div>
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all">
                                        <Download size={14} /> Download PDF
                                    </button>
                                </div>
                            </div>

                            {/* Content of Modal */}
                            <div className="flex-1 p-16 relative">
                                <button
                                    onClick={() => setSelectedSubmission(null)}
                                    className="absolute top-8 right-8 p-2 text-gray-400 hover:text-black hover:bg-white rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>

                                <div className="mb-12">
                                    <div className="text-[10px] font-bold text-[#4a7c59] uppercase tracking-[0.2em] mb-3">Institutional Record</div>
                                    <h2 className="text-3xl font-black tracking-tight mb-2">{selectedSubmission.title}</h2>
                                    <p className="text-gray-500 italic text-sm">Issued by the Academic Board on {selectedSubmission.date}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-12">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Aggregate Score</div>
                                        <div className="text-3xl font-black text-[#4a7c59]">{selectedSubmission.score}<span className="text-sm font-medium text-gray-400"> / 100</span></div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Integrity Factor</div>
                                        <div className="text-3xl font-black text-blue-500">{selectedSubmission.integrityScore}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-4 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-500">Supervising Head</span>
                                        <span className="text-sm font-bold">{selectedSubmission.instructor}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 border-b border-gray-100">
                                        <span className="text-sm font-medium text-gray-500">Duration Elapsed</span>
                                        <span className="text-sm font-bold">{selectedSubmission.durationSpent}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4">
                                        <span className="text-sm font-medium text-gray-500">Security Anomalies</span>
                                        <span className={`text-sm font-bold ${selectedSubmission.violations > 0 ? 'text-orange-500' : 'text-[#4a7c59]'}`}>
                                            {selectedSubmission.violations} Detected
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-12 flex gap-4">
                                    <button className="flex-1 py-4 bg-[#1a1a1a] text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all">
                                        <FileSearch size={18} /> Review Audit Log
                                    </button>
                                    <button className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-black transition-all">
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Support Ticket Modal */}
            <AnimatePresence>
                {showTicketModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-[500px] rounded-[30px] shadow-2xl overflow-hidden p-10 border border-[#e0e0d5]">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-bold tracking-tight">Institutional Support</h3>
                                <button onClick={() => { setShowTicketModal(false); setTicketSuccess(false); }} className="text-gray-400 hover:text-black"><X size={20} /></button>
                            </div>

                            {ticketSuccess ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                                    <div className="w-16 h-16 bg-green-50 text-[#4a7c59] rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h4 className="text-lg font-bold mb-2">Ticket Dispatched</h4>
                                    <p className="text-gray-500 text-sm">Your request has been routed to the academic helpdesk. Node ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                                    <button onClick={() => setShowTicketModal(false)} className="mt-8 px-8 py-3 bg-[#4a7c59] text-white font-bold rounded-xl">Dismiss</button>
                                </motion.div>
                            ) : (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    sendTicket(ticketData.subject, ticketData.message);
                                    setTicketSuccess(true);
                                    setTicketData({ subject: '', message: '' });
                                }}>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Subject</label>
                                            <input
                                                type="text" required
                                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl outline-[#4a7c59] text-sm"
                                                placeholder="e.g. Webcam Initialization Failure"
                                                value={ticketData.subject ?? ''}
                                                onChange={e => setTicketData({ ...ticketData, subject: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Detailed Description</label>
                                            <textarea
                                                required
                                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl outline-[#4a7c59] text-sm h-32 resize-none"
                                                placeholder="Please provide specific node errors or symptoms..."
                                                value={ticketData.message ?? ''}
                                                onChange={e => setTicketData({ ...ticketData, message: e.target.value })}
                                            />
                                        </div>
                                        <button className="w-full py-4 bg-[#4a7c59] text-white font-bold rounded-xl shadow-lg shadow-[#4a7c59]/10">
                                            Escalate to Admin
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <footer className="py-10 text-center border-t border-[#e0e0d5]/50">
                <div className="text-[10px] font-mono text-gray-400 tracking-widest uppercase">
                    {`Protocol: ${activeTab.toUpperCase()} // Status: Operational // Latency: 12ms`}
                </div>
            </footer>
        </div>
    );
}
