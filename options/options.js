/**
 * AdShield Pro - Options Page Controller
 */

document.addEventListener("DOMContentLoaded", async () => {
  const whitelistUl = document.getElementById("whitelistUl");
  const whitelistInput = document.getElementById("whitelistInput");
  const addWhitelistForm = document.getElementById("addWhitelistForm");
  const whitelistCountBadge = document.getElementById("whitelistCountBadge");
  const diagTotalBlocked = document.getElementById("diagTotalBlocked");
  const exportSettingsBtn = document.getElementById("exportSettingsBtn");
  const resetAllBtn = document.getElementById("resetAllBtn");

  function cleanDomainInput(raw) {
    let clean = raw.trim().toLowerCase();
    clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
    clean = clean.split("/")[0].split("?")[0].split(":")[0];
    return clean;
  }

  async function loadData() {
    const data = await chrome.storage.local.get(["whitelist", "totalBlocked"]);
    const whitelist = Array.isArray(data.whitelist) ? data.whitelist : [];
    const totalBlocked = data.totalBlocked || 0;

    diagTotalBlocked.textContent = totalBlocked.toLocaleString();
    whitelistCountBadge.textContent = `${whitelist.length} ${whitelist.length === 1 ? "Domain" : "Domains"}`;

    whitelistUl.innerHTML = "";

    if (whitelist.length === 0) {
      whitelistUl.innerHTML = '<li class="empty-state">No whitelisted domains yet.</li>';
      return;
    }

    whitelist.forEach((domain) => {
      const li = document.createElement("li");

      const span = document.createElement("span");
      span.textContent = domain;
      li.appendChild(span);

      const btn = document.createElement("button");
      btn.className = "remove-btn";
      btn.textContent = "Remove";
      btn.title = `Remove ${domain} from whitelist`;
      btn.addEventListener("click", () => removeDomain(domain));
      li.appendChild(btn);

      whitelistUl.appendChild(li);
    });
  }

  async function addDomain(rawDomain) {
    const domain = cleanDomainInput(rawDomain);
    if (!domain || !domain.includes(".")) {
      alert("Please enter a valid domain name (e.g. example.com).");
      return;
    }

    const data = await chrome.storage.local.get("whitelist");
    const whitelist = Array.isArray(data.whitelist) ? [...data.whitelist] : [];

    if (whitelist.includes(domain)) {
      alert(`Domain "${domain}" is already in your whitelist.`);
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: "TOGGLE_DOMAIN_WHITELIST",
        domain: domain
      },
      () => {
        whitelistInput.value = "";
        loadData();
      }
    );
  }

  function removeDomain(domain) {
    chrome.runtime.sendMessage(
      {
        type: "TOGGLE_DOMAIN_WHITELIST",
        domain: domain
      },
      () => {
        loadData();
      }
    );
  }

  addWhitelistForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addDomain(whitelistInput.value);
  });

  exportSettingsBtn.addEventListener("click", async () => {
    const data = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adshield-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  resetAllBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to reset all AdShield stats and clear the whitelist?")) {
      await chrome.storage.local.set({
        whitelist: [],
        totalBlocked: 0,
        sessionBlocked: 0
      });
      chrome.runtime.sendMessage({ type: "RESET_STATS" }, () => {
        loadData();
      });
    }
  });

  loadData();
});
