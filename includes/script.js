const jeilbrekBtn = document.getElementById('jeilbrek'); 
const UAElement = document.getElementById("UA");

// choose one of kernel exploits
var exploitChain = localStorage.getItem("exploitChain") || "lapse";
const netctrlRadio = document.getElementById("netctrl-exploit");
const lapseRadio = document.getElementById("lapse-exploit");
const kexForm = document.getElementById('kernel-options');

// Show user agent
UAElement.innerText += " " + navigator.userAgent;

let selectedVersion = null; // stores the version string of the last clicked button

// --- Version button handling ---
document.querySelectorAll('.jb-btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    // Highlight active button
    document.querySelectorAll('.jb-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    selectedVersion = this.dataset.version;
    jeilbrekBtn.disabled = true;
    doJb(selectedVersion);
  });
});

// --- Kernel exploit selection ---
kexForm.addEventListener("change", function (event) {
    localStorage.setItem("exploitChain", event.target.value);
    exploitChain = event.target.value;
});

function cacheProgress(e) {
    var Percent = (Math.round(e.loaded / e.total * 100));
    document.title = "Caching: " + Percent + "%";
}

function displayCacheProgress() {
    setTimeout(function () {
        document.title = "\u2713";
    }, 1000);
    setTimeout(function () {
        document.title = "CSSFontFace exploit";
    }, 3000);
}

document.addEventListener("DOMContentLoaded", function() {
    // Cache handling
    if (window.applicationCache) {
        window.applicationCache.addEventListener("progress", cacheProgress, false);
        window.applicationCache.oncached = function (e) { displayCacheProgress(); };
        window.applicationCache.onupdateready = function (e) { displayCacheProgress(); };
    }

    // choose prefered exploit chain
    if (exploitChain == "netctrl") {
        netctrlRadio.checked = true;
    } else {
        lapseRadio.checked = true;
    }

    // Set default selected version (11.02) if no button is active
    if (!selectedVersion) {
        const defaultBtn = document.querySelector('.jb-btn[data-version="11.02"]') || document.querySelector('.jb-btn');
        if (defaultBtn) {
            defaultBtn.classList.add('active');
            selectedVersion = defaultBtn.dataset.version;
        }
    }
});
