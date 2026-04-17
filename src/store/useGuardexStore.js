'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GuardexEngine, getGuardexEngine } from '@/engine/GuardexEngine';

/* ══════════════════════════════════════════════════════════════
   GUARDEX CORE STORE v2.0
   State Management + Engine Integration
   PRD v2.0 Compliant — Class Scope + Violation Decision Engine
   ══════════════════════════════════════════════════════════════ */

// ─── UNIVERSITY CLASS HIERARCHY (PRD §9) ───
const CLASS_HIERARCHY = {
  departments: [
    { id: 'CSE', name: 'Computer Science & Engineering' },
    { id: 'ECE', name: 'Electronics & Communication' },
    { id: 'ME', name: 'Mechanical Engineering' },
  ],
  programmes: [
    { id: 'BTECH_CSE', dept: 'CSE', name: 'B.Tech Computer Science' },
    { id: 'BTECH_ECE', dept: 'ECE', name: 'B.Tech Electronics' },
    { id: 'BTECH_ME', dept: 'ME', name: 'B.Tech Mechanical' },
  ],
  batches: [
    { id: 'BAT_2022', programme: 'BTECH_CSE', year: 2022 },
    { id: 'BAT_2023', programme: 'BTECH_CSE', year: 2023 },
    { id: 'BAT_2024', programme: 'BTECH_CSE', year: 2024 },
  ],
  sections: [
    { id: 'SEC_A', batch: 'BAT_2023', name: 'Section A', strength: 60 },
    { id: 'SEC_B', batch: 'BAT_2023', name: 'Section B', strength: 60 },
    { id: 'SEC_C', batch: 'BAT_2023', name: 'Section C', strength: 55 },
  ]
};

const useGuardexStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      currentPage: 'login',
      currentExam: null,
      penaltyConfig: {
        maxTabSwitches: 3,
        freezeDuration: 10,
        maxFullscreenExits: 3,
        pasteLimit: 0,
        zeroMarkThreshold: 5,
        audioSensitivity: 75,
        eyeTrackingPrecision: 0.8,
        copyPasteBlocked: true,
        rightClickBlocked: true,
        aiProctoringEnabled: true,
        facePenaltyDuration: 2,
      },

      session: {
        isActive: false,
        startTime: null,
        endTime: null,
        isFrozen: false,
        frozenUntil: null,
        freezeReason: '',
        isSubmitted: false,
        currentQuestion: 0,
        marks: 100,
      },

      exams: [
        {
          id: 'EXAM_001',
          title: 'Advanced Computer Architecture',
          course: 'C.S.E - Semester VI',
          duration: 120,
          totalMarks: 100,
          status: 'active',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Assessment on Pipelining, Instruction Set Architectures, and Memory Hierarchy Optimizations.',
          questions: [
            {
              id: 'q1',
              title: 'Pipeline Hazards',
              description: 'Explain the three main types of pipeline hazards (Structural, Data, and Control) and provide a technique to mitigate each.',
              marks: 50,
              template: '# Pipeline Hazards Analysis\n# Define the hazards below\n'
            },
            {
              id: 'q2',
              title: 'Cache Mapping',
              description: 'Implement a simple direct-mapped cache simulation that tracks hits and misses for a given sequence of memory addresses.',
              marks: 50,
              template: '# Cache Simulation\ndef simulate_cache(addresses, cache_size):\n    # Your code here\n    pass\n'
            }
          ],
          assignedStudents: []
        }
      ],

      violations: [],
      submissions: [],
      studentAnswers: {}, // examId -> { questionId -> answer }
      reports: [],
      tickets: [],
      classHierarchy: CLASS_HIERARCHY,

      aiState: {
        faceDetected: true,
        faceCount: 1,
        gaze: 'center',
        gazeZone: 'Z1',
        reverifyStatus: 'ok',
        identityStatus: 'unverified', // unverified | verifying | verified | failed
        faceReferenceEmbedding: null,
        lastVerification: Date.now(),
        lastLivenessCheck: null,
        webcamActive: false,
        micActive: false,
        glassesDetected: false,
        lowLight: false,
        calibrationScore: 100,
        calibrationStatus: 'complete',
        browserProfile: null, // { isEdge, isChrome, isBrave, isArc, etc }
        vmSignals: [], // detected VM/RDP signals
      },

      // Engine state tracking
      engineState: {
        lastDecision: null,
        activeRule: null,
        totalProcessedEvents: 0,
        agentHeartbeat: true,
        agentLastSeen: Date.now(),
      },

      // --- ACTIONS ---
      login: (role, name, email = '') => {
        const userId = 'GX-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const rollNo = role === 'student' ? `${new Date().getFullYear()}BTCS${Math.floor(Math.random() * 900) + 100}` : 'DEPT_HEAD';

        set({
          user: {
            id: userId,
            role,
            name,
            email: email || `${name.toLowerCase().replace(' ', '.')}@university.edu`,
            rollNo
          },
          isAuthenticated: true,
          currentPage: role === 'admin' ? 'dashboard' : 'portal',
          // Automatically assign student to all mock exams for demo purposes
          exams: get().exams.map(e => ({
            ...e,
            assignedStudents: role === 'student' ? [userId] : []
          }))
        });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, currentPage: 'login', session: { isActive: false }, violations: [] });
      },

      setPage: (page) => set({ currentPage: page }),

      startExam: (examId) => {
        const exam = get().exams.find(e => e.id === examId);
        if (!exam) return;

        set({
          currentExam: exam,
          session: {
            isActive: true,
            startTime: Date.now(),
            endTime: Date.now() + (exam.duration * 60 * 1000),
            isFrozen: false,
            isSubmitted: false,
            currentQuestion: 0,
            marks: exam.totalMarks
          }
        });
      },

      // ─── ENGINE-INTEGRATED VIOLATION PROCESSOR ───
      addViolation: (type, description, severity = 'medium', eventPayload = {}) => {
        const state = get();
        const engine = getGuardexEngine(state.penaltyConfig);
        const newViolation = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          type,
          description,
          severity,
          engineRule: null
        };

        // ─── Build engine event payload ───
        const enginePayload = {
          session: {
            student_id: state.user?.id,
            assessment_id: state.currentExam?.id,
            status: state.session.isActive ? 'active' : 'inactive',
            calibration_status: state.aiState.calibrationStatus,
          },
          event: {
            type,
            timestamp: new Date().toISOString(),
            confidence: eventPayload.confidence || 0.95,
            duration_seconds: eventPayload.duration || 0,
            zone: eventPayload.zone || null,
            yaw: eventPayload.yaw || 0,
            pitch: eventPayload.pitch || 0,
            compiler_running: eventPayload.compilerRunning || false,
            ...eventPayload,
          },
          agent: {
            heartbeat: state.engineState.agentHeartbeat,
            spaces_detected: eventPayload.spacesDetected || false,
          },
          webcam: {
            glasses_detected: state.aiState.glassesDetected,
            low_light: state.aiState.lowLight,
          },
        };

        // ─── Process through GuardexEngine ───
        const decision = engine.processEvent(enginePayload);

        if (decision) {
          newViolation.engineRule = decision.rule_triggered;
          newViolation.severity = decision.severity?.toLowerCase() || severity;

          // Update engine state
          set(s => ({
            engineState: {
              ...s.engineState,
              lastDecision: decision,
              activeRule: decision.rule_triggered,
              totalProcessedEvents: s.engineState.totalProcessedEvents + 1,
            }
          }));

          // ─── EXECUTE ENGINE DECISION ───
          if (decision.action === 'terminate') {
            set(s => ({
              session: {
                ...s.session,
                marks: 0,
                isSubmitted: true,
                freezeReason: decision.message_to_student || `CRITICAL VIOLATION: ${description}. Session terminated.`
              }
            }));
          } else if (decision.action === 'freeze') {
            const freezeMs = decision.freeze_duration_minutes > 0
              ? decision.freeze_duration_minutes * 60 * 1000
              : 24 * 60 * 60 * 1000; // indefinite → 24h placeholder

            set(s => ({
              session: {
                ...s.session,
                isFrozen: true,
                frozenUntil: Date.now() + freezeMs,
                freezeReason: decision.message_to_student || `Security Pause: ${description}.`
              }
            }));
          }

          // ─── Send admin alert if required ───
          if (decision.admin_alert && state.currentExam) {
            state.sendReport(
              state.user?.id,
              state.user?.name,
              state.user?.rollNo,
              state.currentExam.title,
              type,
              decision.severity?.toLowerCase() || 'medium'
            );
          }
        }

        // ─── Legacy escalation fallback (for events engine doesn't handle) ───
        if (!decision) {
          // Tab switch escalation
          if (type === 'tab_switch') {
            const updated = [...state.violations, newViolation];
            const count = updated.filter(v => v.type === 'tab_switch').length;
            if (count >= state.penaltyConfig.maxTabSwitches) {
              set(s => ({
                session: {
                  ...s.session,
                  marks: 0,
                  isSubmitted: true,
                  freezeReason: 'CRITICAL VIOLATION: Tab switch limit exceeded. Session terminated.'
                }
              }));
            } else if (count >= 2) {
              set(s => ({
                session: {
                  ...s.session,
                  isFrozen: true,
                  frozenUntil: Date.now() + (s.penaltyConfig.freezeDuration * 60 * 1000),
                  freezeReason: `Security Pause: Tab switch #${count}. System locked for ${s.penaltyConfig.freezeDuration} minutes.`
                }
              }));
            }
          }

          // Fullscreen escalation
          if (type === 'fullscreen_exit') {
            const updated = [...state.violations, newViolation];
            const count = updated.filter(v => v.type === 'fullscreen_exit').length;
            if (count >= state.penaltyConfig.maxFullscreenExits) {
              set(s => ({
                session: {
                  ...s.session,
                  marks: 0,
                  isSubmitted: true,
                  freezeReason: 'CRITICAL VIOLATION: Fullscreen exit limit exceeded.'
                }
              }));
            }
          }

          // Copy/Paste
          if (type === 'paste_attempt' || type === 'copy_attempt') {
            const updated = [...state.violations, newViolation];
            const count = updated.filter(v => v.type === type).length;
            if (count >= 5) {
              set(s => ({
                session: {
                  ...s.session,
                  marks: Math.max(0, s.session.marks - 5),
                  freezeReason: `WARNING: Repeated ${type} attempts. Marks deducted.`
                }
              }));
            }
          }
        }

        // ─── Always log the violation ───
        set(s => ({ violations: [...s.violations, newViolation] }));
      },

      // ─── ENGINE AGENT HEARTBEAT ───
      updateAgentHeartbeat: (isAlive) => {
        set(s => ({
          engineState: {
            ...s.engineState,
            agentHeartbeat: isAlive,
            agentLastSeen: isAlive ? Date.now() : s.engineState.agentLastSeen,
          }
        }));
      },

      // ─── CLASS SCOPE CHECK ───
      checkAccessScope: (studentSectionId, examId) => {
        const state = get();
        const exam = state.exams.find(e => e.id === examId);
        if (!exam) return { granted: false, reason: 'exam_not_found' };

        // If exam has target class ids, check membership
        if (exam.targetClassIds && exam.targetClassIds.length > 0) {
          if (!exam.targetClassIds.includes(studentSectionId)) {
            return { granted: false, reason: 'section_mismatch', severity: 'CRITICAL' };
          }
        }

        // Check time window
        const now = new Date();
        if (exam.startTime && new Date(exam.startTime) > now) {
          return { granted: false, reason: 'too_early' };
        }
        if (exam.endTime && new Date(exam.endTime) < now) {
          return { granted: false, reason: 'too_late' };
        }

        return { granted: true };
      },

      unfreeze: () => set(s => ({ session: { ...s.session, isFrozen: false } })),
      unfreezeStudent: (studentId) => {
        // In a real app, this would be a socket message or a database update.
        // For our demo, we'll track frozen students in a global map if we had one.
        // Since we only have one "session" in the store for the current user,
        // we'll assume the HOD is unfreezing a student who is currently active.
        // If we want to support multiple students, we need to store their session state indexed by ID.

        // For now, let's add a mechanism to mark a report as 'resolved_and_unfrozen'
        set(s => ({
          reports: s.reports.map(r =>
            r.studentId === studentId ? { ...r, isResolved: true, unfreezeAction: true } : r
          )
        }));
      },
      updatePenaltyConfig: (updates) => set(s => ({ penaltyConfig: { ...s.penaltyConfig, ...updates } })),
      createExam: (examData) => {
        const totalMarks = examData.questions?.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0) || examData.totalMarks || 100;
        const newExam = {
          id: `EXAM_${Date.now()}`,
          status: examData.status || 'scheduled',
          assignedStudents: [],
          totalMarks,
          ...examData,
          totalMarks, // ensure computed totalMarks wins
        };
        set(s => ({ exams: [...s.exams, newExam] }));
      },

      updateExam: (examId, updates) => {
        set(s => ({
          exams: s.exams.map(e => {
            if (e.id !== examId) return e;
            const updated = { ...e, ...updates };
            if (updates.questions) {
              updated.totalMarks = updates.questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);
            }
            return updated;
          })
        }));
      },

      deleteExam: (examId) => {
        set(s => ({ exams: s.exams.filter(e => e.id !== examId) }));
      },

      updateAI: (updates) => set(s => ({ aiState: { ...s.aiState, ...updates } })),
      setCurrentExam: (id) => set({ currentExam: get().exams.find(e => e.id === id) }),

      saveAnswer: (examId, questionId, answer) => {
        set(s => ({
          studentAnswers: {
            ...s.studentAnswers,
            [examId]: {
              ...(s.studentAnswers[examId] || {}),
              [questionId]: answer
            }
          }
        }));
      },

      submitSession: () => {
        const state = get();
        const { user, currentExam, session, violations, studentAnswers } = state;

        const newSubmission = {
          id: 'SUB_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          studentId: user.id,
          studentName: user.name,
          rollNo: user.rollNo,
          examId: currentExam.id,
          examTitle: currentExam.title,
          score: session.marks,
          totalMarks: currentExam.totalMarks,
          violations: violations.length,
          answers: studentAnswers[currentExam.id] || {},
          timestamp: new Date().toISOString(),
          status: 'completed'
        };

        set({
          submissions: [...state.submissions, newSubmission],
          session: { ...session, isSubmitted: true, isActive: false }
        });
      },

      resetSession: () => set(s => ({
        session: {
          isActive: false,
          isSubmitted: false,
          isFrozen: false,
          marks: 100,
          currentQuestion: 0,
          startTime: null,
          endTime: null,
          frozenUntil: null,
          freezeReason: ''
        },
        violations: [],
        currentPage: 'portal'
      })),

      // --- REPORTING SYSTEM ---
      reports: [],
      sendReport: (studentId, studentName, rollNo, examTitle, violationType, severity) => {
        const newReport = {
          id: `REP_${Date.now()}`,
          studentId,
          studentName,
          rollNo,
          examTitle,
          violationType,
          severity,
          timestamp: new Date().toISOString(),
          status: 'transmitted',
          recipients: ['HOD_OFFICE', 'SUBJECT_FACULTY'],
          isResolved: false
        };
        set(s => ({ reports: [newReport, ...s.reports] }));
      },

      // --- TICKETING & SUPPORT ---
      tickets: [],
      sendTicket: (subject, message) => {
        const newTicket = {
          id: `TKT_${Date.now()}`,
          studentId: get().user?.id,
          studentName: get().user?.name,
          subject,
          message,
          timestamp: new Date().toISOString(),
          status: 'pending'
        };
        set(s => ({ tickets: [newTicket, ...s.tickets] }));
      },

      resolveReport: (reportId) => {
        set(s => ({
          reports: s.reports.map(r => r.id === reportId ? { ...r, isResolved: true } : r)
        }));
      },

      // --- v2.1 IDENTITY & ENVIRONMENT ACTIONS ---
      verifyIdentity: (embedding, status = 'verified') => {
        set(s => ({
          aiState: {
            ...s.aiState,
            faceReferenceEmbedding: embedding,
            identityStatus: status,
            lastVerification: Date.now()
          }
        }));
      },

      setBrowserProfile: (profile) => {
        set(s => ({ aiState: { ...s.aiState, browserProfile: profile } }));
      },

      setVMSignals: (signals) => {
        set(s => ({ aiState: { ...s.aiState, vmSignals: signals } }));
      }
    }),
    {
      name: 'guardex-academic-store-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useGuardexStore;
