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
    CheckCircle, BookOpen, Code2, Hash
} from 'lucide-react';

export default function TrainerConsole() {
    const { user, exams, violations, penaltyConfig, updatePenaltyConfig, createExam, updateExam, deleteExam, logout } = useGuardexStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [expandedExam, setExpandedExam] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // ─── Exam Form State ───
    const emptyQuestion = { id: '', title: '', description: '', marks: 10, template: '' };
    const emptyExam = {
        title: '', course: '', duration: 60, description: '',
        startTime: '', endTime: '',
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
                        { id: 'vault', icon: ShieldAlert, label: 'Integrity Vault' },
                        { id: 'analytics', icon: BarChart3, label: 'Batch Analytics' },
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
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                        <LogOut size={14} /> TERMINATE_SESSION
                    </button>
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
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 uppercase">
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
                                        <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Incident Audit Vault</h3>
                                        <p className="text-gray-400 text-sm">Review architectural security breaches and manual overrides.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button className="px-6 py-3 bg-white border border-[#e0e0d5] rounded-xl flex items-center gap-3 text-sm font-medium">
                                            <Download size={18} className="text-[#4a7c59]" /> Export CSV
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl border border-[#e0e0d5] overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-10 py-5 text-left text-[10px] font-bold text-gray-400 uppercase">Violation Node</th>
                                                <th className="px-10 py-5 text-left text-[10px] font-bold text-gray-400 uppercase">Severity</th>
                                                <th className="px-10 py-5 text-left text-[10px] font-bold text-gray-400 uppercase">Detection Vector</th>
                                                <th className="px-10 py-5 text-left text-[10px] font-bold text-gray-400 uppercase">Timestamp</th>
                                                <th className="px-10 py-5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {violations.length > 0 ? violations.map(v => (
                                                <tr key={v.id} className="hover:bg-red-50/30 transition-colors">
                                                    <td className="px-10 py-6 font-bold">{v.type.toUpperCase()}</td>
                                                    <td className="px-10 py-6">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v.severity === 'critical' ? 'bg-red-100 text-red-600' :
                                                                v.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                                                                    'bg-blue-100 text-blue-600'
                                                            }`}>
                                                            {v.severity}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-6 text-gray-500">{v.description}</td>
                                                    <td className="px-10 py-6 text-[10px] text-gray-400 font-mono italic">{new Date(v.timestamp).toLocaleTimeString()}</td>
                                                    <td className="px-10 py-6 text-right"><Eye size={18} className="text-gray-300 cursor-pointer hover:text-black" /></td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="5" className="px-10 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <ShieldCheck size={48} className="text-green-200" />
                                                            <div className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Integrity Violations Detected in Active Cycle</div>
                                                        </div>
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
                                        <div className="text-3xl font-black text-[#4a7c59] mb-4">98.2%</div>
                                        <p className="text-gray-400 text-xs text-balance px-4 leading-relaxed">98.2% of sessions completed without high-severity flags.</p>
                                    </div>
                                    <div className="bg-white p-10 rounded-3xl border border-[#e0e0d5] flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                                            <Clock size={32} />
                                        </div>
                                        <h4 className="font-bold text-xl mb-2">Avg. Completion</h4>
                                        <div className="text-3xl font-black text-blue-500 mb-4">52 min</div>
                                        <p className="text-gray-400 text-xs px-4 leading-relaxed">Average time taken to submit the assessment module.</p>
                                    </div>
                                    <div className="bg-white p-10 rounded-3xl border border-[#e0e0d5] flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                                            <UserX size={32} />
                                        </div>
                                        <h4 className="font-bold text-xl mb-2">Zero Marked</h4>
                                        <div className="text-3xl font-black text-red-500 mb-4">2</div>
                                        <p className="text-gray-400 text-xs px-4 leading-relaxed">Candidates automatically disqualified by protocol.</p>
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
                                                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2 tracking-widest">Duration (Minutes) *</label>
                                                <input
                                                    type="number" required min="5" max="600"
                                                    className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-xl outline-[#4a7c59] text-sm"
                                                    value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
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

        </div>
    );
}
