'use client';

/* ══════════════════════════════════════════════════════════════
   GUARDEX ENGINE v2.0
   AI-Powered Exam Proctoring — Decision & Classification Core
   Based on GUARDEX PRD v2.0 Addendum (April 2026)
   ══════════════════════════════════════════════════════════════ */

// ─── GAZE ZONE MAP ───
// Z1-Z3: On-screen zones (safe)
// Z4-Z7: Off-screen zones (flaggable)
// Z7 = upward (thinking allowance <5s)
const GAZE_ZONES = {
    Z1: 'center',
    Z2: 'center-left',
    Z3: 'center-right',
    Z4: 'far-left',
    Z5: 'far-right',
    Z6: 'down',       // phone/notes
    Z7: 'up',         // thinking
};

const OFF_SCREEN_ZONES = ['Z4', 'Z5', 'Z6', 'Z7'];

// ─── DEFAULT PENALTY CONFIG ───
const DEFAULT_CONFIG = {
    maxTabSwitches: 3,
    maxFullscreenExits: 3,
    freezeDuration: 10,       // minutes
    facePenaltyDuration: 2,   // minutes
    zeroMarkThreshold: 5,
    audioSensitivity: 75,
    eyeTrackingPrecision: 0.8,
    copyPasteBlocked: true,
    rightClickBlocked: true,
    aiProctoringEnabled: true,
    gazeThresholdMultiplier: 1.0, // 1.4 for glasses
};

/**
 * GUARDEX Decision Engine
 * Processes structured event payloads and returns structured violation responses
 */
export class GuardexEngine {

    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.violationLog = [];
        this.gazeEventLog = [];       // rolling log for G-03 (8+ in 10 min)
        this.saccadeLog = [];         // reading saccade tracking for G-07
        this.clearedViolations = new Set(); // admin-cleared violation IDs
    }

    // ─── CONFIGURATION ───
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }

    // ─── ADMIN CLEARANCE ───
    clearViolation(violationId) {
        this.clearedViolations.add(violationId);
    }

    getActiveViolationCount(type = null) {
        return this.violationLog.filter(v =>
            !this.clearedViolations.has(v.id) &&
            (type ? v.type === type : true)
        ).length;
    }

    // ─── MAIN EVENT PROCESSOR ───
    processEvent(payload) {
        const { session, event, agent, screen_diff, webcam } = payload;

        // PRIORITY 1: Agent heartbeat lost → immediate CRITICAL
        if (agent && agent.heartbeat === false) {
            return this._buildResponse({
                action: 'freeze',
                severity: 'CRITICAL',
                rule_triggered: 'agent_heartbeat_lost',
                message_to_student: 'Connection to proctoring agent lost. Your exam has been frozen. Please ensure the Guardex Desktop Agent is running.',
                admin_alert: true,
                alert_type: 'instant_push',
                screenshot_required: true,
                freeze_duration_minutes: 0, // indefinite until agent reconnects
                auto_terminate: false,
                notes: 'Agent heartbeat lost >5 sec — exam frozen immediately per PRD rule',
                session, event
            });
        }

        // PRIORITY 2: Process based on event type
        if (!event) return null;

        switch (event.type) {
            case 'tab_switch':
                return this._processTabSwitch(payload);
            case 'fullscreen_exit':
                return this._processFullscreenExit(payload);
            case 'spaces_switch':
                return this._processSpacesSwitch(payload);
            case 'stage_manager_focus':
                return this._processStageManager(payload);
            case 'split_view_entry':
                return this._processSplitView(payload);
            case 'mission_control':
                return this._processMissionControl(payload);
            case 'hot_corner':
                return this._processHotCorner(payload);
            case 'gaze_off_screen':
                return this._processGazeOffScreen(payload);
            case 'eyes_closed':
                return this._processEyesClosed(payload);
            case 'head_turn':
                return this._processHeadTurn(payload);
            case 'head_pitch':
                return this._processHeadPitch(payload);
            case 'reading_saccade':
                return this._processReadingSaccade(payload);
            case 'combined_head_gaze':
                return this._processCombinedHeadGaze(payload);
            case 'multiple_faces':
                return this._processMultipleFaces(payload);
            case 'face_not_visible':
                return this._processFaceNotVisible(payload);
            case 'browser_ai_shortcut':
                return this._processBrowserAIShortcut(payload);
            case 'viewport_shrink':
                return this._processViewportShrink(payload);
            case 'browser_ai_panel':
                return this._processBrowserAIPanel(payload);
            case 'screen_capture_revoked':
                return this._processScreenCaptureRevoked(payload);
            case 'audio_second_voice':
                return this._processAudioSecondVoice(payload);
            case 'vm_detected':
                return this._processVMDetected(payload);
            case 'phone_detected':
                return this._processPhoneDetected(payload);
            case 'unknown_person_in_frame':
                return this._processUnknownPerson(payload);
            case 'second_student_in_frame':
                return this._processSecondStudent(payload);
            case 'liveness_check_failed':
                return this._processLivenessCheckFailed(payload);
            case 'identity_mismatch':
                return this._processIdentityMismatch(payload);
            case 'paste_attempt':
                return this._processPasteAttempt(payload);
            case 'screenshot_attempt':
                return this._processScreenshotAttempt(payload);
            case 'audio_anomaly':
                return this._processAudioAnomaly(payload);
            case 'scope_violation':
                return this._processScopeViolation(payload);
            case 'calibration_failed':
                return this._processCalibrationFailed(payload);
            default:
                return null;
        }
    }

    // ═══ TAB / WINDOW SWITCH RULES ═══

    _processTabSwitch(payload) {
        const count = this.getActiveViolationCount('tab_switch') + 1;
        this._logViolation('tab_switch', payload);

        if (count === 1) {
            return this._buildResponse({
                action: 'warn',
                severity: 'LOW',
                rule_triggered: 'tab_switch_1',
                message_to_student: 'Warning: Tab switch detected. Switching tabs during the exam is a violation. This is your first warning.',
                admin_alert: false,
                alert_type: 'logged_only',
                screenshot_required: false,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'Tab switch #1 — LOW severity warning',
                ...payload
            });
        } else if (count === 2) {
            return this._buildResponse({
                action: 'freeze',
                severity: 'MEDIUM',
                rule_triggered: 'tab_switch_2',
                message_to_student: 'SECURITY ALERT: Second tab switch detected. Your exam is frozen for 10 minutes. Further violations will result in zero marks.',
                admin_alert: true,
                alert_type: 'dashboard',
                screenshot_required: true,
                freeze_duration_minutes: this.config.freezeDuration,
                auto_terminate: false,
                notes: 'Tab switch #2 — MEDIUM severity, exam frozen 10 minutes',
                ...payload
            });
        } else {
            return this._buildResponse({
                action: 'terminate',
                severity: 'CRITICAL',
                rule_triggered: 'tab_switch_3',
                message_to_student: 'CRITICAL VIOLATION: Third tab switch detected. Your score has been set to 0 and the session is terminated.',
                admin_alert: true,
                alert_type: 'instant_push',
                screenshot_required: true,
                freeze_duration_minutes: 0,
                auto_terminate: true,
                notes: 'Tab switch #3 — CRITICAL, score=0, session terminated',
                ...payload
            });
        }
    }

    _processFullscreenExit(payload) {
        const count = this.getActiveViolationCount('fullscreen_exit') + 1;
        this._logViolation('fullscreen_exit', payload);

        if (count === 1) {
            return this._buildResponse({
                action: 'warn',
                severity: 'LOW',
                rule_triggered: 'fullscreen_exit_1',
                message_to_student: 'Warning: You have exited fullscreen mode. Please return to fullscreen immediately. This is your first warning.',
                admin_alert: false,
                alert_type: 'logged_only',
                screenshot_required: false,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'Fullscreen exit #1 — LOW severity warning overlay',
                ...payload
            });
        } else if (count === 2) {
            return this._buildResponse({
                action: 'warn',
                severity: 'MEDIUM',
                rule_triggered: 'fullscreen_exit_2',
                message_to_student: 'FINAL WARNING: Second fullscreen exit detected. The next exit will result in zero marks and session termination.',
                admin_alert: true,
                alert_type: 'dashboard',
                screenshot_required: true,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'Fullscreen exit #2 — MEDIUM severity final warning',
                ...payload
            });
        } else {
            return this._buildResponse({
                action: 'terminate',
                severity: 'CRITICAL',
                rule_triggered: 'fullscreen_exit_3',
                message_to_student: 'CRITICAL VIOLATION: Third fullscreen exit. Your score has been set to 0 and the session is terminated.',
                admin_alert: true,
                alert_type: 'instant_push',
                screenshot_required: true,
                freeze_duration_minutes: 0,
                auto_terminate: true,
                notes: 'Fullscreen exit #3 — CRITICAL, score=0, session terminated',
                ...payload
            });
        }
    }

    // ═══ macOS DESKTOP RULES ═══

    _processSpacesSwitch(payload) {
        const { agent } = payload;
        this._logViolation('spaces_switch', payload);

        if (agent && agent.spaces_detected) {
            // Layer 2 + Agent confirmed
            return this._buildResponse({
                action: 'freeze',
                severity: 'HIGH',
                rule_triggered: 'spaces_switch_confirmed',
                message_to_student: 'SECURITY ALERT: Desktop space switch detected and confirmed. This violation enters the tab-switch escalation ladder.',
                admin_alert: true,
                alert_type: 'instant_push',
                screenshot_required: true,
                freeze_duration_minutes: this.config.freezeDuration,
                auto_terminate: false,
                notes: 'Spaces switch confirmed by Layer 2 + Agent — enters tab-switch escalation ladder',
                ...payload
            });
        } else {
            // Layer 2 only, no Agent confirmation
            return this._buildResponse({
                action: 'flag',
                severity: 'HIGH',
                rule_triggered: 'spaces_switch_unconfirmed',
                message_to_student: 'Potential desktop space switch detected. Your session is under review.',
                admin_alert: true,
                alert_type: 'instant_push',
                screenshot_required: true,
                freeze_duration_minutes: this.config.freezeDuration,
                auto_terminate: false,
                notes: 'Spaces switch detected by Layer 2 only, no Agent confirmation — flag + admin review + auto-freeze pending',
                ...payload
            });
        }
    }

    _processStageManager(payload) {
        this._logViolation('stage_manager_focus', payload);
        // Treated as window switch → enters tab-switch escalation
        return this._processTabSwitch({ ...payload, event: { ...payload.event, type: 'tab_switch' } });
    }

    _processSplitView(payload) {
        this._logViolation('split_view_entry', payload);
        return this._buildResponse({
            action: 'freeze',
            severity: 'HIGH',
            rule_triggered: 'split_view_entry',
            message_to_student: 'SECURITY ALERT: Split View detected. Your exam has been paused for admin review.',
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: true,
            freeze_duration_minutes: 0, // paused until admin unfreeze
            auto_terminate: false,
            notes: 'Split View entry — HIGH severity, exam paused + admin instant push',
            ...payload
        });
    }

    _processMissionControl(payload) {
        this._logViolation('mission_control', payload);
        return this._buildResponse({
            action: 'warn',
            severity: 'MEDIUM',
            rule_triggered: 'mission_control',
            message_to_student: 'Warning: Mission Control activation detected. Please close Mission Control and return to the exam.',
            admin_alert: false,
            alert_type: 'logged_only',
            screenshot_required: false,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Mission Control activated — MEDIUM severity, warning overlay + log',
            ...payload
        });
    }

    _processHotCorner(payload) {
        this._logViolation('hot_corner', payload);
        return this._buildResponse({
            action: 'nudge',
            severity: 'LOW',
            rule_triggered: 'hot_corner',
            message_to_student: null,
            admin_alert: false,
            alert_type: 'logged_only',
            screenshot_required: false,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Hot Corner triggered — LOW severity, logged + violation score++',
            ...payload
        });
    }

    // ═══ GAZE / EYE TRACKING RULES ═══

    _applyGazeThresholds(baseDuration) {
        return baseDuration * this.config.gazeThresholdMultiplier;
    }

    _processGazeOffScreen(payload) {
        const { event, webcam, session } = payload;
        const zone = event.zone || 'Z4';
        const duration = event.duration_seconds || 0;
        const compilerRunning = event.compiler_running || false;

        // ─── FALSE-POSITIVE MITIGATIONS ───

        // Z7 (upward) < 5s → NEVER flag (thinking allowance)
        if (zone === 'Z7' && duration < 5) {
            return this._buildResponse({
                action: 'allow',
                severity: 'LOW',
                rule_triggered: 'gaze_thinking_allowance',
                message_to_student: null,
                admin_alert: false,
                alert_type: 'logged_only',
                screenshot_required: false,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'Z7 gaze (upward) < 5s — NEVER flag per thinking allowance policy',
                ...payload
            });
        }

        // Compiler running → suppress off-screen gaze flags
        if (compilerRunning) {
            return this._buildResponse({
                action: 'allow',
                severity: 'LOW',
                rule_triggered: 'gaze_compiler_suppression',
                message_to_student: null,
                admin_alert: false,
                alert_type: 'logged_only',
                screenshot_required: false,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'Compiler active — gaze flag suppressed per false-positive policy',
                ...payload
            });
        }

        // Glasses detected → increase thresholds by 40%
        if (webcam?.glasses_detected) {
            this.config.gazeThresholdMultiplier = 1.4;
        }

        // Low light → use head-pose-only mode
        if (webcam?.low_light) {
            return this._buildResponse({
                action: 'allow',
                severity: 'LOW',
                rule_triggered: 'gaze_low_light_mode',
                message_to_student: null,
                admin_alert: false,
                alert_type: 'logged_only',
                screenshot_required: false,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'Low light detected — iris tracking disabled, switched to head-pose-only mode',
                ...payload
            });
        }

        // Track gaze event for G-03 (rolling window)
        this.gazeEventLog.push({
            timestamp: event.timestamp || new Date().toISOString(),
            zone,
            duration
        });

        // Clean events older than 10 minutes
        const tenMinAgo = Date.now() - (10 * 60 * 1000);
        this.gazeEventLog = this.gazeEventLog.filter(
            e => new Date(e.timestamp).getTime() > tenMinAgo
        );

        // G-03: >8 off-screen events in any 10-min window
        const offScreenInWindow = this.gazeEventLog.filter(
            e => OFF_SCREEN_ZONES.includes(e.zone)
        ).length;

        if (offScreenInWindow > 8) {
            this._logViolation('gaze_frequency', payload);
            return this._buildResponse({
                action: 'flag',
                severity: 'HIGH',
                rule_triggered: 'G-03',
                message_to_student: 'Your gaze has been frequently off-screen. This has been flagged for admin review.',
                admin_alert: true,
                alert_type: 'dashboard',
                screenshot_required: true,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'G-03: >8 off-screen events in 10-min window — flag for admin review. All gaze events below CRITICAL → admin review required; NO automatic zero-mark',
                ...payload
            });
        }

        // G-01: Off-screen >5s → LOW nudge
        const threshold5s = this._applyGazeThresholds(5);
        const threshold15s = this._applyGazeThresholds(15);

        if (OFF_SCREEN_ZONES.includes(zone) && duration > threshold15s) {
            // G-02: Off-screen >15s → HIGH flag
            this._logViolation('gaze_extended', payload);
            return this._buildResponse({
                action: 'flag',
                severity: 'HIGH',
                rule_triggered: 'G-02',
                message_to_student: 'Your gaze has been off-screen for an extended period. A screenshot has been captured and an admin alert sent.',
                admin_alert: true,
                alert_type: 'instant_push',
                screenshot_required: true,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: `G-02: Off-screen gaze (${zone}) > ${threshold15s}s — flag + screenshot + admin alert. Admin review required; NO automatic zero-mark`,
                ...payload
            });
        }

        if (OFF_SCREEN_ZONES.includes(zone) && duration > threshold5s) {
            // G-01: Off-screen >5s → LOW nudge
            this._logViolation('gaze_nudge', payload);
            return this._buildResponse({
                action: 'nudge',
                severity: 'LOW',
                rule_triggered: 'G-01',
                message_to_student: 'Please keep your gaze on the screen. Looking away for extended periods will be flagged.',
                admin_alert: false,
                alert_type: 'logged_only',
                screenshot_required: false,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: `G-01: Off-screen gaze (${zone}) > ${threshold5s}s — nudge message + log`,
                ...payload
            });
        }

        return null;
    }

    _processEyesClosed(payload) {
        const { event } = payload;
        const duration = event.duration_seconds || 0;
        const threshold = this._applyGazeThresholds(5);

        if (duration > threshold) {
            // G-04: EAR below threshold >5s
            this._logViolation('eyes_closed', payload);
            return this._buildResponse({
                action: 'nudge',
                severity: 'MEDIUM',
                rule_triggered: 'G-04',
                message_to_student: 'Your eyes appear to be closed. Please ensure you are attentive during the exam.',
                admin_alert: false,
                alert_type: 'logged_only',
                screenshot_required: false,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: `G-04: EAR below threshold > ${threshold}s (eyes closed) — UI prompt + log`,
                ...payload
            });
        }
        return null;
    }

    _processHeadTurn(payload) {
        const { event } = payload;
        const yaw = Math.abs(event.yaw || 0);
        const duration = event.duration_seconds || 0;
        const threshold = this._applyGazeThresholds(8);

        if (yaw > 35 && duration > threshold) {
            // G-05: Head yaw >35° for >8s
            this._logViolation('head_turn', payload);
            return this._buildResponse({
                action: 'flag',
                severity: 'HIGH',
                rule_triggered: 'G-05',
                message_to_student: 'Your head has been turned away from the screen for too long. This has been flagged.',
                admin_alert: true,
                alert_type: 'dashboard',
                screenshot_required: true,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: `G-05: Head yaw > 35° for > ${threshold}s — flag + screenshot. Admin review required`,
                ...payload
            });
        }
        return null;
    }

    _processHeadPitch(payload) {
        const { event } = payload;
        const pitch = event.pitch || 0;
        const duration = event.duration_seconds || 0;
        const threshold = this._applyGazeThresholds(10);

        if (pitch < -25 && duration > threshold) {
            // G-06: Head pitch < -25° for >10s
            this._logViolation('head_pitch', payload);
            return this._buildResponse({
                action: 'flag',
                severity: 'HIGH',
                rule_triggered: 'G-06',
                message_to_student: 'You appear to be looking down for an extended period. This has been flagged as a potential integrity concern.',
                admin_alert: true,
                alert_type: 'dashboard',
                screenshot_required: true,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: `G-06: Head pitch < -25° for > ${threshold}s — flag + screenshot. Admin review required`,
                ...payload
            });
        }
        return null;
    }

    _processReadingSaccade(payload) {
        const { event } = payload;
        const now = Date.now();

        this.saccadeLog.push({ timestamp: now, zone: event.zone || 'Z6' });

        // Clean entries older than 5 minutes
        const fiveMinAgo = now - (5 * 60 * 1000);
        this.saccadeLog = this.saccadeLog.filter(e => e.timestamp > fiveMinAgo);

        const z6Saccades = this.saccadeLog.filter(e => e.zone === 'Z6').length;

        if (z6Saccades > 3) {
            // G-07: Reading saccade toward Z6 >3x in 5 min
            this._logViolation('reading_saccade', payload);
            return this._buildResponse({
                action: 'flag',
                severity: 'HIGH',
                rule_triggered: 'G-07',
                message_to_student: 'Repeated downward gaze patterns detected. This has been flagged for admin review.',
                admin_alert: true,
                alert_type: 'instant_push',
                screenshot_required: true,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'G-07: Reading saccade pattern toward Z6 > 3x in 5 min — flag + admin alert',
                ...payload
            });
        }
        return null;
    }

    _processCombinedHeadGaze(payload) {
        // G-08: Combined head turned + gaze off-screen → CRITICAL auto-freeze
        this._logViolation('combined_head_gaze', payload);
        return this._buildResponse({
            action: 'freeze',
            severity: 'CRITICAL',
            rule_triggered: 'G-08',
            message_to_student: 'CRITICAL: Combined head turn and off-screen gaze detected. Your exam has been frozen and a screenshot captured.',
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: true,
            freeze_duration_minutes: this.config.freezeDuration,
            auto_terminate: false,
            notes: 'G-08: Combined head turned + gaze off-screen — CRITICAL auto-freeze. Only G-08 may trigger auto-freeze among gaze rules',
            ...payload
        });
    }

    // ═══ OTHER VIOLATIONS ═══

    _processMultipleFaces(payload) {
        this._logViolation('multiple_faces', payload);
        return this._buildResponse({
            action: 'flag',
            severity: 'HIGH',
            rule_triggered: 'multiple_faces',
            message_to_student: 'Multiple faces detected in the camera frame. This is a serious violation. An alert has been sent to the proctor.',
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: true,
            freeze_duration_minutes: this.config.facePenaltyDuration,
            auto_terminate: false,
            notes: 'Multiple faces in frame — HIGH severity, flag + screenshot + instant push',
            ...payload
        });
    }

    _processFaceNotVisible(payload) {
        const { event } = payload;
        const duration = event.duration_seconds || 0;

        if (duration > 30) {
            this._logViolation('face_not_visible', payload);
            return this._buildResponse({
                action: 'freeze',
                severity: 'HIGH',
                rule_triggered: 'face_not_visible',
                message_to_student: 'Your face has not been visible for over 30 seconds. Your exam is frozen pending admin review.',
                admin_alert: true,
                alert_type: 'instant_push',
                screenshot_required: true,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'Face not visible > 30s — HIGH severity, exam frozen pending admin',
                ...payload
            });
        }
        return null;
    }

    _processIdentityMismatch(payload) {
        this._logViolation('identity_mismatch', payload);
        return this._buildResponse({
            action: 'flag',
            severity: 'CRITICAL',
            rule_triggered: 'identity_mismatch',
            message_to_student: 'Identity verification failed. This has been reported to the institutional authority.',
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: true,
            freeze_duration_minutes: 0,
            auto_terminate: false, // auto-terminate if admin-enabled
            notes: 'Identity mismatch — CRITICAL flag; auto-terminate if admin-enabled',
            ...payload
        });
    }

    _processPhoneDetected(payload) {
        this._logViolation('phone_detected', payload);
        return this._buildResponse({
            action: 'flag',
            severity: 'HIGH',
            rule_triggered: 'phone_detected',
            message_to_student: 'A phone or device has been detected in the camera frame. This is a serious violation. An alert has been sent.',
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: true,
            freeze_duration_minutes: this.config.freezeDuration,
            auto_terminate: false,
            notes: 'Phone/device in webcam frame — HIGH severity, flag + screenshot + instant push',
            ...payload
        });
    }

    _processVMDetected(payload) {
        this._logViolation('vm_detected', payload);
        return this._buildResponse({
            action: 'freeze',
            severity: 'CRITICAL',
            rule_triggered: 'vm_detected',
            message_to_student: 'Virtual machine or remote desktop environment detected. Your exam has been blocked.',
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: true,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'VM/remote desktop detected — CRITICAL severity, blocked/exam frozen',
            ...payload
        });
    }

    _processExtensionDetected(payload) {
        const { session } = payload;
        const isPreExam = !session?.status || session.status !== 'active';

        if (isPreExam) {
            this._logViolation('extension_pre_exam', payload);
            return this._buildResponse({
                action: 'block',
                severity: 'BLOCKER',
                rule_triggered: 'extension_pre_exam',
                message_to_student: 'Prohibited browser extension detected. You cannot start the exam until all prohibited extensions are removed.',
                admin_alert: true,
                alert_type: 'dashboard',
                screenshot_required: false,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'Extension detected (pre-exam) — BLOCKER, cannot start',
                ...payload
            });
        } else {
            this._logViolation('extension_mid_exam', payload);
            return this._buildResponse({
                action: 'flag',
                severity: 'HIGH',
                rule_triggered: 'extension_mid_exam',
                message_to_student: 'A prohibited browser extension has been detected during the exam. This has been reported.',
                admin_alert: true,
                alert_type: 'instant_push',
                screenshot_required: true,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'Extension detected (mid-exam) — HIGH flag + screenshot + instant push',
                ...payload
            });
        }
    }

    _processPasteAttempt(payload) {
        this._logViolation('paste_attempt', payload);
        return this._buildResponse({
            action: 'block',
            severity: 'MEDIUM',
            rule_triggered: 'paste_attempt',
            message_to_student: 'External paste operation blocked. Clipboard operations are disabled during this exam.',
            admin_alert: false,
            alert_type: 'logged_only',
            screenshot_required: false,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Paste attempt (external content) — MEDIUM, blocked + logged',
            ...payload
        });
    }

    _processScreenshotAttempt(payload) {
        this._logViolation('screenshot_attempt', payload);
        return this._buildResponse({
            action: 'block',
            severity: 'MEDIUM',
            rule_triggered: 'screenshot_attempt',
            message_to_student: 'Screenshot attempt blocked. Screen capture is disabled during this exam.',
            admin_alert: false,
            alert_type: 'logged_only',
            screenshot_required: false,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Screenshot attempt — MEDIUM, blocked + flag',
            ...payload
        });
    }

    _processBrowserAIShortcut(payload) {
        const count = this.getActiveViolationCount('browser_ai_shortcut') + 1;
        this._logViolation('browser_ai_shortcut', payload);

        if (count >= 3) {
            return this._buildResponse({
                action: 'flag',
                severity: 'HIGH',
                rule_triggered: 'browser_ai_shortcut_repeated',
                message_to_student: 'Multiple attempts to trigger browser AI assistants detected. This incident has been escalated.',
                admin_alert: true,
                alert_type: 'dashboard',
                screenshot_required: true,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: 'Browser AI shortcut intercepted 3x+ — HIGH flag + dashboard alert',
                ...payload
            });
        }

        return this._buildResponse({
            action: 'block',
            severity: 'MEDIUM',
            rule_triggered: 'browser_ai_shortcut',
            message_to_student: null, // Silently blocked + logged
            admin_alert: false,
            alert_type: 'logged_only',
            screenshot_required: false,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Browser AI shortcut intercepted — MEDIUM severity, silently blocked + logged',
            ...payload
        });
    }

    _processViewportShrink(payload) {
        this._logViolation('viewport_shrink', payload);
        return this._buildResponse({
            action: 'flag',
            severity: 'HIGH',
            rule_triggered: 'viewport_shrink',
            message_to_student: 'A sudden change in browser viewport detected. Please ensure no sidebars or overlays are open.',
            admin_alert: true,
            alert_type: 'dashboard',
            screenshot_required: true,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Viewport shrink >200px (potential AI sidebar) — HIGH flag + screenshot + dashboard',
            ...payload
        });
    }

    _processBrowserAIPanel(payload) {
        this._logViolation('browser_ai_panel', payload);
        return this._buildResponse({
            action: 'freeze',
            severity: 'CRITICAL',
            rule_triggered: 'browser_ai_panel',
            message_to_student: 'SECURITY ALERT: Browser native AI panel detected. Your exam has been frozen immediately.',
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: true,
            freeze_duration_minutes: 0, // indefinite
            auto_terminate: false,
            notes: 'Browser AI panel detected by Desktop Agent — CRITICAL freeze + instant push',
            ...payload
        });
    }

    _processScreenCaptureRevoked(payload) {
        this._logViolation('screen_capture_revoked', payload);
        return this._buildResponse({
            action: 'freeze',
            severity: 'CRITICAL',
            rule_triggered: 'screen_capture_revoked',
            message_to_student: 'CRITICAL: Screen capture permission has been revoked. Your exam has been frozen.',
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: false,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Screen capture permission revoked mid-exam — CRITICAL freeze + instant push',
            ...payload
        });
    }

    _processAudioSecondVoice(payload) {
        this._logViolation('audio_second_voice', payload);
        return this._buildResponse({
            action: 'flag',
            severity: 'MEDIUM',
            rule_triggered: 'audio_second_voice',
            message_to_student: 'Audio anomaly detected. A recording has been saved for review.',
            admin_alert: true,
            alert_type: 'dashboard',
            screenshot_required: false,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Audio conversation pattern detected — MEDIUM flag + 10s audio clip saved',
            ...payload
        });
    }

    _processUnknownPerson(payload) {
        const { webcam } = payload;
        if (webcam?.isFaculty) {
            return this._buildResponse({
                action: 'allow',
                severity: 'LOW',
                rule_triggered: 'faculty_in_frame',
                message_to_student: null,
                admin_alert: false,
                alert_type: 'logged_only',
                screenshot_required: false,
                freeze_duration_minutes: 0,
                auto_terminate: false,
                notes: `Faculty [${webcam.employeeName || 'Known'}] appeared in frame — NO PENALTY per v2.1 policy`,
                ...payload
            });
        }

        this._logViolation('unknown_person_in_frame', payload);
        return this._buildResponse({
            action: 'flag',
            severity: 'HIGH',
            rule_triggered: 'unknown_person_in_frame',
            message_to_student: 'An unidentified person has been detected in the camera frame.',
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: true,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Unknown person in frame — HIGH flag + screenshot + instant push',
            ...payload
        });
    }

    _processSecondStudent(payload) {
        this._logViolation('second_student_in_frame', payload);
        return this._buildResponse({
            action: 'freeze',
            severity: 'CRITICAL',
            rule_triggered: 'second_student_in_frame',
            message_to_student: 'CRITICAL: Another student has been detected in your frame. Your exam is frozen.',
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: true,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Second student detected in frame — CRITICAL freeze + instant push',
            ...payload
        });
    }

    _processLivenessCheckFailed(payload) {
        this._logViolation('liveness_check_failed', payload);
        return this._buildResponse({
            action: 'block',
            severity: 'BLOCKER',
            rule_triggered: 'liveness_check_failed',
            message_to_student: 'Face liveness verification failed. Please ensure you are not using a photo or video bypass.',
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: true,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Liveness check failed (all attempts) — BLOCKER, cannot start exam',
            ...payload
        });
    }

    _processScopeViolation(payload) {
        this._logViolation('scope_violation', payload);
        return this._buildResponse({
            action: 'block',
            severity: 'CRITICAL',
            rule_triggered: 'scope_violation',
            message_to_student: null, // Return 404, do NOT reveal assessment exists
            admin_alert: true,
            alert_type: 'instant_push',
            screenshot_required: false,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: 'Assessment accessed outside class scope — CRITICAL, API returns 404 + IP logged + instant push',
            ...payload
        });
    }

    _processCalibrationFailed(payload) {
        this._logViolation('calibration_failed', payload);
        return this._buildResponse({
            action: 'allow',
            severity: 'LOW',
            rule_triggered: 'calibration_failed',
            message_to_student: 'Calibration did not achieve the optimal score. Your exam will proceed but gaze data will require manual review.',
            admin_alert: false,
            alert_type: 'logged_only',
            screenshot_required: false,
            freeze_duration_minutes: 0,
            auto_terminate: false,
            notes: "Calibration failed — LOW, flag 'manual review required'; exam proceeds",
            ...payload
        });
    }

    // ═══ CLASS SCOPE ENFORCEMENT ═══

    static checkAccessScope(student, assessment, gracePeriodMinutes = 5) {
        const now = new Date();
        const start = new Date(assessment.start_time);
        const end = new Date(assessment.end_time);
        const graceEnd = new Date(end.getTime() + gracePeriodMinutes * 60000);

        const results = {
            granted: true,
            reason: null,
            log_entry: {
                student_id: student.id,
                assessment_id: assessment.id,
                class_id: student.section_id,
                ip: student.ip || 'unknown',
                timestamp: now.toISOString()
            }
        };

        // Check section membership
        if (!assessment.target_class_ids?.includes(student.section_id)) {
            results.granted = false;
            results.reason = 'section_mismatch';
            results.severity = 'CRITICAL';
            return results;
        }

        // Check time window
        if (now < start) {
            results.granted = false;
            results.reason = 'too_early';
            return results;
        }

        if (now > graceEnd) {
            results.granted = false;
            results.reason = 'too_late';
            return results;
        }

        // Check student status
        if (student.status !== 'active') {
            results.granted = false;
            results.reason = 'student_inactive';
            return results;
        }

        return results;
    }

    // ═══ PRE-EXAM ENVIRONMENT HARDENING (macOS) ═══

    static checkPreExamEnvironment(checks) {
        const required = [
            { key: 'agent_installed', label: 'Desktop Agent installed and running (heartbeat confirmed)' },
            { key: 'accessibility_permission', label: 'Accessibility permission granted' },
            { key: 'spaces_cleared', label: 'Multiple Spaces cleared' },
            { key: 'stage_manager_disabled', label: 'Stage Manager disabled' },
            { key: 'hot_corners_disabled', label: 'Hot Corners disabled' },
            { key: 'calibration_passed', label: 'Calibration completed with score ≥ 70%' },
            { key: 'no_extensions', label: 'No prohibited extensions detected' },
            { key: 'no_vm', label: 'No VM/remote desktop environment detected' },
            { key: 'face_visible', label: 'Student face visible + single face in frame' },
            { key: 'fullscreen_confirmed', label: 'Fullscreen confirmed' },
        ];

        const results = [];
        let canStart = true;

        for (const req of required) {
            const passed = checks[req.key] === true;
            results.push({
                ...req,
                passed,
                remediation: passed ? null : `Please ensure: ${req.label}`
            });
            if (!passed) canStart = false;
        }

        // Special BLOCKER for accessibility permission
        const accessibilityCheck = results.find(r => r.key === 'accessibility_permission');
        if (accessibilityCheck && !accessibilityCheck.passed) {
            accessibilityCheck.severity = 'BLOCKER';
            accessibilityCheck.remediation = 'Accessibility permission is required. Go to System Settings → Privacy & Security → Accessibility and grant permission to Guardex.';
        }

        return { canStart, checks: results };
    }

    // ═══ INTERNAL HELPERS ═══

    _logViolation(type, payload) {
        const entry = {
            id: `VIO_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type,
            timestamp: payload?.event?.timestamp || new Date().toISOString(),
            student_id: payload?.session?.student_id,
            assessment_id: payload?.session?.assessment_id,
            confidence: payload?.event?.confidence || 0,
        };
        this.violationLog.push(entry);
        return entry;
    }

    _buildResponse({
        action, severity, rule_triggered, message_to_student,
        admin_alert, alert_type, screenshot_required,
        freeze_duration_minutes, auto_terminate, notes,
        session, event, ...rest
    }) {
        const calibrationNote = session?.calibration_status === 'incomplete'
            ? ' | Gaze confidence reduced — manual review recommended'
            : '';

        const glassesNote = rest?.webcam?.glasses_detected
            ? ' | Gaze thresholds increased 40% for this student'
            : '';

        const lowLightNote = rest?.webcam?.low_light
            ? ' | Switched to head-pose-only mode; iris tracking disabled'
            : '';

        return {
            action,
            severity,
            rule_triggered,
            message_to_student,
            admin_alert,
            alert_type,
            screenshot_required,
            freeze_duration_minutes,
            auto_terminate,
            log_entry: {
                student_id: session?.student_id || '',
                assessment_id: session?.assessment_id || '',
                violation_type: rule_triggered,
                timestamp: event?.timestamp || new Date().toISOString(),
                confidence: event?.confidence || 0,
            },
            notes: notes + calibrationNote + glassesNote + lowLightNote,
        };
    }
}

// ─── SINGLETON INSTANCE ───
let engineInstance = null;

export function getGuardexEngine(config) {
    if (!engineInstance) {
        engineInstance = new GuardexEngine(config);
    }
    return engineInstance;
}

export function resetGuardexEngine() {
    engineInstance = null;
}

export default GuardexEngine;
