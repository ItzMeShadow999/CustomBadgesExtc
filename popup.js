(function () {
    'use strict';
    const API_BASE = "https://custom-badges.shadow-164.workers.dev";

    async function getDiscordTab() {
        const tabs = await chrome.tabs.query({ url: ["https://discord.com/*", "https://*.discord.com/*"] });
        if (!tabs.length) return null;
        return tabs.find(t => t.active) || tabs[0];
    }
    async function sendToContentScript(action, payload) {
        const tab = await getDiscordTab();
        if (!tab) return null;
        try {
            return await chrome.tabs.sendMessage(tab.id, Object.assign({ action }, payload));
        } catch (e) {
            log('Could not reach content script:', e.message);
            return null;
        }
    }
    function log(...a) { console.log('[CustomBadges]', ...a); }
    function headerBarHtml() {
        return `
            <section style="background:#000;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;display:flex;align-items:center;height:48px;padding:0 16px;font-family:'gg sans','Noto Sans','Helvetica Neue',Helvetica,Arial,sans-serif;">
                <svg aria-hidden="true" width="20" height="20" fill="none" viewBox="0 0 24 24" style="color:#949BA4;flex-shrink:0;margin-right:12px;">
                    <path fill="currentColor" d="M4 13h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1zm1-8h4v6H5V5zm9 16h6a1 1 0 001-1v-8a1 1 0 00-1-1h-6a1 1 0 00-1 1v8a1 1 0 001 1zm1-8h4v6h-4v-6zM4 21h6a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1v4a1 1 0 001 1zm1-4h4v2H5v-2zm9-8h6a1 1 0 001-1V4a1 1 0 00-1-1h-6a1 1 0 00-1 1v4a1 1 0 001 1zm1-4h4v2h-4V5z"/>
                </svg>
                <div id="ub-tabs-container" role="tablist" style="display:flex;align-items:stretch;height:100%;">
                    <div class="ub-dash-tab" id="ub-tab-badges" role="tab" tabindex="0" aria-selected="true" data-tab="badges"
                         style="display:flex;align-items:center;padding:0 16px;cursor:pointer;border-bottom:2px solid #5865F2;color:#fff;font-size:15px;font-weight:600;">
                        Custom Badges
                    </div>
                    <div class="ub-dash-tab" id="ub-tab-style" role="tab" tabindex="0" aria-selected="false" data-tab="style"
                         style="display:flex;align-items:center;padding:0 16px;cursor:pointer;border-bottom:2px solid transparent;color:#949BA4;font-size:15px;font-weight:500;">
                        Style Studio
                    </div>
                </div>
                <div id="ub-dash-close" role="button" aria-label="Close Dashboard" tabindex="0"
                     style="margin-left:auto;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:4px;cursor:pointer;color:#949BA4;flex-shrink:0;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
                </div>
            </section>
        `;
    }
    function dashboardHtml(presetLabels = []) {
        const icon = {
            toggle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="15.5" cy="12" r="2.75" fill="currentColor" stroke="none"/></svg>`,
            pencil: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 19.5l1-4L16 5l3 3-10.5 10.5-4 1z"/><path d="M14 6.5l3 3"/></svg>`,
            eye: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2.5-4.2 6.2-6.5 10-6.5s7.5 2.3 10 6.5c-2.5 4.2-6.2 6.5-10 6.5S4.5 16.2 2 12z"/><circle cx="12" cy="12" r="2.75"/></svg>`,
            bolt: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6 8 12 2 18"/><polyline points="9 6 15 12 9 18"/><polyline points="16 6 22 12 16 18"/></svg>`,
            grid: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
            box: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L20 6.5V15.5L12 20L4 15.5V6.5L12 2Z"/><path d="M12 2V11M12 11L20 6.5M12 11L4 6.5"/><path d="M14.5 5L14.5 9L17.5 7.5L17.5 3.7Z"/><path d="M6 13.2l3.4 1.7M6 15l2.6 1.3"/></svg>`,
            check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
            trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,
            plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
            shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><polyline points="9 12 11 14 15 10"/></svg>`,
            clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>`
        };
        return `
            <style>
            
                #ub-dashboard-settings {
                    --ub-bg: #000000;
                    --ub-bg-card: #050505;
                    --ub-bg-card-hover: #0a0a0a;
                    --ub-bg-input: #0a0a0a;
                    --ub-bg-input-hover: #0f0f0f;
                    --ub-border: rgba(255, 255, 255, 0.06);
                    --ub-border-strong: rgba(255, 255, 255, 0.10);
                    --ub-text: #F2F3F5;
                    --ub-text-secondary: #DBDEE1;
                    --ub-text-muted: #B5BAC1;
                    --ub-text-faint: #949BA4;
                    --ub-accent: #5865F2;
                    --ub-accent-2: #7289DA;
                    --ub-accent-hover: #4752C4;
                    --ub-accent-soft: rgba(88, 101, 242, 0.15);
                    --ub-danger: #DA373C;
                    --ub-positive: #23A55A;
                    --ub-warning: #F0B232;
                    --ub-radius-lg: 12px;
                    --ub-radius: 8px;
                    --ub-radius-sm: 6px;
                    --ub-font: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
                    background-color: var(--ub-bg);
                    color: var(--ub-text);
                    font-family: var(--ub-font);
                    font-size: 16px;
                    line-height: 1.5;
                    -webkit-font-smoothing: antialiased;
                }
                #ub-dashboard-settings * {
                    font-family: var(--ub-font);
                    box-sizing: border-box;
                }
                #ub-dashboard-settings .ub-section {
                    background: var(--ub-bg-card);
                    border: 1px solid var(--ub-border);
                    border-radius: var(--ub-radius-lg);
                    padding: 20px;
                    margin-bottom: 16px;
                    transition: border-color 150ms ease, background-color 150ms ease;
                }
                #ub-dashboard-settings .ub-section:hover {
                    border-color: var(--ub-border-strong);
                }
                #ub-dashboard-settings .ub-section-head {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                    padding-left: 10px;
                    border-left: 2px solid var(--ub-accent-2);
                }
                #ub-dashboard-settings .ub-section-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    color: var(--ub-accent-2);
                    flex-shrink: 0;
                    opacity: 0.9;
                }
                #ub-dashboard-settings .ub-eyebrow {
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.03em;
                    text-transform: uppercase;
                    color: var(--ub-text-muted);
                }
                #ub-dashboard-settings .ub-section-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--ub-text);
                    margin: 0;
                }
                #ub-dashboard-settings .ub-field {
                    margin-bottom: 16px;
                }
                #ub-dashboard-settings .ub-field:last-child {
                    margin-bottom: 0;
                }
                #ub-dashboard-settings .ub-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    text-transform: uppercase;
                    color: var(--ub-text-muted);
                    margin-bottom: 8px;
                }
                #ub-dashboard-settings .ub-hint {
                    font-size: 14px;
                    line-height: 1.5;
                    color: var(--ub-text-faint);
                    margin: 0 0 14px;
                }
                #ub-dashboard-settings .ub-write-budget-card {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                #ub-dashboard-settings .ub-write-budget-toprow {
                    display: flex;
                    align-items: baseline;
                    justify-content: space-between;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                #ub-dashboard-settings .ub-write-budget-count {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--ub-text-secondary);
                }
                #ub-dashboard-settings .ub-write-budget-reset {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--ub-text-faint);
                }
                #ub-dashboard-settings .ub-write-budget-bar {
                    height: 6px;
                    border-radius: 999px;
                    background: var(--ub-bg-input, rgba(255,255,255,0.06));
                    overflow: hidden;
                }
                #ub-dashboard-settings .ub-write-budget-bar-fill {
                    height: 100%;
                    border-radius: 999px;
                    background: var(--ub-positive);
                    width: 100%;
                    transition: width 200ms ease, background-color 200ms ease;
                }
                #ub-dashboard-settings .ub-write-budget-card.ub-write-budget-exhausted .ub-write-budget-count {
                    color: var(--ub-warning);
                }
                #ub-dashboard-settings .ub-write-budget-card.ub-write-budget-exhausted .ub-write-budget-reset {
                    color: var(--ub-warning);
                }
                #ub-dashboard-settings .ub-write-budget-card.ub-write-budget-exhausted .ub-write-budget-bar-fill {
                    background: var(--ub-warning);
                }
                #ub-dashboard-settings .ub-input,
                #ub-dashboard-settings .ub-select {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.04);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.10);
                    border-top-color: rgba(255, 255, 255, 0.16);
                    border-radius: var(--ub-radius-sm);
                    padding: 10px 12px;
                    min-height: 40px;
                    color: var(--ub-text);
                    font-size: 14px;
                    font-weight: 400;
                    box-shadow:
                        inset 0 1px 0 rgba(255, 255, 255, 0.07),
                        0 2px 8px rgba(0, 0, 0, 0.35);
                    transition: border-color 150ms ease, background 150ms ease, box-shadow 150ms ease;
                }
                #ub-dashboard-settings .ub-input::placeholder {
                    color: var(--ub-text-faint);
                }
                #ub-dashboard-settings .ub-input:hover,
                #ub-dashboard-settings .ub-select:hover {
                    background: rgba(255, 255, 255, 0.07);
                    border-color: rgba(255, 255, 255, 0.18);
                    border-top-color: rgba(255, 255, 255, 0.24);
                    box-shadow:
                        inset 0 1px 0 rgba(255, 255, 255, 0.10),
                        0 2px 12px rgba(0, 0, 0, 0.4);
                }
                #ub-dashboard-settings .ub-input:focus-visible,
                #ub-dashboard-settings .ub-select:focus-visible {
                    outline: none;
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(88, 101, 242, 0.6);
                    border-top-color: rgba(88, 101, 242, 0.8);
                    box-shadow:
                        inset 0 1px 0 rgba(255, 255, 255, 0.08),
                        0 0 0 3px rgba(88, 101, 242, 0.18),
                        0 2px 12px rgba(0, 0, 0, 0.4);
                }
                #ub-dashboard-settings .ub-select {
                    cursor: pointer;
                    appearance: none;
                    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23949ba4' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    padding-right: 36px;
                }
                #ub-dashboard-settings .ub-btn {
                    appearance: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    border: none;
                    border-radius: var(--ub-radius-sm);
                    padding: 0 16px;
                    min-height: 38px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    color: var(--ub-text-secondary);
                    background: #101010;
                    border: 1px solid var(--ub-border-strong);
                    transition: background-color 120ms ease, border-color 120ms ease, transform 80ms ease, color 120ms ease;
                }
                #ub-dashboard-settings .ub-btn:hover {
                    background: #161616;
                    border-color: rgba(255, 255, 255, 0.2);
                    color: var(--ub-text);
                }
                #ub-dashboard-settings .ub-btn:active {
                    transform: scale(0.97);
                }
                #ub-dashboard-settings .ub-btn:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 3px var(--ub-accent-soft);
                    border-color: var(--ub-accent);
                }
                #ub-dashboard-settings .ub-btn-primary {
                    background: var(--ub-accent);
                    border-color: var(--ub-accent);
                    color: #ffffff;
                }
                #ub-dashboard-settings .ub-btn-primary:hover {
                    background: var(--ub-accent-hover);
                    border-color: var(--ub-accent-hover);
                    color: #ffffff;
                }
                #ub-dashboard-settings .ub-btn-danger {
                    background: transparent;
                    border-color: var(--ub-border-strong);
                    color: var(--ub-danger);
                }
                #ub-dashboard-settings .ub-btn-danger:hover {
                    background: rgba(218, 55, 60, 0.12);
                    border-color: var(--ub-danger);
                    color: #ff5c60;
                }
                #ub-dashboard-settings .ub-btn-danger-solid {
                    background: var(--ub-danger);
                    border-color: var(--ub-danger);
                    color: #ffffff;
                }
                #ub-dashboard-settings .ub-btn-danger-solid:hover {
                    background: #c42f33;
                    border-color: #c42f33;
                    color: #ffffff;
                }
                #ub-dashboard-settings .ub-btn-danger-solid:disabled {
                    opacity: 0.5;
                    cursor: default;
                }
                #ub-dashboard-settings .ub-btn-row {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                #ub-dashboard-settings .ub-btn-link {
                    appearance: none;
                    background: none;
                    border: none;
                    padding: 0 4px;
                    min-height: 38px;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--ub-accent-2);
                    cursor: pointer;
                    transition: color 120ms ease;
                }
                #ub-dashboard-settings .ub-btn-link:hover {
                    color: var(--ub-accent);
                    text-decoration: underline;
                }
                #ub-dashboard-settings .ub-btn-link:focus-visible {
                    outline: none;
                    text-decoration: underline;
                }
            
                #ub-dashboard-settings .ub-token-wrap {
                    position: relative;
                }
                #ub-dashboard-settings .ub-token-wrap input#ub-session-token::selection {
                    color: transparent;
                    background: var(--ub-accent-soft);
                }
                #ub-dashboard-settings .ub-token-wrap input#ub-session-token {
                    color: transparent;
                    caret-color: var(--ub-text);
                
                    height: 40px;
                    padding-top: 0;
                    padding-bottom: 0;
                
                    font-family: var(--font-code, Consolas, "Courier New", monospace);
                    font-size: 14px;
                    letter-spacing: 0;
                }
                #ub-dashboard-settings .ub-token-wrap input#ub-session-token.ub-token-empty {
                    color: var(--ub-text-faint);
                }
                #ub-dashboard-settings .ub-token-overlay {
                    position: absolute;
                    inset: 0;
                    height: 40px;
                
                    border: 1px solid transparent;
                    padding: 0 12px;
                    pointer-events: none;
                    overflow: hidden;
                    font-family: var(--font-code, Consolas, "Courier New", monospace);
                    font-size: 14px;
                    line-height: 1;
                    letter-spacing: 0;
                }
                #ub-dashboard-settings .ub-token-overlay-inner {
                    display: block;
                    height: 40px;
                    line-height: 40px;
                    white-space: nowrap;
                    overflow-wrap: normal;
                    word-break: keep-all;
                    word-wrap: normal;
                
                }
                #ub-dashboard-settings .ub-token-overlay,
                #ub-dashboard-settings .ub-token-overlay * {
                    font-family: var(--font-code, Consolas, "Courier New", monospace);
                }
                #ub-dashboard-settings .ub-token-char {
                    position: relative;
                    display: inline-block;
                    vertical-align: middle;
                    white-space: nowrap;
                    overflow-wrap: normal;
                    word-break: keep-all;
                    word-wrap: normal;
                
                    width: 1ch;
                    height: 1em;
                    line-height: 1;
                    text-align: center;
                }
                #ub-dashboard-settings .ub-token-glyph {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 240ms ease, transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                #ub-dashboard-settings .ub-token-glyph-letter {
                    transform: translateY(-8px) scale(0.3) rotate(-20deg);
                }
                #ub-dashboard-settings .ub-token-glyph-dot {
                    transform: translateY(8px) scale(0.3) rotate(20deg);
                }
                #ub-dashboard-settings .ub-token-glyph.ub-token-shown {
                    opacity: 1;
                    transform: translateY(0) scale(1) rotate(0deg);
                }
            
                #ub-guidelines-backdrop {
                    display: none;
                    position: fixed;
                    inset: 0;
                    z-index: 9998;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(3px);
                    -webkit-backdrop-filter: blur(3px);
                    opacity: 0;
                    transition: opacity 260ms ease;
                    pointer-events: none;
                }
                #ub-guidelines-backdrop.ub-backdrop-open {
                    display: block;
                    opacity: 1;
                    pointer-events: auto;
                }
            
            
                .ub-guidelines-panel {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0.94);
                    width: 500px;
                    max-width: 92vw;
                    max-height: 84vh;
                    z-index: 9999;
                    background: #111214;
                    border: 1px solid rgba(255,255,255,0.10);
                    border-radius: 14px;
                    box-shadow:
                        0 0 0 1px rgba(255,255,255,0.04),
                        0 8px 16px rgba(0,0,0,0.4),
                        0 24px 56px rgba(0,0,0,0.7);
                    display: flex;
                    flex-direction: column;
                    padding: 28px 32px 32px;
                    color: #F2F3F5;
                    font-size: 14px;
                    font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    overflow-y: auto;
                    opacity: 0;
                    transform-origin: center center;
                    pointer-events: none;
                    scrollbar-width: thin;
                    scrollbar-color: #4a4a50 #1a1a1d;
                    box-sizing: border-box;
                }
                .ub-guidelines-panel * {
                    box-sizing: border-box;
                    font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
                }
                .ub-guidelines-panel::-webkit-scrollbar {
                    width: 10px;
                }
                .ub-guidelines-panel::-webkit-scrollbar-track {
                    background: #1a1a1d;
                    border-radius: 8px;
                }
                .ub-guidelines-panel::-webkit-scrollbar-thumb {
                    background: #4a4a50;
                    border-radius: 8px;
                    border: 2px solid #1a1a1d;
                }
                .ub-guidelines-panel::-webkit-scrollbar-thumb:hover {
                    background: #5c5c63;
                }
                .ub-guidelines-panel.ub-panel-open {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                    pointer-events: auto;
                    transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 260ms ease-out;
                }
                .ub-guidelines-panel.ub-panel-closing {
                    pointer-events: none;
                    animation: ub-crt-off 340ms cubic-bezier(0.86, 0, 0.07, 1) forwards;
                }
                .ub-guidelines-panel.ub-panel-closing::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: #fff;
                    opacity: 0;
                    pointer-events: none;
                    animation: ub-crt-flash 340ms ease-in forwards;
                }
                @keyframes ub-crt-off {
                    0% { transform: translate(-50%, -50%) scaleY(1) scaleX(1); filter: brightness(1); opacity: 1; }
                    45% { transform: translate(-50%, -50%) scaleY(0.015) scaleX(1); filter: brightness(2.2); opacity: 1; }
                    70% { transform: translate(-50%, -50%) scaleY(0.015) scaleX(0.02); filter: brightness(2.6); opacity: 0.6; }
                    100% { transform: translate(-50%, -50%) scaleY(0.015) scaleX(0.0001); filter: brightness(3); opacity: 0; }
                }
                @keyframes ub-crt-flash {
                    0% { opacity: 0; }
                    35% { opacity: 0.55; }
                    55% { opacity: 0.15; }
                    100% { opacity: 0; }
                }
                .ub-guidelines-close {
                    position: absolute;
                    top: 14px;
                    right: 18px;
                    background: none;
                    border: none;
                    color: #949BA4;
                    font-size: 20px;
                    cursor: pointer;
                    line-height: 1;
                    z-index: 1;
                }
                .ub-guidelines-close:hover {
                    color: #F2F3F5;
                }
                .ub-guidelines-h2 {
                    font-size: 20px;
                    font-weight: 800;
                    margin-bottom: 10px;
                    color: #F2F3F5;
                    letter-spacing: -0.01em;
                    line-height: 1.3;
                }
                .ub-guidelines-h3 {
                    font-size: 15px;
                    font-weight: 700;
                    margin: 18px 0 6px;
                    color: #F2F3F5;
                }
                .ub-guidelines-code {
                    display: block;
                    background: #0a0a0a;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 6px;
                    padding: 14px 16px;
                    font-family: "Consolas", "Menlo", "Courier New", monospace;
                    font-size: 13px;
                    line-height: 1.65;
                    white-space: pre;
                    overflow-x: auto;
                    margin: 8px 0;
                }
                .ub-guidelines-code .k { color: #9cdcfe; }
                .ub-guidelines-code .s { color: #ce9178; }
                .ub-guidelines-code .n { color: #b5cea8; }
                .ub-guidelines-code .p { color: #808080; }
                .ub-guidelines-inline-code {
                    background: #0a0a0a;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 4px;
                    padding: 1px 5px;
                    font-family: "Consolas", "Menlo", "Courier New", monospace;
                    font-size: 12px;
                    color: #ce9178;
                }
                .ub-guidelines-note {
                    background: #0f0f0f;
                    border-radius: 6px;
                    padding: 8px 12px;
                    margin: 8px 0;
                    border-left: 3px solid #949BA4;
                    color: #DBDEE1;
                    font-size: 13px;
                }
                .ub-guidelines-warn {
                    background: #0f0f0f;
                    border-radius: 6px;
                    padding: 8px 12px;
                    margin: 8px 0;
                    border-left: 3px solid #F0B232;
                    color: #DBDEE1;
                    font-size: 13px;
                }
                .ub-guidelines-panel ul,
                .ub-guidelines-panel ol {
                    margin: 6px 0 0 18px;
                    padding: 0;
                    color: #DBDEE1;
                    font-size: 13.5px;
                }
                .ub-guidelines-panel li {
                    margin-bottom: 4px;
                }
                .ub-guidelines-panel a {
                    color: #7289DA;
                    text-decoration: none;
                }
                .ub-guidelines-panel a:hover {
                    text-decoration: underline;
                }
                .ub-guidelines-panel strong {
                    color: #F2F3F5;
                    font-weight: 700;
                }
                .ub-guidelines-panel .ub-btn {
                    appearance: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    border-radius: 6px;
                    padding: 0 16px;
                    min-height: 38px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 120ms ease, transform 80ms ease;
                }
                .ub-guidelines-panel .ub-btn-primary {
                    background: #5865F2;
                    border: 1px solid #5865F2;
                    color: #ffffff;
                }
                .ub-guidelines-panel .ub-btn-primary:hover {
                    background: #4752C4;
                    border-color: #4752C4;
                }
                .ub-guidelines-panel .ub-btn-primary:active {
                    transform: scale(0.97);
                }
                #ub-dashboard-settings .ub-preview-empty {
                    font-size: 13px;
                    color: var(--ub-text-faint);
                    padding: 4px 0;
                }
                #ub-dashboard-settings .ub-preview-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }
                #ub-dashboard-settings .ub-preview-row-icon {
                    object-fit: contain;
                    flex-shrink: 0;
                    display: block;
                }
                #ub-dashboard-settings .ub-preview-row-label {
                    font-size: 12px;
                    color: var(--ub-text-faint);
                }
                #ub-dashboard-settings .ub-popup-card {
                    border-radius: 8px;
                    padding: 20px 28px;
                    text-align: center;
                    min-width: 180px;
                    width: fit-content;
                    margin: 0;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                    font-family: var(--font-primary, "gg sans", sans-serif);
                    transition: background 160ms ease;
                }
                #ub-dashboard-settings .ub-popup-card img {
                    width: 64px;
                    height: 64px;
                    object-fit: cover;
                    margin: 0 auto 14px;
                    display: block;
                }
                #ub-dashboard-settings .ub-popup-name {
                    font-weight: 800;
                    font-size: 16px;
                    letter-spacing: 0.3px;
                    line-height: 1.2;
                }
                #ub-dashboard-settings .ub-popup-by {
                    font-size: 12px;
                    color: #949ba4;
                    margin-top: 4px;
                }
                #ub-dashboard-settings .ub-preview-warning {
                    font-size: 11px;
                    color: #f0b132;
                    margin-top: 12px;
                    line-height: 1.5;
                }
                #ub-dashboard-settings .ub-badge-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 14px;
                    background: var(--ub-bg-input);
                    border: 1px solid var(--ub-border);
                    border-radius: var(--ub-radius-sm);
                    margin-bottom: 8px;
                    transition: background-color 120ms ease, border-color 120ms ease;
                }
                #ub-dashboard-settings .ub-badge-row:hover {
                    background: var(--ub-bg-input-hover);
                    border-color: var(--ub-border-strong);
                }
                #ub-dashboard-settings .ub-badge-row.ub-badge-active {
                    background: rgba(88, 101, 242, 0.10);
                    border-color: rgba(88, 101, 242, 0.45);
                    box-shadow: inset 0 0 0 1px rgba(88, 101, 242, 0.15);
                }
                #ub-dashboard-settings .ub-badge-thumb {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    object-fit: cover;
                    flex-shrink: 0;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid var(--ub-border-strong);
                }
                #ub-dashboard-settings .ub-badge-row-name {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--ub-text);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                #ub-dashboard-settings .ub-badge-row-name .ub-badge-active-tag {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--ub-text-muted);
                    margin-left: 6px;
                }
                #ub-dashboard-settings .ub-badge-row-actions {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-shrink: 0;
                }
                #ub-dashboard-settings .ub-badge-use-btn {
                    appearance: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--ub-radius-sm);
                    padding: 0 14px;
                    min-height: 32px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    background: var(--ub-accent);
                    border: 1px solid var(--ub-accent);
                    color: #ffffff;
                    transition: background-color 120ms ease, border-color 120ms ease, transform 80ms ease;
                }
                #ub-dashboard-settings .ub-badge-use-btn:hover {
                    background: var(--ub-accent-hover);
                    border-color: var(--ub-accent-hover);
                }
                #ub-dashboard-settings .ub-badge-use-btn:active { transform: scale(0.96); }
                #ub-dashboard-settings .ub-badge-delete-btn {
                    appearance: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--ub-radius-sm);
                    padding: 0 14px;
                    min-height: 32px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    background: var(--ub-danger);
                    border: 1px solid var(--ub-danger);
                    color: #ffffff;
                    transition: background-color 120ms ease, border-color 120ms ease, transform 80ms ease;
                }
                #ub-dashboard-settings .ub-badge-delete-btn:hover {
                    background: #c42f33;
                    border-color: #c42f33;
                }
                #ub-dashboard-settings .ub-badge-delete-btn:active { transform: scale(0.96); }
                #ub-dashboard-settings #ub-my-badges-list:empty::after {
                    content: "No saved badges yet";
                    font-size: 13px;
                    color: var(--ub-text-faint);
                    font-style: italic;
                    display: block;
                    padding: 4px 0 10px;
                }
                #ub-dashboard-settings .ub-divider {
                    display: none;
                }
                #ub-dashboard-settings a:focus-visible,
                #ub-dashboard-settings button:focus-visible {
                    outline: none;
                }
                @keyframes ub-gradient-flow {
                    0%   { background-position: 0% 50%; }
                    20%  { background-position: 80% 50%; }
                    40%  { background-position: 160% 50%; }
                    60%  { background-position: 240% 50%; }
                    80%  { background-position: 320% 50%; }
                    100% { background-position: 400% 50%; }
                }
                .ub-gradient-text {
                    background: linear-gradient(90deg,
                        #2d3899,
                        #3a45a8,
                        #4752c4,
                        #4f5ed6,
                        #5865f2,
                        #5f6ef3,
                        #6677f4,
                        #7289da,
                        #6677f4,
                        #5f6ef3,
                        #5865f2,
                        #4f5ed6,
                        #4752c4,
                        #3a45a8,
                        #2d3899
                    );
                    background-size: 400% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    color: transparent;
                    animation: ub-gradient-flow 14s ease-in-out infinite;
                }
                #ub-dashboard-settings .ub-dropdown {
                    position: relative;
                    width: 100%;
                    user-select: none;
                }
                #ub-dashboard-settings .ub-dropdown-trigger {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    background: rgba(255, 255, 255, 0.04);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.10);
                    border-top-color: rgba(255, 255, 255, 0.16);
                    border-radius: var(--ub-radius-sm);
                    padding: 10px 12px;
                    min-height: 40px;
                    color: var(--ub-text);
                    font-size: 14px;
                    cursor: pointer;
                    box-shadow:
                        inset 0 1px 0 rgba(255, 255, 255, 0.07),
                        0 2px 8px rgba(0, 0, 0, 0.35);
                    transition: border-color 150ms ease, background 150ms ease, box-shadow 150ms ease;
                }
                #ub-dashboard-settings .ub-dropdown-trigger:hover {
                    background: rgba(255, 255, 255, 0.07);
                    border-color: rgba(255, 255, 255, 0.18);
                    border-top-color: rgba(255, 255, 255, 0.24);
                }
                #ub-dashboard-settings .ub-dropdown.open .ub-dropdown-trigger {
                    border-color: rgba(88, 101, 242, 0.6);
                    border-top-color: rgba(88, 101, 242, 0.8);
                    box-shadow:
                        inset 0 1px 0 rgba(255, 255, 255, 0.08),
                        0 0 0 3px rgba(88, 101, 242, 0.18);
                    border-bottom-left-radius: 0;
                    border-bottom-right-radius: 0;
                }
                #ub-dashboard-settings .ub-dropdown-arrow {
                    flex-shrink: 0;
                    color: var(--ub-text-faint);
                    transition: transform 180ms ease;
                }
                #ub-dashboard-settings .ub-dropdown.open .ub-dropdown-arrow {
                    transform: rotate(180deg);
                }
                #ub-dashboard-settings .ub-dropdown-menu {
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    z-index: 999;
                    background: rgba(10, 10, 18, 0.82);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(88, 101, 242, 0.4);
                    border-top: none;
                    border-bottom-left-radius: var(--ub-radius-sm);
                    border-bottom-right-radius: var(--ub-radius-sm);
                    box-shadow:
                        0 8px 32px rgba(0, 0, 0, 0.6),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.04);
                    overflow: hidden;
                }
                #ub-dashboard-settings .ub-dropdown.open .ub-dropdown-menu {
                    display: block;
                }
                #ub-dashboard-settings .ub-dropdown-option {
                    padding: 10px 12px;
                    font-size: 14px;
                    color: var(--ub-text-secondary);
                    cursor: pointer;
                    transition: background 100ms ease, color 100ms ease;
                }
                #ub-dashboard-settings .ub-dropdown-option:hover {
                    background: rgba(88, 101, 242, 0.2);
                    color: var(--ub-text);
                }
                #ub-dashboard-settings .ub-dropdown-option.selected {
                    background: rgba(88, 101, 242, 0.3);
                    color: #ffffff;
                    font-weight: 600;
                }
                .ub-dash-tab { cursor: pointer; transition: color 120ms ease, border-bottom-color 120ms ease; }
                .ub-dash-tab:not([aria-selected="true"]):hover { color: #DBDEE1 !important; }
                .ub-tabpanel {
                    opacity: 1;
                    transform: translateY(0);
                    transition: opacity 160ms ease, transform 160ms ease;
                }
                .ub-tabpanel.ub-hidden { display: none; }
                .ub-tabpanel.ub-panel-fade-out {
                    opacity: 0;
                    transform: translateY(5px);
                }
                .ub-tabpanel.ub-panel-fade-in {
                    opacity: 0;
                    transform: translateY(-5px);
                }
                @media (prefers-reduced-motion: reduce) {
                    .ub-tabpanel { transition: none; }
                }
                #ub-dashboard-settings .ub-choice-group {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                #ub-dashboard-settings .ub-choice {
                    appearance: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1 1 0;
                    justify-content: center;
                    min-height: 40px;
                    padding: 0 12px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.10);
                    border-radius: var(--ub-radius-sm);
                    color: var(--ub-text-secondary);
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
                }
                #ub-dashboard-settings .ub-choice:hover {
                    background: rgba(255, 255, 255, 0.07);
                    border-color: rgba(255, 255, 255, 0.18);
                    color: var(--ub-text);
                }
                #ub-dashboard-settings .ub-choice.selected {
                    background: var(--ub-accent-soft);
                    border-color: rgba(88, 101, 242, 0.6);
                    color: #ffffff;
                }
                #ub-dashboard-settings .ub-choice:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 3px var(--ub-accent-soft);
                }
                @keyframes ub-preview-fade {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.35; }
                }
                #ub-dashboard-settings #ub-popup-anim-group .ub-choice:hover {
                    animation: ub-preview-fade 1100ms ease-in-out infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    #ub-dashboard-settings #ub-popup-anim-group .ub-choice:hover {
                        animation: none;
                    }
                }
                #ub-dashboard-settings .ub-shape-swatch {
                    display: block;
                    width: 16px;
                    height: 16px;
                    flex-shrink: 0;
                    background: currentColor;
                    opacity: 0.9;
                }
                #ub-dashboard-settings .ub-color-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                #ub-dashboard-settings .ub-color-input {
                    appearance: none;
                    -webkit-appearance: none;
                    width: 40px;
                    height: 40px;
                    flex-shrink: 0;
                    padding: 0;
                    border: 2px solid rgba(255, 255, 255, 0.16);
                    border-radius: 50%;
                    cursor: pointer;
                    background: none;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
                    transition: border-color 120ms ease, transform 80ms ease;
                }
                #ub-dashboard-settings .ub-color-input:hover {
                    border-color: rgba(255, 255, 255, 0.32);
                }
                #ub-dashboard-settings .ub-color-input:active {
                    transform: scale(0.95);
                }
                #ub-dashboard-settings .ub-color-input::-webkit-color-swatch-wrapper {
                    padding: 0;
                    border-radius: 50%;
                }
                #ub-dashboard-settings .ub-color-input::-webkit-color-swatch {
                    border: none;
                    border-radius: 50%;
                }
                #ub-dashboard-settings .ub-color-input::-moz-color-swatch {
                    border: none;
                    border-radius: 50%;
                }
                #ub-dashboard-settings .ub-color-hex {
                    font-size: 13px;
                    font-weight: 600;
                    font-family: "Consolas", "Menlo", monospace;
                    color: var(--ub-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
                #ub-dashboard-settings .ub-color-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                #ub-dashboard-settings .ub-field.ub-disabled {
                    opacity: 0.4;
                    pointer-events: none;
                }
                #ub-dashboard-settings .ub-switch-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                #ub-dashboard-settings .ub-switch-row:last-child {
                    border-bottom: none;
                }
                #ub-dashboard-settings .ub-switch-row.ub-disabled {
                    opacity: 0.4;
                    pointer-events: none;
                }
                #ub-dashboard-settings .ub-switch-copy {
                    flex: 1;
                }
                #ub-dashboard-settings .ub-switch-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--ub-text);
                    margin-bottom: 2px;
                }
                #ub-dashboard-settings .ub-switch-desc {
                    font-size: 12px;
                    line-height: 1.4;
                    color: var(--ub-text-faint);
                }
                #ub-dashboard-settings .ub-switch {
                    position: relative;
                    flex-shrink: 0;
                    width: 40px;
                    height: 24px;
                    border-radius: 999px;
                    border: none;
                    background: rgba(255, 255, 255, 0.14);
                    cursor: pointer;
                    padding: 0;
                    transition: background 200ms ease;
                }
                #ub-dashboard-settings .ub-switch::after {
                    content: "";
                    position: absolute;
                    top: 3px;
                    left: 3px;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #ffffff;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
                    transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                #ub-dashboard-settings .ub-switch.on {
                    background: var(--ub-accent);
                }
                #ub-dashboard-settings .ub-switch.on::after {
                    transform: translateX(16px);
                }
                #ub-dashboard-settings .ub-switch:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                #ub-dashboard-settings .ub-value-pill {
                    display: inline-block;
                    margin-left: 8px;
                    padding: 1px 8px;
                    background: rgba(255, 255, 255, 0.06);
                    border-radius: 999px;
                    color: var(--ub-text-secondary);
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0;
                    text-transform: none;
                    vertical-align: middle;
                }
                #ub-dashboard-settings .ub-range {
                    appearance: none;
                    -webkit-appearance: none;
                    width: 100%;
                    height: 6px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.10);
                    outline: none;
                    cursor: pointer;
                    margin-top: 4px;
                }
                #ub-dashboard-settings .ub-range::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 6px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.18);
                }
                #ub-dashboard-settings .ub-range::-webkit-slider-thumb {
                    appearance: none;
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: var(--ub-accent);
                    border: 3px solid #ffffff;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
                    cursor: pointer;
                    transition: transform 80ms ease;
                
                    margin-top: -6px;
                }
                #ub-dashboard-settings .ub-range::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                }
                #ub-dashboard-settings .ub-range::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: var(--ub-accent);
                    border: 3px solid #ffffff;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
                    cursor: pointer;
                }
                #ub-dashboard-settings .ub-range::-moz-range-track {
                    height: 6px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.18);
                }
                /* Discord's own settings classes (contentSection_b6bcee /
                   content_b6bcee) are built to sit centered next to a nav
                   sidebar column. We don't render that sidebar. The dashboard
                   now fills the entire viewport (see dashboardView.js), so
                   instead of forcing everything flush-left at a narrow width -
                   which left a huge dead zone on the right on any wide
                   screen - center a wider column in the available space. */
                #ub-dashboard-root .contentSection_b6bcee {
                    display: flex !important;
                    justify-content: center !important;
                    width: 100%;
                }
                #ub-dashboard-root .content_b6bcee {
                    margin: 0 auto !important;
                    width: 100%;
                }
                /* The 48px display heading was sized for the old full-page
                   in-Discord overlay. The toolbar popup is a fixed 420px
                   wide, so at 48px "Custom Badges" ran past the edge and
                   got clipped by the scroller's overflow. Scale it down and
                   let it wrap instead of forcing a single clipped line. */
                #ub-page-heading {
                    font-size: 30px !important;
                    white-space: normal !important;
                    line-height: 1.15 !important;
                }
            </style>
            <div class="scroller__23746 thin_d125d2 scrollerBase_d125d2" dir="ltr" style="overflow: hidden scroll; flex: 1 1 auto; min-height: 0; padding: 24px; background-color: #000000; font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                <section class="contentSection_b6bcee">
                    <div class="content_b6bcee" style="max-width: 960px; width: 100%;">
                        <h2 id="ub-page-heading" class="display-lg_cf4812 ub-gradient-text" data-text-variant="display-lg" style="margin-bottom: 6px; font-weight: 800; font-size: 48px; letter-spacing: -0.02em; white-space: nowrap; line-height: 1.1;">
                            Custom Badges
                        </h2>
                        <p id="ub-page-subtitle" class="text-md/normal_cf4812" data-text-variant="text-md/normal" style="color: #949ba4; margin-bottom: 24px; font-size: 15px; line-height: 1.5;">
                            Adds a self-hosted custom badge with hover tooltip and click-to-view popup card, visible to anyone else running this plugin.
                        </p>
                        <div id="ub-dashboard-settings">
                        <div id="ub-panel-badges" class="ub-tabpanel">
                            <div class="ub-section">
                                <div class="ub-section-head">
                                    <div class="ub-section-icon">${icon.shield}</div>
                                    <div class="ub-eyebrow">Account Verification</div>
                                </div>
                                <p class="ub-hint">
                                    Prove you own this Discord account so the server accepts badge changes as coming from you. No passwords or long-lived Discord tokens are ever stored - just a short-lived, revocable proof.
                                </p>
                                <div class="ub-btn-row">
                                    <button type="button" id="ub-verify-account" class="ub-btn ub-btn-primary">Verify Discord Account</button>
                                    <button type="button" id="ub-revoke-token" class="ub-btn ub-btn-danger-solid" disabled>Revoke Your Token</button>
                                </div>
                                <div class="ub-field">
                                    <div class="ub-label">Session Token</div>
                                    <p class="ub-hint" style="margin-bottom: 8px;">Paste the token shown after verifying your account here.</p>
                                    <div class="ub-token-wrap">
                                        <input id="ub-session-token" type="text" class="ub-input" placeholder="Paste your session token here" autocomplete="off" spellcheck="false" />
                                        <div id="ub-session-token-overlay" class="ub-token-overlay"><div id="ub-session-token-overlay-inner" class="ub-token-overlay-inner"></div></div>
                                    </div>
                                </div>
                                <div class="ub-field" style="margin-bottom: 0;">
                                    <div class="ub-label">Your Discord User ID (optional)</div>
                                    <p class="ub-hint" style="margin-bottom: 8px;">This script normally auto-detects your account from the bottom-left user panel, but if publishing does nothing or a preview shows "Not detected", paste your ID here as a manual fallback. Enable Developer Mode in Discord (Settings → Advanced), then right-click your own avatar/username anywhere and choose "Copy User ID".</p>
                                    <input id="ub-self-user-id" type="text" class="ub-input" placeholder="e.g. 123456789012345678" autocomplete="off" spellcheck="false" />
                                </div>
                            </div>
                            <div class="ub-section">
                                <div class="ub-section-head">
                                    <div class="ub-section-icon">${icon.clock}</div>
                                    <div class="ub-eyebrow">Write Budget</div>
                                </div>
                                <div id="ub-write-budget-card" class="ub-write-budget-card">
                                    <div class="ub-write-budget-toprow">
                                        <span id="ub-write-budget-count" class="ub-write-budget-count">Loading…</span>
                                    </div>
                                    <div class="ub-write-budget-bar"><div id="ub-write-budget-bar-fill" class="ub-write-budget-bar-fill" style="width:100%;"></div></div>
                                    <span id="ub-write-budget-reset" class="ub-write-budget-reset"></span>
                                </div>
                            </div>
                            <div class="ub-section">
                                <div class="ub-section-head">
                                    <div class="ub-section-icon">${icon.pencil}</div>
                                    <div class="ub-eyebrow">Edit Active Badge</div>
                                    <div id="ub-publish-status" style="margin-left:auto;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--ub-text-faint);">
                                        <span id="ub-publish-status-dot" style="width:7px;height:7px;border-radius:50%;background:var(--ub-text-faint);flex-shrink:0;transition:background-color 150ms ease;"></span>
                                        <span id="ub-publish-status-text">Not published yet</span>
                                    </div>
                                </div>
                                <div class="ub-field">
                                    <div class="ub-label">Api Base Url</div>
                                    <input id="ub-api-base-url" type="text" class="ub-input" placeholder="https://custom-badges.shadow-164.workers.dev" />
                                </div>
                                <div class="ub-field">
                                    <div class="ub-label">My Badge Image Url</div>
                                    <input id="ub-badge-image-url" type="text" class="ub-input" placeholder="https://..." />
                                </div>
                                <div class="ub-field" style="margin-bottom: 16px;">
                                    <div class="ub-label">My Badge Name</div>
                                    <input id="ub-badge-name" type="text" class="ub-input" placeholder="Your badge name" />
                                </div>
                                <button id="ub-apply-badge" class="ub-btn ub-btn-primary" style="margin-bottom: 0; width: 100%;">Apply Badge Changes</button>
                            </div>
                            <div class="ub-section">
                                <div class="ub-section-head">
                                    <div class="ub-section-icon">${icon.eye}</div>
                                    <div class="ub-eyebrow">Live Preview</div>
                                </div>
                                <div id="ub-live-preview">
                                    <div id="ub-preview-empty" class="ub-preview-empty">
                                        Set your badge image and name above to see a live preview
                                    </div>
                                    <div id="ub-preview-content" class="ub-preview-content" style="display: none;">
                                        <div class="ub-preview-row">
                                            <img id="ub-preview-row-icon" class="ub-preview-row-icon" alt="" />
                                            <span class="ub-preview-row-label">Badge row icon</span>
                                        </div>
                                        <div id="ub-popup-card" class="ub-popup-card">
                                            <img id="ub-popup-img" class="ub-popup-img" alt="" />
                                            <div id="ub-popup-name" class="ub-popup-name"></div>
                                            <div id="ub-popup-by" class="ub-popup-by"></div>
                                        </div>
                                        <div id="ub-preview-warning" class="ub-preview-warning" style="display: none;">
                                            Couldn't sample colors from this image, showing the flat fallback background instead. This can happen if the host blocks cross-origin image reads. What others see may look different from this preview.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="ub-section">
                                <div class="ub-section-head">
                                    <div class="ub-section-icon">${icon.bolt}</div>
                                    <div class="ub-eyebrow">Quick Actions</div>
                                </div>
                                <div class="ub-btn-row">
                                    <button id="ub-share-badge" class="ub-btn">Share Badge</button>
                                    <button id="ub-revert-badge" class="ub-btn ub-btn-primary">Revert To Previous Badge</button>
                                    <button id="ub-refresh-cache" class="ub-btn ub-btn-primary">Refresh Badge Cache</button>
                                </div>
                                <div class="ub-field">
                                    <div class="ub-label">Import Badge Code</div>
                                    <input id="ub-import-badge-code" type="text" class="ub-input" placeholder="Paste a badge code..." />
                                </div>
                                <button id="ub-import-badge" class="ub-btn" style="margin-bottom: 16px;">Import Badge</button>
                                <div class="ub-field">
                                    <div class="ub-label">Selected Preset</div>
                                    <div class="ub-dropdown" id="ub-selected-preset-dropdown">
                                        <div class="ub-dropdown-trigger" id="ub-selected-preset-trigger">
                                            <span class="ub-dropdown-value" id="ub-selected-preset-value">${presetLabels[0] ?? "No presets"}</span>
                                            <svg class="ub-dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                                        </div>
                                        <div class="ub-dropdown-menu" id="ub-selected-preset-menu">
                                            ${presetLabels.map((label, i) => `<div class="ub-dropdown-option" data-value="${i}">${label}</div>`).join("\n                                        ")}
                                        </div>
                                    </div>
                                    <input type="hidden" id="ub-selected-preset" value="0" />
                                </div>
                                <button id="ub-apply-preset" class="ub-btn" style="margin-bottom: 0;">Apply Preset</button>
                            </div>
                            <div class="ub-section">
                                <div class="ub-section-head">
                                    <div class="ub-section-icon">${icon.grid}</div>
                                    <div class="ub-eyebrow">My Badges</div>
                                </div>
                                <p class="ub-hint">
                                    Your saved badge slots. Click "Use" on any badge to make it active and publish it. Add a new slot to build another look - you can have up to 12.
                                </p>
                                <div id="ub-my-badges-list" style="margin-bottom: 10px;"></div>
                                <button id="ub-new-badge-slot" class="ub-btn ub-btn-primary">${icon.plus} New Badge Slot</button>
                            </div>
                            <div class="ub-section">
                                <div class="ub-section-head">
                                    <div class="ub-section-icon">${icon.box}</div>
                                    <div class="ub-eyebrow">Badge Packs</div>
                                </div>
                                <p class="ub-hint">
                                    Import a pack of badges from a raw GitHub URL, or export your current badges as a pack to share with others.
                                </p>
                                <div class="ub-field">
                                    <div class="ub-label">Import Pack from URL</div>
                                    <p class="ub-hint" style="margin-bottom: 8px;">Raw GitHub URL to a badge pack JSON file (e.g. https://raw.githubusercontent.com/you/repo/main/packs/friend-group.json). Use the raw.githubusercontent.com link, not a github.com/blob/... page.</p>
                                    <input id="ub-import-pack-url" type="text" class="ub-input" placeholder="https://raw.githubusercontent.com/ItzMeShadow999/Badges/main/packs/DiscordBadges.json" />
                                </div>
                                <div class="ub-btn-row" style="margin-bottom: 0; flex-wrap: wrap; gap: 8px;">
                                    <button id="ub-import-pack" class="ub-btn ub-btn-primary">Import Pack</button>
                                    <button id="ub-make-pack" class="ub-btn">Make Pack (Copy JSON)</button>
                                    <button id="ub-browse-packs" class="ub-btn">Add More Packs</button>
                                    <button id="ub-view-guidelines" type="button" class="ub-btn-link">View Publish Guide</button>
                                </div>
                            </div>
                            <div class="ub-section" style="margin-bottom: 0;">
                                <div class="ub-section-head">
                                    <div class="ub-section-icon">${icon.toggle}</div>
                                    <div class="ub-eyebrow">Behavior</div>
                                </div>
                                <div class="ub-switch-row">
                                    <div class="ub-switch-copy">
                                        <div class="ub-switch-label">Show Tooltip</div>
                                        <div class="ub-switch-desc">Show a small tooltip when hovering a custom badge</div>
                                    </div>
                                    <button type="button" id="ub-show-tooltip" class="ub-switch on" role="switch" aria-checked="true"></button>
                                </div>
                                <div class="ub-switch-row" id="ub-show-popup-row">
                                    <div class="ub-switch-copy">
                                        <div class="ub-switch-label">Show Popup</div>
                                        <div class="ub-switch-desc">Show a popup card when clicking a custom badge.</div>
                                    </div>
                                    <button type="button" id="ub-show-popup" class="ub-switch on" role="switch" aria-checked="true"></button>
                                </div>
                                <div class="ub-switch-row" id="ub-show-owner-tag-row">
                                    <div class="ub-switch-copy">
                                        <div class="ub-switch-label">Show Owner Tag</div>
                                        <div class="ub-switch-desc">Show "By {username}" underneath the badge name in the popup. Always shows the real Discord display name - not editable.</div>
                                    </div>
                                    <button type="button" id="ub-show-owner-tag" class="ub-switch on" role="switch" aria-checked="true"></button>
                                </div>
                                <div class="ub-switch-row">
                                    <div class="ub-switch-copy">
                                        <div class="ub-switch-label">Append Tag</div>
                                        <div class="ub-switch-desc">Add a [BD] suffix after your badge name. Seen by everyone who views your badge.</div>
                                    </div>
                                    <button type="button" id="ub-append-tag" class="ub-switch" role="switch" aria-checked="false"></button>
                                </div>
                                <div class="ub-switch-row">
                                    <div class="ub-switch-copy">
                                        <div class="ub-switch-label">Hide Own Badge</div>
                                        <div class="ub-switch-desc">Don't show my own badge to myself when viewing my own profile</div>
                                    </div>
                                    <button type="button" id="ub-hide-own-badge" class="ub-switch" role="switch" aria-checked="false"></button>
                                </div>
                            </div>
                        </div>
                        <div id="ub-panel-style" class="ub-tabpanel ub-hidden">
                            <div class="ub-section">
                                <div class="ub-section-head">
                                    <div class="ub-section-icon">${icon.eye}</div>
                                    <div class="ub-eyebrow">Icon Appearance</div>
                                </div>
                                <div class="ub-field">
                                    <div class="ub-label">Icon Shape</div>
                                    <div class="ub-choice-group" id="ub-icon-shape-group">
                                        <button type="button" class="ub-choice" data-value="circle">
                                            <span class="ub-shape-swatch" style="border-radius: 50%;"></span>
                                            Circle
                                        </button>
                                        <button type="button" class="ub-choice" data-value="rounded">
                                            <span class="ub-shape-swatch" style="border-radius: 5px;"></span>
                                            Rounded
                                        </button>
                                        <button type="button" class="ub-choice" data-value="square">
                                            <span class="ub-shape-swatch" style="border-radius: 0;"></span>
                                            Square
                                        </button>
                                    </div>
                                    <input type="hidden" id="ub-icon-shape" value="circle" />
                                </div>
                                <div class="ub-field">
                                    <div class="ub-label">Icon Size <span class="ub-value-pill" id="ub-icon-size-value">22px</span></div>
                                    <input type="range" id="ub-icon-size" class="ub-range" min="12" max="48" step="1" value="22" />
                                </div>
                                <div class="ub-field">
                                    <div class="ub-label">Hover Effect</div>
                                    <div class="ub-choice-group" id="ub-hover-effect-group">
                                        <button type="button" class="ub-choice" data-value="none">None</button>
                                        <button type="button" class="ub-choice" data-value="scale">Scale Up</button>
                                        <button type="button" class="ub-choice" data-value="glow">Glow</button>
                                    </div>
                                    <input type="hidden" id="ub-hover-effect" value="none" />
                                </div>
                                <div class="ub-field" id="ub-glow-color-field" style="margin-bottom: 0;">
                                    <div class="ub-label">Glow Color</div>
                                    <div class="ub-color-row">
                                        <input type="color" id="ub-glow-color" class="ub-color-input" value="#ffffff" />
                                        <span class="ub-color-hex" id="ub-glow-color-hex">#FFFFFF</span>
                                    </div>
                                </div>
                            </div>
                            <div class="ub-section">
                                <div class="ub-section-head">
                                    <div class="ub-section-icon">${icon.box}</div>
                                    <div class="ub-eyebrow">Popup Card</div>
                                </div>
                                <div class="ub-field">
                                    <div class="ub-label">Background</div>
                                    <div class="ub-choice-group" id="ub-bg-mode-group">
                                        <button type="button" class="ub-choice" data-value="base">Base</button>
                                        <button type="button" class="ub-choice" data-value="sample">Sample Image</button>
                                        <button type="button" class="ub-choice" data-value="edit">Edit Gradient</button>
                                    </div>
                                    <input type="hidden" id="ub-bg-mode" value="base" />
                                </div>
                                <div class="ub-field" id="ub-gradient-fields">
                                    <div class="ub-color-grid">
                                        <div>
                                            <div class="ub-label">Main Color</div>
                                            <div class="ub-color-row">
                                                <input type="color" id="ub-gradient-main" class="ub-color-input" value="#1d1d1d" />
                                                <span class="ub-color-hex" id="ub-gradient-main-hex">#1D1D1D</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div class="ub-label">Second Color</div>
                                            <div class="ub-color-row">
                                                <input type="color" id="ub-gradient-secondary" class="ub-color-input" value="#2a2a38" />
                                                <span class="ub-color-hex" id="ub-gradient-secondary-hex">#2A2A38</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="ub-field">
                                    <div class="ub-label">Name Color</div>
                                    <div class="ub-color-row">
                                        <input type="color" id="ub-name-color" class="ub-color-input" value="#ffffff" />
                                        <span class="ub-color-hex" id="ub-name-color-hex">#FFFFFF</span>
                                    </div>
                                </div>
                                <div class="ub-field" style="margin-bottom: 0;">
                                    <div class="ub-label">Popup Animation</div>
                                    <div class="ub-choice-group" id="ub-popup-anim-group">
                                        <button type="button" class="ub-choice" data-value="fade">Fade</button>
                                        <button type="button" class="ub-choice" data-value="scale">Scale</button>
                                        <button type="button" class="ub-choice" data-value="slide">Slide</button>
                                    </div>
                                    <input type="hidden" id="ub-popup-anim" value="fade" />
                                </div>
                            </div>
                            <div class="ub-section" style="margin-bottom: 0;">
                                <div class="ub-section-head">
                                    <div class="ub-section-icon">${icon.eye}</div>
                                    <div class="ub-eyebrow">Live Preview</div>
                                </div>
                                <div>
                                    <div class="ub-preview-empty">
                                        Set your badge image and name in the Custom Badges tab to see a live preview
                                    </div>
                                    <div class="ub-preview-content" style="display: none;">
                                        <div class="ub-preview-row">
                                            <img class="ub-preview-row-icon" alt="" />
                                            <span class="ub-preview-row-label">Badge row icon</span>
                                        </div>
                                        <div class="ub-popup-card">
                                            <img class="ub-popup-img" alt="" />
                                            <div class="ub-popup-name"></div>
                                            <div class="ub-popup-by"></div>
                                        </div>
                                        <div class="ub-preview-warning" style="display: none;">
                                            Couldn't sample colors from this image, showing the flat fallback background instead. This can happen if the host blocks cross-origin image reads. What others see may look different from this preview.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            <div id="ub-guidelines-backdrop" class="ub-guidelines-backdrop" id="ub-guidelines-backdrop"></div>
            <div id="ub-guidelines-panel" class="ub-guidelines-panel">
                <button type="button" class="ub-guidelines-close" id="ub-guidelines-close" title="Close">✕</button>
                <div class="ub-guidelines-h2">📦 Badge Pack Sharing Guidelines</div>
                <div style="color: var(--ub-text-muted); font-size: 13.5px; margin-bottom: 18px; line-height: 1.55;">Before sharing a pack, make sure it meets these standards so everyone has a smooth experience importing it.</div>
                <div class="ub-guidelines-h3">Format</div>
                <div style="color: var(--ub-text-secondary); margin-bottom: 8px;">Your pack must be a valid JSON file hosted on <code class="ub-guidelines-inline-code">raw.githubusercontent.com</code> - no other hosts are accepted by the importer. The structure should look like this:</div>
                <code class="ub-guidelines-code"><span class="p">{</span>
      <span class="k">"version"</span><span class="p">:</span> <span class="n">1</span><span class="p">,</span>
      <span class="k">"badges"</span><span class="p">:</span> <span class="p">[</span>
        <span class="s">"base64encodedcode"</span><span class="p">,</span>
        <span class="s">"base64encodedcode"</span>
      <span class="p">]</span>
    <span class="p">}</span></code>
                <div style="color: var(--ub-text-secondary);">Each entry in the <code class="ub-guidelines-inline-code">badges</code> array is a badge code generated by the <strong>Make Pack</strong> button in your dashboard.</div>
                <div class="ub-guidelines-h3">Pack Size</div>
                <div class="ub-guidelines-note">ⓘ The importer only loads the <strong>first 6 badges</strong> from any pack. The <strong>Make Pack</strong> button exports up to <strong>12 badges</strong> (your current plugin save limit). Technically packs can be as large as you want, but we recommend a minimum of <strong>6</strong> and a maximum of <strong>10–15</strong> for the best experience.</div>
                <div class="ub-guidelines-h3">Content Rules</div>
                <div class="ub-guidelines-warn">⚠️ Packs that break these rules will be removed without warning.</div>
                <ul>
                    <li>Badges must use <strong>publicly accessible image URLs</strong> that won't die in a week (no Discord CDN links, no temp hosts)</li>
                    <li>No NSFW, offensive, or hateful imagery</li>
                    <li>No impersonation of other users, plugins, or brands</li>
                </ul>
                <div class="ub-guidelines-h3">How to Submit</div>
                <ol>
                    <li>Generate your pack JSON using the <strong>Make Pack (Copy JSON)</strong> button</li>
                    <li>Push it to the packs repo as <code class="ub-guidelines-inline-code">packs/your-pack-name.json</code> in <a href="https://github.com/ItzMeShadow999/Badges" target="_blank" rel="noopener noreferrer">https://github.com/ItzMeShadow999/Badges</a></li>
                    <li>Open a PR with a short description of the theme</li>
                </ol>
                <div class="ub-guidelines-h3">Tips for a Good Pack</div>
                <ul>
                    <li>Use a clear, descriptive filename (<code class="ub-guidelines-inline-code">anime-icons.json</code>, not <code class="ub-guidelines-inline-code">pack1.json</code>)</li>
                    <li>All badges in a pack should share a <strong>theme or aesthetic</strong> - random assortments are harder to browse</li>
                    <li>Test your pack with <strong>Import Pack from URL</strong> before submitting to make sure every badge imports cleanly</li>
                </ul>
                <div style="margin-top: 24px; display: flex; justify-content: flex-end; padding-top: 16px; border-top: 1px solid var(--ub-border);">
                    <button type="button" id="ub-guidelines-close-btn" class="ub-btn ub-btn-primary">Got it</button>
                </div>
            </div>
        `;
    }
    const BUILTIN_PRESETS = [
        { label: "Hypesquad Legacy", imageUrl: "https://files.catbox.moe/lreui6.png", name: "Hypesquad legacy ",
            style: { iconShape: "circle", iconSize: 22, hoverEffect: "glow", glowColor: "#5865F2", nameColor: "#5865F2", appendTag: false },
            prefs: { showTooltip: true, hideOwnBadge: false } },
        { label: "Minecraft Account", imageUrl: "https://i.pinimg.com/736x/82/b2/1f/82b21fe6d9166c673eed585a5fc38ef5.jpg", name: "Mincraft Account",
            style: { iconShape: "circle", iconSize: 22, hoverEffect: "glow", glowColor: "#f54e6d", nameColor: "#ffffff", appendTag: false },
            prefs: { showTooltip: true, hideOwnBadge: false } },
        { label: "Konata Haii", imageUrl: "https://files.catbox.moe/lri82r.gif", name: "konata haii",
            style: { iconShape: "circle", iconSize: 22, hoverEffect: "glow", glowColor: "#4955e3", nameColor: "#ffffff", appendTag: false },
            prefs: { showTooltip: true, hideOwnBadge: false } },
        { label: "Cat", imageUrl: "https://i.ibb.co/4gWjN4fN/5c3d6e5876ff2a6ea5372317c5a4fbd7-removebg-preview.png", name: "Cat",
            style: { iconShape: "circle", iconSize: 22, hoverEffect: "glow", glowColor: "#ffd6de", nameColor: "#ffffff", appendTag: false },
            prefs: { showTooltip: true, hideOwnBadge: false } },
        { label: "Verified Discord User", imageUrl: "https://files.catbox.moe/aodhtf.png", name: "Verified Discord User",
            style: { iconShape: "circle", iconSize: 30, hoverEffect: "scale", glowColor: "#0095ff", nameColor: "#ffffff", appendTag: false },
            prefs: { showTooltip: true, hideOwnBadge: false } },
        { label: "I like Vencord", imageUrl: "https://files.catbox.moe/g2sqaj.png", name: "I like Vencord",
            style: { iconShape: "square", iconSize: 22, hoverEffect: "glow", glowColor: "#FCC1CC", nameColor: "#ffffff", appendTag: true },
            prefs: { showTooltip: true, hideOwnBadge: false } }
    ];
    const MAX_BADGES = 12;
    const DEFAULT_PACKS_REPO_URL = "https://github.com/ItzMeShadow999/Badges";
    const BADGE_EXPIRY_WARNING_DAYS = 14;
    const BADGE_HISTORY_LIMIT = 2;
    const BADGE_HISTORY_DEBOUNCE_MS = 3000;
    const REQUEST_TIMEOUT_MS = 10_000;
    const RATE_LIMIT_WINDOW_MS = 10_000;
    const RATE_LIMIT_MAX_REQUESTS = 50;
    const OWNER_TAG_FORMAT = "By {username}";
    function normalizeBadgeName(name) {
        return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
    }
    const BLOCKED_BADGE_NAMES = new Set([
        "discord", "discord mod", "staff", "discord developer",
        "discord active developer", "discord staff", "discord moderator",
        "discord employee", "discord team", "discord partner",
        "discord support", "certified moderator", "verified bot developer"
    ].map(normalizeBadgeName));
    const BLOCKED_BADGE_NAME_MESSAGE = "That badge name isn't allowed - it impersonates an official Discord role/badge";
    function isBlockedBadgeName(name) {
        if (!name) return false;
        return BLOCKED_BADGE_NAMES.has(normalizeBadgeName(name));
    }
    const DEFAULT_BADGE_STYLE = {
        iconShape: "circle", iconSize: 22, hoverEffect: "none",
        glowColor: "#ffffff", nameColor: "#ffffff", appendTag: false,
        popupAnimation: "fade", popupBackgroundMode: "base",
        popupGradientMain: "#1d1d1d", popupGradientSecondary: "#2a2a38",
        firstUsedDate: ""
    };
    const DEFAULT_BADGE_PREFS = {
        showTooltip: true, hideOwnBadge: false,
        showPopup: true, showOwnerTag: true
    };
    const SETTINGS_KEY = 'cb-dashboard-settings-v1';
    const HISTORY_KEY = 'cb-dashboard-history-v1';
    const SELF_ID_KEY = 'cb-dashboard-self-id';
    const DEFAULTS = {
        apiBaseUrl: API_BASE,
        sessionToken: "",
        selfUserId: "",
        myBadgeImageUrl: "",
        myBadgeName: "",
        selectedPreset: "0",
        showTooltip: true,
        appendTag: false,
        badgeNameColor: "#ffffff",
        badgeIconSize: 22,
        badgeIconShape: "circle",
        badgeHoverEffect: "none",
        badgeGlowColor: "#ffffff",
        hideOwnBadge: false,
        myBadgesJson: "[]",
        myActiveBadgeId: "",
        importBadgeCode: "",
        importPackUrl: "",
        packRepoUrl: DEFAULT_PACKS_REPO_URL,
        showPopup: true,
        showOwnerTag: true,
        popupBackgroundMode: "base",
        popupGradientMain: "#1d1d1d",
        popupGradientSecondary: "#2a2a38",
        popupAnimationStyle: "fade",
        firstUsedDate: "",
        packGuidelinesShown: false
    };
    let _settingsCache = null;
    function allSettings() {
        if (_settingsCache) return _settingsCache;
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            _settingsCache = raw ? Object.assign({}, DEFAULTS, JSON.parse(raw)) : Object.assign({}, DEFAULTS);
        } catch (e) {
            _settingsCache = Object.assign({}, DEFAULTS);
        }
        if (!_settingsCache.firstUsedDate) _settingsCache.firstUsedDate = new Date().toISOString();
        return _settingsCache;
    }
    function persistSettings() {
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(_settingsCache)); }
        catch (e) { log('Failed to save dashboard settings:', e); }
    }
    function getSetting(key) {
        const all = allSettings();
        return all[key] === undefined ? DEFAULTS[key] : all[key];
    }
    function setSetting(key, value) {
        const all = allSettings();
        all[key] = value;
        persistSettings();
    }
    const dashboardSettingsProxy = new Proxy({}, {
        get(_t, prop) { return getSetting(String(prop)); },
        set(_t, prop, value) { setSetting(String(prop), value); return true; }
    });
    function loadBadgeHistory() {
        try {
            const v = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
            return Array.isArray(v) ? v : [];
        } catch (e) { return []; }
    }
    function saveBadgeHistory(history) {
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, BADGE_HISTORY_LIMIT))); }
        catch (e) { }
    }
    let lastHistoryPushAt = 0;
    function pushBadgeHistory(snapshot) {
        const now = Date.now();
        if (now - lastHistoryPushAt < BADGE_HISTORY_DEBOUNCE_MS) return;
        lastHistoryPushAt = now;
        const history = loadBadgeHistory();
        history.unshift(snapshot);
        saveBadgeHistory(history);
    }
    function toast(message, opts) {
        const type = (opts && opts.type) || 'info';
        const colors = { success: '#23A55A', error: '#DA373C', info: '#5865F2' };
        const el = document.createElement('div');
        el.textContent = message;
        el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);z-index:10050;background:${colors[type] || colors.info};color:#fff;padding:10px 18px;border-radius:8px;font-family:"gg sans","Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.4);opacity:0;transition:opacity .18s ease, transform .18s ease;max-width:420px;text-align:center;`;
        document.body.appendChild(el);
        requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(0)'; });
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => el.remove(), 220);
        }, 3200);
    }
    // Reads the logged-in Discord user off the live discord.com tab via the
    // content script - the popup has no DOM of Discord's to scrape itself.
    async function getCurrentUser() {
        const overrideId = (getSetting("selfUserId") || "").trim();
        const result = await sendToContentScript('getCurrentUser', { overrideId });
        return result || null;
    }
    function resolveBadgeStyle(remote, ownerFirstUsedDate) {
        const base = Object.assign({}, DEFAULT_BADGE_STYLE, remote || {});
        if (remote && typeof remote.appendVencordTag === "boolean") base.appendTag = remote.appendVencordTag;
        if (!base.firstUsedDate && ownerFirstUsedDate) base.firstUsedDate = ownerFirstUsedDate;
        return base;
    }
    function getMyBadgeStyle() {
        return {
            iconShape: getSetting("badgeIconShape"),
            iconSize: getSetting("badgeIconSize"),
            hoverEffect: getSetting("badgeHoverEffect"),
            glowColor: getSetting("badgeGlowColor"),
            nameColor: getSetting("badgeNameColor"),
            appendVencordTag: getSetting("appendTag"),
            popupAnimation: getSetting("popupAnimationStyle"),
            popupBackgroundMode: getSetting("popupBackgroundMode"),
            popupGradientMain: getSetting("popupGradientMain"),
            popupGradientSecondary: getSetting("popupGradientSecondary"),
            firstUsedDate: getSetting("firstUsedDate")
        };
    }
    function resolveBadgePrefs(remote) {
        return Object.assign({}, DEFAULT_BADGE_PREFS, remote || {});
    }
    function getMyBadgePrefs() {
        return {
            showTooltip: getSetting("showTooltip"),
            hideOwnBadge: getSetting("hideOwnBadge"),
            showPopup: getSetting("showPopup"),
            showOwnerTag: getSetting("showOwnerTag")
        };
    }
    function formatOwnerTag(ownerUsername) {
        if (!ownerUsername) return null;
        return OWNER_TAG_FORMAT.replace("{username}", ownerUsername);
    }
    function formatBadgeName(rawName, appendTag) {
        return appendTag ? `${rawName} [BD]` : rawName;
    }
    async function dashGetPopupBackground(imageUrl, style) {
        if (style.popupBackgroundMode === "edit") {
            return {
                background: `radial-gradient(120% 100% at 50% 0%, ${style.popupGradientSecondary} 0%, ${style.popupGradientMain} 65%)`,
                edgeColor: style.popupGradientMain, sampleFailed: false
            };
        }
        if (style.popupBackgroundMode === "sample") {
            const sampled = await sampleImageColor(imageUrl);
            if (sampled) return { background: `radial-gradient(120% 100% at 50% 0%, ${sampled} 0%, #1d1d1d 65%)`, edgeColor: "#1d1d1d", sampleFailed: false };
            return { background: "#1d1d1d", edgeColor: "#1d1d1d", sampleFailed: true };
        }
        return { background: "#1d1d1d", edgeColor: "#1d1d1d", sampleFailed: false };
    }
    async function getDashboardPreviewData() {
        const imageUrl = getSetting("myBadgeImageUrl");
        const name = getSetting("myBadgeName");
        if (!imageUrl || !name) return null;
        const style = getMyBadgeStyle();
        const me = await getCurrentUser();
        const ownerUsername = (me && me.username) || null;
        const displayName = formatBadgeName(name, style.appendTag);
        const ownerTag = getSetting("showOwnerTag") ? formatOwnerTag(ownerUsername) : null;
        const { background, sampleFailed } = await dashGetPopupBackground(imageUrl, style);
        return {
            imageUrl, displayName, ownerTag,
            nameColor: style.nameColor, iconShape: style.iconShape, iconSize: style.iconSize,
            background, sampleFailed
        };
    }
    function genBadgeId() {
        return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    }
    function getMyBadges() {
        try {
            const parsed = JSON.parse(getSetting("myBadgesJson") || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    }
    function setMyBadgesLocal(list) {
        setSetting("myBadgesJson", JSON.stringify(list.slice(0, MAX_BADGES)));
    }
    function getActiveBadgeId() {
        return getSetting("myActiveBadgeId") || null;
    }
    function findBadgeEntry(id) {
        if (!id) return undefined;
        return getMyBadges().find(b => b.id === id);
    }
    function encodeBadgeCode() {
        const imageUrl = getSetting("myBadgeImageUrl");
        const name = getSetting("myBadgeName");
        if (!imageUrl || !name) return null;
        const payload = { imageUrl, name, style: getMyBadgeStyle(), prefs: getMyBadgePrefs() };
        return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    }
    function decodeBadgeCode(code) {
        return JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    }
    function shareMyBadge() {
        const code = encodeBadgeCode();
        if (!code) { toast("Set your badge image and name first", { type: "error" }); return; }
        navigator.clipboard.writeText(code)
            .then(() => toast("Badge code copied to clipboard", { type: "success" }))
            .catch(() => toast("Couldn't copy to clipboard", { type: "error" }));
    }
    function validateBadgePayload(parsed) {
        if (!parsed || typeof parsed !== "object") return "That code isn't a valid badge, it didn't decode to an object";
        if (typeof parsed.imageUrl !== "string" || !parsed.imageUrl.trim()) return "That code is missing a valid image URL";
        if (typeof parsed.name !== "string" || !parsed.name.trim()) return "That code is missing a valid badge name";
        if (isBlockedBadgeName(parsed.name)) return BLOCKED_BADGE_NAME_MESSAGE;
        if (parsed.style !== undefined && parsed.style !== null && (typeof parsed.style !== "object" || Array.isArray(parsed.style)))
            return "That code has an invalid style block";
        if (parsed.prefs !== undefined && parsed.prefs !== null && (typeof parsed.prefs !== "object" || Array.isArray(parsed.prefs)))
            return "That code has an invalid preferences block";
        return null;
    }
    let suppressPublishOnChange = false;
    function applyBadgeState(state) {
        const style = resolveBadgeStyle(state.style);
        const prefs = resolveBadgePrefs(state.prefs);
        suppressPublishOnChange = true;
        try {
            setSetting("myBadgeImageUrl", state.imageUrl);
            setSetting("myBadgeName", state.name);
            setSetting("badgeIconShape", style.iconShape);
            setSetting("badgeIconSize", style.iconSize);
            setSetting("badgeHoverEffect", style.hoverEffect);
            setSetting("badgeGlowColor", style.glowColor);
            setSetting("badgeNameColor", style.nameColor);
            setSetting("appendTag", style.appendTag);
            setSetting("popupAnimationStyle", style.popupAnimation);
            setSetting("popupBackgroundMode", style.popupBackgroundMode);
            setSetting("popupGradientMain", style.popupGradientMain);
            setSetting("popupGradientSecondary", style.popupGradientSecondary);
            setSetting("showTooltip", prefs.showTooltip);
            setSetting("hideOwnBadge", prefs.hideOwnBadge);
            setSetting("showPopup", prefs.showPopup);
            setSetting("showOwnerTag", prefs.showOwnerTag);
        } finally {
            suppressPublishOnChange = false;
        }
        scheduleAutoPublish(0);
    }
    function importBadgeFromCode() {
        const code = getSetting("importBadgeCode");
        if (!code) { toast("Paste a badge code first", { type: "error" }); return; }
        let parsed;
        try { parsed = decodeBadgeCode(code); }
        catch (e) { toast("That badge code isn't valid base64/JSON", { type: "error" }); return; }
        const err = validateBadgePayload(parsed);
        if (err) { toast(err, { type: "error" }); return; }
        applyBadgeState({ imageUrl: parsed.imageUrl, name: parsed.name, style: parsed.style, prefs: parsed.prefs });
        setSetting("importBadgeCode", "");
        toast("Badge imported and saved", { type: "success" });
    }
    function applySelectedPreset() {
        const preset = BUILTIN_PRESETS[Number(getSetting("selectedPreset"))];
        if (!preset) { toast("Pick a preset first", { type: "error" }); return; }
        applyBadgeState({ imageUrl: preset.imageUrl, name: preset.name, style: preset.style, prefs: preset.prefs });
        toast(`Applied "${preset.label}" preset and published`, { type: "success" });
    }
    function revertBadge() {
        const history = loadBadgeHistory();
        if (!history.length) { toast("No previous badge saved to revert to yet", { type: "error" }); return; }
        const previous = history.shift();
        saveBadgeHistory(history);
        applyBadgeState(previous);
        toast("Reverted to your previous badge", { type: "success" });
    }
    function apiBase() {
        return getSetting("apiBaseUrl") || API_BASE;
    }
    function taggedError(kind, detail) {
        return new Error(`${kind}:${detail}`);
    }
    async function fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
        } catch (e) {
            if (e && e.name === "AbortError") {
                let host = url;
                try { host = new URL(url).host; } catch (e2) { }
                throw taggedError("TIMEOUT", `Request to ${host} timed out`);
            }
            throw taggedError("NETWORK", (e && e.message) || "Network request failed");
        } finally {
            clearTimeout(timeout);
        }
    }
    async function parseJsonOrThrow(res) {
        let data = null;
        try { data = await res.json(); } catch (e) { }
        if (res.status === 429) {
            const retryAfter = res.headers.get("Retry-After") ?? "";
            throw taggedError("SERVER_RATE_LIMIT", retryAfter || (data && data.error) || "Too many requests");
        }
        if (!res.ok) {
            throw taggedError("SERVER_ERROR", `${res.status}:${(data && data.error) || res.statusText || "Unknown error"}`);
        }
        return data;
    }
    let _writeRequestTimestamps = [];
    function checkClientRateLimit() {
        const timestamps = _writeRequestTimestamps;
        const now = Date.now();
        while (timestamps.length && now - timestamps[0] > RATE_LIMIT_WINDOW_MS) timestamps.shift();
        if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
            const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - timestamps[0]);
            throw taggedError("CLIENT_RATE_LIMIT", String(Math.max(retryAfterMs, 0)));
        }
        timestamps.push(now);
    }
    function authHeaders(sessionToken) {
        const headers = { "Content-Type": "application/json" };
        if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
        return headers;
    }
    function requireSessionToken(sessionToken) {
        if (!sessionToken) throw taggedError("NOT_VERIFIED", 'Verify your Discord account in settings first ("Verify Discord Account" button)');
        return sessionToken;
    }
    async function apiSetBadge(userId, badgeId, imageUrl, description, style) {
        checkClientRateLimit();
        const token = requireSessionToken(getSetting("sessionToken"));
        const res = await fetchWithTimeout(apiBase(), {
            method: "POST", headers: authHeaders(token),
            body: JSON.stringify({ action: "setBadge", userId, badgeId, imageUrl, description, style })
        });
        return parseJsonOrThrow(res);
    }
    async function apiSetActiveBadge(userId, badgeId) {
        checkClientRateLimit();
        const token = requireSessionToken(getSetting("sessionToken"));
        const res = await fetchWithTimeout(apiBase(), {
            method: "POST", headers: authHeaders(token),
            body: JSON.stringify({ action: "setActiveBadge", userId, badgeId })
        });
        return parseJsonOrThrow(res);
    }
    async function apiDeleteBadge(userId, badgeId) {
        checkClientRateLimit();
        const token = requireSessionToken(getSetting("sessionToken"));
        const res = await fetchWithTimeout(apiBase(), {
            method: "POST", headers: authHeaders(token),
            body: JSON.stringify({ action: "deleteBadge", userId, badgeId })
        });
        return parseJsonOrThrow(res);
    }
    async function apiRevokeToken() {
        const token = requireSessionToken(getSetting("sessionToken"));
        const res = await fetchWithTimeout(`${apiBase()}/self/revoke`, {
            method: "POST", headers: authHeaders(token), body: JSON.stringify({})
        });
        return parseJsonOrThrow(res);
    }
    // Read-only peek at the caller's own write budget (server-derived from the
    // session token - no userId is ever sent, so the client can't ask for
    // anyone else's budget). Doesn't consume a write.
    async function apiGetWriteBudget() {
        const token = requireSessionToken(getSetting("sessionToken"));
        const res = await fetchWithTimeout(`${apiBase()}/self/writes`, {
            method: "GET", headers: authHeaders(token)
        });
        return parseJsonOrThrow(res);
    }
    function describeBadgeApiError(e) {
        const message = e instanceof Error ? e.message : String(e);
        const sep = message.indexOf(":");
        const kind = sep === -1 ? message : message.slice(0, sep);
        const detail = sep === -1 ? "" : message.slice(sep + 1);
        switch (kind) {
            case "NOT_VERIFIED":
                return 'Verify your Discord account first (see the "Verify Discord Account" button in settings)';
            case "CLIENT_RATE_LIMIT": {
                const seconds = Math.max(1, Math.ceil(Number(detail) / 1000) || 1);
                return `Slow down a little - try again in ${seconds}s`;
            }
            case "SERVER_RATE_LIMIT":
                return detail && /^\d+$/.test(detail)
                    ? `Rate limited by the badge server - try again in ${detail}s`
                    : "Rate limited by the badge server - try again shortly";
            case "TIMEOUT": return "Request timed out - the badge server didn't respond in time";
            case "NETWORK": return "Couldn't reach the badge server - check your connection";
            case "SERVER_ERROR": return "The badge server had a problem - try again in a bit";
            default: return "Something went wrong talking to the badge server";
        }
    }
    function refreshOwnBadgeDisplay(userId) {
        // Cache lives in content.js on the Discord tab now; ask it to drop
        // the entry and re-scan. Fire-and-forget - nothing here depends on
        // the reply, and the Discord tab may not even be open right now.
        sendToContentScript('refreshOwnBadgeDisplay', { userId });
    }
    let lastPublishedSnapshot = null;
    const AUTO_PUBLISH_DEBOUNCE_MS = 700;
    const AUTO_PUBLISH_RETRY_DELAYS_MS = [3000, 8000, 20000, 45000];
    let _autoPublishTimer = null;
    let _autoPublishRetryTimer = null;
    let _autoPublishRetryCount = 0;
    let _autoPublishGeneration = 0;
    let _publishStatusListeners = [];
    function onPublishStatusChange(fn) {
        _publishStatusListeners.push(fn);
        return () => { _publishStatusListeners = _publishStatusListeners.filter(f => f !== fn); };
    }
    function setPublishStatus(state, detail) {
        _publishStatusListeners.forEach(fn => { try { fn(state, detail); } catch (e) { } });
    }
    function cancelPendingAutoPublish() {
        if (_autoPublishTimer) { clearTimeout(_autoPublishTimer); _autoPublishTimer = null; }
        if (_autoPublishRetryTimer) { clearTimeout(_autoPublishRetryTimer); _autoPublishRetryTimer = null; }
        _autoPublishRetryCount = 0;
    }
    function scheduleAutoPublish(delay = AUTO_PUBLISH_DEBOUNCE_MS) {
        cancelPendingAutoPublish();
        const myGeneration = ++_autoPublishGeneration;
        setPublishStatus("pending");
        _autoPublishTimer = setTimeout(() => {
            _autoPublishTimer = null;
            runAutoPublish(myGeneration);
        }, delay);
    }
    async function runAutoPublish(generation) {
        if (generation !== _autoPublishGeneration) return;
        const imageUrl = getSetting("myBadgeImageUrl");
        const name = getSetting("myBadgeName");
        if (!imageUrl || !name) { setPublishStatus("idle"); return; }
        if (isBlockedBadgeName(name)) {
            toast(BLOCKED_BADGE_NAME_MESSAGE, { type: "error" });
            setPublishStatus("error", "Blocked badge name");
            return;
        }
        setPublishStatus("publishing");
        const ok = await updateMyBadgeFromSettings();
        if (generation !== _autoPublishGeneration) return; 
        if (ok) {
            _autoPublishRetryCount = 0;
            setPublishStatus("success");
        } else {
            const delay = AUTO_PUBLISH_RETRY_DELAYS_MS[Math.min(_autoPublishRetryCount, AUTO_PUBLISH_RETRY_DELAYS_MS.length - 1)];
            _autoPublishRetryCount++;
            setPublishStatus("error", `Retrying in ${Math.round(delay / 1000)}s`);
            _autoPublishRetryTimer = setTimeout(() => {
                _autoPublishRetryTimer = null;
                runAutoPublish(generation);
            }, delay);
        }
    }
    async function setMyBadge(badgeId, imageUrl, description) {
        const me = await getCurrentUser();
        if (!me) {
            log('Not logged in / could not detect current user');
            toast('Could not detect your Discord account - open the "Your Discord User ID" field in settings and paste it in manually', { type: "error" });
            return false;
        }
        try {
            const res = await apiSetBadge(me.id, badgeId, imageUrl, description, getMyBadgeStyle());
            refreshOwnBadgeDisplay(me.id);
            applyWriteBudget(res && res.writeBudget);
            log('Badge set:', res);
            return true;
        } catch (e) {
            log('Failed to set badge:', e);
            toast(describeBadgeApiError(e), { type: "error" });
            return false;
        }
    }
    async function updateMyBadgeFromSettings() {
        if (suppressPublishOnChange) return true;
        const imageUrl = getSetting("myBadgeImageUrl");
        const name = getSetting("myBadgeName");
        if (!imageUrl || !name) return true;
        if (isBlockedBadgeName(name)) { toast(BLOCKED_BADGE_NAME_MESSAGE, { type: "error" }); return false; }
        if (lastPublishedSnapshot) pushBadgeHistory(lastPublishedSnapshot);
        lastPublishedSnapshot = { imageUrl, name, style: getMyBadgeStyle(), prefs: getMyBadgePrefs() };
        let id = getActiveBadgeId();
        if (!id) { id = genBadgeId(); setSetting("myActiveBadgeId", id); }
        const list = getMyBadges();
        const entry = { id, imageUrl, description: name, style: getMyBadgeStyle() };
        const idx = list.findIndex(b => b.id === id);
        if (idx === -1) list.push(entry); else list[idx] = entry;
        setMyBadgesLocal(list);
        return await setMyBadge(id, imageUrl, name);
    }
    function loadBadgeFieldsIntoSettings(entry) {
        suppressPublishOnChange = true;
        try {
            setSetting("myBadgeImageUrl", entry.imageUrl);
            setSetting("myBadgeName", entry.description);
            const style = resolveBadgeStyle(entry.style);
            setSetting("badgeIconShape", style.iconShape);
            setSetting("badgeIconSize", style.iconSize);
            setSetting("badgeHoverEffect", style.hoverEffect);
            setSetting("badgeGlowColor", style.glowColor);
            setSetting("badgeNameColor", style.nameColor);
            setSetting("appendTag", style.appendTag);
            setSetting("popupAnimationStyle", style.popupAnimation);
            setSetting("popupBackgroundMode", style.popupBackgroundMode);
            setSetting("popupGradientMain", style.popupGradientMain);
            setSetting("popupGradientSecondary", style.popupGradientSecondary);
        } finally {
            suppressPublishOnChange = false;
        }
    }
    async function switchToBadge(id) {
        const entry = findBadgeEntry(id);
        if (!entry) return;
        setSetting("myActiveBadgeId", id);
        loadBadgeFieldsIntoSettings(entry);
        const me = await getCurrentUser();
        if (!me) {
            toast('Could not detect your Discord account - paste your User ID into settings manually', { type: "error" });
            return;
        }
        try {
            const res = await apiSetActiveBadge(me.id, id);
            refreshOwnBadgeDisplay(me.id);
            applyWriteBudget(res && res.writeBudget);
            toast("Switched active badge", { type: "success" });
        } catch (e) {
            log('Failed to switch active badge:', e);
            toast(describeBadgeApiError(e), { type: "error" });
        }
    }
    function createNewBadgeSlot() {
        const list = getMyBadges();
        if (list.length >= MAX_BADGES) { toast(`You can only have up to ${MAX_BADGES} badges`, { type: "error" }); return; }
        const id = genBadgeId();
        const entry = {
            id,
            imageUrl: getSetting("myBadgeImageUrl") || "",
            description: getSetting("myBadgeName") || "New Badge",
            style: getMyBadgeStyle()
        };
        list.push(entry);
        setMyBadgesLocal(list);
        setSetting("myActiveBadgeId", id);
        loadBadgeFieldsIntoSettings(entry);
        if (entry.imageUrl) scheduleAutoPublish(0);
        toast("New badge slot added - edit the fields above to customize it", { type: "success" });
    }
    async function deleteBadgeSlot(id) {
        const list = getMyBadges();
        const remaining = list.filter(b => b.id !== id);
        setMyBadgesLocal(remaining);
        const me = await getCurrentUser();
        if (me) {
            try {
                const res = await apiDeleteBadge(me.id, id);
                refreshOwnBadgeDisplay(me.id);
                applyWriteBudget(res && res.writeBudget);
            } catch (e) {
                log('Failed to delete badge:', e);
                toast(describeBadgeApiError(e), { type: "error" });
            }
        } else {
            toast('Removed locally, but could not reach the server (Discord account not detected) - it may still show on your profile', { type: "error" });
        }
        if (getActiveBadgeId() === id) {
            const next = remaining[0];
            if (next) {
                switchToBadge(next.id);
            } else {
                setSetting("myActiveBadgeId", "");
                suppressPublishOnChange = true;
                try {
                    setSetting("myBadgeImageUrl", "");
                    setSetting("myBadgeName", "");
                } finally {
                    suppressPublishOnChange = false;
                }
            }
        }
    }
    function refreshBadgeCache() {
        sendToContentScript('refreshBadgeCache', {});
        toast("Badge cache cleared", { type: "success" });
    }
    function verifyDiscordAccount() {
        chrome.tabs.create({ url: `${apiBase()}/auth/start` });
    }
    async function revokeSessionToken() {
        try {
            await apiRevokeToken();
            setSetting("sessionToken", "");
            _writeBudgetInfo = null;
            renderWriteBudget();
            toast("Token revoked - re-verify to publish badge changes again", { type: "success" });
        } catch (e) {
            log('Failed to revoke token:', e);
            toast(describeBadgeApiError(e), { type: "error" });
        }
    }
    function packUrlLooksValid(url) {
        try { return new URL(url).hostname === "raw.githubusercontent.com"; }
        catch (e) { return false; }
    }
    function makePack() {
        const badges = getMyBadges();
        if (!badges.length) { toast("You don't have any badges to pack yet", { type: "error" }); return; }
        const codes = badges.map(b => btoa(unescape(encodeURIComponent(JSON.stringify({ imageUrl: b.imageUrl, name: b.description, style: b.style })))));
        const pack = { version: 1, badges: codes };
        navigator.clipboard.writeText(JSON.stringify(pack, null, 2))
            .then(() => {
                const repoHint = getSetting("packRepoUrl")
                    ? ` Push it to ${getSetting("packRepoUrl")} as packs/your-pack-name.json.`
                    : ' Set "Pack Repo Url" below, then push this as packs/your-pack-name.json in that repo.';
                toast(`Pack JSON copied to clipboard.${repoHint}`, { type: "success" });
            })
            .catch(() => toast("Couldn't copy to clipboard", { type: "error" }));
    }
    function browsePacks() {
        chrome.tabs.create({ url: "https://github.com/ItzMeShadow999/Badges" });
    }
    async function importPackFromUrl() {
        const url = (getSetting("importPackUrl") || "").trim();
        if (!url) { toast("Paste a pack URL first", { type: "error" }); return; }
        if (!packUrlLooksValid(url)) { toast("Use a raw.githubusercontent.com link, not a github.com/blob/... page", { type: "error" }); return; }
        let codes;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();
            codes = Array.isArray(data) ? data : (Array.isArray(data && data.badges) ? data.badges : []);
            if (!codes.length) throw new Error("empty pack");
        } catch (e) {
            toast("Couldn't load that pack - check the URL", { type: "error" });
            return;
        }
        const list = getMyBadges();
        let imported = 0;
        for (const code of codes) {
            if (list.length + imported >= MAX_BADGES) break;
            try {
                const parsed = decodeBadgeCode(code);
                if (validateBadgePayload(parsed)) continue;
                list.push({ id: genBadgeId(), imageUrl: parsed.imageUrl, description: parsed.name, style: parsed.style });
                imported++;
            } catch (e) { }
        }
        if (!imported) { toast("No valid badges found in that pack", { type: "error" }); return; }
        setMyBadgesLocal(list);
        for (const entry of list.slice(-imported)) {
            await setMyBadge(entry.id, entry.imageUrl, entry.description);
        }
        toast(`Imported ${imported} badge(s) from pack and saved`, { type: "success" });
    }
    let _dashboardBridge = null;
    function setDashboardBridge(b) { _dashboardBridge = b; }
    function getDashboardBridge() { return _dashboardBridge; }
    // --- Write budget display -------------------------------------------------
    // Purely a read-side mirror of the server's authoritative WriteBudget DO.
    // We never derive or decrement this locally - every number shown comes from
    // either GET /self/writes (peekWriteBudget, no write consumed) or the
    // `writeBudget` block a successful write response already includes.
    let _writeBudgetInfo = null; // { remaining, limit, resetAt } | null
    let _writeBudgetCountdownTimer = null;
    function formatWriteBudgetDuration(ms) {
        if (ms <= 0) return "0m";
        const totalMinutes = Math.ceil(ms / 60000);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
    function renderWriteBudget() {
        const countEl = document.getElementById("ub-write-budget-count");
        const resetEl = document.getElementById("ub-write-budget-reset");
        const cardEl = document.getElementById("ub-write-budget-card");
        const fillEl = document.getElementById("ub-write-budget-bar-fill");
        if (!countEl || !resetEl || !cardEl) return; // dashboard not mounted yet
        if (!getSetting("sessionToken")) {
            countEl.textContent = "Verify your account to see your write budget";
            resetEl.textContent = "";
            cardEl.classList.remove("ub-write-budget-exhausted");
            if (fillEl) fillEl.style.width = "100%";
            return;
        }
        if (!_writeBudgetInfo) {
            countEl.textContent = "Loading…";
            resetEl.textContent = "";
            return;
        }
        const { remaining, limit, resetAt } = _writeBudgetInfo;
        const safeLimit = limit || 0;
        const exhausted = remaining <= 0;
        countEl.textContent = `${remaining} / ${safeLimit} writes remaining`;
        cardEl.classList.toggle("ub-write-budget-exhausted", exhausted);
        if (fillEl) fillEl.style.width = `${safeLimit > 0 ? Math.max(0, Math.min(100, (remaining / safeLimit) * 100)) : 100}%`;
        if (resetAt == null) {
            // Fresh, never-started window - nothing to count down to.
            resetEl.textContent = "";
        } else {
            const msLeft = resetAt - Date.now();
            if (msLeft <= 0) {
                resetEl.textContent = "Refreshing…";
                fetchWriteBudget();
            } else {
                resetEl.textContent = `${exhausted ? "Available again" : "Resets"} in ${formatWriteBudgetDuration(msLeft)}`;
            }
        }
    }
    function applyWriteBudget(info) {
        if (!info) return;
        _writeBudgetInfo = { remaining: info.remaining, limit: info.limit, resetAt: info.resetAt ?? null };
        renderWriteBudget();
    }
    async function fetchWriteBudget() {
        if (!document.getElementById("ub-write-budget-count")) return; // dashboard not mounted
        if (!getSetting("sessionToken")) { renderWriteBudget(); return; }
        try {
            const data = await apiGetWriteBudget();
            applyWriteBudget(data);
        } catch (e) {
            log("Failed to fetch write budget:", e);
            // Leave the last known value displayed rather than showing an error
            // in a spot that's meant to be a quiet status readout.
        }
    }
    function startWriteBudgetCountdown() {
        if (_writeBudgetCountdownTimer) return;
        _writeBudgetCountdownTimer = setInterval(() => {
            if (_writeBudgetInfo && _writeBudgetInfo.resetAt != null) renderWriteBudget();
        }, 30000);
    }
    function stopWriteBudgetCountdown() {
        if (_writeBudgetCountdownTimer) { clearInterval(_writeBudgetCountdownTimer); _writeBudgetCountdownTimer = null; }
    }
    // The popup window itself *is* the dashboard now - there's no FAB, no
    // overlay, no open/close lifecycle. It mounts once when the popup opens
    // and tears down (implicitly, since the whole document unloads) when the
    // user clicks away.
    function mountDashboard() {
        const root = document.getElementById('ub-dashboard-root');
        root.innerHTML = headerBarHtml() + dashboardHtml(BUILTIN_PRESETS.map(p => p.label));
        wireDashboardSettings(root);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) fetchWriteBudget();
        });
        return root;
    }
    function initDashboard() {
        setDashboardBridge({
            settings: { store: dashboardSettingsProxy },
            presetLabels: BUILTIN_PRESETS.map(p => p.label),
            getPreviewData: () => getDashboardPreviewData(),
            shareMyBadge: () => shareMyBadge(),
            revertBadge: () => revertBadge(),
            refreshBadgeCache: () => refreshBadgeCache(),
            importBadgeFromCode: () => importBadgeFromCode(),
            applySelectedPreset: () => applySelectedPreset(),
            createNewBadgeSlot: () => createNewBadgeSlot(),
            importPackFromUrl: () => importPackFromUrl(),
            makePack: () => makePack(),
            browsePacks: () => browsePacks(),
            onBadgeModeChange: () => { },
            publishBadge: () => scheduleAutoPublish(),
            applyBadgeNow: () => scheduleAutoPublish(0),
            onPublishStatusChange: fn => onPublishStatusChange(fn),
            verifyAccount: () => verifyDiscordAccount(),
            revokeSessionToken: () => revokeSessionToken(),
            switchToBadge: id => switchToBadge(id),
            deleteBadgeSlot: id => deleteBadgeSlot(id)
        });
        mountDashboard();
        renderWriteBudget();
        fetchWriteBudget();
        startWriteBudgetCountdown();
    }
    document.addEventListener('DOMContentLoaded', initDashboard);
    function wireDashboardSettings(root) {
        const bridge = getDashboardBridge();
        if (!bridge) {
            console.warn("[UserDashboard] Dashboard bridge not set yet - settings form will not be wired up.");
            return;
        }
        const { settings } = bridge;
        const $ = (id) => root.querySelector(`#${id}`);
        const closeBtn = $("ub-dash-close");
        const publishStatusDot = $("ub-publish-status-dot");
        const publishStatusText = $("ub-publish-status-text");
        if (bridge.onPublishStatusChange) {
            bridge.onPublishStatusChange((state, detail) => {
                if (!publishStatusDot || !publishStatusText) return;
                const map = {
                    idle: { color: "var(--ub-text-faint)", text: "Not published yet" },
                    pending: { color: "var(--ub-warning)", text: "Waiting for you to stop typing…" },
                    publishing: { color: "var(--ub-accent-2)", text: "Sending to server…" },
                    success: { color: "var(--ub-positive)", text: "Synced to server ✓" },
                    error: { color: "var(--ub-danger)", text: detail || "Failed to sync - retrying" }
                };
                const s = map[state] || map.idle;
                publishStatusDot.style.background = s.color;
                publishStatusText.textContent = s.text;
                publishStatusText.style.color = s.color;
            });
        }
        if (closeBtn && closeBtn.getAttribute("data-ub-listener") !== "true") {
            closeBtn.setAttribute("data-ub-listener", "true");
            closeBtn.addEventListener("click", () => {
                window.close();
            });
            closeBtn.addEventListener("mouseenter", () => { closeBtn.style.background = "var(--background-modifier-hover,rgba(79,84,92,0.16))"; closeBtn.style.color = "#fff"; });
            closeBtn.addEventListener("mouseleave", () => { closeBtn.style.background = "transparent"; closeBtn.style.color = "#949BA4"; });
        }
        const apiBaseUrl = $("ub-api-base-url");
        const badgeImageUrl = $("ub-badge-image-url");
        const badgeName = $("ub-badge-name");
        const importBadgeCode = $("ub-import-badge-code");
        const importPackUrl = $("ub-import-pack-url");
        const sessionToken = $("ub-session-token");
        const selfUserId = $("ub-self-user-id");
        const sessionTokenOverlay = $("ub-session-token-overlay-inner");
        const revokeTokenBtn = $("ub-revoke-token");
        const badgeModeInput = $("ub-badge-mode");
        const selectedPresetInput = $("ub-selected-preset");
        const iconSize = $("ub-icon-size");
        const iconSizeValue = $("ub-icon-size-value");
        const hoverEffectInput = $("ub-hover-effect");
        const glowColorField = $("ub-glow-color-field");
        const glowColor = $("ub-glow-color");
        const glowColorHex = $("ub-glow-color-hex");
        const bgModeInput = $("ub-bg-mode");
        const gradientFields = $("ub-gradient-fields");
        const gradientMain = $("ub-gradient-main");
        const gradientMainHex = $("ub-gradient-main-hex");
        const gradientSecondary = $("ub-gradient-secondary");
        const gradientSecondaryHex = $("ub-gradient-secondary-hex");
        const nameColor = $("ub-name-color");
        const nameColorHex = $("ub-name-color-hex");
        const showTooltipSwitch = $("ub-show-tooltip");
        const showPopupSwitch = $("ub-show-popup");
        const showPopupRow = $("ub-show-popup-row");
        const showOwnerTagSwitch = $("ub-show-owner-tag");
        const showOwnerTagRow = $("ub-show-owner-tag-row");
        const appendTagSwitch = $("ub-append-tag");
        const hideOwnBadgeSwitch = $("ub-hide-own-badge");
        function wireDropdown(dropdownId, hiddenInputId, valueElId, onChange) {
            const dropdown = root.querySelector(`#${dropdownId}`);
            const hiddenInput = $(hiddenInputId);
            const valueEl = root.querySelector(`#${valueElId}`);
            const trigger = root.querySelector(`#${dropdownId} .ub-dropdown-trigger`);
            const menu = root.querySelector(`#${dropdownId} .ub-dropdown-menu`);
            if (!dropdown || !hiddenInput || !valueEl || !trigger || !menu)
                return;
            trigger.addEventListener("click", e => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains("open");
                root.querySelectorAll(".ub-dropdown.open").forEach(d => d.classList.remove("open"));
                if (!isOpen)
                    dropdown.classList.add("open");
            });
            menu.querySelectorAll(".ub-dropdown-option").forEach(opt => {
                opt.addEventListener("click", () => {
                    const val = opt.dataset.value ?? "";
                    hiddenInput.value = val;
                    valueEl.textContent = opt.textContent ?? "";
                    menu.querySelectorAll(".ub-dropdown-option").forEach(o => o.classList.remove("selected"));
                    opt.classList.add("selected");
                    dropdown.classList.remove("open");
                    onChange?.(val);
                });
            });
        }
        document.addEventListener("click", () => {
            root.querySelectorAll(".ub-dropdown.open").forEach(d => d.classList.remove("open"));
        });
        const TAB_COPY = {
            badges: {
                title: "Custom Badges",
                subtitle: "Adds a self-hosted custom badge with hover tooltip and click-to-view popup card, visible to anyone else running this plugin."
            },
            style: {
                title: "Styles Menu",
                subtitle: "Shape, size, hover effects, popup background, name color, and animation - everything that controls how your badge looks. Every change here is visible to anyone who views your badge."
            }
        };
        const pageHeading = root.querySelector("#ub-page-heading");
        const pageSubtitle = root.querySelector("#ub-page-subtitle");
        const tabUnderline = root.querySelector("#ub-tab-underline");
        const tabsContainer = root.querySelector("#ub-tabs-container");
        let activeTab = "badges";
        const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        function positionUnderline(tabEl) {
            if (!tabUnderline || !tabsContainer || !tabEl)
                return;
            const containerRect = tabsContainer.getBoundingClientRect();
            const tabRect = tabEl.getBoundingClientRect();
            tabUnderline.style.left = `${tabRect.left - containerRect.left}px`;
            tabUnderline.style.width = `${tabRect.width}px`;
        }
        function switchTab(tab) {
            if (tab === activeTab)
                return;
            activeTab = tab;
            root.querySelectorAll(".ub-dash-tab").forEach(t => {
                const active = t.dataset.tab === tab;
                t.setAttribute("aria-selected", String(active));
                t.style.borderBottomColor = active ? "#5865F2" : "transparent";
                t.style.color = active ? "#fff" : "#949BA4";
                t.style.fontWeight = active ? "600" : "500";
                if (active) positionUnderline(t);
            });
            const copy = TAB_COPY[tab] ?? TAB_COPY.badges;
            if (pageHeading)
                pageHeading.textContent = copy.title;
            if (pageSubtitle)
                pageSubtitle.textContent = copy.subtitle;
            const targetPanel = root.querySelector(`#ub-panel-${tab}`);
            const currentPanel = root.querySelector(".ub-tabpanel:not(.ub-hidden)");
            if (!targetPanel || targetPanel === currentPanel)
                return;
            if (prefersReducedMotion) {
                currentPanel?.classList.add("ub-hidden");
                targetPanel.classList.remove("ub-hidden");
                return;
            }
            currentPanel?.classList.add("ub-panel-fade-out");
            setTimeout(() => {
                currentPanel?.classList.add("ub-hidden");
                currentPanel?.classList.remove("ub-panel-fade-out");
                targetPanel.classList.remove("ub-hidden");
                targetPanel.classList.add("ub-panel-fade-in");
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => targetPanel.classList.remove("ub-panel-fade-in"));
                });
            }, 150);
        }
        root.querySelectorAll(".ub-dash-tab").forEach(t => {
            t.addEventListener("click", () => switchTab(t.dataset.tab ?? "badges"));
        });
        positionUnderline(root.querySelector('.ub-dash-tab[aria-selected="true"]'));
        window.addEventListener("resize", () => {
            positionUnderline(root.querySelector(`#ub-tab-${activeTab}`));
        });
        function wireChoiceGroup(groupId, hiddenInputId, onChange) {
            const group = root.querySelector(`#${groupId}`);
            const hiddenInput = $(hiddenInputId);
            if (!group || !hiddenInput)
                return;
            group.querySelectorAll(".ub-choice").forEach(btn => {
                btn.addEventListener("click", () => {
                    const val = btn.dataset.value ?? "";
                    hiddenInput.value = val;
                    group.querySelectorAll(".ub-choice").forEach(b => b.classList.remove("selected"));
                    btn.classList.add("selected");
                    onChange?.(val);
                });
            });
        }
        function setChoiceGroupValue(groupId, hiddenInputId, val) {
            const group = root.querySelector(`#${groupId}`);
            const hiddenInput = $(hiddenInputId);
            if (!group || !hiddenInput)
                return;
            hiddenInput.value = val;
            group.querySelectorAll(".ub-choice").forEach(b => {
                b.classList.toggle("selected", b.dataset.value === val);
            });
        }
        function wireSwitch(btn, onChange) {
            if (!btn)
                return;
            btn.addEventListener("click", () => {
                if (btn.disabled)
                    return;
                const next = !btn.classList.contains("on");
                btn.classList.toggle("on", next);
                btn.setAttribute("aria-checked", String(next));
                onChange(next);
            });
        }
        function setSwitchValue(btn, val) {
            if (!btn)
                return;
            btn.classList.toggle("on", val);
            btn.setAttribute("aria-checked", String(val));
        }
        let tokenMasked = !!settings.store.sessionToken;
        function escapeHtml(s) {
            return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        function syncOverlayScroll() {
            if (!sessionToken || !sessionTokenOverlay)
                return;
            sessionTokenOverlay.style.transform = `translateX(${-sessionToken.scrollLeft}px)`;
        }
        function buildTokenChars(masked) {
            if (!sessionToken || !sessionTokenOverlay)
                return;
            const value = sessionToken.value;
            sessionToken.classList.toggle("ub-token-empty", !value);
            if (!value) {
                sessionTokenOverlay.innerHTML = "";
                syncOverlayScroll();
                return;
            }
            const chars = value.split("");
            sessionTokenOverlay.innerHTML = chars.map((ch, i) => {
                const delay = masked ? i * 16 : (chars.length - 1 - i) * 16;
                return `<span class="ub-token-char">` +
                    `<span class="ub-token-glyph ub-token-glyph-letter${!masked ? " ub-token-shown" : ""}" style="transition-delay:${delay}ms">${escapeHtml(ch)}</span>` +
                    `<span class="ub-token-glyph ub-token-glyph-dot${masked ? " ub-token-shown" : ""}" style="transition-delay:${delay}ms">•</span>` +
                    `</span>`;
            }).join("");
            syncOverlayScroll();
        }
        function setTokenMasked(masked) {
            if (!sessionTokenOverlay)
                return;
            const charEls = sessionTokenOverlay.querySelectorAll(".ub-token-char");
            const total = charEls.length;
            charEls.forEach((charEl, i) => {
                const delay = masked ? i * 16 : (total - 1 - i) * 16;
                const letter = charEl.querySelector(".ub-token-glyph-letter");
                const dot = charEl.querySelector(".ub-token-glyph-dot");
                if (letter) {
                    letter.style.transitionDelay = `${delay}ms`;
                    letter.classList.toggle("ub-token-shown", !masked);
                }
                if (dot) {
                    dot.style.transitionDelay = `${delay}ms`;
                    dot.classList.toggle("ub-token-shown", masked);
                }
            });
            syncOverlayScroll();
        }
        sessionToken?.addEventListener("focus", () => {
            tokenMasked = false;
            setTokenMasked(false);
        });
        sessionToken?.addEventListener("blur", () => {
            if (!sessionToken.value) {
                tokenMasked = true;
                return;
            }
            requestAnimationFrame(() => {
                tokenMasked = true;
                setTokenMasked(true);
            });
        });
        sessionToken?.addEventListener("input", () => {
            buildTokenChars(document.activeElement === sessionToken ? false : tokenMasked);
        });
        sessionToken?.addEventListener("scroll", syncOverlayScroll);
        const guidelinesPanel = $("ub-guidelines-panel");
        const guidelinesBackdrop = $("ub-guidelines-backdrop");
        const CRT_CLOSE_ANIM_MS = 340;
        let guidelinesClosing = false;
        function openGuidelines() {
            if (!guidelinesPanel)
                return;
            guidelinesClosing = false;
            guidelinesPanel.classList.remove("ub-panel-closing");
            void guidelinesPanel.offsetWidth;
            guidelinesPanel.classList.add("ub-panel-open");
            if (guidelinesBackdrop)
                guidelinesBackdrop.classList.add("ub-backdrop-open");
        }
        function closeGuidelines() {
            if (!guidelinesPanel || guidelinesClosing || !guidelinesPanel.classList.contains("ub-panel-open"))
                return;
            guidelinesClosing = true;
            if (guidelinesBackdrop)
                guidelinesBackdrop.classList.remove("ub-backdrop-open");
            guidelinesPanel.classList.add("ub-panel-closing");
            setTimeout(() => {
                guidelinesPanel.classList.remove("ub-panel-open", "ub-panel-closing");
                guidelinesClosing = false;
            }, CRT_CLOSE_ANIM_MS);
        }
        $("ub-view-guidelines")?.addEventListener("click", openGuidelines);
        $("ub-guidelines-close")?.addEventListener("click", closeGuidelines);
        $("ub-guidelines-close-btn")?.addEventListener("click", closeGuidelines);
        guidelinesBackdrop?.addEventListener("click", closeGuidelines);
        function updatePopupLockState() {
            const locked = settings.store.badgeMode === "vencord";
            showPopupRow?.classList.toggle("ub-disabled", locked);
            if (showPopupSwitch)
                showPopupSwitch.disabled = locked;
            showOwnerTagRow?.classList.toggle("ub-disabled", locked);
            if (showOwnerTagSwitch)
                showOwnerTagSwitch.disabled = locked;
        }
        wireDropdown("ub-badge-mode-dropdown", "ub-badge-mode", "ub-badge-mode-value", val => {
            settings.store.badgeMode = val;
            bridge.onBadgeModeChange(val);
            updatePopupLockState();
        });
        wireSwitch(showTooltipSwitch, val => {
            settings.store.showTooltip = val;
        });
        wireSwitch(showPopupSwitch, val => {
            settings.store.showPopup = val;
        });
        wireSwitch(showOwnerTagSwitch, val => {
            settings.store.showOwnerTag = val;
        });
        wireSwitch(appendTagSwitch, val => {
            settings.store.appendTag = val;
            updatePreview();
            bridge.publishBadge();
        });
        wireSwitch(hideOwnBadgeSwitch, val => {
            settings.store.hideOwnBadge = val;
        });
        wireDropdown("ub-selected-preset-dropdown", "ub-selected-preset", "ub-selected-preset-value", val => {
            settings.store.selectedPreset = val;
        });
        function updateGlowFieldState() {
            glowColorField?.classList.toggle("ub-disabled", hoverEffectInput?.value !== "glow");
        }
        function updateGradientFieldsState() {
            gradientFields?.classList.toggle("ub-disabled", bgModeInput?.value !== "edit");
        }
        wireChoiceGroup("ub-icon-shape-group", "ub-icon-shape", val => {
            settings.store.badgeIconShape = val;
            updatePreview();
            bridge.publishBadge();
        });
        iconSize?.addEventListener("input", () => {
            if (iconSizeValue)
                iconSizeValue.textContent = `${iconSize.value}px`;
            settings.store.badgeIconSize = Number(iconSize.value);
            updatePreview();
            bridge.publishBadge();
        });
        iconSize?.addEventListener("change", () => {
            settings.store.badgeIconSize = Number(iconSize.value);
            updatePreview();
            bridge.publishBadge();
        });
        wireChoiceGroup("ub-hover-effect-group", "ub-hover-effect", val => {
            settings.store.badgeHoverEffect = val;
            updateGlowFieldState();
            bridge.publishBadge();
        });
        glowColor?.addEventListener("input", () => {
            if (glowColorHex)
                glowColorHex.textContent = glowColor.value.toUpperCase();
            settings.store.badgeGlowColor = glowColor.value;
            bridge.publishBadge();
        });
        glowColor?.addEventListener("change", () => {
            settings.store.badgeGlowColor = glowColor.value;
            bridge.publishBadge();
        });
        wireChoiceGroup("ub-bg-mode-group", "ub-bg-mode", val => {
            settings.store.popupBackgroundMode = val;
            updateGradientFieldsState();
            updatePreview();
            bridge.publishBadge();
        });
        gradientMain?.addEventListener("input", () => {
            if (gradientMainHex)
                gradientMainHex.textContent = gradientMain.value.toUpperCase();
            settings.store.popupGradientMain = gradientMain.value;
            updatePreview();
            bridge.publishBadge();
        });
        gradientMain?.addEventListener("change", () => {
            settings.store.popupGradientMain = gradientMain.value;
            updatePreview();
            bridge.publishBadge();
        });
        gradientSecondary?.addEventListener("input", () => {
            if (gradientSecondaryHex)
                gradientSecondaryHex.textContent = gradientSecondary.value.toUpperCase();
            settings.store.popupGradientSecondary = gradientSecondary.value;
            updatePreview();
            bridge.publishBadge();
        });
        gradientSecondary?.addEventListener("change", () => {
            settings.store.popupGradientSecondary = gradientSecondary.value;
            updatePreview();
            bridge.publishBadge();
        });
        nameColor?.addEventListener("input", () => {
            if (nameColorHex)
                nameColorHex.textContent = nameColor.value.toUpperCase();
            settings.store.badgeNameColor = nameColor.value;
            updatePreview();
            bridge.publishBadge();
        });
        nameColor?.addEventListener("change", () => {
            settings.store.badgeNameColor = nameColor.value;
            updatePreview();
            bridge.publishBadge();
        });
        wireChoiceGroup("ub-popup-anim-group", "ub-popup-anim", val => {
            settings.store.popupAnimationStyle = val;
            bridge.publishBadge();
        });
        const previewEmpties = Array.from(root.querySelectorAll(".ub-preview-empty"));
        const previewContents = Array.from(root.querySelectorAll(".ub-preview-content"));
        const previewRowIcons = Array.from(root.querySelectorAll(".ub-preview-row-icon"));
        const popupCards = Array.from(root.querySelectorAll(".ub-popup-card"));
        const popupImgs = Array.from(root.querySelectorAll(".ub-popup-img"));
        const popupNames = Array.from(root.querySelectorAll(".ub-popup-name"));
        const popupBys = Array.from(root.querySelectorAll(".ub-popup-by"));
        const previewWarnings = Array.from(root.querySelectorAll(".ub-preview-warning"));
        const radiusFor = (shape) => (shape === "circle" ? "50%" : shape === "rounded" ? "6px" : "0");
        let previewToken = 0;
        async function updatePreview() {
            const token = ++previewToken;
            const url = badgeImageUrl?.value.trim() ?? "";
            const name = badgeName?.value.trim() ?? "";
            if (!url || !name) {
                previewEmpties.forEach(el => el.style.display = "");
                previewContents.forEach(el => el.style.display = "none");
                return;
            }
            previewEmpties.forEach(el => el.style.display = "none");
            previewContents.forEach(el => el.style.display = "");
            const bridge = getDashboardBridge();
            const data = await bridge?.getPreviewData();
            if (token !== previewToken)
                return;
            const radius = radiusFor(data?.iconShape ?? "circle");
            previewRowIcons.forEach(el => {
                el.src = data?.imageUrl ?? url;
                el.style.width = `${data?.iconSize ?? 22}px`;
                el.style.height = `${data?.iconSize ?? 22}px`;
                el.style.borderRadius = radius;
            });
            popupCards.forEach(el => {
                el.style.background = data?.background ?? "#1d1d1d";
            });
            popupImgs.forEach(el => {
                el.src = data?.imageUrl ?? url;
                el.style.borderRadius = radius;
            });
            popupNames.forEach(el => {
                el.textContent = data?.displayName ?? name;
                el.style.color = data?.nameColor ?? "#ffffff";
            });
            popupBys.forEach(el => {
                el.textContent = data?.ownerTag ?? "";
                el.style.display = data?.ownerTag ? "" : "none";
            });
            previewWarnings.forEach(el => {
                el.style.display = data?.sampleFailed ? "" : "none";
            });
        }
        const myBadgesListEl = $("ub-my-badges-list");
        function renderMyBadgesList() {
            if (!myBadgesListEl)
                return;
            let badges = [];
            try {
                badges = JSON.parse(settings.store.myBadgesJson || "[]");
            }
            catch {
                badges = [];
            }
            const activeId = settings.store.myActiveBadgeId ?? "";
            if (!badges.length) {
                myBadgesListEl.innerHTML = "";
                return;
            }
            myBadgesListEl.innerHTML = badges.map(b => {
                const isActive = b.id === activeId;
                return `
                    <div class="ub-badge-row${isActive ? " ub-badge-active" : ""}" data-badge-id="${b.id}">
                        <img class="ub-badge-thumb" src="${b.imageUrl || ""}" alt="${b.description || ""}" referrerpolicy="no-referrer" />
                        <span class="ub-badge-row-name">
                            ${b.description || "Unnamed badge"}${isActive ? `<span class="ub-badge-active-tag">(active)</span>` : ""}
                        </span>
                        <div class="ub-badge-row-actions">
                            ${!isActive ? `<button type="button" class="ub-badge-use-btn" data-use-id="${b.id}">Use</button>` : ""}
                            <button type="button" class="ub-badge-delete-btn" data-delete-id="${b.id}">Delete</button>
                        </div>
                    </div>
                `;
            }).join("");
            myBadgesListEl.querySelectorAll(".ub-badge-use-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.dataset.useId;
                    if (!id)
                        return;
                    btn.disabled = true;
                    btn.textContent = "...";
                    try {
                        await bridge.switchToBadge(id);
                    }
                    finally {
                        syncFromStore();
                    }
                });
            });
            myBadgesListEl.querySelectorAll(".ub-badge-delete-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.dataset.deleteId;
                    if (!id)
                        return;
                    btn.disabled = true;
                    btn.textContent = "...";
                    try {
                        await bridge.deleteBadgeSlot(id);
                    }
                    finally {
                        syncFromStore();
                    }
                });
            });
        }
        function syncFromStore() {
            if (apiBaseUrl)
                apiBaseUrl.value = settings.store.apiBaseUrl ?? "";
            if (badgeImageUrl)
                badgeImageUrl.value = settings.store.myBadgeImageUrl ?? "";
            if (badgeName)
                badgeName.value = settings.store.myBadgeName ?? "";
            if (sessionToken)
                sessionToken.value = settings.store.sessionToken ?? "";
            if (selfUserId)
                selfUserId.value = settings.store.selfUserId ?? "";
            tokenMasked = document.activeElement === sessionToken ? false : !!settings.store.sessionToken;
            buildTokenChars(tokenMasked);
            if (revokeTokenBtn)
                revokeTokenBtn.disabled = !settings.store.sessionToken;
            renderMyBadgesList();
            const modeVal = settings.store.badgeMode ?? "original";
            if (badgeModeInput)
                badgeModeInput.value = modeVal;
            const modeOpt = root.querySelector(`#ub-badge-mode-menu .ub-dropdown-option[data-value="${modeVal}"]`);
            if (modeOpt) {
                root.querySelector("#ub-badge-mode-value").textContent = modeOpt.textContent ?? "";
                root.querySelectorAll("#ub-badge-mode-menu .ub-dropdown-option").forEach(o => o.classList.remove("selected"));
                modeOpt.classList.add("selected");
            }
            const presetVal = String(settings.store.selectedPreset ?? "0");
            if (selectedPresetInput)
                selectedPresetInput.value = presetVal;
            const presetOpt = root.querySelector(`#ub-selected-preset-menu .ub-dropdown-option[data-value="${presetVal}"]`);
            if (presetOpt) {
                root.querySelector("#ub-selected-preset-value").textContent = presetOpt.textContent ?? "";
                root.querySelectorAll("#ub-selected-preset-menu .ub-dropdown-option").forEach(o => o.classList.remove("selected"));
                presetOpt.classList.add("selected");
            }
            setChoiceGroupValue("ub-icon-shape-group", "ub-icon-shape", settings.store.badgeIconShape ?? "circle");
            const sizeVal = settings.store.badgeIconSize ?? 22;
            if (iconSize)
                iconSize.value = String(sizeVal);
            if (iconSizeValue)
                iconSizeValue.textContent = `${sizeVal}px`;
            setChoiceGroupValue("ub-hover-effect-group", "ub-hover-effect", settings.store.badgeHoverEffect ?? "none");
            const glowVal = settings.store.badgeGlowColor ?? "#ffffff";
            if (glowColor)
                glowColor.value = glowVal;
            if (glowColorHex)
                glowColorHex.textContent = glowVal.toUpperCase();
            updateGlowFieldState();
            setChoiceGroupValue("ub-bg-mode-group", "ub-bg-mode", settings.store.popupBackgroundMode ?? "base");
            const gradMainVal = settings.store.popupGradientMain ?? "#1d1d1d";
            if (gradientMain)
                gradientMain.value = gradMainVal;
            if (gradientMainHex)
                gradientMainHex.textContent = gradMainVal.toUpperCase();
            const gradSecVal = settings.store.popupGradientSecondary ?? "#2a2a38";
            if (gradientSecondary)
                gradientSecondary.value = gradSecVal;
            if (gradientSecondaryHex)
                gradientSecondaryHex.textContent = gradSecVal.toUpperCase();
            updateGradientFieldsState();
            const nameColorVal = settings.store.badgeNameColor ?? "#ffffff";
            if (nameColor)
                nameColor.value = nameColorVal;
            if (nameColorHex)
                nameColorHex.textContent = nameColorVal.toUpperCase();
            setChoiceGroupValue("ub-popup-anim-group", "ub-popup-anim", settings.store.popupAnimationStyle ?? "fade");
            setSwitchValue(showTooltipSwitch, settings.store.showTooltip ?? true);
            setSwitchValue(showPopupSwitch, settings.store.showPopup ?? true);
            setSwitchValue(showOwnerTagSwitch, settings.store.showOwnerTag ?? true);
            setSwitchValue(appendTagSwitch, settings.store.appendTag ?? false);
            setSwitchValue(hideOwnBadgeSwitch, settings.store.hideOwnBadge ?? false);
            updatePopupLockState();
            updatePreview();
        }
        syncFromStore();
        apiBaseUrl?.addEventListener("change", () => {
            settings.store.apiBaseUrl = apiBaseUrl.value;
        });
        badgeImageUrl?.addEventListener("input", () => {
            settings.store.myBadgeImageUrl = badgeImageUrl.value;
            updatePreview();
            bridge.publishBadge();
        });
        badgeImageUrl?.addEventListener("change", () => {
            settings.store.myBadgeImageUrl = badgeImageUrl.value;
            updatePreview();
            bridge.publishBadge();
        });
        badgeName?.addEventListener("input", () => {
            settings.store.myBadgeName = badgeName.value;
            updatePreview();
            bridge.publishBadge();
        });
        badgeName?.addEventListener("change", () => {
            settings.store.myBadgeName = badgeName.value;
            updatePreview();
            bridge.publishBadge();
        });
        const applyBadgeBtn = $("ub-apply-badge");
        applyBadgeBtn?.addEventListener("click", async () => {
            if (applyBadgeBtn.disabled) return;
            applyBadgeBtn.disabled = true;
            const originalLabel = applyBadgeBtn.textContent;
            applyBadgeBtn.textContent = "Applying...";
            try {
                await bridge.applyBadgeNow();
            }
            finally {
                applyBadgeBtn.disabled = false;
                applyBadgeBtn.textContent = originalLabel;
            }
        });
        $("ub-share-badge")?.addEventListener("click", () => bridge.shareMyBadge());
        $("ub-revert-badge")?.addEventListener("click", () => {
            bridge.revertBadge();
            syncFromStore();
        });
        $("ub-refresh-cache")?.addEventListener("click", () => bridge.refreshBadgeCache());
        $("ub-import-badge")?.addEventListener("click", () => {
            settings.store.importBadgeCode = importBadgeCode?.value ?? "";
            bridge.importBadgeFromCode();
            if (importBadgeCode)
                importBadgeCode.value = "";
            syncFromStore();
        });
        $("ub-apply-preset")?.addEventListener("click", () => {
            bridge.applySelectedPreset();
            syncFromStore();
        });
        $("ub-new-badge-slot")?.addEventListener("click", () => {
            bridge.createNewBadgeSlot();
            syncFromStore();
        });
        $("ub-import-pack")?.addEventListener("click", () => {
            settings.store.importPackUrl = importPackUrl?.value ?? "";
            bridge.importPackFromUrl();
            syncFromStore();
        });
        $("ub-make-pack")?.addEventListener("click", () => {
            bridge.makePack();
            if (!settings.store.packGuidelinesShown) {
                settings.store.packGuidelinesShown = true;
                openGuidelines();
            }
        });
        $("ub-browse-packs")?.addEventListener("click", () => bridge.browsePacks());
        $("ub-verify-account")?.addEventListener("click", () => bridge.verifyAccount());
        sessionToken?.addEventListener("change", () => {
            settings.store.sessionToken = sessionToken.value;
            if (revokeTokenBtn)
                revokeTokenBtn.disabled = !settings.store.sessionToken;
            fetchWriteBudget();
        });
        selfUserId?.addEventListener("change", () => {
            const val = selfUserId.value.trim();
            if (val && !/^\d{15,25}$/.test(val)) {
                toast("That doesn't look like a Discord User ID (should be a 15-25 digit number)", { type: "error" });
                return;
            }
            settings.store.selfUserId = val;
            if (val) toast("Manual User ID saved - publishing will use this instead of auto-detection", { type: "success" });
        });
        revokeTokenBtn?.addEventListener("click", async () => {
            if (!settings.store.sessionToken || revokeTokenBtn.disabled)
                return;
            revokeTokenBtn.disabled = true;
            const originalLabel = revokeTokenBtn.textContent;
            revokeTokenBtn.textContent = "Revoking...";
            try {
                await bridge.revokeSessionToken();
            }
            finally {
                syncFromStore();
                if (revokeTokenBtn.textContent === "Revoking...")
                    revokeTokenBtn.textContent = originalLabel;
            }
        });
    }})();
