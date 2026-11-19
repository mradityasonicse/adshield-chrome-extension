/**
 * AdShield Pro - Popup Controller
 * Manifest V3 Reactive UI Management
 */

document.addEventListener("DOMContentLoaded", async () => {
  const masterToggleBtn = document.getElementById("masterToggleBtn");
  const shieldStatusText = document.getElementById("shieldStatusText");
  const siteDomainEl = document.getElementById("siteDomain");
  const siteBadgeEl = document.getElementById("siteBadge");
  const whitelistToggleBtn = document.getElementById("whitelistToggleBtn");
  const pageBlockedCountEl = document.getElementById("pageBlockedCount");
  const totalBlockedCountEl = document.getElementById("totalBlockedCount");
  const dataSavedValueEl = document.getElementById("dataSavedValue");
  const timeSavedValueEl = document.getElementById("timeSavedValue");
  const resetStatsBtn = document.getElementById("resetStatsBtn");
  const openOptionsBtn = document.getElementById("openOptionsBtn");

  let currentTab = null;
  let currentHostname = "";
  let isWhitelisted = false;
  let isGlobalEnabled = true;

  function formatDataSaved(count) {
    const bytes = count * 184320; // Avg 180 KB per ad/tracker payload
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(0) + " KB";
    }
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatTimeSaved(count) {
    const seconds = count * 0.35; // Avg 350ms CPU/network load saved
    return seconds < 60 ? seconds.toFixed(1) + "s" : (seconds / 60).toFixed(1) + "m";
  }

  function updateCounters(pageCount, totalCount) {
    pageBlockedCountEl.textContent = pageCount.toLocaleString();
    totalBlockedCountEl.textContent = totalCount.toLocaleString();
    dataSavedValueEl.textContent = formatDataSaved(totalCount);
    timeSavedValueEl.textContent = formatTimeSaved(totalCount);
  }

  function renderState(state) {
    isGlobalEnabled = state.shieldEnabled;
    isWhitelisted = state.isWhitelisted;

    // 1. Master Shield Button
    if (isGlobalEnabled) {
      masterToggleBtn.classList.remove("inactive");
      masterToggleBtn.classList.add("active");
      shieldStatusText.textContent = "Protection Active";
      shieldStatusText.style.color = "#10b981";
    } else {
      masterToggleBtn.classList.remove("active");
      masterToggleBtn.classList.add("inactive");
      shieldStatusText.textContent = "Protection Paused";
      shieldStatusText.style.color = "#f43f5e";
    }

    // 2. Site domain & Whitelist status
    if (!currentHostname || currentHostname.startsWith("chrome") || currentHostname === "newtab") {
      siteDomainEl.textContent = currentHostname || "Internal Page";
      siteBadgeEl.textContent = "System";
      siteBadgeEl.className = "badge-status";
      siteBadgeEl.style.background = "rgba(100, 116, 139, 0.2)";
      siteBadgeEl.style.color = "#94a3b8";
      whitelistToggleBtn.disabled = true;
      whitelistToggleBtn.style.opacity = "0.5";
      whitelistToggleBtn.querySelector(".btn-text").textContent = "Not Applicable";
    } else {
      siteDomainEl.textContent = currentHostname;
      whitelistToggleBtn.disabled = !isGlobalEnabled;
      whitelistToggleBtn.style.opacity = isGlobalEnabled ? "1" : "0.5";

      if (isWhitelisted) {
        siteBadgeEl.textContent = "Whitelisted";
        siteBadgeEl.className = "badge-status whitelisted";
        whitelistToggleBtn.querySelector(".btn-text").textContent = "Resume Shield";
      } else {
        siteBadgeEl.textContent = isGlobalEnabled ? "Protected" : "Paused";
        siteBadgeEl.className = `badge-status ${isGlobalEnabled ? "protected" : "whitelisted"}`;
        whitelistToggleBtn.querySelector(".btn-text").textContent = "Pause on this site";
      }
    }

    // 3. Counters
    updateCounters(state.currentTabBlocked || 0, state.totalBlocked || 0);
  }

  async function loadStatus() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) {
        currentTab = tabs[0];
        if (currentTab.url) {
          try {
            const urlObj = new URL(currentTab.url);
            currentHostname = urlObj.hostname.toLowerCase();
          } catch (e) {
            currentHostname = "";
          }
        }
      }

      chrome.runtime.sendMessage(
        {
          type: "GET_POPUP_STATE",
          tabId: currentTab ? currentTab.id : null,
          url: currentTab ? currentTab.url : null
        },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            return;
          }
          renderState(response);
        }
      );
    } catch (err) {
      console.error("[AdShield] Init error:", err);
    }
  }

  masterToggleBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "TOGGLE_GLOBAL_SHIELD" }, (res) => {
      if (res) {
        loadStatus();
      }
    });
  });

  whitelistToggleBtn.addEventListener("click", () => {
    if (!currentHostname) return;

    chrome.runtime.sendMessage(
      {
        type: "TOGGLE_DOMAIN_WHITELIST",
        domain: currentHostname,
        tabId: currentTab ? currentTab.id : null,
        reloadTab: true
      },
      (res) => {
        if (res && res.success) {
          loadStatus();
        }
      }
    );
  });

  resetStatsBtn.addEventListener("click", () => {
    if (confirm("Reset all blocked counters back to zero?")) {
      chrome.runtime.sendMessage({ type: "RESET_STATS" }, (res) => {
        if (res && res.success) {
          loadStatus();
        }
      });
    }
  });

  openOptionsBtn.addEventListener("click", () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options/options.html"));
    }
  });

  loadStatus();
});
