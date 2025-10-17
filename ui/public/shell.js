// Inicializar íconos
window.lucide && window.lucide.createIcons();

// Shell logic
(function () {
    const shell = document.getElementById('moduleShell');
    const frame = document.getElementById('modFrame');
    const titleEl = document.getElementById('modTitle');
    const statusEl = document.getElementById('modStatus');
    const btnOpen = document.getElementById('openNewTab');
    const btnReload = document.getElementById('reloadFrame');
    const btnClose = document.getElementById('closeShell');

    function setStatus(msg) { statusEl.textContent = '· ' + msg; }
    function openShell(slug, deepPath = '', qs = '') {
        const path = deepPath ? '/' + deepPath.replace(/^\/+/, '') : '';
        const url = `/modulos/${slug}${path}${qs || ''}`;
        frame.src = url;
        btnOpen.href = url;
        titleEl.textContent = slug;
        setStatus('cargando…');
        shell.classList.add('is-open');
        // Actualizar URL con ?app=slug (sin recargar)
        const next = new URL(window.location.href);
        next.searchParams.set('app', slug);
        history.replaceState(null, '', next.toString());
    }
    function closeShell() {
        shell.classList.remove('is-open');
        frame.src = 'about:blank';
        // Limpiar ?app
        const next = new URL(window.location.href);
        next.searchParams.delete('app');
        history.replaceState(null, '', next.toString());
    }

    // Wire: botones "Abrir"
    document.addEventListener('click', async (ev) => {
        const a = ev.target.closest('.open-module');
        if (!a) return;
        ev.preventDefault();
        const slug = a.dataset.slug || (a.getAttribute('href').split('/').pop());
        window.__openShell ? window.__openShell(slug) : (window.location.href = `/apps/${slug}`);
    });


    // Botones topbar
    btnReload.addEventListener('click', () => {
        try { frame.contentWindow.location.reload(); } catch (_) { }
    });
    btnClose.addEventListener('click', closeShell);

    // Abrir automáticamente si viene ?app=slug
    (function autoOpenFromQuery() {
        const u = new URL(window.location.href);
        const app = u.searchParams.get('app');
        if (app) openShell(app);
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
    window.__closeShell = closeShell;

    frame.addEventListener('load', () => {
        setStatus('listo');
        // Handshake opcional
        try { frame.contentWindow.postMessage({ type: 'host-ready', theme: 'dark' }, '*'); } catch (_) { }
    });
})();