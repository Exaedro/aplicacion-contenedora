(() => {
    const GRID_MAIN = document.getElementById('grid-modules');

    // --- Crear/gestionar la sección de Favoritos ---
    function ensureFavoritesArea() {
        let favSection = document.getElementById('favorites-section');
        if (favSection) return favSection;

        favSection = document.createElement('section');
        favSection.id = 'favorites-section';
        favSection.className = 'favorites-section';

        const title = document.createElement('h2');
        title.textContent = 'FAVORITOS';
        title.className = 'favorites-title';

        const hr = document.createElement('hr');
        hr.className = 'favorites-hr';

        const grid = document.createElement('div');
        grid.id = 'grid-favorites';
        grid.className = 'grid grid-favorites';

        // Insertamos la sección de favoritos por encima del grid principal
        GRID_MAIN.parentNode.insertBefore(favSection, GRID_MAIN);
        favSection.appendChild(title);
        favSection.appendChild(hr);
        favSection.appendChild(grid);

        return favSection;
    }

    function getFavoritesGrid() {
        ensureFavoritesArea();
        return document.getElementById('grid-favorites');
    }

    function updateFavoritesVisibility() {
        const favSection = document.getElementById('favorites-section');
        if (!favSection) return;
        const gridFav = document.getElementById('grid-favorites');
        // Ocultar sección si está vacía
        favSection.hidden = (gridFav && gridFav.children.length > 0) ? false : true;
    }

    // --- Utilidades DOM ---
    function findCard(slug) {
        const sel = `.card[data-slug="${CSS?.escape ? CSS.escape(slug) : slug}"]`;
        return document.querySelector(sel);
    }

    function moveCardToFavorites(card) {
        const gridFav = getFavoritesGrid();
        if (!card || !gridFav) return;
        if (card.parentElement === gridFav) return; // ya está arriba
        gridFav.appendChild(card);
        updateFavoritesVisibility();
    }

    function moveCardToMain(card) {
        if (!card || !GRID_MAIN) return;
        if (card.parentElement === GRID_MAIN) return;
        GRID_MAIN.appendChild(card);
        updateFavoritesVisibility();
    }

    function animateInto(container, card) {
        // medimos antes de mover
        const rectFrom = card.getBoundingClientRect();
        container.appendChild(card);
        const rectTo = card.getBoundingClientRect();

        const dx = rectFrom.left - rectTo.left;
        const dy = rectFrom.top - rectTo.top;

        // posición inicial “desde donde estaba”
        gsap.fromTo(card, { opacity: 0, x: dx, y: dy }, { opacity: 1, x: 0, y: 0, duration: .28, ease: 'power2.out' });
    }

    function animateOutAndRemove(card, onDone) {
        const h = card.offsetHeight;
        gsap.to(card, { opacity: 0, duration: .15, ease: 'power1.out' });
        gsap.to(card, {
            height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0,
            duration: .18, ease: 'power1.in', onComplete: () => { card.remove(); onDone && onDone(); }
        });
    }

    // (Redefinidas con animación: está bien que sobrescriban a las de arriba)
    function moveCardToFavorites(card) {
        const gridFav = getFavoritesGrid();
        if (!card || !gridFav || card.parentElement === gridFav) return;
        animateInto(gridFav, card);
        updateFavoritesVisibility();
    }

    function moveCardToMain(card) {
        if (!card) return;
        const container = GRID_MAIN || document.createElement('div');
        if (card.parentElement === container) return;
        animateInto(container, card);
        updateFavoritesVisibility();
    }

    // --- Ajustar UI según estado (favorito / escondido / neutral) ---
    function setCardStateUI(slug, state) {
        const card = findCard(slug);

        if (state === 'escondido') {
            if (card) animateOutAndRemove(card, updateFavoritesVisibility);
            else updateFavoritesVisibility();
            return;
        }

        if (!card) return;
        card.dataset.prefState = state;

        if (state === 'favorito') moveCardToFavorites(card);
        else moveCardToMain(card);

        const menu = document.getElementById('menu-' + slug);
        if (menu) {
            const favBtn = menu.querySelector('.add-favorite');
            const hideBtn = menu.querySelector('.not-interested');

            if (favBtn) {
                favBtn.dataset.slug = slug;
                favBtn.innerHTML = (state === 'favorito')
                    ? `<i data-lucide="star-off" class="icon-16"></i> Quitar de favoritos`
                    : `<i data-lucide="star" class="icon-16"></i> Agregar a favoritos`;
            }
            if (hideBtn) {
                hideBtn.dataset.slug = slug;
                hideBtn.innerHTML = (state === 'escondido')
                    ? `<i data-lucide="eye" class="icon-16"></i> Mostrar en la lista`
                    : `<i data-lucide="eye-off" class="icon-16"></i> No me interesa`;
            }
            window.lucide && window.lucide.createIcons();
        }
    }

    // --- API ---
    async function apiGetPrefs() {
        const r = await fetch(`/api/users/preferences/modules`, { credentials: 'include' });
        if (!r.ok) throw new Error('No se pudieron cargar preferencias');
        return r.json(); // { favorites, hidden, map }
    }
    async function apiSetPref(slug, state) {
        const r = await fetch(`/api/users/preferences/modules`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ set: { [slug]: state } }),
        });
        if (!r.ok) throw new Error(await r.text().catch(() => 'Error'));
        return r.json();
    }

    // --- Menús ---
    function closeAllMenus() {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.hidden = true);
        document.querySelectorAll('.kebab-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    }

    // --- Carga inicial: pinta favoritos arriba y remueve ocultos ---
    async function paintInitialPrefs() {
        ensureFavoritesArea(); // crea la sección (se ocultará si queda vacía)
        try {
            const { favorites = [], hidden = [] } = await apiGetPrefs();
            const favSet = new Set(favorites);
            const hidSet = new Set(hidden);

            // 1) Remover ocultos
            document.querySelectorAll('#grid-modules .card[data-slug]').forEach(card => {
                const slug = card.getAttribute('data-slug');
                if (hidSet.has(slug)) card.remove();
            });

            // 2) Subir favoritos
            document.querySelectorAll('.card[data-slug]').forEach(card => {
                const slug = card.getAttribute('data-slug');
                const state = hidSet.has(slug) ? 'escondido' : (favSet.has(slug) ? 'favorito' : 'neutral');
                setCardStateUI(slug, state);
            });
        } catch {
            // si falla, dejamos todo como está
        } finally {
            updateFavoritesVisibility();
        }
    }

    // --- Delegación de clicks (toggle favorito / no me interesa / eliminar) ---
    document.addEventListener('click', async (e) => {
        const kebab = e.target.closest('.kebab-btn');
        if (kebab) {
            const slug = kebab.dataset.menuFor;
            const menu = document.getElementById('menu-' + slug);
            const isOpen = kebab.getAttribute('aria-expanded') === 'true';
            closeAllMenus();
            if (!isOpen && menu) {
                menu.hidden = false;
                kebab.setAttribute('aria-expanded', 'true');
            }
            return;
        }

        // ------------------ ELIMINAR MÓDULO (reintegrado) ------------------
        const del = e.target.closest('.delete-module');
        const toolbar = document.querySelector('.toolbar');
        const modulesGrid = document.getElementById('grid-modules');
        const deletingModule = document.querySelector('.deleting-module');
        const errorDeletingModule = document.querySelector('.error-deleting-module');
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

                const modules = GRID_MAIN.getElementsByClassName('card'); // <-- reemplazo de MODULES_GRID
                if (modules.length <= 1) {
                    setFlash('Módulo eliminado exitosamente', 'success');
                    return window.location.reload();

                }

                showToast('Módulo eliminado exitosamente', 'success');
                deletingModule.classList.add('hidden');
                toolbar.classList.remove('hidden');
                modulesGrid.classList.remove('hidden');
                card?.remove();
                sidebarCard?.remove();
                closeAllMenus();
            } catch (err) {
                if (err.message.includes('EBUSY')) {
                    deletingModule.classList.add('hidden');
                    errorDeletingModule.classList.remove('hidden');

                    const res = await fetch(`/api/modules/${encodeURIComponent(slug)}/start`, {
                        method: 'POST',
                        headers: { 'Accept': 'application/json' },
                        // credentials: 'include'
                    });

                    setTimeout(() => window.location.reload(), 5000);
                }
                del.disabled = false;
                closeAllMenus();
            }
            return;
        }
        // ------------------ /ELIMINAR MÓDULO ------------------

        const fav = e.target.closest('.add-favorite');
        if (fav) {
            const slug = fav.dataset.slug;
            const card = findCard(slug);
            const prev = card?.dataset.prefState || 'neutral';
            const next = (prev === 'favorito') ? 'neutral' : 'favorito';

            // Optimista
            setCardStateUI(slug, next);
            closeAllMenus();

            try {
                await apiSetPref(slug, next);
                showToast(next === 'favorito' ? 'Añadido a favoritos' : 'Quitado de favoritos', 'success');
            } catch {
                // Revertir
                setCardStateUI(slug, prev);
                showToast('No se pudo actualizar favorito', 'error');
            }
            return;
        }

        const hide = e.target.closest('.not-interested');
        if (hide) {
            const slug = hide.dataset.slug;
            const card = findCard(slug);
            const prev = card?.dataset.prefState || 'neutral';
            const next = (prev === 'escondido') ? 'neutral' : 'escondido';

            // Optimista
            setCardStateUI(slug, next);
            closeAllMenus();

            try {
                await apiSetPref(slug, next);
                showToast(next === 'escondido' ? 'Módulo oculto' : 'Módulo visible nuevamente', 'success');
                if (next === 'neutral' && !findCard(slug)) {
                    // Si veníamos de oculto y ya no existe la card, sugerí recargar o re-renderizar el grid completo
                    // window.location.reload();
                }
            } catch {
                // Revertir
                setCardStateUI(slug, prev);
                showToast('No se pudo actualizar preferencia', 'error');
            }
            return;
        }

        if (!e.target.closest('.dropdown-menu')) closeAllMenus();
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllMenus(); });

    // --- Init ---
    paintInitialPrefs();
    window.lucide && window.lucide.createIcons();
})();
