// Inicializar íconos
window.lucide && window.lucide.createIcons();

// Shell logic
(function () {
    const shell = document.getElementById('moduleShell');
    const frame = document.getElementById('modFrame');
    const titleEl = document.getElementById('modTitle');
    const statusEl = document.getElementById('modStatus');
    // const btnOpen = document.getElementById('openNewTab');
    const btnReload = document.getElementById('reloadFrame');
    const btnClose = document.getElementById('closeShell');
    const header = document.querySelector('.header');
    const layout = document.querySelector('.layout');
    const showInListBtn = document.getElementById('showInListBtn');
    const mainMessage = document.querySelector('.main-message');    

    function setStatus(msg) { statusEl.textContent = '· ' + msg; }
    function openShell(slug, deepPath = '', qs = '', name, state) {
        if (slug === 'gestor-de-usuarios') {
            openShellWithUrl('http://localhost:3001/', 'Gestor de usuarios');
            return;
        }

        const path = deepPath ? '/' + deepPath.replace(/^\/+/, '') : '';
        const url = `/modulos/${slug}${path}${qs || ''}`;
        frame.src = url;
        //btnOpen.href = url;
        titleEl.textContent = name || slug;
        setStatus('cargando…');
        shell.classList.add('is-open');
        showInListBtn.hidden = state !== 'escondido';
        showInListBtn.dataset.state = state;
        showInListBtn.dataset.slug = slug;
        // Actualizar URL con ?app=slug (sin recargar)
        const next = new URL(window.location.href);
        next.searchParams.set('app', slug);
        history.replaceState(null, '', next.toString());
    }

    function openShellWithUrl(url, name) {
        frame.src = url;
        //btnOpen.href = url;
        titleEl.textContent = name;
        setStatus('cargando…');
        shell.classList.add('is-open');
        header.hidden = true;
        layout.classList.add('is-shell-open');
        mainMessage.classList.add('hidden');
        // Actualizar URL con ?app=slug (sin recargar)
        const next = new URL(window.location.href);
        next.searchParams.set('app', name.toLowerCase().replace(/\s+/g, '-'));
        history.replaceState(null, '', next.toString());
    }

    function closeShell() {
        shell.classList.remove('is-open');
        frame.src = 'about:blank';
        // Limpiar ?app
        const next = new URL(window.location.href);
        next.searchParams.delete('app');
        history.replaceState(null, '', next.toString());
        header.hidden = false;
        layout.classList.remove('is-shell-open');
        mainMessage.classList.remove('hidden');
    }

    // Wire: botones "Abrir"
    document.addEventListener('click', async (ev) => {
        const a = ev.target.closest('.open-module');
        if (!a) return;
        ev.preventDefault();
        const slug = a.dataset.slug || (a.getAttribute('href').split('/').pop());
        const name = a.dataset.name;
        const state = a.dataset.state;
        window.__openShell ? window.__openShell(slug, undefined, undefined, name, state) : (window.location.href = `/apps/${slug}`);
        header.hidden = true;
        layout.classList.add('is-shell-open');
    });


    // Botones topbar
    btnReload.addEventListener('click', () => {
        try { frame.contentWindow.location.reload(); } catch (_) { }
    });
    btnClose.addEventListener('click', () => {
        closeShell();
        window.clearActiveModules();
    });

    // Abrir automáticamente si viene ?app=slug
    (function autoOpenFromQuery() {
        const u = new URL(window.location.href);
        const app = u.searchParams.get('app');
        if (app) {
            openShell(app);
            header.hidden = true;
            layout.classList.add('is-shell-open');
        }
    })();

    // Bridge opcional (título/altura/estado)
    window.addEventListener('message', (ev) => {
        if (!ev || !ev.data || typeof ev.data !== 'object') return;
        if (ev.source !== frame.contentWindow) return;
        const { type, title, height, status } = ev.data;
        if (type === 'module-meta') {
            if (title) { titleEl.textContent = title; document.title = title + ' · Módulos'; }
            if (typeof height === 'number') { frame.style.height = Math.max(300, height) + 'px'; }
            if (status) setStatus(status);
        }
    });

    window.__openShell = openShell;
    window.__openShellWithUrl = openShellWithUrl;
    window.__closeShell = closeShell;

    frame.addEventListener('load', () => {
        setStatus('listo');
        // Handshake opcional
        try { frame.contentWindow.postMessage({ type: 'host-ready', theme: 'dark' }, '*'); } catch (_) { }
    });

    // Botón "Mostrar en la lista"
    showInListBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        const slug = showInListBtn.dataset.slug;
        const state = 'neutral'

        const response = await fetch(`/api/users/preferences/modules`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ set: { [slug]: state } }),
        });

        if (!response.ok) {
            return showToast('Error al intentar actualizar el estado del módulo', 'error');
        }

        setFlash('Módulo mostrado en la lista', 'success');
        window.__closeShell();
        window.location.reload();
    });
})();