/**
 * AdShield Pro - Enhanced Content Engine
 * Manifest V3 Advanced Cosmetic Filter, Precision YouTube Ad Skipper & Pop-up Neutralizer
 */

(function () {
  "use strict";

  let isEnabled = true;
  let isWhitelisted = false;
  let blockedCount = 0;
  let observer = null;
  const currentHostname = window.location.hostname.toLowerCase();
  const isYouTube = currentHostname.includes("youtube.com");

  // State tracker for YouTube video playback restoration
  let wasInAd = false;
  let savedPlaybackRate = 1.0;
  let savedMuted = false;

  const COSMETIC_SELECTORS = [
    "ins.adsbygoogle",
    '[id^="google_ads_iframe"]',
    '[id^="div-gpt-ad"]',
    '[id*="google_ads"]',
    'iframe[src*="googlesyndication.com"]',
    'iframe[src*="doubleclick.net"]',
    'iframe[src*="adnxs.com"]',
    'iframe[src*="smartadserver.com"]',
    'iframe[src*="criteo.com"]',
    "#player-ads",
    ".ytp-ad-overlay-container",
    ".ytp-ad-message-container",
    ".ytp-ad-action-interstitial",
    "ytd-promoted-sparkles-web-renderer",
    "ytd-promoted-video-renderer",
    "ytd-in-feed-ad-layout-renderer",
    "ytd-ad-slot-renderer",
    "ytd-banner-promo-renderer",
    "#masthead-ad",
    "ytd-display-ad-renderer",
    "ytd-statement-banner-renderer",
    "ytd-action-companion-ad-renderer",
    ".ytd-mealbar-promo-renderer",
    "ytd-compact-promoted-video-renderer",
    "#taw",
    "div[data-text-ad]",
    ".uEierd",
    ".commercial-unit-desktop-top",
    ".commercial-unit-desktop-rhs",
    'div[id^="taboola-"]',
    ".trc_related_container",
    ".trc_rbox_div",
    ".OUTBRAIN",
    'div[class*="outbrain"]',
    'div[id^="outbrain"]',
    ".revcontent",
    ".mgid-container",
    ".zergnet-widget",
    "shreddit-ad-post",
    ".promotedlink",
    '[data-testid="placementTracking"]',
    '[class*="ad-banner"]',
    '[class*="ad-container"]',
    '[class*="ad-wrapper"]',
    '[class*="ad-slot"]',
    '[class*="advertisement"]',
    '[class*="sponsored-post"]',
    '[id*="ad-container"]',
    '[id*="ad-banner"]',
    '[id*="ad_wrapper"]',
    '[id*="ad-slot"]',
    '[aria-label="advertisement" i]',
    '[aria-label="sponsored" i]',
    "[data-ad-unit]",
    "[data-ad-slot]",
    "[data-ad-client]",
    ".ad-placeholder",
    ".ad-unit",
    ".ads-holder",
    ".top-ad",
    ".bottom-ad",
    ".sidebar-ad",
    'div[class*="floating-ad"]',
    'div[class*="sticky-ad"]',
    'div[class*="corner-ad"]',
    ".advert-box",
    ".ad-box",
    ".ad-area",
    ".ad-leaderboard",
    ".ad-rectangle",
    ".ad-skyscraper"
  ];

  const SELECTOR_QUERY = COSMETIC_SELECTORS.join(", ");

  const ANTI_ADBLOCK_KEYWORDS = [
    "ad blocker detected",
    "adblock detected",
    "disable ad blocker",
    "disable your ad blocker",
    "turn off ad blocker",
    "adblocker detected",
    "ad blocking software",
    "whitelisting our site",
    "ad blocker is enabled"
  ];

  /**
   * Precision YouTube Video Ad Skipper
   * Strictly operates ONLY when an ad is active. Never touches normal videos!
   */
  function handleYouTubeVideoAds() {
    if (!isYouTube || !isEnabled || isWhitelisted) return;

    try {
      const player = document.getElementById("movie_player") || document.querySelector(".html5-video-player");
      if (!player) return;

      const video = player.querySelector("video.html5-main-video") || player.querySelector("video");
      if (!video) return;

      // STRICT VERIFICATION:
      // YouTube marks the player container with "ad-showing" or "ad-interrupting" ONLY when an ad is playing!
      const isAdActive = player.classList.contains("ad-showing") || 
                         player.classList.contains("ad-interrupting");

      if (isAdActive) {
        // Record user's pre-ad playback settings
        if (!wasInAd) {
          wasInAd = true;
          savedPlaybackRate = (video.playbackRate > 0 && video.playbackRate <= 2.0) ? video.playbackRate : 1.0;
          savedMuted = video.muted;
        }

        // 1. Click standard or modern skip button immediately if present
        const skipBtn = player.querySelector(
          ".ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-ad-skip-button-slot button, button.ytp-ad-skip-button-text"
        );
        if (skipBtn) {
          skipBtn.click();
          blockedCount++;
          notifyBackground(1);
          return;
        }

        // 2. Fast-forward ONLY if it's strictly an ad under 2 minutes
        // This guarantees normal videos (which are not ads) are NEVER fast-forwarded!
        if (!isNaN(video.duration) && video.duration > 0 && video.duration <= 120) {
          video.muted = true;
          video.playbackRate = 16.0;
          if (video.currentTime < video.duration - 0.1) {
            video.currentTime = video.duration;
          }
        }

        // 3. Dismiss overlay cards inside the video
        const overlayClose = player.querySelector(".ytp-ad-overlay-close-button");
        if (overlayClose) overlayClose.click();

      } else {
        // NORMAL VIDEO PLAYING
        // Restore normal speed and un-mute if we previously sped up an ad
        if (wasInAd) {
          wasInAd = false;
          if (video.playbackRate === 16.0) {
            video.playbackRate = savedPlaybackRate || 1.0;
          }
          if (video.muted && !savedMuted) {
            video.muted = false;
          }
        }
        // NEVER touch video.currentTime here! Normal videos play completely undisturbed.
      }
    } catch (e) {
      // Ignore DOM timing edge cases
    }
  }

  /**
   * Run cosmetic scan across the DOM
   */
  function runCosmeticFilter() {
    if (!isEnabled || isWhitelisted) return;

    try {
      const elements = document.querySelectorAll(SELECTOR_QUERY);
      let newBlocked = 0;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el.dataset.adshieldHidden) {
          el.dataset.adshieldHidden = "true";
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("height", "0", "important");
          el.style.setProperty("min-height", "0", "important");
          el.style.setProperty("pointer-events", "none", "important");
          newBlocked++;
        }
      }

      if (newBlocked > 0) {
        blockedCount += newBlocked;
        notifyBackground(newBlocked);
      }
    } catch (e) {
      // Ignore DOM access errors
    }

    if (isYouTube) {
      handleYouTubeVideoAds();
    }
  }

  /**
   * Defuse intrusive anti-adblock overlay modals and restore scrolling
   */
  function detectAndDefuseAntiAdblock() {
    if (!isEnabled || isWhitelisted) return;

    try {
      const allDivs = document.querySelectorAll("div, section, aside, dialog");
      for (let i = 0; i < allDivs.length; i++) {
        const el = allDivs[i];
        const text = el.innerText ? el.innerText.toLowerCase() : "";
        if (text.length > 0 && text.length < 450) {
          const hasKeyword = ANTI_ADBLOCK_KEYWORDS.some((kw) => text.includes(kw));
          if (hasKeyword) {
            const style = window.getComputedStyle(el);
            const isOverlay =
              style.position === "fixed" ||
              style.position === "absolute" ||
              parseInt(style.zIndex, 10) > 1000;

            if (isOverlay) {
              el.remove();
              document.body.style.setProperty("overflow", "auto", "important");
              document.documentElement.style.setProperty("overflow", "auto", "important");
              blockedCount++;
              notifyBackground(1);
              break;
            }
          }
        }
      }
    } catch (e) {
      // Cross-origin protection
    }
  }

  /**
   * Setup MutationObserver
   */
  let timeoutId = null;
  function initMutationObserver() {
    if (observer) return;

    observer = new MutationObserver(() => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        runCosmeticFilter();
        detectAndDefuseAntiAdblock();
        timeoutId = null;
      }, isYouTube ? 150 : 250);
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        observer.observe(document.body, { childList: true, subtree: true });
        runCosmeticFilter();
      });
    }

    // Polling interval strictly for YouTube ad state transitions
    if (isYouTube) {
      setInterval(handleYouTubeVideoAds, 300);
    }
  }

  /**
   * Send blocked telemetry to background service worker
   */
  function notifyBackground(count) {
    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: "REPORT_COSMETIC_BLOCKED",
          count: count,
          hostname: currentHostname
        }).catch(() => {});
      }
    } catch (e) {
      // Context invalidated
    }
  }

  /**
   * Initialize state from storage
   */
  async function init() {
    try {
      const data = await chrome.storage.local.get(["shieldEnabled", "whitelist"]);
      isEnabled = data.shieldEnabled !== false;
      const whitelist = Array.isArray(data.whitelist) ? data.whitelist : [];
      isWhitelisted = whitelist.some((domain) => currentHostname === domain || currentHostname.endsWith("." + domain));

      if (!isEnabled || isWhitelisted) {
        return;
      }

      runCosmeticFilter();
      initMutationObserver();
      detectAndDefuseAntiAdblock();
    } catch (err) {
      console.debug("[AdShield] Storage lookup error:", err);
    }
  }

  // Listen for real-time messages from popup / background
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "GET_PAGE_STATS") {
        sendResponse({
          hostname: currentHostname,
          blockedCount: blockedCount,
          isEnabled: isEnabled,
          isWhitelisted: isWhitelisted
        });
        return true;
      }

      if (message.type === "TOGGLE_STATE_CHANGED") {
        isEnabled = message.enabled;
        if (!isEnabled && observer) {
          observer.disconnect();
          observer = null;
        } else if (isEnabled) {
          runCosmeticFilter();
          initMutationObserver();
        }
        sendResponse({ success: true });
        return true;
      }
    });
  }

  // Kickstart
  init();
})();
