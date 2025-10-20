(function () {
    const btn = document.getElementById('userMenuBtn');
    const menu = document.getElementById('userMenu');
    if (!btn || !menu) return;

    // Toggle abrir/cerrar
    const openMenu = () => {
        menu.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        // foco en el primer input si existe
        const firstInput = menu.querySelector('input, button, a, [tabindex]:not([tabindex="-1"])');
        if (firstInput) firstInput.focus();
        // render de iconos por si el menú se inyecta tarde
        if (window.lucide?.createIcons) lucide.createIcons();
    };

    const closeMenu = () => {
        if (menu.hidden) return;
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
    };

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.hidden ? openMenu() : closeMenu();
    });

    // Click afuera cierra
    document.addEventListener('click', (e) => {
        if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) {
            closeMenu();
        }
    });

    // ESC cierra
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });

    // Navegación con TAB dentro del menú (focus trap simple)
    menu.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const focusables = menu.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
})();
