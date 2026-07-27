// Define exploitChain early (used by main.js)
var exploitChain = localStorage.getItem("exploitChain") || "lapse";

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
});

// --- Version button handling ---
document.querySelectorAll('.jb-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
        // Highlight active button
        document.querySelectorAll('.jb-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        selectedVersion = this.dataset.version;

        // Button feedback
        const originalText = this.textContent;
        this.textContent = 'Running...';
        this.disabled = true;

        // Call jailbreak
        doJb(selectedVersion)
            .then(() => {
                this.textContent = originalText;
                this.disabled = false;
            })
            .catch((err) => {
                console.error(err);
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
        }
    }
});
