const key = 'modulo-activo';

// Si estás en la ruta raíz, limpia el activo
if (location.pathname === '/' || location.pathname === '') {
    localStorage.removeItem(key);
}

// Detectar si hay ?app= en la URL
const params = new URLSearchParams(location.search);
const appSlug = params.get('app');
if (appSlug) {
    localStorage.setItem(key, appSlug);
}

const apply = () => {
    const slug = localStorage.getItem(key);
    document.querySelectorAll('.avatar-modulo').forEach(el => {
        const on = el.getAttribute('data-slug') === slug;
        el.classList.toggle('is-active', on);
        if (on) el.setAttribute('aria-current', 'true');
        else el.removeAttribute('aria-current');
    });
};
apply();

// Delegación de clicks
document.addEventListener('click', e => {
    const closeBtn = e.target.closest('#closeShell');
    const openBtn = e.target.closest('.open-module');
    const avatar = e.target.closest('.avatar-modulo');

    // Cerrar shell → eliminar activo
    if (closeBtn) {
        localStorage.removeItem(key);
        document.querySelectorAll('.avatar-modulo').forEach(m => {
            m.classList.remove('is-active');
            m.removeAttribute('aria-current');
        });
        return;
    }

    // Botones de abrir módulo
    if (openBtn) {
        const slug = openBtn.getAttribute('data-slug');
        if (slug) {
            localStorage.setItem(key, slug);
            document.querySelectorAll('.avatar-modulo').forEach(m => {
                const on = m.getAttribute('data-slug') === slug;
                m.classList.toggle('is-active', on);
                if (on) m.setAttribute('aria-current', 'true');
                else m.removeAttribute('aria-current');
            });
        }
        return;
    }

    // Click directo en avatar
    if (avatar) {
        const slug = avatar.getAttribute('data-slug');
        localStorage.setItem(key, slug);
        document.querySelectorAll('.avatar-modulo').forEach(m => {
            const on = m === avatar;
            m.classList.toggle('is-active', on);
            if (on) m.setAttribute('aria-current', 'true');
            else m.removeAttribute('aria-current');
        });
    }
});

function clearActiveModules() {
    document.querySelectorAll('.avatar-modulo').forEach(m => {
        m.classList.remove('is-active');
        m.removeAttribute('aria-current');
    });
}

window.clearActiveModules = clearActiveModules;

// Reaplica si el DOM cambia
new MutationObserver(() => apply()).observe(document.body, { childList: true, subtree: true });
