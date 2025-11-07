// MAIN
const GRID_NEUTRALS = document.getElementById('grid-modules');
const TOOLBAR = document.querySelector('.toolbar');
const DELETING_MODULE = document.querySelector('.deleting-module');

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
            if (FOLDER_FAV.children.length >= 1) {
                FOLDER_FAV_EMPTY.hidden = true;
            }

            // Cambios para el estado de la carta del main
            addFavoriteBtn.innerHTML = `<i data-lucide="star-off" class="icon-16"></i> Quitar de favoritos`
            FAVORITES_SECTION.hidden = condition;
            card.dataset.prefState = state;
            break;
        case 'escondido':
            FOLDER_HIDDEN.appendChild(avatar);
            avatar.dataset.state = 'escondido'

            // Ocultar mensaje de vacio en el sidebar
            if (FOLDER_HIDDEN.children.length >= 1) {
                FOLDER_HIDDEN_EMPTY.hidden = true;
            }

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
            if (FOLDER_FAV.children.length <= 1) {
                FOLDER_FAV_EMPTY.hidden = false;
            }

            const favoriteModulesLength = GRID_FAVORITES.children.length
            if (favoriteModulesLength <= 0) {
                FAVORITES_SECTION.hidden = true;
            }

            break;
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

                const stopped = await request(`/${slug}/stop`, { method: 'POST' })
                if (!stopped) {
                    console.log(stopped)
                    throw new Error('No se pudo detener el módulo')
                }

                const ok = await request(`/${slug}`, { method: 'DELETE' })
                if (!ok) {
                    console.log(ok)
                    throw new Error('No se pudo eliminar el módulo')
                }

                showToast('Módulo eliminado exitosamente', 'success')
            } catch(e) {
                showToast('No se pudo eliminar el módulo', 'error')
            }
        }})
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
    if (!res.ok) return undefined
    return res.json();
}


// (() => {
//     const GRID_MAIN = document.getElementById('grid-modules');

//     // --- Crear/gestionar la sección de Favoritos ---
//     function ensureFavoritesArea() {
//         let favSection = document.getElementById('favorites-section');
//         if (favSection) return favSection;

//         favSection = document.createElement('section');
//         favSection.id = 'favorites-section';
//         favSection.className = 'favorites-section';

//         const title = document.createElement('h2');
//         title.textContent = 'FAVORITOS';
//         title.className = 'favorites-title';

//         const hr = document.createElement('hr');
//         hr.className = 'favorites-hr';

//         const grid = document.createElement('div');
//         grid.id = 'grid-favorites';
//         grid.className = 'grid grid-favorites';

//         // Insertamos la sección de favoritos por encima del grid principal
//         GRID_MAIN.parentNode.insertBefore(favSection, GRID_MAIN);
//         favSection.appendChild(title);
//         favSection.appendChild(hr);
//         favSection.appendChild(grid);

//         return favSection;
//     }

//     function getFavoritesGrid() {
//         ensureFavoritesArea();
//         return document.getElementById('grid-favorites');
//     }

//     function updateFavoritesVisibility() {
//         const favSection = document.getElementById('favorites-section');
//         if (!favSection) return;
//         const gridFav = document.getElementById('grid-favorites');
//         // Ocultar sección si está vacía
//         favSection.hidden = (gridFav && gridFav.children.length > 0) ? false : true;
//     }

//     // --- Utilidades DOM ---
//     function findCard(slug) {
//         const sel = `.card[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`;
//         return document.querySelector(sel);
//     }

//     function moveCardToFavorites(card) {
//         const gridFav = getFavoritesGrid();
//         if (!card || !gridFav) return;
//         if (card.parentElement === gridFav) return; // ya está arriba
//         gridFav.appendChild(card);
//         updateFavoritesVisibility();
//     }

//     function moveCardToMain(card) {
//         if (!card || !GRID_MAIN) return;
//         if (card.parentElement === GRID_MAIN) return;
//         GRID_MAIN.appendChild(card);
//         updateFavoritesVisibility();
//     }

//     function animateInto(container, card) {
//         // medimos antes de mover
//         const rectFrom = card.getBoundingClientRect();
//         container.appendChild(card);
//         const rectTo = card.getBoundingClientRect();

//         const dx = rectFrom.left - rectTo.left;
//         const dy = rectFrom.top - rectTo.top;

//         // posición inicial “desde donde estaba”
//         gsap.fromTo(card, { opacity: 0, x: dx, y: dy }, { opacity: 1, x: 0, y: 0, duration: .28, ease: 'power2.out' });
//     }

//     function animateOutAndRemove(card, onDone) {
//         const h = card.offsetHeight;
//         gsap.to(card, { opacity: 0, duration: .15, ease: 'power1.out' });
//         gsap.to(card, {
//             height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0,
//             duration: .18, ease: 'power1.in', onComplete: () => { card.remove(); onDone && onDone(); }
//         });
//     }

//     // (Redefinidas con animación: está bien que sobrescriban a las de arriba)
//     function moveCardToFavorites(card) {
//         const gridFav = getFavoritesGrid();
//         if (!card || !gridFav || card.parentElement === gridFav) return;
//         animateInto(gridFav, card);
//         updateFavoritesVisibility();
//     }

//     function moveCardToMain(card) {
//         if (!card) return;
//         const container = GRID_MAIN || document.createElement('div');
//         if (card.parentElement === container) return;
//         animateInto(container, card);
//         updateFavoritesVisibility();
//     }

//     // === helpers para FAVORITOS en sidebar ===
//     function getSidebarFavContainer() {
//         return document.querySelector('[data-folder-content="fav"]');
//     }
//     function getSidebarFavButton() {
//         return document.querySelector('.avatar-folder[data-folder="fav"]');
//     }
//     function initialsFromLabel(label) {
//         const s = String(label || '').trim().toUpperCase();
//         return (s[0] || '') + (s[1] || '');
//     }
//     function labelFromCard(card) {
//         return card?.querySelector('.card__title')?.textContent?.trim() || card?.dataset?.slug || '';
//     }
//     function openFavFolderIfClosed() {
//         const btn = getSidebarFavButton();
//         const content = getSidebarFavContainer();
//         if (!btn || !content) return;

//         const expanded = btn.getAttribute('aria-expanded') === 'true';
//         if (expanded) return;

//         btn.setAttribute('aria-expanded', 'true');
//         // caret → chevron-down
//         const caret = btn.querySelector('.caret');
//         if (caret) caret.setAttribute('data-icon', 'chevron-down');

//         // animación simple de apertura (sin depender del otro script)
//         content.hidden = false;
//         content.style.height = 'auto';
//         const h = content.clientHeight + 'px';
//         content.style.height = '0px';
//         requestAnimationFrame(() => {
//             content.style.transition = 'height .18s ease';
//             content.style.height = h;
//         });
//         content.addEventListener('transitionend', function onEnd() {
//             content.style.height = '';
//             content.style.transition = '';
//             normalizeFolderContent('fav')
//             content.removeEventListener('transitionend', onEnd);
//         });
//     }

//     function upsertSidebarFavorite(slug, label) {
//         const cont = getSidebarFavContainer();
//         if (!cont) return;

//         // existe?
//         let avatar = cont.querySelector(`.avatar-modulo[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`);
//         if (!avatar) {
//             avatar = document.createElement('a');
//             avatar.href = `/apps/${encodeURIComponent(slug)}`;
//             avatar.className = 'avatar avatar-modulo primary-20 open-module';
//             avatar.dataset.slug = slug;
//             avatar.dataset.name = label;
//             const span = document.createElement('span');
//             span.className = 'avatar__text';
//             span.textContent = initialsFromLabel(label);
//             avatar.appendChild(span);
//             cont.appendChild(avatar);

//             // si estaba cerrada, abrir y animar el nuevo
//             openFavFolderIfClosed();
//             try {
//                 avatar.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
//             } catch { }
//             if (window.gsap) {
//                 gsap.fromTo(avatar, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: .22, ease: 'power2.out' });
//             }
//         } else {
//             // actualizar label/initials por si cambió
//             avatar.dataset.name = label;
//             const t = avatar.querySelector('.avatar__text');
//             if (t) t.textContent = initialsFromLabel(label);
//         }

//         if (window.lucide?.createIcons) window.lucide.createIcons();
//     }

//     function removeSidebarFavorite(slug) {
//         const cont = getSidebarFavContainer();
//         if (!cont) return;
//         const avatar = cont.querySelector(`.avatar-modulo[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`);
//         if (!avatar) { scheduleEmptyStateUpdate('fav'); return; }

//         if (window.gsap) {
//             gsap.to(avatar, {
//                 opacity: 0, scale: 0.9, duration: .14, ease: 'power1.in',
//                 onComplete: () => {
//                     avatar.remove();
//                     scheduleEmptyStateUpdate('fav'); // <- ahora SÍ calcula sin el item
//                 }
//             });
//         } else {
//             avatar.remove();
//             scheduleEmptyStateUpdate('fav');
//         }
//     }

//     function getSidebarNeutralContainer() {
//         return document.querySelector('[data-folder-content="neutral"]');
//     }
//     function upsertSidebarNeutral(slug, label) {
//         const cont = getSidebarNeutralContainer();
//         if (!cont) return;
//         let avatar = cont.querySelector(`.avatar-modulo[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`);
//         if (!avatar) {
//             avatar = document.createElement('a');
//             avatar.href = `/apps/${encodeURIComponent(slug)}`;
//             avatar.className = 'avatar avatar-modulo primary-20 open-module';
//             avatar.dataset.slug = slug;
//             avatar.dataset.name = label;
//             avatar.setAttribute('aria-current', false)
//             const span = document.createElement('span');
//             span.className = 'avatar__text';
//             span.textContent = initialsFromLabel(label);
//             avatar.appendChild(span);
//             cont.appendChild(avatar);
//             if (window.gsap) {
//                 gsap.fromTo(avatar, { opacity: 0, scale: .92 }, { opacity: 1, scale: 1, duration: .18, ease: 'power2.out' });
//             }
//         } else {
//             avatar.dataset.name = label;
//             const t = avatar.querySelector('.avatar__text');
//             if (t) t.textContent = initialsFromLabel(label);
//         }
//         if (window.lucide?.createIcons) window.lucide.createIcons();
//     }
//     function removeSidebarNeutral(slug) {
//         const cont = getSidebarNeutralContainer();
//         if (!cont) return;
//         const avatar = cont.querySelector(`.avatar-modulo[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`);
//         if (!avatar) { scheduleEmptyStateUpdate('neutral'); return; }

//         if (window.gsap) {
//             gsap.to(avatar, {
//                 opacity: 0, scale: .9, duration: .14, ease: 'power1.in',
//                 onComplete: () => {
//                     avatar.remove();
//                     scheduleEmptyStateUpdate('neutral');
//                 }
//             });
//         } else {
//             avatar.remove();
//             scheduleEmptyStateUpdate('neutral');
//         }
//     }

//     // --- Ajustar UI según estado (favorito / escondido / neutral) ---
//     function setCardStateUI(slug, state) {
//         const card = findCard(slug);
//         const folderEmpty = document.getElementById('folder-fav').querySelector('.folder__empty')
//         const contentFav = document.getElementById('folder-fav').querySelectorAll('.folder__content .avatar-modulo')

//         if (state === 'escondido') {
//             if (card) animateOutAndRemove(card, updateFavoritesVisibility);
//             // quitar de ambas carpetas del sidebar
//             removeSidebarFavorite(slug);
//             removeSidebarNeutral(slug);
//             updateFavoritesVisibility();
//             return;
//         }

//         if (!card) return;
//         card.dataset.prefState = state;

//         // mover en el MAIN
//         if (state === 'favorito') {
//             moveCardToFavorites(card);
//             folderEmpty.hidden = true;
//         } else {
//             if (contentFav.length <= 1) {
//                 folderEmpty.hidden = false;
//             }

//             moveCardToMain(card);
//         }

//         // --- sincronizar SIDEBAR ---
//         const label = labelFromCard(card);
//         if (state === 'favorito') {
//             // agregar a favoritos y quitar de neutrales
//             upsertSidebarFavorite(slug, label);
//             removeSidebarNeutral(slug);
//         } else if (state === 'neutral') {
//             // quitar de favoritos y asegurar presencia en neutrales
//             removeSidebarFavorite(slug);
//             upsertSidebarNeutral(slug, label);
//         }

//         // actualizar textos del menú contextual
//         const menu = document.getElementById('menu-' + slug);
//         if (menu) {
//             const favBtn = menu.querySelector('.add-favorite');
//             const hideBtn = menu.querySelector('.not-interested');

//             if (favBtn) {
//                 favBtn.dataset.slug = slug;
//                 favBtn.innerHTML = (state === 'favorito')
//                     ? `<i data-lucide="star-off" class="icon-16"></i> Quitar de favoritos`
//                     : `<i data-lucide="star" class="icon-16"></i> Agregar a favoritos`;
//             }
//             if (hideBtn) {
//                 hideBtn.dataset.slug = slug;
//                 hideBtn.innerHTML = (state === 'escondido')
//                     ? `<i data-lucide="eye" class="icon-16"></i> Mostrar en la lista`
//                     : `<i data-lucide="eye-off" class="icon-16"></i> No me interesa`;
//             }
//             window.lucide && window.lucide.createIcons();
//         }

//         updateAllFolderEmptyStates();
//     }

//     // actualizar todos
//     function updateAllFolderEmptyStates() {
//         ['fav', 'neutral', 'hidden'].forEach(k => scheduleEmptyStateUpdate(k));
//     }

//     // --- API ---
//     async function apiGetPrefs() {
//         const r = await fetch(`/api/users/preferences/modules`, { credentials: 'include' });
//         if (!r.ok) throw new Error('No se pudieron cargar preferencias');
//         return r.json(); // { favorites, hidden, map }
//     }
//     async function apiSetPref(slug, state) {
//         const r = await fetch(`/api/users/preferences/modules`, {
//             method: 'PATCH',
//             headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
//             credentials: 'include',
//             body: JSON.stringify({ set: { [slug]: state } }),
//         });
//         if (!r.ok) throw new Error(await r.text().catch(() => 'Error'));
//         return r.json();
//     }

//     // --- Menús ---
//     function closeAllMenus() {
//         document.querySelectorAll('.dropdown-menu').forEach(m => m.hidden = true);
//         document.querySelectorAll('.kebab-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
//     }

//     function scheduleEmptyStateUpdate(folderKey) {
//         requestAnimationFrame(() => {
//             //updateFolderEmptyState(folderKey);
//             normalizeFolderContent(folderKey);
//         });
//     }

//     // --- Carga inicial: pinta favoritos arriba y remueve ocultos ---
//     async function paintInitialPrefs() {
//         ensureFavoritesArea(); // crea la sección (se ocultará si queda vacía)
//         try {
//             const { favorites = [], hidden = [] } = await apiGetPrefs();
//             const favSet = new Set(favorites);
//             const hidSet = new Set(hidden);

//             // 1) Remover ocultos
//             document.querySelectorAll('#grid-modules .card[data-slug]').forEach(card => {
//                 const slug = card.getAttribute('data-slug');
//                 if (hidSet.has(slug)) card.remove();
//             });

//             // 2) Subir favoritos
//             document.querySelectorAll('.card[data-slug]').forEach(card => {
//                 const slug = card.getAttribute('data-slug');
//                 const state = hidSet.has(slug) ? 'escondido' : (favSet.has(slug) ? 'favorito' : 'neutral');
//                 setCardStateUI(slug, state);
//             });
//         } catch {
//             // si falla, dejamos todo como está
//         } finally {
//             updateFavoritesVisibility();
//             updateAllFolderEmptyStates();
//         }
//     }

//     // Limpia alturas residuales y divs vacíos al final de animaciones
//     function normalizeFolderContent(folderKey) {
//         const content = document.querySelector(`[data-folder-content="${folderKey}"]`);
//         if (!content) return;
//         content.style.height = '';
//         content.style.transition = '';

//         // limpiar nodos huérfanos (p.ej. divs vacíos creados por errores)
//         [...content.childNodes].forEach(n => {
//             if (n.nodeType === Node.TEXT_NODE && !n.textContent.trim()) n.remove();
//             if (n.nodeType === Node.ELEMENT_NODE) {
//                 // no tocar el placeholder de vacío
//                 if (n.classList?.contains('folder__empty')) return;
//                 if (n.children.length === 0 && !n.textContent.trim()) n.remove();
//             }
//         });
//     }


//     // --- Delegación de clicks (toggle favorito / no me interesa / eliminar) ---
//     document.addEventListener('click', async (e) => {
//         const kebab = e.target.closest('.kebab-btn');
//         if (kebab) {
//             const slug = kebab.dataset.menuFor;
//             const menu = document.getElementById('menu-' + slug);
//             const isOpen = kebab.getAttribute('aria-expanded') === 'true';
//             closeAllMenus();
//             if (!isOpen && menu) {
//                 menu.hidden = false;
//                 kebab.setAttribute('aria-expanded', 'true');
//             }
//             return;
//         }

//         // ------------------ ELIMINAR MÓDULO (reintegrado) ------------------
//         const del = e.target.closest('.delete-module');
//         const toolbar = document.querySelector('.toolbar');
//         const modulesGrid = document.getElementById('grid-modules');
//         const deletingModule = document.querySelector('.deleting-module');
//         const errorDeletingModule = document.querySelector('.error-deleting-module');
//         if (del) {
//             const slug = del.dataset.slug;
//             if (!slug) return;

//             const ok = confirm(`¿Eliminar el módulo "${slug}"? Esta acción no se puede deshacer.`);
//             if (!ok) { closeAllMenus(); return; }

//             // Pantalla de carga eliminando el modulo
//             deletingModule.classList.remove('hidden'); // Mostramos pantalla de carga
//             toolbar.classList.add('hidden'); // Ocultamos toolbar
//             modulesGrid.classList.add('hidden'); // Ocultamos grid

//             // 1) Si el módulo está abierto en el iframe, se cierra y espera a que quede en blanco
//             const iframe = document.getElementById('modFrame');
//             const isOpenInFrame = iframe && iframe.src.includes(`/modulos/${slug}`);
//             if (isOpenInFrame) {
//                 await new Promise((resolve) => {
//                     const onload = () => { iframe.removeEventListener('load', onload); resolve(); };
//                     iframe.addEventListener('load', onload, { once: true });

//                     window.__closeShell ? window.__closeShell() : (iframe.src = 'about:blank');
//                 });
//                 // pequeña espera extra por si Windows tarda en soltar el lock
//                 await new Promise(r => setTimeout(r, 120));
//             }

//             del.disabled = true;
//             const card = document.querySelector(`.card[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`);
//             const sidebarCard = document.querySelector(`.avatar-modulo[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`);

//             try {
//                 // Parar el modulo para poder eliminarlo
//                 const resStopModule = await fetch(`/api/modules/${encodeURIComponent(slug)}/stop`, {
//                     method: 'POST',
//                     headers: { 'Accept': 'application/json' },
//                     // credentials: 'include'
//                 });
//                 if (!resStopModule.ok) {
//                     const txt = await resStopModule.text().catch(() => '');
//                     throw new Error(txt || (`${resStopModule.status} ${resStopModule.statusText}`));
//                 }

//                 const res = await fetch(`/api/modules/${encodeURIComponent(slug)}`, {
//                     method: 'DELETE',
//                     headers: { 'Accept': 'application/json' },
//                     // credentials: 'include'
//                 });
//                 if (!res.ok) {
//                     const txt = await res.text().catch(() => '');
//                     throw new Error(txt || (`${res.status} ${res.statusText}`));
//                 }

//                 const modules = GRID_MAIN.getElementsByClassName('card'); // <-- reemplazo de MODULES_GRID
//                 if (modules.length <= 1) {
//                     setFlash('Módulo eliminado exitosamente', 'success');
//                     return window.location.reload();

//                 }

//                 showToast('Módulo eliminado exitosamente', 'success');
//                 deletingModule.classList.add('hidden');
//                 toolbar.classList.remove('hidden');
//                 modulesGrid.classList.remove('hidden');

//                 card?.remove();
//                 removeSidebarFavorite(slug);
//                 removeSidebarNeutral(slug);

//                 updateAllFolderEmptyStates();

//                 closeAllMenus();

//                 closeAllMenus();
//             } catch (err) {
//                 if (err.message.includes('EBUSY')) {
//                     deletingModule.classList.add('hidden');
//                     errorDeletingModule.classList.remove('hidden');

//                     const res = await fetch(`/api/modules/${encodeURIComponent(slug)}/start`, {
//                         method: 'POST',
//                         headers: { 'Accept': 'application/json' },
//                         // credentials: 'include'
//                     });

//                     setTimeout(() => window.location.reload(), 5000);
//                 }
//                 del.disabled = false;
//                 closeAllMenus();
//             }
//             return;
//         }
//         // ------------------ /ELIMINAR MÓDULO ------------------

//         const fav = e.target.closest('.add-favorite');
//         if (fav) {
//             tippy(fav, {
//                 content: fav.dataset.name,
//                 delay: [200, 0],
//                 placement: 'right',
//                 onShow(instance) {
//                     const { props } = instance;
//                     if (props.placement === 'top') props.arrow = false;
//                 }
//             });

//             const slug = fav.dataset.slug;
//             const card = findCard(slug);
//             const prev = card?.dataset.prefState || 'neutral';
//             const next = (prev === 'favorito') ? 'neutral' : 'favorito';

//             // Optimista
//             setCardStateUI(slug, next);
//             closeAllMenus();

//             try {
//                 await apiSetPref(slug, next);
//                 showToast(next === 'favorito' ? 'Añadido a favoritos' : 'Quitado de favoritos', 'success');
//             } catch {
//                 // Revertir
//                 setCardStateUI(slug, prev);
//                 showToast('No se pudo actualizar favorito', 'error');
//             }


//             return;
//         }

//         const hide = e.target.closest('.not-interested');
//         if (hide) {
//             tippy(hide, {
//                 content: hide.dataset.name,
//                 delay: [200, 0],
//                 placement: 'right',
//                 onShow(instance) {
//                     const { props } = instance;
//                     if (props.placement === 'top') props.arrow = false;
//                 }
//             });

//             const slug = hide.dataset.slug;
//             const card = findCard(slug);
//             const prev = card?.dataset.prefState || 'neutral';
//             const next = (prev === 'escondido') ? 'neutral' : 'escondido';

//             // Optimista
//             setCardStateUI(slug, next);
//             closeAllMenus();

//             try {
//                 await apiSetPref(slug, next);
//                 showToast(next === 'escondido' ? 'Módulo oculto' : 'Módulo visible nuevamente', 'success');
//                 if (next === 'neutral' && !findCard(slug)) {
//                     window.location.reload()
//                 }
//             } catch {
//                 // Revertir
//                 setCardStateUI(slug, prev);
//                 showToast('No se pudo actualizar preferencia', 'error');
//             }



//             return;
//         }



//         if (!e.target.closest('.dropdown-menu')) closeAllMenus();
//     });

//     document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllMenus(); });

//     // --- Init ---
//     paintInitialPrefs();
//     window.lucide && window.lucide.createIcons();
// })();
