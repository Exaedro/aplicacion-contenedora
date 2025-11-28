// MAIN
const GRID_NEUTRALS = document.getElementById('grid-modules');
const TOOLBAR = document.querySelector('.toolbar');
const DELETING_MODULE = document.querySelector('.deleting-module');
const DELETING_MODAL = document.getElementById('confirmDeleteModal')

const FAVORITES_SECTION = document.getElementById('favorites-section');
const GRID_FAVORITES = document.getElementById('grid-favorites');

const GRID_HIDDEN = document.getElementById('grid-hidden');

// SIDEBAR
const FOLDER_FAV = document.querySelector('.folder__content[data-folder-content="fav"]');
const FOLDER_FAV_EMPTY = FOLDER_FAV.querySelector('.folder__empty');

const FOLDER_NEUTRAL = document.querySelector('.folder__content[data-folder-content="neutral"]');
const FOLDER_NEUTRAL_EMPTY = FOLDER_NEUTRAL.querySelector('.folder__empty');

const FOLDER_HIDDEN = document.querySelector('.folder__content[data-folder-content="hidden"]');
const FOLDER_HIDDEN_EMPTY = FOLDER_HIDDEN.querySelector('.folder__empty');

(() => {


    // ------------------------ APERTURA DE MENU DE CONFIGURACION DE LOS MODULOS
    configurationMenus()
})()

let ESCONDIDOS = 0;

function setModuleState({ slug, state }) {
    const avatar = findAvatar({ slug })
    const card = findCard({ slug })
    const menu = card.querySelector('.dropdown-menu')
    const addFavoriteBtn = menu.querySelector('.add-favorite')

    switch (state) {
        case 'favorito':
            const condition = state == 'favorito' ? false : true;

            // Cambios para el estado del avatar del sidebar=
            FOLDER_FAV.appendChild(avatar);
            GRID_FAVORITES.appendChild(card);

            // Ocultar mensaje de vacio en el sidebar
            reloadFolders()

            // Cambios para el estado de la carta del main
            addFavoriteBtn.innerHTML = `<i data-lucide="star-off" class="icon-16"></i> Quitar de favoritos`
            FAVORITES_SECTION.hidden = condition;
            card.dataset.prefState = state;
            break;
        case 'escondido':
            FOLDER_HIDDEN.appendChild(avatar);
            avatar.dataset.state = 'escondido'

            ESCONDIDOS++;
            if(GRID_FAVORITES.children.length <= 1) {
                FAVORITES_SECTION.hidden = true;
            }

             // Ocultar mensaje de vacio en el sidebar
            reloadFolders()

            card.hidden = true;
            break;
        case 'neutral':
            // Mover carta al grid de neutrales
            GRID_NEUTRALS.appendChild(card);
            FOLDER_NEUTRAL.appendChild(avatar);

            // Cambiar estado de la carta
            card.dataset.prefState = state;

            // Cambiar icono de favoritos
            addFavoriteBtn.innerHTML = `<i data-lucide="star" class="icon-16"></i> Agregar a favoritos`

            // Ocultar mensaje de vacio en el sidebar
            reloadFolders()

            const favoriteModulesLength = GRID_FAVORITES.children.length
            if (favoriteModulesLength <= 0) {
                FAVORITES_SECTION.hidden = true;
            }

            break;
    }

    if (ESCONDIDOS == GRID_FAVORITES.children.length) {
        FAVORITES_SECTION.hidden = true;
    }
}

function reloadFolders() {
    if (FOLDER_FAV.children.length >= 2) {
        FOLDER_FAV_EMPTY.hidden = true;
    }
    if (FOLDER_NEUTRAL.children.length >= 2) {
        FOLDER_NEUTRAL_EMPTY.hidden = true;
    }

    if (FOLDER_HIDDEN.children.length >= 2) {
        FOLDER_HIDDEN_EMPTY.hidden = true;
    }

    if (FOLDER_FAV.children.length < 2) {
        FOLDER_FAV_EMPTY.hidden = false;
    }
    if (FOLDER_NEUTRAL.children.length < 2) {
        FOLDER_NEUTRAL_EMPTY.hidden = false;
    }

    if (FOLDER_HIDDEN.children.length < 2) {
        FOLDER_HIDDEN_EMPTY.hidden = false;
    }
}

function configurationMenus() {
    const modulesSettings = document.querySelectorAll('.kebab-btn');
    const modulesActions = document.querySelectorAll('.add-favorite, .not-interested, .delete-module');

    modulesSettings.forEach(btn => {
        btn.addEventListener('click', async () => {
            closeAllMenus();
            const slug = btn.getAttribute('data-menu-for');
            const menu = document.getElementById('menu-' + slug);
            const isOpen = btn.getAttribute('aria-expanded') === 'true';
            if (!isOpen && menu) {
                menu.hidden = false;
                btn.setAttribute('aria-expanded', 'true');
            }
            return;
        });
    });

    modulesActions.forEach(btn => {
        const isFavorite = btn.classList.contains('add-favorite')
        const isNotInterested = btn.classList.contains('not-interested')
        const isDelete = btn.classList.contains('delete-module')

        if (isFavorite) return favoriteAction(btn)
        if (isNotInterested) return notInterestedAction(btn)
        if (isDelete) return deleteModuleAction(btn)
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllMenus();
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        const isMenu = e.target.closest('.dropdown-menu');
        const isButton = e.target.closest('.kebab-btn');
        if (!isMenu && !isButton) closeAllMenus();
    });
}

function favoriteAction(btn) {
    btn.addEventListener('click', async () => {
        closeAllMenus();

        const slug = btn.getAttribute('data-slug');
        const card = findCard({ slug });
        const prev = card?.dataset.prefState || 'neutral';
        const next = (prev === 'favorito') ? 'neutral' : 'favorito';

        // Optimista
        setModuleState({ slug, state: next });
        closeAllMenus();

        try {
            await apiSetState(slug, next);
            showToast(next === 'favorito' ? 'Añadido a favoritos' : 'Quitado de favoritos', 'success');
        } catch {
            // Revertir
            setModuleState({ slug, state: prev });
            showToast('No se pudo actualizar favorito', 'error');
        }

        return;
    });
}

function notInterestedAction(btn) {
    btn.addEventListener('click', async () => {
        closeAllMenus();

        const slug = btn.getAttribute('data-slug');

        // Optimista
        setModuleState({ slug, state: 'escondido' });
        closeAllMenus();

        try {
            await apiSetState(slug, 'escondido');
            showToast('Añadido a no interesados', 'success');
        } catch {
            // Revertir
            setModuleState({ slug, state: prev });
            showToast('No se pudo actualizar no interesado', 'error');
        }

        return;
    })
}

async function deleteModuleAction(btn) {
    btn.addEventListener('click', async () => {
        closeAllMenus();

        const slug = btn.getAttribute('data-slug');
        const card = findCard({ slug });

        console.log('CARTA:', card)
        console.log('SE ELIMINARA EL MODULO:', slug)

        const ok = await moduleExists(slug)
        if (!ok) showToast('Este módulo no existe más', 'error')

        confirmDeleteModal.open({
            moduleName: card.dataset.name,
            onConfirm: async () => {
                try {
                    GRID_NEUTRALS.classList.add('hidden')
                    FAVORITES_SECTION.classList.add('hidden')
                    TOOLBAR.hidden = true
                    DELETING_MODULE.classList.remove('hidden')
                    DELETING_MODAL.classList.remove('is-open')

                    const stopped = await request(`/${slug}/stop`, { method: 'POST' })
                    if (!stopped) {
                        console.log(stopped)

                        setTimeout(() => {
                            window.location.reload()
                        }, 2000)
                        throw new Error('No se pudo detener el módulo')
                    }

                    const ok = await request(`/${slug}`, { method: 'DELETE' })
                    if (!ok) {

                        console.log(ok)

                    }
                    console.log(ok)
                    setFlash('Módulo eliminado exitosamente', 'success')
                    window.location.reload()
                } catch (e) {
                    showToast('No se pudo eliminar el módulo', 'error')
                }
            }
        })
    });

    async function moduleExists(slug) {
        const response = await request(`/${slug}/exists`)
        if (response?.ok) return true
    }

    const confirmDeleteModal = (() => {
        const modal = document.getElementById('confirmDeleteModal');
        const dialog = modal.querySelector('.modal__dialog');
        const nameSlot = modal.querySelector('[data-module-name]');
        const btnConfirm = modal.querySelector('[data-confirm]');
        const closeables = modal.querySelectorAll('[data-close]');

        let onConfirm = null;

        function trapFocus(e) {
            if (e.key === 'Tab') {
                const focusables = modal.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        }

        function open({ moduleName = 'este módulo', onConfirm: fn } = {}) {
            onConfirm = typeof fn === 'function' ? fn : null;
            nameSlot.textContent = moduleName;

            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');

            // foco inicial
            dialog.focus();

            // listeners
            document.addEventListener('keydown', onKeydown);
            dialog.addEventListener('keydown', trapFocus);
        }

        function close() {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');

            document.removeEventListener('keydown', onKeydown);
            dialog.removeEventListener('keydown', trapFocus);
        }

        async function confirm() {
            try {
                if (onConfirm) await onConfirm();
            } finally {
                close();
            }
        }

        function onKeydown(e) {
            if (e.key === 'Escape') close();
        }

        // Cerrar por overlay / botones con data-close
        modal.addEventListener('click', (e) => {
            if (e.target.matches('[data-close]')) close();
        });
        closeables.forEach(btn => btn.addEventListener('click', close));

        // Confirmar
        btnConfirm.addEventListener('click', confirm);

        return { open, close };
    })();
}

// UTILIDADES
// Encontrar la carta del main de modulos
function findCard({ slug }) {
    const sel = `.card[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`;
    return document.querySelector(sel);
}

// Encontrar el avatar del modulo en el sidebar
function findAvatar({ slug }) {
    const sel = `.avatar-modulo[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`;
    return document.querySelector(sel);
}

function closeAllMenus() {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.hidden = true);
    document.querySelectorAll('.kebab-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}

async function apiSetState(slug, state) {
    const res = await fetch(`/api/users/preferences/modules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ set: { [slug]: state } }),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => 'Error'));
    return res.json();
}

async function request(endpoint, { method = 'GET', body, credentials = 'include' } = {}) {
    const res = await fetch(`/api/modules${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials,
        body: JSON.stringify(body),
    });

    return res.json();
}