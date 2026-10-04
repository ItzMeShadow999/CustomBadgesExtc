(function() {
  "use strict";
  const API_BASE = "https://custom-badges.shadow-164.workers.dev";
  const CACHE_TTL = 3e4;
  const badgeCache = new Map;
  const imageSourceCache = new Map;
  const MARKER = "data-cb-remote-v11";
  function log(...a) {
    console.log("[CustomBadges]", ...a);
  }
  const styleId = "cb-remote-styles";
  if (!document.getElementById(styleId)) {
    const css = document.createElement("style");
    css.id = styleId;
    css.textContent = `\n            .cb-badge-img {\n                object-fit: contain;\n                display: inline-block;\n                vertical-align: middle;\n                cursor: default;\n            }\n            .cb-badge-img.cb-hover-scale {\n                transition: transform 0.12s ease;\n            }\n            .cb-badge-img.cb-hover-glow {\n                transition: filter 0.18s cubic-bezier(0.16,1,0.3,1);\n            }\n            .cb-badge-img.cb-clickable {\n                cursor: pointer;\n            }\n            /* ── Tooltip ── */\n            .cb-tooltip-el {\n                position: fixed;\n                z-index: 10002;\n                pointer-events: none;\n                opacity: 0;\n                transform: translateY(4px);\n                transition: opacity 120ms ease, transform 120ms ease;\n                background: #000000;\n                color: #ffffff;\n                font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;\n                font-size: 14px;\n                font-weight: 500;\n                line-height: 18px;\n                padding: 8px 12px;\n                border-radius: 6px;\n                box-shadow: 0 8px 16px rgba(0,0,0,0.36);\n                white-space: nowrap;\n                max-width: 280px;\n                text-align: center;\n            }\n            .cb-tooltip-el.visible {\n                opacity: 1;\n                transform: translateY(0);\n            }\n            /* ── Popup Card ── */\n            .cb-badge-popup {\n                position: fixed;\n                z-index: 10001;\n                background: var(--cb-popup-bg, #1d1d1d);\n                border-radius: 8px;\n                padding: 20px 28px;\n                text-align: center;\n                box-shadow: 0 8px 24px rgba(0,0,0,0.5);\n                opacity: 0;\n                pointer-events: none;\n                transition: opacity 0.24s cubic-bezier(0.16,1,0.3,1),\n                            transform 0.24s cubic-bezier(0.16,1,0.3,1);\n                font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;\n                min-width: 180px;\n                width: fit-content;\n            }\n            .cb-badge-popup.visible {\n                opacity: 1;\n                pointer-events: auto;\n            }\n            /* Animation variants */\n            .cb-badge-popup.cb-anim-fade {\n                transform: translateY(8px) scale(0.96);\n            }\n            .cb-badge-popup.cb-anim-fade.visible {\n                transform: translateY(0) scale(1);\n            }\n            .cb-badge-popup.cb-anim-scale {\n                transform: scale(0.8);\n                transform-origin: 50% 100%;\n            }\n            .cb-badge-popup.cb-anim-scale.visible {\n                transform: scale(1);\n            }\n            .cb-badge-popup.cb-anim-slide {\n                transform: translateY(16px);\n            }\n            .cb-badge-popup.cb-anim-slide.visible {\n                transform: translateY(0);\n            }\n            /* Arrow */\n            .cb-badge-popup::after {\n                content: "";\n                position: absolute;\n                top: 100%;\n                left: 50%;\n                transform: translateX(-50%);\n                border-width: 7px;\n                border-style: solid;\n                border-color: var(--cb-popup-arrow, var(--cb-popup-bg, #1d1d1d)) transparent transparent transparent;\n            }\n            .cb-badge-popup img {\n                width: 64px;\n                height: 64px;\n                border-radius: 50%;\n                object-fit: cover;\n                margin: 0 auto 14px auto;\n                display: block;\n            }\n            .cb-badge-popup .cb-name {\n                font-weight: 800;\n                font-size: 16px;\n                letter-spacing: 0.3px;\n                line-height: 1.2;\n            }\n            .cb-badge-popup .cb-by {\n                font-size: 12px;\n                color: #949ba4;\n                margin-top: 4px;\n            }\n        `;
    (document.head || document.documentElement).appendChild(css);
  }
  let _tooltipEl = null;
  function getTooltip() {
    if (_tooltipEl) return _tooltipEl;
    _tooltipEl = document.createElement("div");
    _tooltipEl.className = "cb-tooltip-el";
    document.body.appendChild(_tooltipEl);
    return _tooltipEl;
  }
  function showTooltip(text, rect) {
    const el = getTooltip();
    el.textContent = text;
    el.classList.add("visible");
    const ttRect = el.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - ttRect.width / 2;
    let top = rect.top - ttRect.height - 10;
    left = Math.max(8, Math.min(left, window.innerWidth - ttRect.width - 8));
    top = Math.max(8, top);
    el.style.left = left + "px";
    el.style.top = top + "px";
  }
  function hideTooltip() {
    _tooltipEl?.classList.remove("visible");
  }
  let _popupEl = null;
  let _popupOpenFor = null;
  let _followRaf = null;
  let _globalCloseAttached = false;
  let _onGlobalPointerDown = null;
  let _onGlobalScroll = null;
  function getPopupEl() {
    if (_popupEl) return _popupEl;
    _popupEl = document.createElement("div");
    _popupEl.className = "cb-badge-popup";
    document.body.appendChild(_popupEl);
    return _popupEl;
  }
  function positionPopup(target, el) {
    const rect = target.getBoundingClientRect();
    const top = rect.top - el.offsetHeight - 12;
    const left = rect.left + rect.width / 2 - el.offsetWidth / 2;
    el.style.top = `${Math.max(top, 4)}px`;
    el.style.left = `${Math.max(left, 4)}px`;
  }
  function isTargetVisible(target) {
    if (!document.body.contains(target)) return false;
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= vh || rect.left >= vw) return false;
    let node = target.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      if (cs.overflow !== "visible" || cs.overflowX !== "visible" || cs.overflowY !== "visible") {
        const nr = node.getBoundingClientRect();
        if (nr.width <= 0 || nr.height <= 0) return false;
        if (rect.bottom <= nr.top || rect.top >= nr.bottom || rect.right <= nr.left || rect.left >= nr.right) return false;
      }
      node = node.parentElement;
    }
    return true;
  }
  function startFollowingPopup(target) {
    stopFollowingPopup();
    const step = () => {
      if (!_popupOpenFor || _popupOpenFor !== target) return;
      if (!isTargetVisible(target)) {
        hidePopup();
        return;
      }
      positionPopup(target, getPopupEl());
      _followRaf = requestAnimationFrame(step);
    };
    _followRaf = requestAnimationFrame(step);
  }
  function stopFollowingPopup() {
    if (_followRaf != null) {
      cancelAnimationFrame(_followRaf);
      _followRaf = null;
    }
  }
  function hidePopup() {
    stopFollowingPopup();
    detachGlobalCloseListeners();
    getPopupEl().classList.remove("visible");
    _popupOpenFor = null;
  }
  function attachGlobalCloseListeners() {
    if (_globalCloseAttached) return;
    _globalCloseAttached = true;
    _onGlobalPointerDown = e => {
      const popupEl = _popupEl;
      const openTarget = _popupOpenFor;
      if (!openTarget) return;
      if (popupEl && popupEl.contains(e.target)) return;
      if (e.target === openTarget || openTarget.contains && openTarget.contains(e.target)) return;
      hidePopup();
    };
    _onGlobalScroll = () => {
      hidePopup();
    };
    document.addEventListener("pointerdown", _onGlobalPointerDown, true);
    document.addEventListener("scroll", _onGlobalScroll, true);
  }
  function detachGlobalCloseListeners() {
    if (!_globalCloseAttached) return;
    _globalCloseAttached = false;
    if (_onGlobalPointerDown) document.removeEventListener("pointerdown", _onGlobalPointerDown, true);
    if (_onGlobalScroll) document.removeEventListener("scroll", _onGlobalScroll, true);
    _onGlobalPointerDown = null;
    _onGlobalScroll = null;
  }
  const _sampledColorCache = new Map;
  function sampleImageColor(url) {
    if (_sampledColorCache.has(url)) return Promise.resolve(_sampledColorCache.get(url));
    return new Promise(resolve => {
      const img = new Image;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const size = 32;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) return finish(null);
          ctx.drawImage(img, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 32) continue;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
          if (!count) return finish(null);
          finish(`rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`);
        } catch (e) {
          finish(null);
        }
      };
      img.onerror = () => finish(null);
      img.src = url;
      function finish(color) {
        _sampledColorCache.set(url, color);
        resolve(color);
      }
    });
  }
  async function getPopupBackground(imageUrl, style) {
    if (style.popupBackgroundMode === "edit") {
      return {
        background: `radial-gradient(120% 100% at 50% 0%, ${style.popupGradientSecondary} 0%, ${style.popupGradientMain} 65%)`,
        edgeColor: style.popupGradientMain
      };
    }
    if (style.popupBackgroundMode === "sample") {
      const sampled = await sampleImageColor(imageUrl);
      if (sampled) {
        return {
          background: `radial-gradient(120% 100% at 50% 0%, ${sampled} 0%, #1d1d1d 65%)`,
          edgeColor: "#1d1d1d"
        };
      }
      return {
        background: "#1d1d1d",
        edgeColor: "#1d1d1d"
      };
    }
    return {
      background: "#1d1d1d",
      edgeColor: "#1d1d1d"
    };
  }
  async function showBadgePopup(target, imageUrl, rawName, ownerUsername, style) {
    const el = getPopupEl();
    const anim = style.popupAnimation || "fade";
    el.className = `cb-badge-popup cb-anim-${anim}`;
    const displayName = formatBadgeName(rawName, style.appendTag);
    const nameColor = style.nameColor || "#ffffff";
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = displayName;
    image.referrerPolicy = "no-referrer";
    const name = document.createElement("div");
    name.className = "cb-name";
    name.style.color = nameColor;
    name.textContent = displayName;
    const by = ownerUsername ? document.createElement("div") : null;
    if (by) {
      by.className = "cb-by";
      by.textContent = `By ${ownerUsername}`;
    }
    el.replaceChildren(image, name);
    if (by) el.appendChild(by);
    el.classList.add("visible");
    _popupOpenFor = target;
    positionPopup(target, el);
    startFollowingPopup(target);
    attachGlobalCloseListeners();
    const result = await getPopupBackground(imageUrl, style);
    if (_popupOpenFor === target) {
      el.style.setProperty("--cb-popup-bg", result.background);
      el.style.setProperty("--cb-popup-arrow", result.edgeColor);
    }
  }
  function getUserId(root) {
    const avatar = root.querySelector('img[src*="cdn.discordapp.com/avatars/"]');
    if (avatar) {
      const m = avatar.src.match(/avatars\/(\d+)\//);
      if (m) return m[1];
    }
    const el = root.querySelector("[data-user-id]");
    if (el) return el.dataset.userId;
    return null;
  }
  function getOwnerUsername(root) {
    const exactUsernameEl = root.querySelector('[class*="userTagUsername"]');
    if (exactUsernameEl && exactUsernameEl.textContent && exactUsernameEl.textContent.trim()) {
      const exact = sanitizeUsername(exactUsernameEl.textContent);
      if (exact) return exact;
    }
    const nameSelectors = [ '[class*="username"]', '[class*="userTag"]', '[class*="nameTag"]', '[class*="nickname"]', "h1" ];
    for (const sel of nameSelectors) {
      const candidates = root.querySelectorAll(sel);
      for (const el of candidates) {
        if (!el || !el.textContent || !el.textContent.trim()) continue;
        const candidate = sanitizeUsername(el.textContent);
        if (isLikelyUsername(candidate)) return candidate;
      }
    }
    const avatar = root.querySelector('img[src*="cdn.discordapp.com/avatars/"]');
    if (avatar && avatar.alt && avatar.alt.trim()) {
      const candidate = sanitizeUsername(avatar.alt);
      if (isLikelyUsername(candidate)) return candidate;
    }
    for (const sel of nameSelectors) {
      const el = root.querySelector(sel);
      if (el && el.textContent && el.textContent.trim()) return sanitizeUsername(el.textContent);
    }
    return null;
  }
  async function fetchBadge(userId) {
    if (!userId) return null;
    const cached = badgeCache.get(userId);
    if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;
    try {
      const payload = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: "fetchBadge",
          userId: userId
        }, response => {
          const error = chrome.runtime.lastError;
          if (error) return reject(new Error(error.message));
          resolve(response);
        });
      });
      const data = Array.isArray(payload) ? payload.find(Boolean) : Array.isArray(payload?.badges) ? payload.badges.find(b => b && (!payload.activeId || b.id === payload.activeId)) : payload;
      badgeCache.set(userId, {
        data: data,
        time: Date.now()
      });
      return data;
    } catch (e) {
      log("Fetch error:", e.message);
      return null;
    }
  }
  async function getImageSource(url) {
    if (!url || url.startsWith("data:") || url.startsWith("blob:")) return url;
    if (imageSourceCache.has(url)) return imageSourceCache.get(url);
    const source = await new Promise(resolve => {
      chrome.runtime.sendMessage({
        action: "fetchImage",
        imageUrl: url
      }, response => {
        if (chrome.runtime.lastError || !response || response.error) return resolve(url);
        resolve(response.dataUrl || url);
      });
    });
    imageSourceCache.set(url, source);
    return source;
  }
  function makeBadge(data, userId, ownerUsername, imageSource) {
    const style = data.style || {};
    const shape = style.iconShape || "circle";
    const hoverFx = style.hoverEffect || "none";
    const glowColor = style.glowColor || "#ffffff";
    const iconSize = style.iconSize || 22;
    const badgeTitle = data.description || "Custom Badge";
    const img = document.createElement("img");
    img.src = imageSource || data.imageUrl;
    img.dataset.cbImageSource = imageSource || data.imageUrl;
    img.alt = badgeTitle;
    img.referrerPolicy = "no-referrer";
    img.className = "cb-badge-img cb-injected-badge";
    img.dataset.cbUserId = userId;
    if (ownerUsername) img.dataset.cbOwnerUsername = ownerUsername;
    if (hoverFx === "scale") img.classList.add("cb-hover-scale");
    if (hoverFx === "glow") img.classList.add("cb-hover-glow");
    if (data.link) img.classList.add("cb-clickable");
    const radius = shape === "circle" ? "50%" : shape === "rounded" ? "6px" : "0";
    Object.assign(img.style, {
      width: `${iconSize}px`,
      height: `${iconSize}px`,
      borderRadius: radius,
      marginLeft: "4px"
    });
    if (hoverFx === "scale") {
      img.addEventListener("mouseenter", () => {
        img.style.transform = "scale(1.15)";
      });
      img.addEventListener("mouseleave", () => {
        img.style.transform = "";
      });
    } else if (hoverFx === "glow") {
      img.addEventListener("mouseenter", () => {
        img.style.filter = `drop-shadow(0 0 6px ${glowColor})`;
      });
      img.addEventListener("mouseleave", () => {
        img.style.filter = "";
      });
    }
    img.addEventListener("mouseenter", () => {
      const rect = img.getBoundingClientRect();
      showTooltip(badgeTitle, rect);
    });
    img.addEventListener("mouseleave", hideTooltip);
    img.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      if (_popupOpenFor === img) {
        hidePopup();
      } else {
        showBadgePopup(img, img.dataset.cbImageSource || data.imageUrl, data.description || "Custom Badge", img.dataset.cbOwnerUsername || null, style);
      }
    });
    return img;
  }
  async function process(root) {
    if (root.hasAttribute(MARKER)) return;
    const userId = getUserId(root);
    if (!userId) return;
    root.setAttribute(MARKER, "1");
    const data = await fetchBadge(userId);
    if (!data || !data.imageUrl) {
      log("No remote badge for", userId);
      return;
    }
    const imageSource = await getImageSource(data.imageUrl);
    let container = root.querySelector('div[aria-label="User Badges"]');
    if (!container) {
      const nameEl = root.querySelector('h1, [class*="nameTag"], [class*="nickname"]');
      if (!nameEl) return;
      container = document.createElement("div");
      container.setAttribute("aria-label", "User Badges");
      container.setAttribute("role", "group");
      container.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:6px 0;";
      const parent = nameEl.closest("div[class]") || nameEl.parentElement;
      if (parent && parent.nextSibling) {
        parent.parentNode.insertBefore(container, parent.nextSibling);
      } else {
        return;
      }
    }
    container.querySelectorAll(".cb-injected-badge").forEach(el => el.remove());
    const ownerUsername = getOwnerUsername(root);
    container.appendChild(makeBadge(data, userId, ownerUsername, imageSource));
    log("Injected remote badge for", userId);
  }
  function scan() {
    const roots = new Set;
    [ '[class*="userProfileModalInner"]', '[class*="userProfileModal"]', '[class*="userPopoutInner"]', '[class*="userPopout"]', '[class*="profilePanel"]', '[class*="accountProfilePopoutWrapper"]', '[role="dialog"]' ].forEach(sel => document.querySelectorAll(sel).forEach(el => roots.add(el)));
    document.querySelectorAll('img[src*="avatars"]').forEach(img => {
      if (img.getBoundingClientRect().width >= 64) {
        const p = img.closest("[class]");
        if (p) roots.add(p);
      }
    });
    document.querySelectorAll('div[aria-label="User Badges"]').forEach(badgesEl => {
      let anc = badgesEl;
      for (let i = 0; i < 8 && anc.parentElement; i++) {
        anc = anc.parentElement;
        if (anc.querySelector('img[src*="cdn.discordapp.com/avatars/"]')) break;
      }
      roots.add(anc);
    });
    roots.forEach(process);
  }
  const KNOWN_STATUS_SUFFIXES = [ "Online", "Idle", "Away", "Do Not Disturb", "Streaming", "Invisible", "Offline" ];
  const USERNAME_TOKEN_RE = /^@?[a-z0-9._]{2,32}$/;
  const ACTIVITY_WORD_BLOCKLIST = new Set([ "played", "playing", "listening", "watching", "streaming", "competing", "spotify", "editing", "ago", "hr", "hrs", "min", "mins", "now", "since", "elapsed" ]);
  function isLikelyUsername(s) {
    if (!s) return false;
    const clean = s.replace(/^@/, "");
    return USERNAME_TOKEN_RE.test(clean) && !ACTIVITY_WORD_BLOCKLIST.has(clean.toLowerCase());
  }
  function sanitizeUsername(raw) {
    let out = (raw || "").trim();
    for (const suffix of KNOWN_STATUS_SUFFIXES) {
      if (out.length > suffix.length && out.endsWith(suffix)) {
        out = out.slice(0, out.length - suffix.length).trim();
      }
    }
    out = out.trim();
    const bulletMatch = out.match(/^@?([a-z0-9._]{2,32})\s*(?:•|\u2022)/i);
    if (bulletMatch && isLikelyUsername(bulletMatch[1])) return bulletMatch[1].replace(/^@/, "");
    if (isLikelyUsername(out)) return out.replace(/^@/, "");
    const tokens = out.split(/\s+/).filter(Boolean);
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (isLikelyUsername(tokens[i])) return tokens[i].replace(/^@/, "");
    }
    return out;
  }
  function getCurrentUser(overrideId) {
    const override = (overrideId || "").trim();
    if (/^\d{15,25}$/.test(override)) {
      return {
        id: override,
        username: "you"
      };
    }
    let id = localStorage.getItem(SELF_ID_KEY) || null;
    let username = null;
    const exactUsernameEl = document.querySelector('[class*="userTagUsername"]');
    if (exactUsernameEl && exactUsernameEl.textContent && exactUsernameEl.textContent.trim()) {
      username = sanitizeUsername(exactUsernameEl.textContent);
    }
    const avatarSelectors = [ '[class*="panels"] img[src*="/avatars/"]', '[class*="panels"] img[src*="/embed/avatars/"]', '[class*="avatarStack"] img[src*="/avatars/"]', '[class*="accountProfile"] img[src*="/avatars/"]', '[class*="panelWrapper"] img[src*="/avatars/"]', '[class*="statusBox"] img[src*="/avatars/"]', '[data-list-item-id*="account"] img[src*="/avatars/"]' ];
    let panelAvatar = null;
    for (const sel of avatarSelectors) {
      panelAvatar = document.querySelector(sel);
      if (panelAvatar) break;
    }
    if (panelAvatar) {
      const m = panelAvatar.src.match(/avatars\/(\d+)\//);
      if (m) {
        id = m[1];
        try {
          localStorage.setItem(SELF_ID_KEY, id);
        } catch (e) {}
      }
      if (!username && panelAvatar.alt && panelAvatar.alt.trim()) {
        username = sanitizeUsername(panelAvatar.alt);
      }
    }
    if (!username) {
      const nameSelectors = [ '[class*="panels"] [class*="userTag"]', '[class*="accountProfile"] [class*="userTag"]', '[class*="panels"] [class*="nameTag"]', '[class*="panels"] [class*="username"]', '[class*="accountProfile"] [class*="nameTag"]', '[class*="accountProfile"] [class*="username"]' ];
      for (const sel of nameSelectors) {
        const nameEl = document.querySelector(sel);
        if (nameEl && nameEl.textContent && nameEl.textContent.trim()) {
          username = sanitizeUsername(nameEl.textContent);
          break;
        }
      }
    }
    if (!id) return null;
    return {
      id: id,
      username: username || "you"
    };
  }
  function formatBadgeName(rawName, appendTag) {
    return appendTag ? `${rawName} [BD]` : rawName;
  }
  function refreshCustomBadges() {
    document.querySelectorAll(`[${MARKER}]`).forEach(el => el.removeAttribute(MARKER));
    badgeCache.clear();
    scan();
  }
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== "object") return false;
    switch (message.action) {
     case "getCurrentUser":
      {
        sendResponse(getCurrentUser(message.overrideId));
        return false;
      }

     case "refreshOwnBadgeDisplay":
      {
        if (message.userId) badgeCache.delete(message.userId);
        refreshCustomBadges();
        sendResponse({
          ok: true
        });
        return false;
      }

     case "refreshBadgeCache":
      {
        badgeCache.clear();
        refreshCustomBadges();
        sendResponse({
          ok: true
        });
        return false;
      }

     default:
      return false;
    }
  });
  function init() {
    log("v12 tooltip + card initializing...");
    scan();
    new MutationObserver(scan).observe(document.body, {
      childList: true,
      subtree: true
    });
    setInterval(scan, 500);
  }
  if (document.body) init(); else document.addEventListener("DOMContentLoaded", init);
})();