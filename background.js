"use strict";

const API_BASE = "https://custom-badges.shadow-164.workers.dev";

function toDataUrl(buffer, contentType) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:${contentType || "application/octet-stream"};base64,${btoa(binary)}`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.action !== "fetchBadge" || !message.userId) return false;

  fetch(`${API_BASE}?userId=${encodeURIComponent(message.userId)}`, {
    credentials: "omit",
    cache: "no-store"
  }).then(async response => {
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }).then(data => {
    sendResponse(data);
  }).catch(error => {
    sendResponse({ error: error.message || "Badge request failed" });
  });

  return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.action !== "fetchImage" || !message.imageUrl) return false;
  fetch(message.imageUrl, { credentials: "omit", cache: "no-store" }).then(async response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return toDataUrl(await response.arrayBuffer(), response.headers.get("content-type"));
  }).then(dataUrl => {
    sendResponse({ dataUrl: dataUrl });
  }).catch(error => {
    sendResponse({ error: error.message || "Image request failed" });
  });
  return true;
});