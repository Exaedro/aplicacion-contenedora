(() => {
    const MODULES_GRID = document.getElementById('grid-modules');

    // Cerrar todos los menús
    function closeAllMenus() {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.hidden = true);
        document.querySelectorAll('.kebab-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    }

    // Toggle del menú (delegación)
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.kebab-btn');
        if (btn) {
            const slug = btn.dataset.menuFor;
            const menu = document.getElementById('menu-' + slug);
            const isOpen = btn.getAttribute('aria-expanded') === 'true';
            closeAllMenus();
            if (!isOpen && menu) {
                menu.hidden = false;
                btn.setAttribute('aria-expanded', 'true');
            }
            return;
        }

        // Click en eliminar
        const del = e.target.closest('.delete-module');
        const toolbar = document.querySelector('.toolbar');
        const modulesGrid = document.getElementById('grid-modules');
        const deletingModule = document.querySelector('.deleting-module');
        if (del) {
            const slug = del.dataset.slug;
            if (!slug) return;

            const ok = confirm(`¿Eliminar el módulo "${slug}"? Esta acción no se puede deshacer.`);
            if (!ok) { closeAllMenus(); return; }

            // Pantalla de carga eliminando el modulo
            deletingModule.classList.remove('hidden'); // Mostramos pantalla de carga
            toolbar.classList.add('hidden'); // Ocultamos toolbar
            modulesGrid.classList.add('hidden'); // Ocultamos grid

            // 1) Si el módulo está abierto en el iframe, se cierra y espera a que quede en blanco
            const iframe = document.getElementById('modFrame');
            const isOpenInFrame = iframe && iframe.src.includes(`/modulos/${slug}`);
            if (isOpenInFrame) {
                await new Promise((resolve) => {
                    const onload = () => { iframe.removeEventListener('load', onload); resolve(); };
                    iframe.addEventListener('load', onload, { once: true });

                    window.__closeShell ? window.__closeShell() : (iframe.src = 'about:blank');
                });
                // pequeña espera extra por si Windows tarda en soltar el lock
                await new Promise(r => setTimeout(r, 120));
            }

            del.disabled = true;
            const card = document.querySelector(`.card[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`);
            const sidebarCard = document.querySelector(`.avatar-modulo[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`);

            try {
                // Parar el modulo para poder eliminarlo
                const resStopModule = await fetch(`/api/modules/${encodeURIComponent(slug)}/stop`, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    // credentials: 'include'
                });
                if (!resStopModule.ok) {
                    const txt = await resStopModule.text().catch(() => '');
                    throw new Error(txt || (`${resStopModule.status} ${resStopModule.statusText}`));
                }

                const res = await fetch(`/api/modules/${encodeURIComponent(slug)}`, {
                    method: 'DELETE',
                    headers: { 'Accept': 'application/json' },
                    // credentials: 'include'
                });
                if (!res.ok) {
                    const txt = await res.text().catch(() => '');
                    throw new Error(txt || (`${res.status} ${res.statusText}`));
                }

                const modules = MODULES_GRID.getElementsByClassName('card')
                if (modules.length <= 1) {
                    return window.location.reload();
                }

                deletingModule.classList.add('hidden'); 
                toolbar.classList.remove('hidden');
                modulesGrid.classList.remove('hidden'); 
                card?.remove();
                sidebarCard?.remove();
                closeAllMenus();
            } catch (err) {
                alert('No se pudo eliminar: ' + (err.message || 'Error desconocido'));
                del.disabled = false;
                closeAllMenus();
            }
            return;
        }

        // Click fuera: cerrar menús
        if (!e.target.closest('.dropdown-menu')) closeAllMenus();
    });

    // Escape cierra menús
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllMenus();
    });

    window.lucide && window.lucide.createIcons();
})();