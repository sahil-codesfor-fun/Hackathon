/**
 * GUARDEX Browser AI Brawler v2.1
 * Part of Enhancement Prompt v2.1
 * Detects and blocks native browser AI features (Copilot, Leo, Gemini, Arc AI)
 */

export const BLOCKED_SHORTCUTS = [
    { key: '.', ctrl: true, shift: true, name: 'Edge Copilot (Windows)' },
    { key: '.', meta: true, shift: true, name: 'Edge Copilot (Mac)' },
    { key: 'L', ctrl: true, shift: true, name: 'Brave Leo (Windows)' },
    { key: 'L', meta: true, shift: true, name: 'Brave Leo (Mac)' },
    { key: 'f', meta: true, name: 'Arc AI Hijack' },
    { key: '/', ctrl: true, name: 'Chrome Gemini Panel' },
];

export class AIBrawler {
    constructor(options = {}) {
        this.onViolation = options.onViolation || (() => { });
        this.lastInnerWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
        this.isMonitoring = false;
    }

    start() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        // Layer 1: Keyboard Shortcut Interception
        window.addEventListener('keydown', this.handleKeyDown, true);

        // Layer 2: Viewport Width / Layout Shift Detection
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.handleResize());
            this.resizeObserver.observe(document.documentElement);
        }

        window.addEventListener('resize', () => this.handleWindowResize());
    }

    stop() {
        this.isMonitoring = false;
        window.removeEventListener('keydown', this.handleKeyDown, true);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        window.removeEventListener('resize', this.handleWindowResize);
    }

    handleKeyDown = (e) => {
        const blocked = BLOCKED_SHORTCUTS.find(s =>
            e.key.toLowerCase() === s.key.toLowerCase() &&
            (s.ctrl ? e.ctrlKey : true) &&
            (s.meta ? e.metaKey : true) &&
            (s.shift ? e.shiftKey : true)
        );

        if (blocked) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.onViolation('browser_ai_shortcut', { key: blocked.name });
        }
    }

    handleResize() {
        const currentWidth = window.innerWidth;
        const delta = this.lastInnerWidth - currentWidth;

        if (delta > 200) {
            // Viewport shrank by more than 200px — sidebar likely opened
            this.onViolation('viewport_shrink', { delta });
        }
        this.lastInnerWidth = currentWidth;
    }

    handleWindowResize() {
        // Secondary check: compare screen.width vs window.innerWidth gap
        // Use screen.availWidth for more accurate sidebar detection
        const sidebarWidth = screen.availWidth - window.innerWidth;
        if (sidebarWidth > 250 && document.fullscreenElement) {
            this.onViolation('viewport_shrink', { sidebarWidth, type: 'sidebar_gap' });
        }
    }

    static detectBrowser() {
        const ua = navigator.userAgent;
        const brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];

        const profile = {
            isEdge: brands.some(b => b.brand === 'Microsoft Edge') || /Edg\//.test(ua),
            isChrome: (brands.some(b => b.brand === 'Google Chrome') || /Chrome\//.test(ua)) && !/Edg\//.test(ua) && !/Brave\//.test(ua),
            isBrave: navigator.brave !== undefined || /Brave\//.test(ua),
            isArc: /Arc\//.test(ua),
            isOpera: /OPR\//.test(ua),
            isVivaldi: /Vivaldi\//.test(ua),
            isSafari: /Safari\//.test(ua) && !/Chrome/.test(ua),
        };

        // Arc check is critical in v2.1
        if (profile.isArc) {
            return {
                blocked: true,
                reason: 'Arc browser has an unblockable built-in AI assistant. Please use Chrome or Firefox for this exam.',
                recommendation: 'chrome',
                profile
            };
        }

        return { blocked: false, profile };
    }
}
