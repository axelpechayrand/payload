// Immediate console output
(function() {
    const consoleEl = document.getElementById('console');
    if (consoleEl) {
        consoleEl.textContent = 'Script loaded. Initializing...\n';
    }
})();

var exploitChain = localStorage.getItem("exploitChain") || "lapse";

const UAElement = document.getElementById("UA");
const netctrlRadio = document.getElementById("netctrl-exploit");
const lapseRadio = document.getElementById("lapse-exploit");
const kexForm = document.getElementById('kernel-options');

// Show user agent
UAElement.innerText += " " + navigator.userAgent;
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
    // Clear previous logs and show start message
    if (consoleEl) {
        consoleEl.textContent = ''; // Clear
        consoleEl.append('=== Starting jailbreak for ' + this.dataset.version + ' ===\n');
    }

    // Highlight
    document.querySelectorAll('.jb-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    selectedVersion = this.dataset.version;

    // Check doJb
    if (typeof doJb !== 'function') {
        const msg = 'ERROR: doJb is not defined! main.js may have failed to load.';
        if (consoleEl) consoleEl.append(msg + '\n');
        alert(msg);
        return;
    }

    // Button feedback
    const originalText = this.textContent;
    this.textContent = 'Running...';
    this.disabled = true;

    // Call doJb and handle result
    doJb(selectedVersion)
      .then(() => {
          this.textContent = originalText;
          this.disabled = false;
          if (consoleEl) consoleEl.append('=== Jailbreak completed successfully ===\n');
      })
      .catch((err) => {
          console.error(err);
          if (consoleEl) {
              consoleEl.append('=== ERROR ===\n');
              consoleEl.append('Message: ' + err.message + '\n');
              if (err.stack) consoleEl.append('Stack: ' + err.stack + '\n');
          }
          this.textContent = 'Failed';
          setTimeout(() => {
              this.textContent = originalText;
              this.disabled = false;
          }, 3000);
      });
  });
});

// Cache handling (unchanged)
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

    // Set radio buttons
    if (exploitChain == "netctrl") {
        netctrlRadio.checked = true;
    } else {
        lapseRadio.checked = true;
    }

    // Default active button: 11.02
    if (!selectedVersion) {
        const defaultBtn = document.querySelector('.jb-btn[data-version="11.02"]') || document.querySelector('.jb-btn');
        if (defaultBtn) {
            defaultBtn.classList.add('active');
            selectedVersion = defaultBtn.dataset.version;
            if (consoleEl) consoleEl.append('Default version: ' + selectedVersion + '\n');
        }
    }

    if (consoleEl) consoleEl.append('script.js fully loaded. Ready.\n');
});
