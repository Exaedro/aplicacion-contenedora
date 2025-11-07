// sidebarFolders.js
(function () {
    const $$ = (q, ctx = document) => Array.from(ctx.querySelectorAll(q));
    const $ = (q, ctx = document) => ctx.querySelector(q);

    function toggleFolder(btn) {
        const id = btn.dataset.folder;
        const content = document.querySelector(`[data-folder-content="${id}"]`);
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const next = !expanded;

        btn.setAttribute('aria-expanded', String(next));
        // Cambia caret
        const caret = btn.querySelector('.caret');
        if (caret) caret.setAttribute('data-icon', next ? 'chevron-down' : 'chevron-right');

        // Mostrar/ocultar contenido con una animación suave
        if (next) {
            content.hidden = false;
            content.style.height = 'auto';
            const h = content.clientHeight + 'px';
            content.style.height = '0px';
            requestAnimationFrame(() => {
                content.style.transition = 'height .18s ease';
                content.style.height = h;
            });
            content.addEventListener('transitionend', function onEnd() {
                content.style.height = '';
                content.style.transition = '';
                content.removeEventListener('transitionend', onEnd);
            });
        } else {
            content.style.height = content.clientHeight + 'px';
            requestAnimationFrame(() => {
                content.style.transition = 'height .18s ease';
                content.style.height = '0px';
            });
            content.addEventListener('transitionend', function onEnd() {
                content.hidden = true;
                content.style.height = '';
                content.style.transition = '';
                content.removeEventListener('transitionend', onEnd);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Bind toggles
        $$('.avatar-folder[aria-expanded]').forEach(btn => {
            btn.addEventListener('click', () => toggleFolder(btn));
        });

        // Lucide refresh (por si no se autoinicializa)
        if (window.lucide?.createIcons) {
            window.lucide.createIcons();
        }
    });
})();
