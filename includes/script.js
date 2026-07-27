// This script runs before main.js, so exploitChain is defined when main.js loads.
var exploitChain = localStorage.getItem("exploitChain") || "lapse";

const jeilbrekBtn = document.getElementById('jeilbrek');
const UAElement = document.getElementById("UA");
const netctrlRadio = document.getElementById("netctrl-exploit");
const lapseRadio = document.getElementById("lapse-exploit");
const kexForm = document.getElementById('kernel-options');

// Show user agent
UAElement.innerText += " " + navigator.userAgent;

let selectedVersion = null;

// --- Kernel exploit selection ---
kexForm.addEventListener("change", function (event) {
    localStorage.setItem("exploitChain", event.target.value);
    exploitChain = event.target.value;
    console.log('Exploit chain changed to:', exploitChain);
});

// --- Version button handling ---
document.querySelectorAll('.jb-btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    console.log('Button clicked:', this.dataset.version);

    // Highlight active button
    document.querySelectorAll('.jb-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    selectedVersion = this.dataset.version;

    // Check if doJb is defined (should be loaded from main.js)
    if (typeof doJb !== 'function') {
      alert('ERROR: doJb is not defined! main.js may have failed to load.');
      console.error('doJb is not defined');
      return;
    }

    // Do NOT disable the button – keeps it clickable
    doJb(selectedVersion);
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
    console.log('DOM loaded – script.js ready');

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
            console.log('Default version set to:', selectedVersion);
        }
    }

    console.log('script.js fully loaded. exploitChain =', exploitChain);
});
