'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/* ──────────────────────────────────────────────
   GUARDEX CORE ENGINE
   ACADEMIC INTEGRITY LOGIC
   ────────────────────────────────────────────── */

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

      aiState: {
        faceDetected: true,
        faceCount: 1,
        gaze: 'center',
        reverifyStatus: 'ok',
        lastVerification: Date.now(),
        webcamActive: false,
        micActive: false,
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

      addViolation: (type, description, severity = 'medium') => {
        const state = get();
        const newViolation = { id: Date.now(), timestamp: new Date().toISOString(), type, description, severity };
        const updated = [...state.violations, newViolation];

        set({ violations: updated });

        // PRD Escalation
        if (type === 'tab_switch') {
          const count = updated.filter(v => v.type === 'tab_switch').length;
          if (count === 3) {
            set(s => ({
              session: {
                ...s.session,
                isFrozen: true,
                frozenUntil: Date.now() + (s.penaltyConfig.freezeDuration * 60 * 1000),
                freezeReason: 'Security Pause: Multiple focus losses detected (#3). System locked for 10 minutes.'
              }
            }));
          } else if (count >= 5) {
            set(s => ({
              session: {
                ...s.session,
                marks: 0,
                isSubmitted: true,
                freezeReason: 'CRITICAL VIOLATION: Excessive tab switching (5+ attempts). Manual audit required.'
              }
            }));
          }
        }

        if (type === 'paste_attempt') {
          const count = updated.filter(v => v.type === 'paste_attempt').length;
          const pasteLimit = state.penaltyConfig.pasteLimit;
          if (pasteLimit > 0 && count >= pasteLimit * 2) {
            set(s => ({
              session: {
                ...s.session,
                marks: 0,
                isSubmitted: true,
                freezeReason: 'CRITICAL VIOLATION: Excessive paste attempts. Exam terminated.'
              }
            }));
          } else if (pasteLimit > 0 && count >= pasteLimit) {
            set(s => ({
              session: {
                ...s.session,
                isFrozen: true,
                frozenUntil: Date.now() + (s.penaltyConfig.freezeDuration * 60 * 1000),
                freezeReason: `Security Pause: Paste attempt limit reached (${count}). System locked.`
              }
            }));
          }
        }

        if (type === 'copy_attempt') {
          const count = updated.filter(v => v.type === 'copy_attempt').length;
          if (count >= 5) {
            set(s => ({
              session: {
                ...s.session,
                marks: Math.max(0, s.session.marks - 5),
                freezeReason: 'WARNING: Repeated copy attempts detected. Marks deducted.'
              }
            }));
          }
        }

        if (type === 'fullscreen_exit') {
          const count = updated.filter(v => v.type === 'fullscreen_exit').length;
          if (count >= 3) {
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

        // --- AI PROCTORING PENALTIES ---
        const currentExam = state.currentExam;
        const isAIEnabled = currentExam?.aiProctoringEnabled ?? state.penaltyConfig.aiProctoringEnabled;

        if (isAIEnabled) {
          if (type === 'multiple_faces' || type === 'phone_detected' || type === 'face_absent_critical') {
            const currentExam = state.currentExam;
            const user = state.user;

            // Auto-trigger report for HOD/Faculty on critical AI detections
            state.sendReport(
              user.id,
              user.name,
              user.rollNo,
              currentExam.title,
              type,
              'critical'
            );

            set(s => ({
              session: {
                ...s.session,
                isFrozen: true,
                frozenUntil: Date.now() + (s.penaltyConfig.freezeDuration * 60 * 1000),
                freezeReason: `Security Pause: ${description}. System locked for investigation. REPORT_SENT_TO_HOD.`
              }
            }));
          }
        }
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

      resolveReport: (reportId) => {
        set(s => ({
          reports: s.reports.map(r => r.id === reportId ? { ...r, isResolved: true } : r)
        }));
      }
    }),
    {
      name: 'guardex-academic-store-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useGuardexStore;
