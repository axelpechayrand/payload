// IMMEDIATE CONSOLE OUTPUT
(function() {
    const consoleEl = document.getElementById('console');
    if (consoleEl) {
        consoleEl.textContent = 'Script loaded. Initializing...\n';
    }
})();

// Define exploitChain early
var exploitChain = localStorage.getItem("exploitChain") || "lapse";

const UAElement = document.getElementById("UA");
const netctrlRadio = document.getElementById("netctrl-exploit");
const lapseRadio = document.getElementById("lapse-exploit");
const kexForm = document.getElementById('kernel-options');

// Show user agent
UAElement.innerText += " " + navigator.userAgent;

// Also show in console
const consoleEl = document.getElementById('console');
if (consoleEl) {
    consoleEl.append('User Agent: ' + navigator.userAgent + '\n');
}

let selectedVersion = null;

// --- Kernel exploit selection ---
kexForm.addEventListener("change", function (event) {
    localStorage.setItem("exploitChain", event.target.value);
    exploitChain = event.target.value;
    if (consoleEl) consoleEl.append('Exploit chain changed to: ' + exploitChain + '\n');
});

// --- Version button handling ---
document.querySelectorAll('.jb-btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    if (consoleEl) consoleEl.append('Button clicked: ' + this.dataset.version + '\n');

    // Highlight
    document.querySelectorAll('.jb-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    selectedVersion = this.dataset.version;

    // Check doJb
    if (typeof doJb !== 'function') {
        if (consoleEl) consoleEl.append('ERROR: doJb is not defined! main.js may have failed.\n');
        alert('ERROR: doJb is not defined! Check console.');
        return;
    }

    // Button feedback
    const originalText = this.textContent;
    this.textContent = 'Running...';
    this.disabled = true;

    doJb(selectedVersion)
      .then(() => {
          this.textContent = originalText;
          this.disabled = false;
          if (consoleEl) consoleEl.append('Jailbreak completed for ' + selectedVersion + '\n');
      })
      .catch((err) => {
          console.error(err);
          if (consoleEl) consoleEl.append('ERROR: ' + err.message + '\n');
          this.textContent = 'Failed';
          setTimeout(() => {
              this.textContent = originalText;
              this.disabled = false;
          }, 3000);
      });
  });
});

function cacheProgress(e) {
    var Percent = (Math.round(e.loaded / e.total * 100));
    document.title = "Caching: " + Percent + "%";
}

function displayCacheProgress() {
    setTimeout(function () { document.title = "\u2713"; }, 1000);
    setTimeout(function () { document.title = "CSSFontFace exploit"; }, 3000);
}

document.addEventListener("DOMContentLoaded", function() {
    if (consoleEl) consoleEl.append('DOM ready – setting up UI\n');

    if (window.applicationCache) {
        window.applicationCache.addEventListener("progress", cacheProgress, false);
        window.applicationCache.oncached = function (e) { displayCacheProgress(); };
        window.applicationCache.onupdateready = function (e) { displayCacheProgress(); };
    }

    if (exploitChain == "netctrl") {
        netctrlRadio.checked = true;
    } else {
        lapseRadio.checked = true;
    }

    if (!selectedVersion) {
        const defaultBtn = document.querySelector('.jb-btn[data-version="11.02"]') || document.querySelector('.jb-btn');
        if (defaultBtn) {
            defaultBtn.classList.add('active');
            selectedVersion = defaultBtn.dataset.version;
            if (consoleEl) consoleEl.append('Default version: ' + selectedVersion + '\n');
        }
    }

    if (consoleEl) consoleEl.append('script.js fully loaded.\n');
});
