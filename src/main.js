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
        // ------------------------------------------------------------------
        // STEP 1: Load misc.js FIRST – it defines 'version' and 'logger'
        // ------------------------------------------------------------------
        await load_script("src/misc.js");

        // Now 'version' and 'logger' are available
        if (typeof version === 'undefined') {
            throw new Error('version object still undefined after loading misc.js');
        }
        if (typeof logger === 'undefined') {
            // Fallback logger if not defined (shouldn't happen)
            logger = {
                info: (msg) => { if (consoleEl) consoleEl.append('[INFO] ' + msg + '\n'); },
                error: (msg) => { if (consoleEl) consoleEl.append('[ERROR] ' + msg + '\n'); }
            };
        }

        // ------------------------------------------------------------------
        // STEP 2: Set the version
        // ------------------------------------------------------------------
        if (versionStr) {
            setVersionFromString(versionStr);
            if (consoleEl) consoleEl.append('Version set to: ' + version.major + '.' + version.minor.toString(16).padStart(2,'0') + '\n');
        } else {
            version.init();
        }

        // ------------------------------------------------------------------
        // STEP 3: Load the rest of the scripts
        // ------------------------------------------------------------------
        switch (version.console) {
            case 4:
                await load_script("src/ps4/constants.js");
                await load_script("src/ps4/userland.js");
                break;
            case 5:
                break;
            default:
                throw new Error('Unsupported console ' + version.console);
        }

        logger.info("===USERLAND===");

        let rw = undefined;
        if (arw.master === undefined) {
            rw = await init_rw();
        }

        init_arw(rw);
        init_rop();
        init_syscalls();

        logger.info("===END===");

        await load_script("src/loader.js");
        await load_script("src/workers.js");

        switch (version.console) {
            case 4:
                await load_script("src/ps4/kernel.js");
                break;
            case 5:
                break;
            default:
                throw new Error('Unsupported console ' + version.console);
        }

        // exploitChain is defined from script.js
        const chainScript = `src/${exploitChain}.js`;
        if (consoleEl) consoleEl.append('Loading exploit chain: ' + chainScript + '\n');
        await load_script(chainScript);

        logger.info(`===${exploitChain.toUpperCase()}===`);

        // ------------------------------------------------------------------
        // STEP 4: Execute the exploit
        // ------------------------------------------------------------------
        try {
            if (exploitChain == "lapse") {
                init();
                await setup();
                await double_free_reqs2();
                leak_kaddrs();
                double_free_reqs1();
                make_karw();
                inc_karw_pipe_refcnt();
                logger.info("Corrupted context cleanup started...");
                remove_pktinfo_from_so(pktopts_twins[0]);
                remove_rthdr_from_so(pktopts_twins[1]);
                remove_rthdr_from_so(rthdr_twins[0]);
                logger.info("Corrupted context cleanup completed !!");
            } else {
                init();
                await setup();
                await ucred_triple_free();
                leak_kqueue();
                await make_karw();
                inc_karw_pipe_refcnt();
                logger.info("Corrupted context cleanup started...");
                for (let i = 0; i < triplets.length; i++) {
                    remove_rthdr_from_so(triplets[i]);
                }
                remove_uaf_file();
                logger.info("Corrupted context cleanup completed !!");
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
                logger.info(`Payload ${payloadFile} not found, falling back to src/payload.bin`);
                bin_rsp = await fetch("src/payload.bin");
            }
            const bin_buf = await bin_rsp.arrayBuffer();
            const bin_u8 = new Uint8Array(bin_buf);
            load_bin(bin_u8);
        }

        logger.info("===END===");

    } catch (e) {
        logger.error(e.message);
        logger.error(e.stack);
        throw e;
    }
}
