document.addEventListener('DOMContentLoaded', () => {
    // ========================================
    // CONSTANTS & INITIALIZATION
    // ========================================
    const sections = Array.from(document.querySelectorAll('main > section'));
    const menuLinks = Array.from(document.querySelectorAll('.item-menu'));
    const filterButtons = Array.from(document.querySelectorAll('.filtros [data-filter]'));
    const searchInput = document.getElementById('searchInput');
    const catalog = document.getElementById('catalog');
    const sortToggle = document.getElementById('botao-ordenacao');
    const sortMenu = document.getElementById('sortMenu');

    let currentFilter = 'todos';
    let allowBestiarioAnimation = false;
    let currentlyExpandedCard = null;

    const FAV_KEY = 'photozoo_favorites_v1';
    let favorites = new Set();

    const rarityOrder = {
        'comum': 0,
        'incomum': 1,
        'raro': 2,
        'epico': 3,
        'lendario': 4,
        'boss': 5
    };

    // ========================================
    // FAVORITES MANAGEMENT
    // ========================================
    function loadFavorites() {
        try {
            const raw = localStorage.getItem(FAV_KEY);
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) {
                    favorites = new Set(arr);
                }
            }
        } catch (e) {
            console.warn('Failed to load favorites', e);
        }
    }

    function saveFavorites() {
        try {
            localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favorites)));
        } catch (e) {
            console.warn('Failed to save favorites', e);
        }
    }

    function getCardId(card) {
        return (card.querySelector('h3')?.innerText || '').trim();
    }

    function isFavorited(card) {
        return favorites.has(getCardId(card));
    }

    function toggleFavorite(card) {
        const id = getCardId(card);
        if (!id) return;

        if (favorites.has(id)) {
            favorites.delete(id);
        } else {
            favorites.add(id);
        }

        saveFavorites();

        // Update UI
        const favBtn = card.querySelector('.aba-favoritar');
        if (favBtn) {
            const isFav = favorites.has(id);
            favBtn.classList.toggle('favoritado', isFav);
            favBtn.querySelector('.estrela').innerText = isFav ? '★' : '☆';
            favBtn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
        }

        // Reapply filters if viewing favorites
        if (currentFilter === 'favoritos') {
            applyFilters();
        }
    }

    // ========================================
    // SECTION DISPLAY
    // ========================================
    function revealAllCardsInstant(section) {
        const cards = Array.from(section.querySelectorAll('.carta-animal'));
        cards.forEach(c => c.classList.add('cartao-visivel'));
    }

    function showSection(id) {
        // Hide all sections
        sections.forEach(s => {
            s.style.display = 'none';
            s.classList.remove('secao-entrando', 'aparecer');
            const cards = s.querySelectorAll('.carta-animal');
            if (cards.length) cards.forEach(c => c.classList.remove('cartao-visivel'));
        });

        const section = document.getElementById(id);
        if (!section) return;

        section.style.display = 'block';

        // Focus heading for accessibility
        const heading = section.querySelector('h2, h1');
        if (heading && typeof heading.focus === 'function') {
            heading.focus();
        }

        // Smooth scroll to section
        if (typeof section.scrollIntoView === 'function') {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Cascade animation for bestiário
        if (id === 'bestiario' && allowBestiarioAnimation) {
            section.classList.add('secao-entrando');
            section.offsetHeight; // force reflow
            section.classList.add('aparecer');

            const cards = Array.from(section.querySelectorAll('.carta-animal'));
            cards.forEach((card, idx) => {
                card.classList.remove('cartao-visivel');
                setTimeout(() => card.classList.add('cartao-visivel'), idx * 140 + 220);
            });

            allowBestiarioAnimation = false;
        } else if (id === 'bestiario') {
            revealAllCardsInstant(section);
        }
    }

    // ========================================
    // FILTERING & SEARCH
    // ========================================
    function applyFilters() {
        const query = (searchInput?.value || '').toLowerCase().trim();
        const cards = Array.from(document.querySelectorAll('.carta-animal'));

        cards.forEach(card => {
            const type = (card.dataset.type || '').toLowerCase();
            const names = (card.dataset.name || '').toLowerCase();
            const text = (card.innerText || '').toLowerCase();

            const typeMatch = currentFilter === 'todos' || type === currentFilter;
            const favMatch = currentFilter !== 'favoritos' || isFavorited(card);
            const searchMatch = query === '' || names.includes(query) || text.includes(query);

            card.style.display = (typeMatch && favMatch && searchMatch) ? 'flex' : 'none';
        });
    }

    // ========================================
    // FILTER BUTTONS
    // ========================================
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            currentFilter = btn.dataset.filter || 'todos';
            applyFilters();
        });

        // Keyboard accessibility
        btn.setAttribute('tabindex', '0');
        btn.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // ========================================
    // SEARCH INPUT
    // ========================================
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters();
            }
        });
    }

    // ========================================
    // MENU & NAVIGATION
    // ========================================
    function activateMenuFor(id) {
        menuLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            const target = href.startsWith('#') ? href.substring(1) : '';

            if (target === id) {
                link.classList.add('ativo-menu');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('ativo-menu');
                link.removeAttribute('aria-current');
            }
        });
    }

    function handleHash() {
        let id = location.hash?.substring(1) || 'bestiario';

        // Legacy redirects
        if (id === 'empresa') id = 'sobre';
        if (id === 'enciclopedia') id = 'bestiario';

        showSection(id);
        activateMenuFor(id);
    }

    window.addEventListener('hashchange', handleHash);

    menuLinks.forEach(link => {
        link.setAttribute('tabindex', '0');
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href') || '';
            const target = href.startsWith('#') ? href.substring(1) : '';
            if (target === 'bestiario' || target === 'enciclopedia') {
                allowBestiarioAnimation = true;
            }
            setTimeout(handleHash, 0);
        });

        link.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                link.click();
            }
        });
    });

    // ========================================
    // CATALOG & RARITY
    // ========================================
    function ensureRaritiesAndBadges() {
        const cards = Array.from(document.querySelectorAll('.carta-animal'));
        cards.forEach(card => {
            let rarity = (card.dataset.rarity || '').toLowerCase();
            const names = (card.dataset.name || '').toLowerCase();

            // Override specific boss creatures
            if (names.includes('onça') || names.includes('onca') || names.includes('harpia') || names.includes('sucuri')) {
                rarity = 'boss';
            }

            if (!rarity) rarity = 'comum';
            card.dataset.rarity = rarity;

            // Create or update badge
            let badge = card.querySelector('.rarity-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = `rarity-badge rarity-${rarity}`;
                card.appendChild(badge);
            } else {
                badge.className = `rarity-badge rarity-${rarity}`;
            }
            badge.innerText = rarity.charAt(0).toUpperCase() + rarity.slice(1);
        });
    }

    // ========================================
    // SORTING
    // ========================================
    function sortCatalog(mode) {
        const list = Array.from(catalog.querySelectorAll('.carta-animal'));
        if (!list.length) return;

        if (mode === 'az' || mode === 'za') {
            list.sort((a, b) => {
                const an = (a.querySelector('h3')?.innerText || '').toLowerCase();
                const bn = (b.querySelector('h3')?.innerText || '').toLowerCase();
                return mode === 'az' ? an.localeCompare(bn) : bn.localeCompare(an);
            });
        } else if (mode === 'raridade') {
            list.sort((a, b) => {
                const ra = rarityOrder[a.dataset.rarity || 'comum'] || 0;
                const rb = rarityOrder[b.dataset.rarity || 'comum'] || 0;
                return rb - ra;
            });
        } else if (mode === 'random') {
            for (let i = list.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [list[i], list[j]] = [list[j], list[i]];
            }
        }

        list.forEach(n => catalog.appendChild(n));
    }

    // Sort menu handlers
    if (sortToggle && sortMenu) {
        sortToggle.addEventListener('click', () => {
            const open = sortMenu.classList.toggle('mostrar');
            sortToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            sortMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
        });

        sortMenu.addEventListener('click', e => {
            const opt = e.target.closest('.opcao-ordenacao');
            if (!opt) return;

            const mode = opt.dataset.sort;
            sortCatalog(mode);

            const bestiario = document.getElementById('bestiario');
            if (mode === 'raridade' || mode === 'random') {
                if (bestiario && bestiario.style.display !== 'none') {
                    const cards = Array.from(bestiario.querySelectorAll('.carta-animal'));
                    cards.forEach((card, idx) => {
                        card.classList.remove('cartao-visivel');
                        setTimeout(() => card.classList.add('cartao-visivel'), idx * 140 + 220);
                    });
                } else {
                    allowBestiarioAnimation = true;
                }
            } else if (bestiario && bestiario.style.display !== 'none') {
                revealAllCardsInstant(bestiario);
            }

            sortMenu.classList.remove('mostrar');
            sortToggle.setAttribute('aria-expanded', 'false');
            sortMenu.setAttribute('aria-hidden', 'true');
        });
    }

    // ========================================
    // CARD EXPANSION
    // ========================================
    function closeExpandedCard() {
        if (currentlyExpandedCard) {
            currentlyExpandedCard.classList.remove('expandido');
            document.body.classList.remove('tem-carta-expandida');

            const panel = currentlyExpandedCard.querySelector('.painel-expandido');
            if (panel) panel.classList.remove('visivel');

            currentlyExpandedCard = null;
        }
    }

    if (catalog) {
        catalog.addEventListener('click', (e) => {
            const card = e.target.closest('.carta-animal');
            if (!card) return;

            // Skip if clicking favorite button or other interactive elements
            if (e.target.closest('.aba-favoritar') || e.target.closest('button') || e.target.closest('a')) {
                return;
            }

            // Toggle expansion
            if (currentlyExpandedCard === card) {
                closeExpandedCard();
            } else {
                closeExpandedCard();
                currentlyExpandedCard = card;
                card.classList.add('expandido');
                document.body.classList.add('tem-carta-expandida');

                const panel = card.querySelector('.painel-expandido');
                if (panel) {
                    setTimeout(() => panel.classList.add('visivel'), 20);
                }
            }
        });

        // Close on clicking outside
        document.addEventListener('click', (e) => {
            if (currentlyExpandedCard && !e.target.closest('.carta-animal.expandido')) {
                closeExpandedCard();
            }
        });
    }

    // ========================================
    // FAVORITE BUTTONS
    // ========================================
    document.addEventListener('click', (e) => {
        const favBtn = e.target.closest('.aba-favoritar');
        if (!favBtn) return;

        e.stopPropagation();

        const card = favBtn.closest('.carta-animal');
        toggleFavorite(card);
    });

    // ========================================
    // INITIALIZE FAVORITES UI
    // ========================================
    function initializeFavoritesUI() {
        const favButtons = Array.from(document.querySelectorAll('.carta-animal .aba-favoritar'));
        favButtons.forEach(btn => {
            const card = btn.closest('.carta-animal');
            if (card && isFavorited(card)) {
                btn.classList.add('favoritado');
                btn.querySelector('.estrela').innerText = '★';
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('favoritado');
                btn.querySelector('.estrela').innerText = '☆';
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    }

    // ========================================
    // TOPBAR - VISIBILITY & ANIMATION
    // ========================================
    const bar = document.querySelector('.barra-superior');
    let lastScroll = 0;
    let hideTimeout = null;
    let isHovering = false;
    const TOP_TRIGGER_HEIGHT = 60;

    function startHideTimer() {
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            if (!isHovering) bar.classList.remove('visivel');
        }, 10000);
    }

    window.addEventListener('mousemove', (e) => {
        if (e.clientY <= TOP_TRIGGER_HEIGHT) {
            bar.classList.add('visivel');
            if (hideTimeout) clearTimeout(hideTimeout);
        } else if (!isHovering) {
            startHideTimer();
        }
    });

    window.addEventListener('touchstart', (e) => {
        const touchY = (e.touches?.[0]?.clientY) || 0;
        if (touchY <= TOP_TRIGGER_HEIGHT) {
            bar.classList.add('visivel');
            if (hideTimeout) clearTimeout(hideTimeout);
        }
    });

    bar.addEventListener('mouseenter', () => {
        isHovering = true;
        bar.classList.add('visivel');
        if (hideTimeout) clearTimeout(hideTimeout);
    });

    bar.addEventListener('mouseleave', () => {
        isHovering = false;
        startHideTimer();
    });

    window.addEventListener('scroll', () => {
        const current = window.scrollY;
        if (current > lastScroll) {
            bar.classList.add('visivel');
            startHideTimer();
        } else if (!isHovering) {
            bar.classList.remove('visivel');
        }
        lastScroll = current;
    });

    // ========================================
    // INITIALIZATION
    // ========================================
    sections.forEach(s => s.style.display = 'none');
    ensureRaritiesAndBadges();
    loadFavorites();
    initializeFavoritesUI();
    handleHash();
    applyFilters();
});


