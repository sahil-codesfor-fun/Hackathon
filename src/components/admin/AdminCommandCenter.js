'use client';
import { useState, useEffect } from 'react';
import useGuardexStore from '@/store/useGuardexStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, AlertOctagon, Activity, Clock,
    Shield, ArrowRight, Plus, Eye,
    CheckCircle2, AlertTriangle, Info,
    ChevronRight, Zap, Filter, MoreVertical
} from 'lucide-react';

export default function AdminCommandCenter() {
    const {
        currentExam, exams, violations, reports,
        submissions, session, classHierarchy
    } = useGuardexStore();

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Derived stats
    const exam = currentExam || exams[0] || { title: 'DSA Mid-Term', duration: 120, course: 'CSE Year 2' };
    const liveStudents = 42; // Mocked for visual parity
    const totalEnrolled = 50;
    const studentProgress = (liveStudents / totalEnrolled) * 100;
    const avgIntegrity = 87;
    const timeRemaining = "1h 36m";
    const timeElapsedProgress = 30;

    const gazeZones = [
        { id: 'Z1', label: 'Z1 IDE', percentage: 68, category: 'expected' },
        { id: 'Z2', label: 'Z2 Question', percentage: 19, category: 'expected' },
        { id: 'Z3', label: 'Z3 Output', percentage: 6, category: 'expected' },
        { id: 'Z7', label: 'Z7 Up', percentage: 3, category: 'thinking' },
        { id: 'Z6', label: 'Z6 Down', percentage: 2, category: 'off' },
        { id: 'Z4', label: 'Z4/Z5 Side', percentage: 2, category: 'off' },
    ];

    const studentList = [
        { id: 'S1', initials: 'RS', name: 'Rohan Sharma', roll: '2024CSE042', section: 'Sec B', status: 'Frozen', violation: 'AI Sidebar Detected', color: 'red' },
        { id: 'S2', initials: 'PA', name: 'Priya Anand', roll: '2024CSE017', section: 'Sec B', status: 'Warning', violation: 'Identity Mismatch', color: 'red' },
        { id: 'S3', initials: 'MK', name: 'Mihir Kapoor', roll: '2024CSE031', section: 'Sec C', status: 'Review', violation: 'VM Signal: GPU Virt', color: 'amber' },
        { id: 'S4', initials: 'NV', name: 'Neha Verma', roll: '2024CSE058', section: 'Sec C', status: 'Nudged', violation: 'Audio: Human Voice', color: 'blue' },
        { id: 'S5', initials: 'AJ', name: 'Arjun Joshi', roll: '2024CSE009', section: 'Sec B', status: 'Clean', violation: '0 violations', color: 'green' },
    ];

    const events = [
        { time: '10:24', type: 'Critical', student: 'Rohan Sharma', event: 'Browser AI panel (Edge)', subtitle: 'indefinite freeze · HOD alerted', color: 'red' },
        { time: '10:22', type: 'Critical', student: 'Priya Anand', event: 'Biometric Mismatch (82%)', subtitle: 'G-01 · baseline mismatch · re-verify', color: 'red' },
        { time: '10:19', type: 'High', student: 'Mihir Kapoor', event: 'VM Hardware Signature', subtitle: 'GPU Layer Detect · high flag · screenshot', color: 'amber' },
        { time: '10:15', type: 'Medium', student: 'Neha Verma', event: 'Audio: Conversation Band', subtitle: 'Voice Detected (3.4kHz) · 10s audio saved', color: 'blue' },
    ];

    const sections = [
        { id: 'B', name: 'Section B', count: 22, slot: '10:00 AM slot', assigned: true },
        { id: 'C', name: 'Section C', count: 20, slot: '10:00 AM slot', assigned: true },
        { id: 'A', name: 'Section A', count: 'Not assigned', slot: null, assigned: false },
    ];

    return (
        <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-[#4a7c59]/30 flex flex-col p-8 space-y-8">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">GUARDEX — Admin Command Center</h1>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span>Live session · {exam.title} · {exam.course} · Section B & C</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4a7c59]/20 border border-[#4a7c59]/30 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-xs font-bold text-[#4ade80]">{liveStudents} Active</span>
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                        {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <MoreVertical size={16} className="text-gray-500" />
                    </button>
                </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-6">
                <StatCard
                    label="Students active"
                    value={liveStudents}
                    sub={`${studentProgress}% of enrolled`}
                    progress={studentProgress}
                    color="green"
                />
                <StatCard
                    label="Violations flagged"
                    value={violations.length || 7}
                    customContent={
                        <div className="flex gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-red-400/10 border border-red-400/20 text-[10px] font-bold text-red-400">2 critical</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[10px] font-bold text-amber-400">5 high</span>
                        </div>
                    }
                    color="red"
                />
                <StatCard
                    label="Avg integrity score"
                    value={`${avgIntegrity}%`}
                    sub="Good — above threshold"
                    progress={avgIntegrity}
                    color="green"
                />
                <StatCard
                    label="Time remaining"
                    value={timeRemaining}
                    sub={`${timeElapsedProgress}% elapsed`}
                    progress={timeElapsedProgress}
                    color="blue"
                />
            </div>

            {/* Main Grid: 60/40 */}
            <div className="grid grid-cols-10 gap-8 items-start">
                {/* Students - Live Status */}
                <section className="col-span-6 bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-lg font-bold tracking-tight">Students — live status</h2>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all uppercase tracking-wider">
                            filter <Zap size={14} />
                        </button>
                    </div>
                    <div className="p-2">
                        {studentList.map((st) => (
                            <div key={st.id} className="group flex items-center justify-between p-4 hover:bg-white/[0.02] rounded-xl transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-gray-400 group-hover:border-[#4a7c59]/50 group-hover:text-[#4ade80] transition-all">
                                        {st.initials}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-200">{st.name}</div>
                                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Roll {st.roll} · {st.section}</div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <Badge type={st.color} text={st.status} />
                                    <div className="text-[10px] text-gray-500 font-medium">{st.violation}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-6 pt-2">
                        <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all uppercase tracking-[0.1em] flex items-center justify-center gap-2">
                            View all {liveStudents} students ↗
                        </button>
                    </div>
                </section>

                {/* Right Column: Feed + Gaze */}
                <div className="col-span-4 space-y-8">
                    {/* Live Event Feed */}
                    <section className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold tracking-tight">Live event feed</h2>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-400/10 border border-green-400/20 rounded-full">
                                <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">streaming</span>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {events.map((ev, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="text-[10px] font-mono text-gray-500 pt-0.5">{ev.time}</div>
                                    <div className="space-y-2">
                                        <Badge type={ev.color} text={ev.type} compact />
                                        <div className="text-xs leading-relaxed">
                                            <span className="font-bold text-gray-200">{ev.student}</span>
                                            <span className="text-gray-400 italic"> — {ev.event}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium tracking-tight truncate pb-2 group-last:pb-0">{ev.subtitle}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Gaze Zone Distribution */}
                    <section className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-6 space-y-4">
                        <h2 className="text-sm font-bold tracking-tight">Gaze zone distribution</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {gazeZones.map(zone => (
                                <div key={zone.id} className={`p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center space-y-1 transition-all
                                    ${zone.category === 'expected' ? 'bg-green-400/5' : zone.category === 'thinking' ? 'bg-amber-400/5' : 'bg-red-400/5'}
                                `}>
                                    <div className={`text-[8px] font-bold uppercase tracking-widest ${zone.category === 'expected' ? 'text-green-400/40' : zone.category === 'thinking' ? 'text-amber-400/40' : 'text-red-400/40'
                                        }`}>{zone.label}</div>
                                    <div className={`text-xl font-bold tracking-tighter ${zone.category === 'expected' ? 'text-green-400' : zone.category === 'thinking' ? 'text-amber-400' : 'text-red-400'
                                        }`}>{zone.percentage}%</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Bottom: Class Scope */}
            <section className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold tracking-tight">Exam scope — class assignments</h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        DSA Mid-Term · Prof. Sharma
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                    {sections.map(section => (
                        <div key={section.id} className={`p-6 rounded-2xl border transition-all ${section.assigned
                            ? 'bg-white/[0.02] border-white/5'
                            : 'bg-transparent border-dashed border-white/10 opacity-50'
                            }`}>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Section {section.id}</div>
                                    <div className={`text-xl font-black ${section.assigned ? 'text-gray-200' : 'text-gray-600'}`}>
                                        {section.count} {section.assigned && 'students'}
                                    </div>
                                </div>
                                {section.assigned ? (
                                    <div className="inline-block px-3 py-1 bg-[#4a7c59]/20 border border-[#4a7c59]/20 rounded-full text-[9px] font-bold text-[#4ade80] uppercase tracking-wider">
                                        {section.slot}
                                    </div>
                                ) : (
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-gray-300 transition-all uppercase tracking-wider">
                                        <Plus size={14} /> Add section ↗
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

// ─── HELPER COMPONENTS ───

function StatCard({ label, value, sub, progress, color, customContent }) {
    const colorClasses = {
        green: 'bg-[#4ade80]',
        red: 'text-red-500',
        blue: 'bg-blue-500',
    };

    return (
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-6 space-y-4">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{label}</div>
            <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black tracking-tight ${color === 'red' ? 'text-red-500' : 'text-white'}`}>{value}</span>
            </div>
            {customContent ? customContent : (
                <div className="space-y-3">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full ${colorClasses[color] || 'bg-white'}`}
                        />
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">{sub}</div>
                </div>
            )}
        </div>
    );
}

function Badge({ type, text, compact }) {
    const styles = {
        red: 'bg-red-400/10 text-red-400 border-red-400/20',
        amber: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
        blue: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
        green: 'bg-green-400/10 text-green-400 border-green-400/20',
    };

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${compact ? 'py-0.5 px-1.5' : ''} border rounded-full text-[10px] font-black uppercase tracking-[0.05em] ${styles[type] || styles.blue}`}>
            <div className={`w-1 h-1 rounded-full ${type === 'red' ? 'bg-red-400' : type === 'amber' ? 'bg-amber-400' : type === 'green' ? 'bg-green-400' : 'bg-blue-400'}`} />
            {text}
        </div>
    );
}
