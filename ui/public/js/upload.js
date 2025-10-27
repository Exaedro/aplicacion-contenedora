(() => {
    // ====== Elements
    const modal = document.getElementById('uploadModal');
    const form = document.getElementById('uploadModuleForm');
    const zipInput = document.getElementById('zipFile');
    const dropZone = document.getElementById('zipDrop');   // label for="zipFile"
    const fileNameEl = document.getElementById('fileName');
    const submitBtn = document.getElementById('submitBtn');
    const moduleNameDiv = document.getElementById('moduleNameDiv');
    const moduleDescDiv = document.getElementById('moduleDescDiv');
    const nameSuggestion = document.getElementById('nameSuggestion');
    const inputModName = document.getElementById('modName');
    const zipLoadingGif = document.getElementById('zip-loading');

    const progWrap = document.getElementById('uploadProgress');
    const bar = document.getElementById('progressBar');
    const pctEl = document.getElementById('progressPct');
    const bytesEl = document.getElementById('progressBytes');
    const etaEl = document.getElementById('progressEta');
    const cancelBtn = document.getElementById('cancelUpload');

    const triggers = document.querySelectorAll('button[aria-label="Agregar"], button[aria-label="Nuevo"]');

    let lastFocused = null;
    let xhr = null;
    let t0 = 0;

    // ====== Helpers
    function fmtBytes(n) { if (n == null) return '—'; const k = 1024, u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = Math.min(Math.floor(Math.log(Math.max(n, 1)) / Math.log(k)), u.length - 1); return (n / Math.pow(k, i)).toFixed(i ? 1 : 0) + ' ' + u[i]; }
    function fmtETA(loaded, total, elapsed) { if (!total || !loaded) return 'ETA —'; const rate = loaded / (elapsed / 1000); if (!rate) return 'ETA —'; const rem = (total - loaded) / rate; const m = Math.floor(rem / 60), s = Math.round(rem % 60); return `ETA ${m ? m + 'm ' : ''}${s}s`; }
    function resetProgress() { progWrap.hidden = true; bar.style.width = '0%'; bar.setAttribute('aria-valuenow', '0'); pctEl.textContent = '0%'; bytesEl.textContent = '0 / 0'; etaEl.textContent = 'ETA —'; }
    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    function trapFocus(e) {
        if (e.key !== 'Tab') return;
        const list = Array.from(modal.querySelectorAll('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])')).filter(el => !el.disabled);
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }

    function openModal() {
        lastFocused = document.activeElement;
        modal.classList.add('is-open');
        progWrap.hidden = true;
        modal.setAttribute('aria-hidden', 'false');
        window.addEventListener('keydown', onKey);
        modal.addEventListener('keydown', trapFocus);
        setTimeout(() => document.getElementById('modName').focus(), 0);
        window.lucide && window.lucide.createIcons();

        // 🪄 ANIMACIÓN con GSAP
        const overlay = modal.querySelector('.modal__overlay');
        const dialog = modal.querySelector('.modal__dialog');

        // por si hay animaciones previas
        gsap.killTweensOf([overlay, dialog]);

        // asegúrate de que el modal esté visible para poder animar
        gsap.set(dialog, { transformOrigin: '50% 40%', willChange: 'transform,opacity', force3D: true });

        // overlay (fondo) fade-in
        gsap.fromTo(overlay,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.25, ease: 'power2.out' }
        );

        // diálogo con "rebote" (zoom + slide + leve 3D)
        gsap.fromTo(dialog,
            { autoAlpha: 0, y: -80, scale: 0.85, rotateX: -10 },
            { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: 0.37, ease: 'back.out(1.6)' }
        );
    }
    function closeModal() {
        const overlay = modal.querySelector('.modal__overlay');
        const dialog = modal.querySelector('.modal__dialog');

        gsap.killTweensOf([overlay, dialog]);

        // animación de salida
        gsap.to(dialog, {
            autoAlpha: 0, y: -60, scale: 0.9, rotateX: -8,
            duration: 0.35, ease: 'power2.in',
            onComplete: () => {
                modal.classList.remove('is-open');
                modal.setAttribute('aria-hidden', 'true');
                window.removeEventListener('keydown', onKey);
                progWrap.hidden = true;
                modal.removeEventListener('keydown', trapFocus);
                if (lastFocused && lastFocused.focus) lastFocused.focus();
                form.reset();
                fileNameEl.textContent = 'Acepta solo .zip';
                resetProgress();
                showInputs(false);
            }
        });

        gsap.to(overlay, { autoAlpha: 0, duration: 0.25, ease: 'power2.in' });
    }
    
    function onKey(e) { if (e.key === 'Escape') closeModal(); }

    function showInputs(bool) {
        if (bool) {
            moduleNameDiv.hidden = false;
            moduleDescDiv.hidden = false;
            nameSuggestion.hidden = false;
            return
        }

        moduleNameDiv.hidden = true;
        moduleDescDiv.hidden = true;
        nameSuggestion.hidden = true;
    }

    async function getNameFromZip(file) {
        try {
            zipLoadingGif.hidden = false;
            submitBtn.disabled = true;
            showInputs(false);
            await sleep(1000)

            const zip = await JSZip.loadAsync(file);
            const entry = zip.file("manifest.json")

            // 1) Buscar manifest.json primero

            if (!entry) {
                alert("El ZIP no contiene ningún manifest.json. Por favor, adjunta un archivo zip válido.");
                return false;
            }

            const text = await entry.async("string");
            const data = JSON.parse(text);

            zipLoadingGif.hidden = true;
            submitBtn.disabled = false;
            showInputs(true);
            // Obtiene el nombre y lo escribe en el input
            const name = data.name || "sin nombre"
            inputModName.value = name;
            return true
        } catch (e) {
            alert('No se pudo leer el archivo zip. Comprueba que el archivo está bien formateado y que no esté corrupto.');
        }
    }

    // ====== Open/Close wiring
    triggers.forEach(btn => btn.addEventListener('click', openModal));
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
    modal.addEventListener('click', (e) => { if (e.target.classList.contains('modal__overlay')) closeModal(); });

    // ====== Dropzone (drag&drop). NO usamos zipInput.click() para evitar doble apertura.
    ['dragenter', 'dragover'].forEach(ev =>
        dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('is-dragover'); })
    );
    ['dragleave', 'drop'].forEach(ev =>
        dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('is-dragover'); })
    );
    dropZone.addEventListener('drop', async (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        if (!/\.zip$/i.test(file.name)) { alert('Solo se admite un archivo .zip'); return; }
        const dt = new DataTransfer(); dt.items.add(file);
        const isValid = await getNameFromZip(file);
        if (!isValid) return;

        zipInput.files = dt.files;
        fileNameEl.textContent = file.name;
        showInputs(true);
    });
    zipInput.addEventListener('change', async () => {
        const f = zipInput.files?.[0];
        if (!f) return;
        
        const isValid = await getNameFromZip(f);
        if (!isValid) return;
        
        fileNameEl.textContent = f.name
        showInputs(true);
    });

    // ====== Submit con progreso (XHR)
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameOk = form.moduleName.value.trim().length >= 3;
        const fileOk = zipInput.files && zipInput.files[0] && /\.zip$/i.test(zipInput.files[0].name);
        if (!nameOk || !fileOk) { alert('Completá el nombre (mín. 3) y adjuntá un .zip válido.'); return; }

        submitBtn.disabled = true;
        progWrap.hidden = false;
        t0 = Date.now();

        // ⚠️ Crear FormData ANTES de deshabilitar campos
        const fd = new FormData(form);

        // Deshabilitar campos (dejamos botón cancelar activo)
        Array.from(form.elements).forEach(el => { if (el.id !== 'cancelUpload') el.disabled = true; });

        xhr = new XMLHttpRequest();
        xhr.open('POST', form.action || '/api/modules/install', true);
        xhr.responseType = 'json';
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.upload.onprogress = (ev) => {
            if (!ev.lengthComputable) return;
            const percent = Math.round((ev.loaded / ev.total) * 100);
            bar.style.width = percent + '%';
            bar.setAttribute('aria-valuenow', String(percent));
            pctEl.textContent = percent + '%';
            bytesEl.textContent = `${fmtBytes(ev.loaded)} / ${fmtBytes(ev.total)}`;
            etaEl.textContent = fmtETA(ev.loaded, ev.total, Date.now() - t0);
        };

        xhr.onerror = () => { alert('Error de red al subir el módulo.'); cleanup(false); };
        xhr.onabort = () => { cleanup(false); };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = xhr.response || {};
                bar.style.width = '100%'; bar.setAttribute('aria-valuenow', '100'); pctEl.textContent = '100%'; etaEl.textContent = 'Completado';

                // Agregar tarjeta a la grilla si vuelve { module:{slug,name,description} }
                if (data?.module) {
                    //         const m = data.module;
                    //         const grid = document.querySelector('.grid');
                    //         if (grid) {
                    //             const el = document.createElement('article');
                    //             el.className = 'card';
                    //             el.setAttribute('data-slug', m.slug);
                    //             el.innerHTML = `
                    //   <div class="card__content">
                    //     <div class="tile secondary-30">
                    //       <i data-lucide="calendar" class="icon-32 secondary"></i>
                    //     </div>
                    //     <div>
                    //       <h3 class="card__title"></h3>
                    //       <p class="muted small"></p>
                    //     </div>
                    //     <a href="/apps/${m.slug}" class="btn chip secondary-50 open-module" data-slug="${m.slug}">Abrir</a>
                    //   </div>`;
                    //             el.querySelector('.card__title').textContent = m.name || m.slug;
                    //             el.querySelector('.muted.small').textContent = m.description || '';
                    //             grid.prepend(el);
                    //             // Wire del botón Abrir (si usás tu openShell)
                    //             const a = el.querySelector('.open-module');
                    //             if (a) a.addEventListener('click', (ev) => { ev.preventDefault(); a.dispatchEvent(new Event('click')); });
                    //             window.lucide && window.lucide.createIcons();
                    //         }
                    setFlash('Módulo subido exitosamente', 'success');
                    window.location.reload()
                }

                closeModal();
                cleanup(true);
            } else {
                const text = (xhr.response && xhr.response.error) ? xhr.response.error : (xhr.status + ' ' + xhr.statusText);
                alert('No se pudo subir el módulo: ' + text);
                cleanup(false);
            }
        };

        xhr.send(fd);
        cancelBtn.onclick = () => { if (xhr) xhr.abort(); };

        function cleanup(success) {
            submitBtn.disabled = false;
            Array.from(form.elements).forEach(el => { if (el.id !== 'cancelUpload') el.disabled = false; });
            if (!success) resetProgress();
            form.reset();
            fileNameEl.textContent = 'Acepta solo .zip';
        }
    });

    // Asegurar íconos si el modal se inyectó después
    window.lucide && window.lucide.createIcons();
})();