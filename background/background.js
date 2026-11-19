/**
 * AdShield Pro - Service Worker (Background)
 * Manifest V3 DeclarativeNetRequest & State Manager
 */

// In-memory tab block counts (ephemeral per tab)
const tabStats = new Map();

/**
 * Generate a deterministic integer ID from domain string for DNR dynamic rules (range: 10001 - 99999)
 */
function getDomainRuleId(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  return 10000 + (Math.abs(hash) % 89000);
}

/**
 * Update badge text and color for a specific tab
 */
function updateTabBadge(tabId, count, isEnabled = true) {
  if (!tabId || tabId < 0) return;

  if (!isEnabled) {
    chrome.action.setBadgeText({ text: "OFF", tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#64748b", tabId }); // Slate gray
    return;
  }

  if (count > 0) {
    const text = count > 999 ? "999+" : count.toString();
    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#10b981", tabId }); // Emerald green
  } else {
    chrome.action.setBadgeText({ text: "", tabId });
  }
}

/**
 * Increment blocked counters for a tab and globally
 */
async function recordBlockedItem(tabId, count = 1) {
  if (tabId && tabId > 0) {
    const current = (tabStats.get(tabId) || 0) + count;
    tabStats.set(tabId, current);

    const { shieldEnabled } = await chrome.storage.local.get("shieldEnabled");
    updateTabBadge(tabId, current, shieldEnabled !== false);
  }

  try {
    const data = await chrome.storage.local.get(["totalBlocked", "sessionBlocked"]);
    const totalBlocked = (data.totalBlocked || 0) + count;
    const sessionBlocked = (data.sessionBlocked || 0) + count;
    await chrome.storage.local.set({ totalBlocked, sessionBlocked });
  } catch (e) {
    console.debug("[AdShield] Failed to update storage stats:", e);
  }
}

/**
 * Initialize extension defaults upon install or update
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[AdShield] Extension installed/updated:", details.reason);

  const defaults = {
    shieldEnabled: true,
    whitelist: [],
    totalBlocked: 0,
    sessionBlocked: 0,
    customBlockedDomains: [],
    installedAt: Date.now()
  };

  const existing = await chrome.storage.local.get(Object.keys(defaults));
  const toSet = {};

  for (const [key, value] of Object.entries(defaults)) {
    if (existing[key] === undefined) {
      toSet[key] = value;
    }
  }

  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }

  // Ensure ruleset_1 is active
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ["ruleset_1"]
  });

  chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
});

/**
 * Monitor network rules matched in real-time (available via declarativeNetRequestFeedback)
 */
if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    if (info && info.request && info.request.tabId !== undefined) {
      recordBlockedItem(info.request.tabId, 1);
    }
  });
}

/**
 * Clean up tab state on close
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStats.delete(tabId);
});

/**
 * Update badge when active tab changes
 */
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const { shieldEnabled } = await chrome.storage.local.get("shieldEnabled");
  const count = tabStats.get(tabId) || 0;
  updateTabBadge(tabId, count, shieldEnabled !== false);
});

/**
 * Reset per-tab count when tab navigates to a new page
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading" && changeInfo.url) {
    tabStats.set(tabId, 0);
    chrome.action.setBadgeText({ text: "", tabId });
  }
});

/**
 * Whitelist domain management via Dynamic DeclarativeNetRequest Rules
 */
async function syncWhitelistRules(whitelist) {
  try {
    const existingDynamic = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingDynamic.map((r) => r.id);

    // Build new allow rules for each whitelisted domain
    const newRules = whitelist.map((domain) => {
      const ruleId = getDomainRuleId(domain);
      return {
        id: ruleId,
        priority: 100, // Higher priority than static block rules
        action: { type: "allow" },
        condition: {
          initiatorDomains: [domain],
          resourceTypes: [
            "sub_frame",
            "script",
            "image",
            "xmlhttprequest",
            "ping",
            "media",
            "websocket",
            "other",
            "stylesheet",
            "font"
          ]
        }
      };
    });

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: newRules
    });

    console.log(`[AdShield] Synchronized ${newRules.length} dynamic whitelist rules.`);
  } catch (err) {
    console.error("[AdShield] Error updating dynamic whitelist rules:", err);
  }
}

/**
 * Message Hub: Handle requests from Popup & Content Scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  // 1. Report cosmetic blocks from content script
  if (message.type === "REPORT_COSMETIC_BLOCKED") {
    const tabId = sender.tab ? sender.tab.id : null;
    const count = typeof message.count === "number" ? message.count : 1;
    recordBlockedItem(tabId, count);
    sendResponse({ received: true });
    return true;
  }

  // 2. Fetch status for popup
  if (message.type === "GET_POPUP_STATE") {
    (async () => {
      const data = await chrome.storage.local.get([
        "shieldEnabled",
        "whitelist",
        "totalBlocked",
        "sessionBlocked"
      ]);

      const shieldEnabled = data.shieldEnabled !== false;
      const whitelist = Array.isArray(data.whitelist) ? data.whitelist : [];
      const totalBlocked = data.totalBlocked || 0;
      const sessionBlocked = data.sessionBlocked || 0;

      let currentTabBlocked = 0;
      let currentDomain = "";
      let isWhitelisted = false;

      if (message.tabId) {
        currentTabBlocked = tabStats.get(message.tabId) || 0;
      }

      if (message.url) {
        try {
          const urlObj = new URL(message.url);
          currentDomain = urlObj.hostname.toLowerCase();
          isWhitelisted = whitelist.some(
            (d) => currentDomain === d || currentDomain.endsWith("." + d)
          );
        } catch (e) {
          // Internal URL
        }
      }

      sendResponse({
        shieldEnabled,
        totalBlocked,
        sessionBlocked,
        currentTabBlocked,
        currentDomain,
        isWhitelisted,
        whitelistCount: whitelist.length
      });
    })();
    return true;
  }

  // 3. Toggle global protection
  if (message.type === "TOGGLE_GLOBAL_SHIELD") {
    (async () => {
      const { shieldEnabled } = await chrome.storage.local.get("shieldEnabled");
      const newState = !shieldEnabled;

      await chrome.storage.local.set({ shieldEnabled: newState });

      if (newState) {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
          enableRulesetIds: ["ruleset_1"]
        });
      } else {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
          disableRulesetIds: ["ruleset_1"]
        });
      }

      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        const count = tabStats.get(tab.id) || 0;
        updateTabBadge(tab.id, count, newState);
        chrome.tabs.sendMessage(tab.id, {
          type: "TOGGLE_STATE_CHANGED",
          enabled: newState
        }).catch(() => {});
      }

      sendResponse({ shieldEnabled: newState });
    })();
    return true;
  }

  // 4. Toggle site whitelist
  if (message.type === "TOGGLE_DOMAIN_WHITELIST") {
    (async () => {
      const domain = message.domain ? message.domain.toLowerCase().trim() : "";
      if (!domain) {
        sendResponse({ success: false, error: "Invalid domain" });
        return;
      }

      const data = await chrome.storage.local.get("whitelist");
      let whitelist = Array.isArray(data.whitelist) ? [...data.whitelist] : [];

      const index = whitelist.indexOf(domain);
      let isWhitelistedNow = false;

      if (index > -1) {
        whitelist.splice(index, 1);
        isWhitelistedNow = false;
      } else {
        whitelist.push(domain);
        isWhitelistedNow = true;
      }

      await chrome.storage.local.set({ whitelist });
      await syncWhitelistRules(whitelist);

      if (message.tabId && message.reloadTab) {
        chrome.tabs.reload(message.tabId);
      }

      sendResponse({ success: true, isWhitelisted: isWhitelistedNow, whitelist });
    })();
    return true;
  }

  // 5. Reset lifetime stats
  if (message.type === "RESET_STATS") {
    (async () => {
      await chrome.storage.local.set({ totalBlocked: 0, sessionBlocked: 0 });
      tabStats.clear();
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        chrome.action.setBadgeText({ text: "", tabId: tab.id });
      }
      sendResponse({ success: true });
    })();
    return true;
  }

  return false;
});
