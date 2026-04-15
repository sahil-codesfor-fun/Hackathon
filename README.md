# GUARDEX — AI-Powered Exam Proctoring System 🛡️

**A Production-Grade Campus Solution for Secure Programming Assessments**

GUARDEX is a comprehensive, AI-driven online exam proctoring platform designed to ensure academic integrity in coding examinations. It combines a secure programming environment with real-time AI-powered monitoring, automated penalty enforcement, and a robust administrative command center.

---

## 🚀 Deployment Instructions

### 1. Prerequisites
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher
- **Browser**: Google Chrome / Microsoft Edge (for Fullscreen API support)

### 2. Installation
Navigate to the project directory and install dependencies:
```bash
cd guardex
npm install
```

### 3. Execution
Launch the production-grade development server:
```bash
npm run dev
```
The application will be available at: **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Access Credentials (DEMO)

| Role | Email | Password | Clearance Level |
|------|-------|----------|-----------------|
| **Student** | `student@guardex.edu` | `student123` | L1: Exam Portal |
| **Admin** | `admin@guardex.edu` | `admin123` | L2: Command Center |

---

## 🛡️ Core Features (PRD Compliant)

### 1. AI Proctoring Intelligence
- **Gaze Tracking**: Monitors student attention and flags off-screen focus.
- **Biometric Re-verification**: Randomly verifies student identity during the session.
- **Audio Anomaly Detection**: Tracks microphone spikes and flags suspicious noise.
- **Detection**: Real-time tracking of multiple faces or unauthorized objects.

### 2. Security & Integrity Enclave
- **Tab Switch Lockdown**: Automated penalty escalation (3 switches = 10m freeze, 5 = zero mark).
- **Fullscreen Enforcement**: Non-dismissible requirement for exam participation.
- **Clipboard Blockade**: Hardware-level interception of Copy, Paste, and PrintScreen.
- **Keyboard Restriction**: Blocks DevTools (F12) and prohibited shortcuts (Ctrl+A, Ctrl+S).

### 3. Dynamic Watermarking
- **Visible Deterrent**: Dynamic canvas-based watermark on every question showing Student Name, Roll No, and Timestamp to prevent leaks and screen recording.

### 4. Administrative Command Center
- **Live Node Monitoring**: Real-time grid view of all active student sessions.
- **Anomaly Vault**: Searchable historical log of all detected violations.
- **Penalty Core**: Real-time adjustment of proctoring thresholds (freeze duration, switch limits).

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **State Engine**: Zustand (PRD-compliant persistence)
- **Styling**: Industrial Cyber-Core DS1 (Custom CSS System)
- **Icons**: Lucide React
- **Security Logic**: Deep-level Browser API Interception

---

## 📋 Role-Based Workflows

### Student Workflow
1. **Clearance**: Identity verification through the 7-step Permission Wizard.
2. **Onboarding**: System audit for VMs and prohibited browser extensions.
3. **Execution**: Coding within the secure IDE with real-time AI feedback.

### Admin Workflow
1. **Intelligence**: High-level overview of campus integrity metrics.
2. **Operations**: Real-time monitoring and node management (Freeze/Resume).
3. **Analytics**: Post-exam violation review and reporting.

---
*Built for GUARDEX — Secure Campus Solutions v2.1.0*
