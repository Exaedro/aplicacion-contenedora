// js/activeMarker.js
(function () {
    const SIDEBAR = document.querySelector('.sidebar');
    if (!SIDEBAR) return;

    // Crea un único indicador (animable). Si no hay JS o falla, el fallback CSS con ::before cubre.
    let indicator = document.createElement('div');
    indicator.className = 'sidebar__indicator';
    SIDEBAR.appendChild(indicator);

    const AVATARS = Array.from(SIDEBAR.querySelectorAll('.avatar-modulo[data-slug]'));

    function getAvatarBySlug(slug) {
        return AVATARS.find(a => a.dataset.slug === slug);
    }

    function currentPathSlug() {
        // intenta leer /apps/:slug del pathname
        const params = new URLSearchParams(location.search);
        return params.get('app');
    }

    function saveActive(slug) {
        try { localStorage.setItem('activeModuleSlug', slug); } catch { }
    }

    function loadActive() {
        try { return localStorage.getItem('activeModuleSlug'); } catch { return null; }
    }

    function clearActiveClasses() {
        AVATARS.forEach(a => a.classList.remove('is-active'));
    }

    function placeIndicatorOn(el, animate = true) {
        if (!el) return;
        const sideRect = SIDEBAR.getBoundingClientRect();
        const r = el.getBoundingClientRect();

        const targetY = (r.top - sideRect.top) + (r.height / 2) - (indicator.offsetHeight / 2);

        indicator.style.opacity = '1';

        // Si hay GSAP, animamos; si no, usamos CSS transition
        if (window.gsap) {
            gsap.to(indicator, { y: targetY, duration: 0.18, ease: 'power2.out' });
            // opcional: ajustar alto al alto del avatar
            gsap.to(indicator, { height: Math.max(28, Math.round(r.height * 0.6)), duration: 0.18, ease: 'power2.out' });
        } else {
            indicator.style.transform = `translateY(${targetY}px)`;
            indicator.style.height = Math.max(28, Math.round(r.height * 0.6)) + 'px';
        }
    }

    function markActive(slug, { animate = true } = {}) {
        if (!slug) return;
        const avatar = getAvatarBySlug(slug);
        if (!avatar) return;

        clearActiveClasses();
        avatar.classList.add('is-active');
        placeIndicatorOn(avatar, animate);
        saveActive(slug);

        // Accesibilidad
        AVATARS.forEach(a => a.setAttribute('aria-current', a === avatar ? 'true' : 'false'));
    }

    // Exponer helper global por si otros scripts quieren marcar manualmente
    window.markActiveModule = markActive;

    // Exponer helper global por si otros scripts quieren limpiar marcas
    window.clearActiveModules = clearActiveClasses;

    // Interceptar clicks en cualquier .open-module para mover la marquita
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.open-module');
        if (!link) return;

        const slug = link.dataset.slug || (link.getAttribute('href') || '').split('/apps/')[1];
        if (!slug) return;

        // No prevenimos la navegación: solo sincronizamos estado visual
        markActive(slug);

        // Si tu shell.js maneja el SPA/iframe, genial.
        // Si NO, al navegar igual se recordará por localStorage y se restaurará en load.
    });

    // También marcar cuando tocan el avatar de la sidebar
    SIDEBAR.addEventListener('click', (e) => {
        const a = e.target.closest('.avatar-modulo[data-slug]');
        if (!a) return;
        const slug = a.dataset.slug;
        markActive(slug);
        // dejá que el link haga lo suyo (tu shell/SPA)
    });

    // Restaurar al cargar:
    window.addEventListener('load', () => {
        const fromURL = currentPathSlug();
        const fromLS = loadActive();
        const slug = fromURL || fromLS;

        // Si no se abre desde /apps/:slug, limpiamos

        if (!fromURL) {
            return clearActiveClasses();
        };

        // Si existe ese avatar, marcamos; sino, limpiamos indicador
        const avatar = slug && getAvatarBySlug(slug);
        if (avatar) {
            // Forzar cálculo de altura antes de posicionar
            indicator.style.height = Math.max(28, Math.round(avatar.getBoundingClientRect().height * 0.6)) + 'px';
            markActive(slug, { animate: false });
        } else {
            indicator.style.opacity = '0';
            clearActiveClasses();
        }
    });

    // Recalcular posición si cambia el layout (resize, theme toggle, fuentes)
    window.addEventListener('resize', () => {
        const slug = loadActive();
        const avatar = slug && getAvatarBySlug(slug);
        if (avatar) placeIndicatorOn(avatar, /* animate */ false);
    });

    // Si tenés un evento propio cuando abrís módulo en el shell, escuchalo:
    // document.addEventListener('module:open', (ev) => markActive(ev.detail.slug));
})();
