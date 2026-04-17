# GUARDEX — AI-Driven Proctoring & Exam Integrity Platform 🛡️

**A Production-Grade Institutional Solution for Secure Digital Assessments**

GUARDEX is a comprehensive, state-of-the-art proctoring platform designed for modern academic environments. It combines high-fidelity AI monitoring with a secure programming workspace and a centralized administrative command center to ensure 100% integrity in high-stakes examinations.

---

## 🚀 Key Functional Modules

### 1. Dual-Core AI Proctoring Engine
*   **Presence Verification**: Uses TensorFlow.js and COCO-SSD models to ensure only the authorized candidate is in front of the camera.
*   **Multi-Person Detection**: Instantly flags and penalizes sessions if an unauthorized person is detected in the frame.
*   **Object Identification**: Real-time detection of mobile phones, books, and other prohibited physical notes.
*   **Gaze & Attention Tracking**: Monitors ocular focus and flags suspicious gaze-away patterns (e.g., looking at external devices).
*   **Acoustic Security**: Monitors background noise levels and verbal communication spikes via real-time microphone telemetry.

### 2. Faculty-Driven Configuration
*   **Per-Exam strictness**: Subject Faculty can toggle "AI Proctoring Penalties" on or off for specific assessments.
*   **Configurable Thresholds**: Global settings allow administrators to adjust tab-switch limits, cooling-off durations, and mark-deduction penalties.
*   **Subject IDs**: Assessments are categorized by Faculty ID and Course, ensuring departmental alignment.

### 3. Automated Integrity Escalation (The HOD Bridge)
*   **Critical Incident Reporting**: High-severity breaches (phone detection, multiple faces) automatically generate a transmitted report.
*   **Multi-Node Notification**: Reports are "sent" to the **Head of Department (HOD)** and the **Subject Faculty** in real-time.
*   **Unique Identity Enslavement**: Every incident is indexed by a unique Student ID and Roll Number, allowing for simultaneous proctoring of full batches (100+ students) with zero identity collision.

### 4. Secure Programming Workspace (IDE)
*   **Multi-Language Support**: Integrated compiler for Python, C, C++, Java, JS, and 10+ other languages.
*   **Hardened Input/Output**: Standard Input (stdin) support with sandboxed execution.
*   **Plagiarism Prevention**: 
    *   **Clipboard Lockdown**: Complete blocking of Copy, Paste, and Cut operations.
    *   **Drag-and-Drop Blocking**: Prevents external code injection.
    *   **Right-Click Disabled**: Blocks inspect element and developer tool access.

### 5. Browser Lockdown Architecture
*   **Fullscreen Mandatory**: Exams cannot be taken without active fullscreen focus.
*   **Tab Switch Jail**: Monitoring of tab switches and window blur events with automated cooldown penalties.
*   **DevTools Defence**: Sophisticated detection of open developer tools or console inspection windows.
*   **MacOS/OS Overlay Defence**: Detection of inferred floating overlays used for external communication.

### 6. Administrative Command Center (Trainer_Core)
*   **Live Node Monitoring**: Real-time grid showing the proctoring status of every active student.
*   **Escalation Vault**: A dedicated high-priority feed of all reports sent to HOD/Faculty with evidence links.
*   **Batch Analytics**: High-level overview of class performance and integrity metrics.
*   **Emergency Freeze**: Global lockdown capability to pause all sessions in the event of a platform-wide breach.

### 7. AI Student Support Assistant (Chatbase Integrated)
*   **Context-Aware Help**: A 24/7 AI chatbot trained specifically on the Guardex Institutional Knowledge Base.
*   **Instant Rule Queries**: Students can ask about penalty durations, IDE support, or what to do in case of network failure WITHOUT leaving the exam environment.
*   **Proactive Integrity Coaching**: The AI provides guidance on maintaining focus and avoiding accidental breaches.
*   **Seamless Integration**: Custom Cyber-Academic UI that fits perfectly into the proctoring dashboard.

---

## ⚒️ Technical Infrastructure

*   **Frontend**: Next.js 16 (App Router)
*   **State Management**: Zustand with persistent local-storage integration.
*   **Computer Vision**: TensorFlow.js (COCO-SSD & MobileNet V2).
*   **Design System**: Cyber-Academic DS (Vanilla CSS & Framer Motion).
*   **Reporting**: Automated transmission simulation logic for Faculty/HOD synchronization.

---

## 🛠️ Getting Started

### 1. Installation
```bash
git clone https://github.com/sahil-codesfor-fun/Hackathon.git
cd Hackathon
npm install
```

### 2. Launch
```bash
npm run dev
```

### 3. Demo Access
*   **Student Portal**: Accessible via `student@guardex.edu`
*   **Admin Console**: Accessible via `admin@guardex.edu`

---

## 🔒 Security Compliance
GUARDEX implements non-selectable text and dynamic watermarking (Name/RollNo) on all examination content to prevent data scraping, screen recording, and unauthorized content distribution.

---
*Built for Guardex Innovation Labs — Secure Campus Solutions v3.0.0*
