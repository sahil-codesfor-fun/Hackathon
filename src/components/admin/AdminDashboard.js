'use client';
import { useState } from 'react';
import useGuardexStore from '@/store/useGuardexStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Settings,
    BarChart3, Plus, MoreVertical, Trash2,
    Clock, FilePlus, ChevronRight, ChevronDown, ChevronUp,
    ShieldAlert, Activity, LayoutDashboard, LogOut,
    FileText, Lock, Eye, Download, Edit3, Calendar,
    UserX, UserCheck, X, GripVertical, AlertTriangle,
    CheckCircle, BookOpen, Code2, Hash, ArrowLeft, Shield, MessageSquare, ClipboardList, Trophy, Mail, User
} from 'lucide-react';

export default function TrainerConsole() {
    const {
        user, exams, violations, reports, tickets, submissions,
        penaltyConfig, updatePenaltyConfig, createExam, updateExam, deleteExam, logout, resolveReport, unfreezeStudent
    } = useGuardexStore();
    const [selectedReport, setSelectedReport] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [expandedExam, setExpandedExam] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [lastReadReportCount, setLastReadReportCount] = useState(reports.length);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const unreadCount = Math.max(0, reports.length - lastReadReportCount);

    // ─── Exam Form State ───
    const emptyQuestion = { id: '', title: '', description: '', marks: 10, template: '' };
    const emptyExam = {
        title: '', course: '', duration: 60, description: '',
        startTime: '', endTime: '',
        aiProctoringEnabled: true,
        subjectFaculty: '',
        hodInCharge: 'HOD_Computer_Science',
        questions: [{ ...emptyQuestion, id: `q_${Date.now()}` }]
    };
    const [formData, setFormData] = useState({ ...emptyExam });

    const openCreateModal = () => {
        setEditingExam(null);
        setFormData({ ...emptyExam, questions: [{ ...emptyQuestion, id: `q_${Date.now()}` }] });
        setShowCreateModal(true);
    };

    const openEditModal = (exam) => {
        setEditingExam(exam.id);
        setFormData({
            title: exam.title,
            course: exam.course,
            duration: exam.duration,
            description: exam.description,
            startTime: exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : '',
            endTime: exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '',
            aiProctoringEnabled: exam.aiProctoringEnabled ?? true,
            subjectFaculty: exam.subjectFaculty || '',
            hodInCharge: exam.hodInCharge || 'HOD_Computer_Science',
            questions: exam.questions || [{ ...emptyQuestion, id: `q_${Date.now()}` }]
        });
        setShowCreateModal(true);
    };

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, { ...emptyQuestion, id: `q_${Date.now()}_${prev.questions.length}` }]
        }));
    };

    const removeQuestion = (index) => {
        if (formData.questions.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const updateQuestion = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => i === index ? { ...q, [field]: value } : q)
        }));
    };

    const computedTotalMarks = formData.questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

    const getExamStatus = (exam) => {
        const now = new Date();
        const start = exam.startTime ? new Date(exam.startTime) : null;
        const end = exam.endTime ? new Date(exam.endTime) : null;
        if (!start || !end) return { label: 'Draft', color: 'text-gray-400 bg-gray-100' };
        if (now < start) return { label: 'Scheduled', color: 'text-blue-600 bg-blue-50' };
        if (now >= start && now <= end) return { label: 'Active', color: 'text-green-600 bg-green-50' };
        return { label: 'Ended', color: 'text-red-500 bg-red-50' };
    };

    const handleSubmitExam = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
            endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
            totalMarks: computedTotalMarks,
            questions: formData.questions.map((q, i) => ({
                ...q,
                id: q.id || `q_${Date.now()}_${i}`,
                marks: parseInt(q.marks) || 0
            }))
        };

        if (editingExam) {
            updateExam(editingExam, payload);
        } else {
            // Determine status based on dates
            const now = new Date();
            const start = payload.startTime ? new Date(payload.startTime) : null;
            if (!start) payload.status = 'draft';
            else if (now < start) payload.status = 'scheduled';
            else payload.status = 'active';
            createExam(payload);
        }
        setShowCreateModal(false);
        setFormData({ ...emptyExam, questions: [{ ...emptyQuestion, id: `q_${Date.now()}` }] });
        setEditingExam(null);
    };

    const handleDeleteExam = (examId) => {
        deleteExam(examId);
        setDeleteConfirm(null);
    };

    const formatDate = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(submissions));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "academic_records.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleExportReports = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reports));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "incident_reports.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleDownloadTranscript = (sub) => {
        const transcriptText = `
GUARDEX ACADEMIC TRANSCRIPT
===========================
Candidate: ${sub.studentName}
Roll No: ${sub.rollNo}
Exam: ${sub.examTitle}
Date: ${new Date(sub.timestamp).toLocaleString()}

Final Score: ${sub.score} / ${sub.totalMarks}
Integrity Incidents: ${sub.violations}

RESPONSES:
${Object.entries(sub.answers).map(([qId, ans]) => `\nQuestion ${qId}:\n${ans}\n-------------------`).join('\n')}

Audit Status: VERIFIED
        `;
        const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(transcriptText);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `transcript_${sub.studentName.replace(/\s+/g, '_')}.txt`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="flex h-screen bg-[#f9f9f6] text-[#1a1a1a] font-sans overflow-hidden">

            {/* Sidebar */}
            <aside className="w-[280px] bg-white border-r border-[#e0e0d5] flex flex-col pt-10 px-4">
                <div className="px-4 mb-12 flex items-center gap-3">
                    <ShieldCheck size={28} className="text-[#4a7c59]" />
                    <span className="text-xl font-black tracking-tight">TRAINER_CORE</span>
                </div>

                <nav className="flex-1 space-y-1">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Live Monitoring' },
                        { id: 'exams', icon: FilePlus, label: 'Assessment Manager' },
                        { id: 'vault', icon: ShieldAlert, label: 'Escalation Vault' },
                        { id: 'submissions', icon: ClipboardList, label: 'Academic Records' },
                        { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
                        { id: 'analytics', icon: BarChart3, label: 'Batch Analytics' },
                        { id: 'tickets', icon: MessageSquare, label: 'Support Desk' },
                        { id: 'settings', icon: Settings, label: 'Global Settings' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-5 py-4 transition-all rounded-xl ${activeTab === item.id
                                ? 'bg-[#4a7c59] text-white font-bold shadow-lg shadow-[#4a7c59]/20'
                                : 'text-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="text-xs uppercase tracking-wider">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-gray-100 italic">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#4a7c59] font-bold">
                            {user?.name?.[0]}
                        </div>
                        <div>
                            <div className="text-xs font-bold">{user?.name}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-tighter">Academic Head</div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors uppercase">
                            <ArrowLeft size={14} /> Return to Gateway
                        </button>
                        <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                            <LogOut size={14} /> TERMINATE_SESSION
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="h-[80px] bg-white border-b border-[#e0e0d5] px-10 flex items-center justify-between shadow-sm z-10">
                    <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                        <div className="w-2 h-8 bg-[#4a7c59] rounded-full" />
                        {activeTab.replace('_', ' ')}
                    </h2>
                    <div className="flex items-center gap-6">
                        {/* Notification Center */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowNotifications(!showNotifications); setLastReadReportCount(reports.length); }}
                                className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all relative group"
                            >
                                <Activity size={20} className={unreadCount > 0 ? "text-red-500" : "text-gray-400"} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-4 w-[350px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-[1000] overflow-hidden"
                                    >
                                        <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Incident_Stream</span>
                                            <button onClick={() => setShowNotifications(false)} className="text-gray-300 hover:text-gray-600"><X size={14} /></button>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {reports.length > 0 ? (
                                                [...reports].reverse().map(report => (
                                                    <div key={report.id} className="p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setSelectedReport(report); setShowNotifications(false); }}>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase text-red-500">{report.violationType}</span>
                                                            <span className="text-[8px] font-mono text-gray-400 ml-auto">{new Date(report.timestamp).toLocaleTimeString()}</span>
                                                        </div>
                                                        <div className="text-xs font-bold text-gray-800 mb-1">{report.studentName}</div>
                                                        <div className="text-[9px] text-gray-400 font-mono tracking-tighter">{report.examTitle}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-10 text-center">
                                                    <Shield size={32} className="mx-auto mb-3 text-gray-100" />
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Clear_Skies // No Alerts</p>
                                                </div>
                                            )}
                                        </div>
                                        {reports.length > 0 && (
                                            <button
                                                onClick={() => { setActiveTab('vault'); setShowNotifications(false); }}
                                                className="w-full p-4 text-[10px] font-bold text-[#4a7c59] uppercase tracking-widest bg-gray-50 hover:bg-gray-100 transition-all border-t border-gray-100"
                                            >
                                                Open Escalation Vault
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100 group hover:border-[#4a7c59]/20 transition-all">
                            System_Status: <span className="text-green-500">Operational</span>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="px-6 py-2.5 bg-[#4a7c59] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#3d664a] transition-all"
                        >
                            <Plus size={18} /> Deploy New Test
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-12 bg-[#fdfdfb]">

                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-4 gap-8">
                                    {[
                                        { label: 'Total Exams', val: exams.length, color: 'text-[#4a7c59]' },
                                        { label: 'Active Sessions', val: exams.filter(e => getExamStatus(e).label === 'Active').length, color: 'text-blue-600' },
                                        { label: 'Flagged Anomalies', val: violations.length, color: 'text-orange-500' },
                                        { label: 'Total Questions', val: exams.reduce((s, e) => s + (e.questions?.length || 0), 0), color: 'text-green-600' }
                                    ].map((s, i) => (
                                        <div key={i} className={`p-8 rounded-3xl border border-[#e0e0d5] bg-white hover:shadow-xl transition-all`}>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">{s.label}</div>
                                            <div className={`text-4xl font-black ${s.color}`}>{s.val}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white rounded-3xl border border-[#e0e0d5] overflow-hidden shadow-sm">
                                    <div className="px-10 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Real-Time Examination Node Grid</span>
                                        <Activity size={18} className="text-[#4a7c59] animate-pulse" />
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left border-b border-gray-100 bg-white">
                                                <th className="px-10 py-5 font-bold text-gray-400 text-[10px] uppercase">Assessment</th>
                                                <th className="px-10 py-5 font-bold text-gray-400 text-[10px] uppercase">Course</th>
                                                <th className="px-10 py-5 font-bold text-gray-400 text-[10px] uppercase">Schedule</th>
                                                <th className="px-10 py-5 font-bold text-gray-400 text-[10px] uppercase">Status</th>
                                                <th className="px-10 py-5 font-bold text-gray-400 text-[10px] uppercase">Questions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {exams.map(exam => {
                                                const st = getExamStatus(exam);
                                                return (
                                                    <tr key={exam.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-10 py-6">
                                                            <div className="font-bold text-gray-800">{exam.title}</div>
                                                            <div className="text-[9px] font-mono text-gray-400 italic">{exam.id}</div>
                                                        </td>
                                                        <td className="px-10 py-6 text-xs text-gray-600">{exam.course}</td>
                                                        <td className="px-10 py-6 text-[10px] text-gray-500">{formatDate(exam.startTime)}</td>
                                                        <td className="px-10 py-6">
                                                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${st.color}`}>{st.label}</span>
                                                        </td>
                                                        <td className="px-10 py-6 text-sm font-bold text-gray-700">{exam.questions?.length || 0}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── ASSESSMENT MANAGER ─── */}
                        {activeTab === 'exams' && (
                            <motion.div
                                key="exams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Assessment Manager</h3>
                                        <p className="text-gray-400 text-sm">Create, schedule, and manage exams with structured questions.</p>
                                    </div>
                                </div>

                                {exams.length === 0 && (
                                    <div className="bg-white border border-dashed border-[#e0e0d5] rounded-3xl p-20 text-center">
                                        <BookOpen size={48} className="text-gray-200 mx-auto mb-6" />
                                        <div className="text-gray-400 font-bold text-sm uppercase mb-2">No Assessments Created</div>
                                        <p className="text-gray-400 text-xs mb-8">Deploy a new test to get started.</p>
                                        <button onClick={openCreateModal} className="px-8 py-3 bg-[#4a7c59] text-white rounded-xl font-bold text-sm">
                                            <Plus size={16} className="inline mr-2" /> Create First Exam
                                        </button>
                                    </div>
                                )}

                                {exams.map(exam => {
                                    const st = getExamStatus(exam);
                                    const isExpanded = expandedExam === exam.id;
                                    return (
                                        <motion.div
                                            key={exam.id}
                                            layout
                                            className="bg-white border border-[#e0e0d5] rounded-3xl overflow-hidden hover:shadow-xl transition-all"
                                        >
                                            {/* Exam Header */}
                                            <div className="p-8 flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${st.color}`}>{st.label}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono">{exam.id}</span>
                                                        {exam.aiProctoringEnabled && (
                                                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[8px] font-black rounded uppercase tracking-tighter flex items-center gap-1">
                                                                <Shield size={8} /> AI_STRICT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-xl font-bold mb-2">{exam.title}</h3>
                                                    <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-2xl">{exam.description}</p>

                                                    <div className="flex flex-wrap gap-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                        <div className="flex items-center gap-2"><BookOpen size={14} /> {exam.course || '—'}</div>
                                                        <div className="flex items-center gap-2"><Clock size={14} /> {exam.duration} min</div>
                                                        <div className="flex items-center gap-2"><FileText size={14} /> {exam.totalMarks} pts</div>
                                                        <div className="flex items-center gap-2"><Hash size={14} /> {exam.questions?.length || 0} questions</div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} />
                                                            {exam.startTime ? formatDate(exam.startTime) : 'Not Scheduled'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-4">
                                                    <button onClick={() => openEditModal(exam)} className="p-2.5 text-gray-400 hover:text-[#4a7c59] hover:bg-[#4a7c59]/5 rounded-xl transition-all" title="Edit">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm(exam.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button onClick={() => setExpandedExam(isExpanded ? null : exam.id)} className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all" title="Expand">
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Schedule Bar */}
                                            {(exam.startTime || exam.endTime) && (
                                                <div className="mx-8 mb-4 p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <div>
                                                            <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Start Time</div>
                                                            <div className="text-xs font-bold text-gray-700">{formatDate(exam.startTime)}</div>
                                                        </div>
                                                        <ChevronRight size={14} className="text-gray-300" />
                                                        <div>
                                                            <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">End Time</div>
                                                            <div className="text-xs font-bold text-gray-700">{formatDate(exam.endTime)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-gray-500">
                                                        Window: {exam.startTime && exam.endTime
                                                            ? `${Math.round((new Date(exam.endTime) - new Date(exam.startTime)) / (1000 * 60 * 60))}h`
                                                            : '—'
                                                        }
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expanded Questions */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="border-t border-[#e0e0d5] bg-[#fafaf8]">
                                                            <div className="p-8">
                                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                                                                    Question Bank ({exam.questions?.length || 0} Questions)
                                                                </div>
                                                                <div className="space-y-4">
                                                                    {exam.questions?.map((q, idx) => (
                                                                        <div key={q.id || idx} className="bg-white rounded-2xl border border-[#e0e0d5] p-6 flex gap-6">
                                                                            <div className="w-10 h-10 rounded-xl bg-[#4a7c59]/10 text-[#4a7c59] flex items-center justify-center font-bold text-sm shrink-0">
                                                                                {idx + 1}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <h4 className="font-bold text-sm">{q.title || `Question ${idx + 1}`}</h4>
                                                                                    <span className="px-3 py-1 bg-[#4a7c59]/10 text-[#4a7c59] rounded-full text-[10px] font-bold">{q.marks} marks</span>
                                                                                </div>
                                                                                <p className="text-xs text-gray-500 leading-relaxed mb-3">{q.description || 'No description provided.'}</p>
                                                                                {q.template && (
                                                                                    <div className="bg-gray-50 rounded-lg p-3 font-mono text-[10px] text-gray-600 whitespace-pre-wrap max-h-[100px] overflow-y-auto">
                                                                                        {q.template}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}

                        {activeTab === 'vault' && (
                            <motion.div
                                key="vault" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Integrity Escalation Vault</h3>
                                        <p className="text-gray-400 text-sm">Automated reports transmitted to HOD and Subject Faculty regarding critical breaches.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleExportReports}
                                            className="px-6 py-3 bg-white border border-[#e0e0d5] rounded-xl flex items-center gap-3 text-sm font-medium hover:bg-gray-50 transition-all"
                                        >
                                            <Download size={18} className="text-[#4a7c59]" /> Export Batch Audit
                                        </button>
                                    </div>
                                </div>

                                {/* Escalated Reports Feed */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] px-4">CRITICAL_ESCALATIONS_LOG</h4>
                                    {reports.length > 0 ? (
                                        reports.map(report => (
                                            <motion.div
                                                key={report.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="bg-white border-2 border-red-100 rounded-3xl p-8 flex items-center justify-between hover:shadow-2xl transition-all relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                                                <div className="flex items-center gap-8">
                                                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 border border-red-100">
                                                        <ShieldAlert size={32} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-sm font-black text-gray-800 uppercase tracking-tight">{report.studentName}</span>
                                                            <span className="px-3 py-1 bg-red-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest animate-pulse">Critical_Breach</span>
                                                            <span className="text-[10px] text-gray-400 font-mono italic">{report.id}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-x-10 gap-y-2">
                                                            <div className="text-xs flex items-center gap-2">
                                                                <span className="text-gray-400 uppercase font-bold text-[9px] w-20">Student ID:</span>
                                                                <span className="font-mono text-[#4a7c59] bg-[#4a7c59]/5 px-2 py-0.5 rounded italic">{report.studentId}</span>
                                                            </div>
                                                            <div className="text-xs flex items-center gap-2">
                                                                <span className="text-gray-400 uppercase font-bold text-[9px] w-20">Roll Number:</span>
                                                                <span className="text-gray-700 font-bold">{report.rollNo}</span>
                                                            </div>
                                                            <div className="text-xs flex items-center gap-2">
                                                                <span className="text-gray-400 uppercase font-bold text-[9px] w-20">Assessment:</span>
                                                                <span className="text-gray-700">{report.examTitle}</span>
                                                            </div>
                                                            <div className="text-xs flex items-center gap-2">
                                                                <span className="text-gray-400 uppercase font-bold text-[9px] w-20">Violation:</span>
                                                                <span className="text-red-600 font-black uppercase tracking-tighter">{report.violationType}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-3 text-right">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase">
                                                        <CheckCircle size={14} />
                                                        Sent to HOD & Faculty
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-mono">
                                                        {new Date(report.timestamp).toLocaleString()}
                                                    </div>
                                                    <button
                                                        onClick={() => resolveReport(report.id)}
                                                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-[9px] font-bold uppercase tracking-widest text-[#4a7c59] transition-all flex items-center gap-2 border border-transparent hover:border-[#4a7c59]/20"
                                                    >
                                                        <button className="text-[10px] text-gray-400 hover:text-black font-bold uppercase tracking-widest">Mark as Resolved</button>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="bg-white border border-dashed border-[#e0e0d5] rounded-3xl p-16 text-center">
                                            <MessageSquare size={48} className="text-gray-100 mx-auto mb-6" />
                                            <div className="text-gray-400 font-bold text-xs uppercase tracking-widest">No active technical support requests.</div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'leaderboard' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <h2 className="text-4xl font-black uppercase tracking-tighter">Academic Merit Board</h2>
                                        <p className="text-gray-400 mt-2">Real-time performance ranking based on score precision and integrity metrics.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="px-6 py-3 bg-[#4a7c59] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[#4a7c59]/20">
                                            Total Candidates: {submissions.length}
                                        </div>
                                    </div>
                                </div>

                                {/* Class-wise Summary Stats */}
                                <div className="grid grid-cols-4 gap-6 mb-8">
                                    <div className="bg-[#4a7c59]/5 border border-[#4a7c59]/20 p-6 rounded-3xl">
                                        <div className="text-[10px] font-bold text-[#4a7c59] uppercase tracking-widest mb-1">Class Average</div>
                                        <div className="text-2xl font-black">{submissions.length > 0 ? (submissions.reduce((s, a) => s + a.score, 0) / submissions.length).toFixed(1) : '0.0'}</div>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
                                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Highest Score</div>
                                        <div className="text-2xl font-black">{submissions.length > 0 ? Math.max(...submissions.map(s => s.score)) : '0'}</div>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl">
                                        <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Integrity Rate</div>
                                        <div className="text-2xl font-black">{submissions.length > 0 ? (submissions.filter(s => (typeof s.violations === 'object' ? s.violations.length : s.violations) < 3).length / submissions.length * 100).toFixed(0) : '100'}%</div>
                                    </div>
                                    <div className="bg-red-50 border border-red-100 p-6 rounded-3xl">
                                        <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Flagged Nodes</div>
                                        <div className="text-2xl font-black">{submissions.filter(s => (typeof s.violations === 'object' ? s.violations.length : s.violations) > 5).length}</div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[40px] border border-[#e0e0d5] overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rank</th>
                                                <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidate</th>
                                                <th className="px-10 py-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</th>
                                                <th className="px-10 py-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Integrity Node</th>
                                                <th className="px-10 py-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {[...submissions]
                                                .sort((a, b) => {
                                                    if (b.score !== a.score) return b.score - a.score;
                                                    const vA = typeof a.violations === 'object' ? a.violations.length : (a.violations || 0);
                                                    const vB = typeof b.violations === 'object' ? b.violations.length : (b.violations || 0);
                                                    return vA - vB;
                                                })
                                                .map((sub, idx) => {
                                                    const vCount = typeof sub.violations === 'object' ? sub.violations.length : (sub.violations || 0);
                                                    return (
                                                        <tr key={sub.id} className={`${idx < 3 ? 'bg-yellow-50/20' : ''} hover:bg-gray-50/50 transition-all`}>
                                                            <td className="px-10 py-6">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-400 text-white shadow-lg' :
                                                                    idx === 1 ? 'bg-gray-300 text-white' :
                                                                        idx === 2 ? 'bg-orange-400 text-white' : 'bg-gray-50 text-gray-400'
                                                                    }`}>
                                                                    {idx + 1}
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-6">
                                                                <div className="font-bold text-gray-800">{sub.studentName}</div>
                                                                <div className="text-[10px] text-gray-400 font-mono mt-1 italic">{sub.rollNo}</div>
                                                            </td>
                                                            <td className="px-10 py-6 text-center">
                                                                <div className="text-lg font-black text-[#4a7c59]">{sub.score}</div>
                                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Total_Merit</div>
                                                            </td>
                                                            <td className="px-10 py-6 text-center">
                                                                <div className={`text-xs font-bold ${vCount > 5 ? 'text-red-500' : 'text-gray-400'}`}>
                                                                    {vCount} Violation{vCount !== 1 ? 's' : ''}
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-6 text-center">
                                                                <div className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-black rounded-full uppercase inline-block">Verified</div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            {submissions.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="py-20 text-center">
                                                        <Trophy size={48} className="text-gray-100 mx-auto mb-4" />
                                                        <div className="text-gray-400 font-bold uppercase tracking-widest text-xs">No submission data available for ranking.</div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'analytics' && (
                            <motion.div
                                key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="space-y-12"
                            >
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="bg-white p-10 rounded-3xl border border-[#e0e0d5] flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-[#4a7c59]/5 rounded-2xl flex items-center justify-center text-[#4a7c59] mb-6">
                                            <UserCheck size={32} />
                                        </div>
                                        <h4 className="font-bold text-xl mb-2">Class Confidence</h4>
                                        <div className="text-3xl font-black text-[#4a7c59] mb-4">
                                            {submissions.length > 0 ? (submissions.filter(s => (typeof s.violations === 'object' ? s.violations.length : s.violations) < 5).length / submissions.length * 100).toFixed(1) : '100'}%
                                        </div>
                                        <p className="text-gray-400 text-xs text-balance px-4 leading-relaxed">Percentage of sessions completed without high-severity flags.</p>
                                    </div>
                                    <div className="bg-white p-10 rounded-3xl border border-[#e0e0d5] flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                                            <Clock size={32} />
                                        </div>
                                        <h4 className="font-bold text-xl mb-2">Total Submissions</h4>
                                        <div className="text-3xl font-black text-blue-500 mb-4">{submissions.length}</div>
                                        <p className="text-gray-400 text-xs px-4 leading-relaxed">Total assessment modules received and archived in the repository.</p>
                                    </div>
                                    <div className="bg-white p-10 rounded-3xl border border-[#e0e0d5] flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                                            <UserX size={32} />
                                        </div>
                                        <h4 className="font-bold text-xl mb-2">Critical Flagged</h4>
                                        <div className="text-3xl font-black text-red-500 mb-4">
                                            {submissions.filter(s => s.score === 0 || (typeof s.violations === 'object' ? s.violations.length : s.violations) > 8).length}
                                        </div>
                                        <p className="text-gray-400 text-xs px-4 leading-relaxed">Candidates automatically flagged for manual review or zeroed by protocol.</p>
                                    </div>
                                </div>

                                <div className="bg-[#1a1a1a] p-10 rounded-3xl text-white">
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="flex items-center gap-4">
                                            <BarChart3 size={24} className="text-[#4a7c59]" />
                                            <span className="text-lg font-bold">Historical Integrity Performance</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono italic">DATA_NODE: GX_HIST_2.1</span>
                                    </div>
                                    <div className="h-[200px] flex items-end gap-1.5 justify-between">
                                        {[40, 60, 45, 90, 100, 80, 70, 95, 60, 40, 80, 100, 90, 85, 75, 95].map((h, i) => (
                                            <motion.div
                                                key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }}
                                                className={`flex-1 rounded-t-lg ${h > 90 ? 'bg-[#4a7c59]' : 'bg-gray-800'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'settings' && (
                            <motion.div
                                key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="max-w-4xl space-y-8"
                            >
                                {/* Penalty Thresholds */}
                                <div className="bg-white rounded-3xl border border-[#e0e0d5] overflow-hidden">
                                    <div className="p-10 border-b border-gray-50">
                                        <h3 className="text-xl font-bold mb-2">Penalty Thresholds</h3>
                                        <p className="text-gray-500 text-sm">Configure automatic penalty escalation limits.</p>
                                    </div>
                                    <div className="p-10 space-y-8">
                                        {[
                                            { key: 'maxTabSwitches', label: 'Tab Switch Limit', desc: 'Max tab switches before screen freeze.', min: 1, max: 20 },
                                            { key: 'maxFullscreenExits', label: 'Fullscreen Exit Limit', desc: 'Max fullscreen exits before auto-submission with zero marks.', min: 1, max: 10 },
                                            { key: 'freezeDuration', label: 'Freeze Duration (min)', desc: 'How long the screen stays frozen after violations.', min: 1, max: 60 },
                                            { key: 'facePenaltyDuration', label: 'Multiple Face Penalty (min)', desc: 'Screen freeze duration when 2+ faces are detected.', min: 1, max: 10 },
                                            { key: 'zeroMarkThreshold', label: 'Zero Mark Threshold', desc: 'Total violations before automatic zero marks.', min: 1, max: 20 },
                                            { key: 'audioSensitivity', label: 'Audio Sensitivity (dB)', desc: 'Threshold for loud noise detection spikes.', min: 20, max: 150 }
                                        ].map(item => (
                                            <div key={item.key} className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold mb-1">{item.label}</div>
                                                    <div className="text-gray-400 text-xs">{item.desc}</div>
                                                </div>
                                                <input
                                                    type="number" min={item.min} max={item.max}
                                                    value={penaltyConfig[item.key]}
                                                    onChange={e => updatePenaltyConfig({ [item.key]: parseInt(e.target.value) || item.min })}
                                                    className="w-20 px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold text-[#4a7c59] text-center outline-[#4a7c59]"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Security Toggles */}
                                <div className="bg-white rounded-3xl border border-[#e0e0d5] overflow-hidden">
                                    <div className="p-10 border-b border-gray-50">
                                        <h3 className="text-xl font-bold mb-2">Security Controls</h3>
                                        <p className="text-gray-500 text-sm">Toggle security features on or off for all active exams.</p>
                                    </div>
                                    <div className="p-10 space-y-6">
                                        {[
                                            { key: 'copyPasteBlocked', label: 'Block Copy / Paste', desc: 'Prevent clipboard operations (Ctrl+C, Ctrl+V, Ctrl+X) during exams.' },
                                            { key: 'rightClickBlocked', label: 'Block Right Click', desc: 'Disable context menu to prevent inspect element access.' }
                                        ].map(item => (
                                            <div key={item.key} className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold mb-1">{item.label}</div>
                                                    <div className="text-gray-400 text-xs">{item.desc}</div>
                                                </div>
                                                <button
                                                    onClick={() => updatePenaltyConfig({ [item.key]: !penaltyConfig[item.key] })}
                                                    className={`relative w-14 h-7 rounded-full transition-all ${penaltyConfig[item.key] ? 'bg-[#4a7c59]' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${penaltyConfig[item.key] ? 'left-7' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl border border-[#e0e0d5] p-10 flex items-center justify-between shadow-xl shadow-black/[0.02]">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl">
                                            <Lock size={32} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">Administrative Lockdown</h4>
                                            <p className="text-gray-500 text-sm">Instantly suspend all active assessment sessions in the grid.</p>
                                        </div>
                                    </div>
                                    <button className="px-8 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/10 uppercase text-xs tracking-widest">
                                        Emergency_Freeze
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'submissions' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h2 className="text-4xl font-black uppercase tracking-tighter">Academic Records Hub</h2>
                                        <p className="text-gray-400 mt-2">Centralized repository for all completed assessments and neural audit logs.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleExport}
                                            className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-3"
                                        >
                                            <Download size={16} /> Export Master Ledger
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[40px] border border-[#e0e0d5] overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidate Node</th>
                                                <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assessment Module</th>
                                                <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Final Score</th>
                                                <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Integrity Incidents</th>
                                                <th className="px-10 py-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Submission Node</th>
                                                <th className="px-10 py-6"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {submissions.length > 0 ? (
                                                [...submissions].reverse().map(sub => (
                                                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-all group">
                                                        <td className="px-10 py-6">
                                                            <div className="font-bold text-gray-800">{sub.studentName}</div>
                                                            <div className="text-[10px] text-gray-400 font-mono mt-1 italic">{sub.rollNo}</div>
                                                        </td>
                                                        <td className="px-10 py-6">
                                                            <div className="text-xs font-medium text-gray-600">{sub.examTitle}</div>
                                                            <div className="text-[9px] text-gray-400 mt-1 uppercase tracking-tighter">Node ID: {sub.examId}</div>
                                                        </td>
                                                        <td className="px-10 py-6 text-center">
                                                            <div className={`text-lg font-black ${sub.score < 40 ? 'text-red-500' : 'text-[#4a7c59]'}`}>
                                                                {sub.score}/{sub.totalMarks}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-6 text-center">
                                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold inline-block ${(sub.violations?.length || sub.violations || 0) > 5 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                                                                {typeof sub.violations === 'object' ? sub.violations.length : (sub.violations || 0)} Detection{(typeof sub.violations === 'object' ? sub.violations.length : sub.violations) !== 1 ? 's' : ''}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-6 text-right font-mono text-[11px] text-gray-400">
                                                            {new Date(sub.timestamp).toLocaleDateString()} <br /> {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="px-10 py-6 text-right">
                                                            <button
                                                                onClick={() => setSelectedSubmission(sub)}
                                                                className="p-3 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-[#4a7c59] group-hover:text-white transition-all"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="py-40 text-center">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-200">
                                                            <ClipboardList size={32} />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-300 italic">Central repository is empty</h3>
                                                        <p className="text-sm text-gray-400 mt-2">Awaiting first submission from active examination nodes.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'tickets' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h2 className="text-4xl font-black uppercase tracking-tighter">Support Desk Queue</h2>
                                        <p className="text-gray-400 mt-2">Manage technical escalations and administrative requests from live nodes.</p>
                                    </div>
                                    <div className="px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                        Queue: {tickets.length} Active
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {tickets.length > 0 ? (
                                        [...tickets].reverse().map(ticket => (
                                            <div key={ticket.id} className="bg-white border border-[#e0e0d5] rounded-3xl p-8 flex flex-col md:flex-row gap-8 hover:shadow-xl hover:shadow-black/[0.04] transition-all relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500" />
                                                <div className="md:w-64 border-r border-gray-50 pr-8">
                                                    <div className="text-[10px] font-bold text-[#4a7c59] uppercase tracking-widest mb-3">Origin Node</div>
                                                    <div className="text-sm font-bold mb-1">{ticket.studentName}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono italic mb-4">{ticket.rollNo}</div>
                                                    <div className="px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded-full w-fit uppercase border border-yellow-100">
                                                        Status: OPEN
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h3 className="text-xl font-bold">{ticket.subject}</h3>
                                                        <span className="text-[10px] font-mono text-gray-400">{new Date(ticket.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 p-5 rounded-2xl italic">"{ticket.message}"</p>
                                                    <div className="mt-8 flex gap-4">
                                                        <button className="px-6 py-3 bg-[#1a1a1a] text-white text-xs font-bold rounded-xl hover:bg-black transition-all uppercase tracking-widest flex items-center gap-2">
                                                            <MessageSquare size={14} /> Dispatch Response
                                                        </button>
                                                        <button className="px-6 py-3 bg-white border border-gray-100 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest">
                                                            Mark Resolved
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-32 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                                                <MessageSquare size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-300 italic">Support queue is clear</h3>
                                            <p className="text-sm text-gray-400 mt-2">No active technical escalations reported from any examination nodes.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* ─── DELETE CONFIRMATION ─── */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white w-[420px] rounded-3xl p-10 text-center shadow-2xl">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Delete Assessment?</h3>
                            <p className="text-gray-400 text-sm mb-8">This action is irreversible. All question data will be permanently removed.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 bg-gray-50 text-gray-500 font-bold rounded-xl text-xs uppercase tracking-widest">Cancel</button>
                                <button onClick={() => handleDeleteExam(deleteConfirm)} className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest">Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── CREATE / EDIT EXAM MODAL ─── */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-white w-[900px] max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                                <div>
                                    <h3 className="text-xl font-bold uppercase tracking-tight">
                                        {editingExam ? 'Edit Assessment' : 'Deploy New Assessment'}
                                    </h3>
                                    <p className="text-gray-400 text-sm mt-1">Define structure, questions, and schedule.</p>
                                </div>
                                <button onClick={() => { setShowCreateModal(false); setEditingExam(null); }} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmitExam} className="flex-1 overflow-y-auto">
                                <div className="p-8 space-y-8">

                                    {/* Basic Info */}
                                    <div className="space-y-5">
                                        <div className="text-[10px] font-bold text-[#4a7c59] uppercase tracking-widest flex items-center gap-2">
                                            <BookOpen size={12} /> Basic Information
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2 tracking-widest">Exam Title *</label>
                                            <input
                                                type="text" required
                                                className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-xl outline-[#4a7c59] text-sm"
                                                placeholder="e.g. Advanced Computer Architecture Final"
                                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2 tracking-widest">Module / Course *</label>
                                                <input
                                                    type="text" required
                                                    className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-xl outline-[#4a7c59] text-sm"
                                                    placeholder="B.Tech SEM VI"
                                                    value={formData.course} onChange={e => setFormData({ ...formData, course: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2 tracking-widest">Subject Faculty ID *</label>
                                                <input
                                                    type="text" required
                                                    className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-xl outline-[#4a7c59] text-sm"
                                                    placeholder="e.g. FAC_DR_SHARMA"
                                                    value={formData.subjectFaculty} onChange={e => setFormData({ ...formData, subjectFaculty: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2 tracking-widest">Duration (Minutes) *</label>
                                                <input
                                                    type="number" required min="5" max="600"
                                                    className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-xl outline-[#4a7c59] text-sm"
                                                    value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2 tracking-widest">HOD ID (Auto-Assigned)</label>
                                                <input
                                                    type="text" disabled
                                                    className="w-full bg-gray-100 border border-gray-100 p-3.5 rounded-xl text-sm italic text-gray-400 cursor-not-allowed"
                                                    value={formData.hodInCharge}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2 tracking-widest">Description</label>
                                            <textarea
                                                className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-xl outline-[#4a7c59] h-20 text-sm resize-none"
                                                placeholder="Brief description of the assessment..."
                                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Schedule */}
                                    <div className="space-y-5">
                                        <div className="text-[10px] font-bold text-[#4a7c59] uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={12} /> Schedule
                                        </div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2 tracking-widest">Start Date & Time</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-xl outline-[#4a7c59] text-sm"
                                                    value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2 tracking-widest">End Date & Time</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-xl outline-[#4a7c59] text-sm"
                                                    value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security & Proctoring */}
                                    <div className="space-y-5">
                                        <div className="text-[10px] font-bold text-[#4a7c59] uppercase tracking-widest flex items-center gap-2">
                                            <Shield size={12} /> Security & AI Proctoring
                                        </div>
                                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-bold flex items-center gap-2">
                                                    AI Proctoring Penalties
                                                    <span className="px-2 py-0.5 bg-green-100 text-[#4a7c59] text-[8px] font-black rounded uppercase tracking-tighter">Recommended</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 max-w-md">
                                                    When enabled, AI will automatically detect multiple faces, no face, or mobile devices and trigger a security freeze on the student's screen.
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, aiProctoringEnabled: !formData.aiProctoringEnabled })}
                                                className={`relative w-14 h-7 rounded-full transition-all ${formData.aiProctoringEnabled ? 'bg-[#4a7c59]' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.aiProctoringEnabled ? 'left-7' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Questions */}
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] font-bold text-[#4a7c59] uppercase tracking-widest flex items-center gap-2">
                                                <Code2 size={12} /> Questions ({formData.questions.length})
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-[10px] font-bold text-gray-400">
                                                    TOTAL: <span className="text-[#4a7c59] text-sm">{computedTotalMarks}</span> marks
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addQuestion}
                                                    className="px-4 py-2 bg-[#4a7c59]/10 text-[#4a7c59] rounded-lg text-[10px] font-bold uppercase hover:bg-[#4a7c59]/20 transition-all flex items-center gap-1.5"
                                                >
                                                    <Plus size={12} /> Add Question
                                                </button>
                                            </div>
                                        </div>

                                        {formData.questions.map((q, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                                <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-lg bg-[#4a7c59] text-white flex items-center justify-center text-[10px] font-bold">
                                                            {idx + 1}
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-600">{q.title || `Question ${idx + 1}`}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-[#4a7c59]">{q.marks || 0} marks</span>
                                                        {formData.questions.length > 1 && (
                                                            <button type="button" onClick={() => removeQuestion(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-5 space-y-4">
                                                    <div className="grid grid-cols-4 gap-4">
                                                        <div className="col-span-3">
                                                            <label className="text-[9px] font-bold uppercase text-gray-400 block mb-1.5 tracking-widest">Question Title *</label>
                                                            <input
                                                                type="text" required
                                                                className="w-full bg-white border border-gray-100 p-3 rounded-lg outline-[#4a7c59] text-sm"
                                                                placeholder="e.g. Pipeline Hazards Analysis"
                                                                value={q.title} onChange={e => updateQuestion(idx, 'title', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold uppercase text-gray-400 block mb-1.5 tracking-widest">Marks *</label>
                                                            <input
                                                                type="number" required min="1" max="500"
                                                                className="w-full bg-white border border-gray-100 p-3 rounded-lg outline-[#4a7c59] text-sm"
                                                                value={q.marks} onChange={e => updateQuestion(idx, 'marks', parseInt(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold uppercase text-gray-400 block mb-1.5 tracking-widest">Question Description</label>
                                                        <textarea
                                                            className="w-full bg-white border border-gray-100 p-3 rounded-lg outline-[#4a7c59] h-16 text-sm resize-none"
                                                            placeholder="Detailed instructions for this question..."
                                                            value={q.description} onChange={e => updateQuestion(idx, 'description', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold uppercase text-gray-400 block mb-1.5 tracking-widest">Code Template (Optional)</label>
                                                        <textarea
                                                            className="w-full bg-white border border-gray-100 p-3 rounded-lg outline-[#4a7c59] h-20 text-xs font-mono resize-none"
                                                            placeholder="# Starter code template for students..."
                                                            value={q.template} onChange={e => updateQuestion(idx, 'template', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
                                    <div className="text-[10px] text-gray-400">
                                        {formData.questions.length} questions • {computedTotalMarks} total marks • {formData.duration} min
                                    </div>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => { setShowCreateModal(false); setEditingExam(null); }} className="px-8 py-3.5 bg-gray-100 text-gray-500 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                                            Cancel
                                        </button>
                                        <button type="submit" className="px-8 py-3.5 bg-[#4a7c59] text-white font-bold rounded-xl shadow-lg shadow-[#4a7c59]/20 text-xs uppercase tracking-widest hover:bg-[#3d664a] transition-all flex items-center gap-2">
                                            <CheckCircle size={14} /> {editingExam ? 'Update Assessment' : 'Deploy Assessment'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Evidence Previewer Modal */}
            <AnimatePresence>
                {selectedReport && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                        <div className="w-[800px] bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h4 className="text-xl font-bold uppercase tracking-tighter">Neural_Incident_Audit</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Transaction Node: {selectedReport.id}</p>
                                </div>
                                <button onClick={() => setSelectedReport(null)} className="p-3 bg-white rounded-2xl hover:bg-gray-50 transition-all text-gray-400"><X size={20} /></button>
                            </div>
                            <div className="p-10">
                                <div className="grid grid-cols-3 gap-8 mb-10">
                                    <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                                        <div className="text-[9px] font-bold text-red-400 uppercase mb-2">Detection_Class</div>
                                        <div className="text-lg font-black text-red-600 uppercase italic">{selectedReport.violationType}</div>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                        <div className="text-[9px] font-bold text-gray-400 uppercase mb-2">Confidence_Score</div>
                                        <div className="text-lg font-black text-gray-800 uppercase italic">94.82%</div>
                                    </div>
                                    <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                                        <div className="text-[9px] font-bold text-green-400 uppercase mb-2">Escalation_Status</div>
                                        <div className="text-lg font-black text-green-600 uppercase italic">SUCCESS</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Integrity_Telemetry_Stream</div>
                                    <div className="bg-[#1a1a1a] p-8 rounded-[30px] font-mono text-[11px] leading-relaxed text-green-500/80 max-h-[300px] overflow-y-auto">
                                        <div className="mb-2 text-green-500">[SYSTEM_SYNC] Biometric payload verified...</div>
                                        <div className="mb-2 text-red-500">[DETECTION] Object_Class: {selectedReport.violationType} identified @ frame 4921</div>
                                        <div className="mb-2 text-orange-500">[VALIDATION] Multiple vector verification initiated...</div>
                                        <div className="mb-2 text-red-500">[ESCALATION] Alerting Subject Faculty... OK</div>
                                        <div className="mb-2 text-red-500">[ESCALATION] Alerting Department HOD... OK</div>
                                        <div className="mb-2 text-green-500">[PENALTY] Local node frozen for 600s</div>
                                        <div className="mb-2 text-gray-500">-------------------------------------------</div>
                                        <div className="mb-2 text-green-300"># TELEMETRY_DATA_HEX: 41 49 5F 50 52 4F 43 54 4F 52_01</div>
                                        <div className="mb-2 text-green-300"># VECTOR_SCORE: 0.992837192837</div>
                                        <div className="mb-2 text-green-300"># TIMESTAMP: {selectedReport.timestamp}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-gray-50 flex justify-end gap-4">
                                <button onClick={() => setSelectedReport(null)} className="px-8 py-3 bg-white text-gray-500 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-100">Dismiss</button>

                                {user?.name?.includes("HOD") ? (
                                    <button
                                        className="px-8 py-3 bg-[#4a7c59] text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-[#4a7c59]/20"
                                        onClick={() => {
                                            unfreezeStudent(selectedReport.studentId);
                                            alert(`AUTHORITY_VERIFIED: Resuming node for ${selectedReport.studentName}. Session state restored.`);
                                            setSelectedReport(null);
                                        }}
                                    >
                                        Resume Secure Node
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="px-8 py-3 bg-gray-100 text-gray-300 font-bold rounded-xl text-xs uppercase cursor-not-allowed border border-gray-200"
                                    >
                                        HOD_AUTH_REQUIRED
                                    </button>
                                )}

                                <button className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-red-200">Invalidate Report</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submission Detail Modal */}
            <AnimatePresence>
                {selectedSubmission && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                        <div className="w-[1000px] max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-gray-100">
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 shrink-0">
                                <div>
                                    <h4 className="text-xl font-bold uppercase tracking-tighter">Academic_Evidence_Hub</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Transaction Node: {selectedSubmission.id}</p>
                                </div>
                                <button onClick={() => setSelectedSubmission(null)} className="p-3 bg-white rounded-2xl hover:bg-gray-50 transition-all text-gray-400"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10">
                                <div className="grid grid-cols-4 gap-6 mb-10">
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                        <div className="text-[9px] font-bold text-gray-400 uppercase mb-2">Candidate</div>
                                        <div className="text-sm font-black uppercase">{selectedSubmission.studentName}</div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-1">{selectedSubmission.rollNo}</div>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                        <div className="text-[9px] font-bold text-gray-400 uppercase mb-2">Assessment</div>
                                        <div className="text-sm font-black uppercase">{selectedSubmission.examTitle}</div>
                                        <div className="text-[10px] text-[#4a7c59] font-bold mt-1">VERIFIED_SUBMISSION</div>
                                    </div>
                                    <div className="p-6 bg-[#4a7c59]/5 rounded-3xl border border-[#4a7c59]/10">
                                        <div className="text-[9px] font-bold text-[#4a7c59] uppercase mb-2">Merit_Score</div>
                                        <div className="text-2xl font-black text-[#4a7c59]">{selectedSubmission.score} / {selectedSubmission.totalMarks}</div>
                                    </div>
                                    <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                                        <div className="text-[9px] font-bold text-red-400 uppercase mb-2">Neural_Violations</div>
                                        <div className="text-2xl font-black text-red-600">{typeof selectedSubmission.violations === 'object' ? selectedSubmission.violations.length : selectedSubmission.violations}</div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 border-b border-gray-100 pb-4">Candidate_Response_Ledger</div>

                                    {Object.entries(selectedSubmission.answers).map(([qId, answer], idx) => (
                                        <div key={qId} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[8px] text-gray-500">{idx + 1}</div>
                                                    Logic Module: {qId}
                                                </div>
                                            </div>
                                            <div className="bg-[#1a1a1a] p-8 rounded-[30px] font-mono text-xs leading-relaxed text-green-500/80 border border-black shadow-inner">
                                                <pre className="whitespace-pre-wrap">{answer}</pre>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-4 shrink-0">
                                <button onClick={() => setSelectedSubmission(null)} className="px-8 py-3 bg-white text-gray-500 font-bold rounded-xl text-xs uppercase tracking-widest border border-gray-100 hover:bg-gray-100 transition-all">Close Audit</button>
                                <button
                                    onClick={() => handleDownloadTranscript(selectedSubmission)}
                                    className="px-8 py-3 bg-[#4a7c59] text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-[#4a7c59]/20 flex items-center gap-2"
                                >
                                    <Download size={14} /> Download PDF Transcript
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
