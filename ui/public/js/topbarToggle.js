(() => {
    const shell = document.getElementById('moduleShell');
    const toggleBtn = document.getElementById('modShellToggle');

    if (shell && toggleBtn) {
        const setIcon = (expanded) => {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', expanded ? 'chevron-up' : 'chevron-down');
                window.lucide && window.lucide.createIcons();
            }
            toggleBtn.setAttribute('aria-expanded', String(expanded));
            toggleBtn.setAttribute('aria-label', expanded ? 'Contraer barra' : 'Expandir barra');
        };

        // Estado inicial: expandido
        setIcon(true);

        toggleBtn.addEventListener('click', () => {
            const nowCollapsed = !shell.classList.toggle('is-collapsed') ? false : true;
            setIcon(!nowCollapsed);
        });

        // Atajo de teclado: Ctrl/Cmd + B para alternar (opcional)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                toggleBtn.click();
            }
        });
    }
})();