// Immediate console output
(function() {
    const consoleEl = document.getElementById('console');
    if (consoleEl) {
        consoleEl.append('[main.js] Loaded\n');
    }
})();

window.onerror = function(msg, url, line, col, error) {
    const consoleEl = document.getElementById('console');
    if (consoleEl) {
        consoleEl.append('[GLOBAL ERROR] ' + msg + '\n');
        if (error && error.stack) consoleEl.append(error.stack + '\n');
    }
    console.error('[main.js] Global error:', msg, error);
};

function load_script(src) {
    const consoleEl = document.getElementById('console');
    return new Promise((resolve, reject) => {
        if (consoleEl) consoleEl.append('Loading: ' + src + '\n');
        const script = document.createElement("script");
        script.src = src;
        script.onload = function() {
            if (consoleEl) consoleEl.append('Loaded: ' + src + '\n');
            resolve();
        };
        script.onerror = function() {
            const msg = 'Failed to load ' + src;
            if (consoleEl) consoleEl.append('ERROR: ' + msg + '\n');
            reject(new Error(msg));
        };
        document.head.appendChild(script);
    });
}

function setVersionFromString(versionStr) {
    const parts = versionStr.split('.');
    if (parts.length !== 2) throw new Error('Invalid version format');
    version.major = parseInt(parts[0], 10);
    version.minor = parseInt(parts[1], 16);
    version.console = 4;
}

async function doJb(versionStr) {
    const consoleEl = document.getElementById('console');
    if (consoleEl) consoleEl.append('[doJb] Starting for ' + versionStr + '\n');

    try {
        // Set version
        if (versionStr) {
            setVersionFromString(versionStr);
            if (consoleEl) consoleEl.append('Version set to: ' + version.major + '.' + version.minor.toString(16).padStart(2,'0') + '\n');
        } else {
            version.init();
        }

        // Load misc.js
        await load_script("src/misc.js");

        // Now logger should be available
        if (typeof logger !== 'undefined') {
            logger.info('misc.js loaded');
        } else {
            if (consoleEl) consoleEl.append('WARNING: logger not defined after misc.js\n');
        }

        // Load PS4 scripts
        switch (version.console) {
            case 4:
                await load_script("src/ps4/constants.js");
                await load_script("src/ps4/userland.js");
                break;
            case 5:
                break;
            default:
                const msg = 'Unsupported console ' + version.console;
                if (typeof logger !== 'undefined') logger.info(msg);
                else if (consoleEl) consoleEl.append(msg + '\n');
                throw new Error(msg);
        }

        if (typeof logger !== 'undefined') logger.info("===USERLAND===");
        else if (consoleEl) consoleEl.append("===USERLAND===\n");

        // Userland exploits
        let rw = undefined;
        if (arw.master === undefined) {
            rw = await init_rw();
        }

        init_arw(rw);
        init_rop();
        init_syscalls();

        if (typeof logger !== 'undefined') logger.info("===END===");
        else if (consoleEl) consoleEl.append("===END===\n");

        // Load loader and workers
        await load_script("src/loader.js");
        await load_script("src/workers.js");

        // Load kernel
        switch (version.console) {
            case 4:
                await load_script("src/ps4/kernel.js");
                break;
            case 5:
                break;
            default:
                const msg2 = 'Unsupported console ' + version.console;
                if (typeof logger !== 'undefined') logger.info(msg2);
                else if (consoleEl) consoleEl.append(msg2 + '\n');
                throw new Error(msg2);
        }

        // Load exploit chain (lapse or netctrl)
        const chainScript = `src/${exploitChain}.js`;
        if (consoleEl) consoleEl.append('Loading exploit chain: ' + chainScript + '\n');
        await load_script(chainScript);

        if (typeof logger !== 'undefined') logger.info(`===${exploitChain.toUpperCase()}===`);
        else if (consoleEl) consoleEl.append(`===${exploitChain.toUpperCase()}===\n`);

        // Now execute the exploit
        try {
            if (exploitChain == "lapse") {
                init();
                await setup();
                await double_free_reqs2();
                leak_kaddrs();
                double_free_reqs1();
                make_karw();
                inc_karw_pipe_refcnt();
                if (typeof logger !== 'undefined') logger.info("Corrupted context cleanup started...");
                remove_pktinfo_from_so(pktopts_twins[0]);
                remove_rthdr_from_so(pktopts_twins[1]);
                remove_rthdr_from_so(rthdr_twins[0]);
                if (typeof logger !== 'undefined') logger.info("Corrupted context cleanup completed !!");
            } else {
                init();
                await setup();
                await ucred_triple_free();
                leak_kqueue();
                await make_karw();
                inc_karw_pipe_refcnt();
                if (typeof logger !== 'undefined') logger.info("Corrupted context cleanup started...");
                for (let i = 0; i < triplets.length; i++) {
                    remove_rthdr_from_so(triplets[i]);
                }
                remove_uaf_file();
                if (typeof logger !== 'undefined') logger.info("Corrupted context cleanup completed !!");
            }
        } finally {
            cleanup();
        }

        find_all_proc();

        if (fn.setuid.invoke(0) === -1) {
            jailbreak();

            const kpatches_rsp = await fetch(`src/ps4/patches/${constants.KPATCH}`);
            const kpatches_buf = await kpatches_rsp.arrayBuffer();
            const kpatches_u8 = new Uint8Array(kpatches_buf);
            kernel_patches(kpatches_u8);

            // --- Load payload based on version ---
            const major = version.major;
            const minor = version.minor.toString(16).padStart(2, '0');
            const payloadFile = `payload_${major}${minor}.bin`;
            let bin_rsp;
            try {
                bin_rsp = await fetch(`src/${payloadFile}`);
                if (!bin_rsp.ok) throw new Error('Payload not found');
            } catch {
                if (typeof logger !== 'undefined') logger.info(`Payload ${payloadFile} not found, falling back to src/payload.bin`);
                else if (consoleEl) consoleEl.append(`Payload ${payloadFile} not found, falling back to src/payload.bin\n`);
                bin_rsp = await fetch("src/payload.bin");
            }
            const bin_buf = await bin_rsp.arrayBuffer();
            const bin_u8 = new Uint8Array(bin_buf);
            load_bin(bin_u8);
        }

        if (typeof logger !== 'undefined') logger.info("===END===");
        else if (consoleEl) consoleEl.append("===END===\n");

    } catch (e) {
        // Log error both to logger and console element
        if (typeof logger !== 'undefined') {
            logger.error(e.message);
            logger.error(e.stack);
        } else {
            if (consoleEl) {
                consoleEl.append('ERROR: ' + e.message + '\n');
                if (e.stack) consoleEl.append('Stack: ' + e.stack + '\n');
            }
        }
        // Re-throw so the button handler can catch it
        throw e;
    }
}
