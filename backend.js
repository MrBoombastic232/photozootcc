document.addEventListener('DOMContentLoaded', () => {

    //Elementos principais

    const sections      = Array.from(document.querySelectorAll('main > section'));
    const menuLinks     = Array.from(document.querySelectorAll('.menu-item'));
    const filterButtons = Array.from(document.querySelectorAll('.filters [data-filter]'));
    const searchInput   = document.getElementById('searchInput');

    let currentFilter = 'todos';
    let currentUser   = null;
    let allowBestiarioAnimation = false; // controla se a animação em cascata do bestiário deve rodar


    //Exibir seção correta

    function revealAllCardsInstant(section) {
        const cards = Array.from(section.querySelectorAll('.animal-card'));
        cards.forEach(c => c.classList.add('visible-card'));
    }

    function showSection(id) {
        // Esconder todas as seções e limpar estados de animação
        sections.forEach(s => {
            s.style.display = 'none';
            s.classList.remove('section-enter', 'show');
            const sCards = s.querySelectorAll && s.querySelectorAll('.animal-card');
            if (sCards && sCards.length) sCards.forEach(c => c.classList.remove('visible-card'));
        });

        const section = document.getElementById(id);
        if (section) {
            // Limpar estado por segurança
            section.classList.remove('section-enter', 'show');
            const prevCards = section.querySelectorAll && section.querySelectorAll('.animal-card');
            if (prevCards && prevCards.length) prevCards.forEach(c => c.classList.remove('visible-card'));

            section.style.display = 'block';

            const heading = section.querySelector('h2, h1');
            if (heading && typeof heading.focus === 'function') heading.focus();

            // Rolagem suave para a seção visível (compensa topbar fixa via CSS `scroll-margin-top`)
            if (typeof section.scrollIntoView === 'function') {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Se for o bestiário (antigo 'enciclopedia')
            if (id === 'bestiario') {
                // Se a animação estiver permitida, executar a expansão em cascata
                if (allowBestiarioAnimation) {
                    section.classList.add('section-enter');
                    // força reflow
                    // eslint-disable-next-line no-unused-expressions
                    section.offsetHeight;
                    section.classList.add('show');

                    const cards = Array.from(section.querySelectorAll('.animal-card'));
                    cards.forEach((card, idx) => {
                        card.classList.remove('visible-card');
                        // animação mais lenta e espaçada
                        setTimeout(() => card.classList.add('visible-card'), idx * 140 + 220);
                    });
                    // resetar a flag para não repetir em ações involuntárias
                    allowBestiarioAnimation = false;
                } else {
                    // mostrar os cards imediatamente sem animação
                    revealAllCardsInstant(section);
                }
            }
        }
    }


    //Aplicar filtros

    function applyFilters() {
        const q = (searchInput?.value || '').toLowerCase().trim();
        const cards = Array.from(document.querySelectorAll('.animal-card'));

        const filterFavorites = currentFilter === 'favoritos';

        cards.forEach(card => {
            const type  = (card.dataset.type  || '').toLowerCase();
            const names = (card.dataset.name  || '').toLowerCase();
            const text  = (card.innerText     || '').toLowerCase();

            // If filtering by favorites, only show favorited cards
            const favoritesMatch = !filterFavorites || isFavorited(card);

            // Type match only applies when not in favorites filter
            const typeMatch = filterFavorites ? true : (currentFilter === 'todos' || type === currentFilter);

            const searchMatch = q === '' || names.includes(q) || text.includes(q);

            card.style.display = (typeMatch && favoritesMatch && searchMatch) ? 'flex' : 'none';
        });
    }


    //Botões de filtro
  
    if (filterButtons.length) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                currentFilter = btn.dataset.filter || 'todos';
                applyFilters();
            });

            // Acessibilidade: permitir Enter/Space
            btn.setAttribute('tabindex', '0');
            btn.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });
    }


    //Campo de busca
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);

        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters();
            }
        });
    }


    //Ativar item do menu correto
   
    function activateMenuFor(id) {
        menuLinks.forEach(link => {
            const href   = link.getAttribute('href') || '';
            const target = href.startsWith('#') ? href.substring(1) : '';

            if (target === id) {
                link.classList.add('active-menu');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active-menu');
                link.removeAttribute('aria-current');
            }
        });
    }


    //Manipular hash da URL
   
    function handleHash() {
        let id = location.hash?.substring(1) || 'bestiario';

        // Redirecionamentos internos
        if (id === 'empresa') id = 'sobre';
        if (id === 'enciclopedia') id = 'bestiario'; // compatibilidade legada

        showSection(id);
        activateMenuFor(id);
    }

    window.addEventListener('hashchange', handleHash);

    menuLinks.forEach(link =>
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href') || '';
            const target = href.startsWith('#') ? href.substring(1) : '';
            if (target === 'bestiario' || target === 'enciclopedia') {
                // permitir animação em cascata quando o usuário abriu via menu
                allowBestiarioAnimation = true;
            }
            setTimeout(handleHash, 0);
        })
    );


    // Inicialização inicial

    sections.forEach(s => s.style.display = 'none');

    // --- Raridade / badges ---
    const catalog = document.getElementById('catalog');
    const rarityOrder = { 'comum': 0, 'incomum': 1, 'raro': 2, 'epico': 3, 'lendario': 4, 'boss': 5 };

    // Favoritos (armazenados em localStorage)
    const FAV_KEY = 'photozoo_favorites_v1';
    let favorites = new Set();

    function loadFavorites() {
        try {
            const raw = localStorage.getItem(FAV_KEY);
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) arr.forEach(id => favorites.add(id));
            }
        } catch (e) {
            console.warn('Falha ao carregar favoritos', e);
        }
    }

    function saveFavorites() {
        try {
            localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favorites)));
        } catch (e) {
            console.warn('Falha ao salvar favoritos', e);
        }
    }

    function cardIdFor(card) {
        // usar o título (h3) como id único aproximado
        return (card.querySelector('h3')?.innerText || '').trim();
    }

    function isFavorited(card) {
        return favorites.has(cardIdFor(card));
    }

    function setCardFavoritedAttr(card) {
        if (isFavorited(card)) card.dataset.favorited = 'true'; else delete card.dataset.favorited;
    }

    function toggleFavorite(card) {
        const id = cardIdFor(card);
        if (!id) return;
        if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
        saveFavorites();
        setCardFavoritedAttr(card);
        // update fav-tab visual if present
        const ft = card.querySelector('.fav-tab');
        if (ft) {
            if (favorites.has(id)) ft.classList.add('favorited'); else ft.classList.remove('favorited');
            ft.setAttribute('aria-pressed', favorites.has(id) ? 'true' : 'false');
        }
    }

    function ensureRaritiesAndBadges() {
        const cards = Array.from(document.querySelectorAll('.animal-card'));
        cards.forEach(card => {
            // Se não houver raridade declarada, definir como 'comum'
            let r = (card.dataset.rarity || '').toLowerCase();
            const names = (card.dataset.name || '').toLowerCase();

            // Marcar bosses específicos (onça, sucuri, harpia) caso correspondam
            if (names.includes('onça') || names.includes('onca') || names.includes('harpia') || names.includes('sucuri')) {
                r = 'boss';
            }

            if (!r) r = 'comum';
            card.dataset.rarity = r;

            // Criar badge visual se não existir
            if (!card.querySelector('.rarity-badge')) {
                const span = document.createElement('span');
                span.className = `rarity-badge rarity-${r}`;
                // capitalizar primeiro caractere (com acentos...) simplificado
                span.innerText = r.charAt(0).toUpperCase() + r.slice(1);
                card.appendChild(span);
            } else {
                const existing = card.querySelector('.rarity-badge');
                existing.className = `rarity-badge rarity-${r}`;
                existing.innerText = r.charAt(0).toUpperCase() + r.slice(1);
            }
            // garantir atributo de favorito inicial (será atualizado após carregar favoritos)
            card.dataset.favorited = card.dataset.favorited || '';
        });
    }

    // Ordenação
    function sortCatalog(mode) {
        const list = Array.from(catalog.querySelectorAll('.animal-card'));
        if (!list.length) return;

        if (mode === 'az' || mode === 'za') {
            list.sort((a,b) => {
                const an = (a.querySelector('h3')?.innerText || '').toLowerCase();
                const bn = (b.querySelector('h3')?.innerText || '').toLowerCase();
                if (an < bn) return mode === 'az' ? -1 : 1;
                if (an > bn) return mode === 'az' ? 1 : -1;
                return 0;
            });
        } else if (mode === 'raridade') {
            list.sort((a,b) => {
                const ra = rarityOrder[a.dataset.rarity || 'comum'] || 0;
                const rb = rarityOrder[b.dataset.rarity || 'comum'] || 0;
                // ordenar do mais raro para o mais comum (boss primeiro)
                return rb - ra;
            });
        }

        // Reanexar na nova ordem
        list.forEach(n => catalog.appendChild(n));
    }

    // Inicializa badges e ordenação UI
    ensureRaritiesAndBadges();

    // Carregar favoritos e marcar cards
    loadFavorites();
    const allCards = Array.from(document.querySelectorAll('.animal-card'));
    allCards.forEach(c => setCardFavoritedAttr(c));

    // Clique em cards: expandir e mostrar painel com botão de favoritar
    const catalogEl = catalog;
    let currentlyExpandedCard = null;

    if (catalogEl) {
        catalogEl.addEventListener('click', (e) => {
            const card = e.target.closest('.animal-card');
            if (!card) return;

            // se o clique veio do botão de favoritar dentro do painel, já tratamos em handler separado
            if (e.target.closest('.fav-tab')) return;

            // Alternar expansão — fechar outras
            if (currentlyExpandedCard && currentlyExpandedCard !== card) {
                currentlyExpandedCard.classList.remove('expanded');
                const panel = currentlyExpandedCard.querySelector('.expanded-panel'); if (panel) panel.remove();
                const favBtn = currentlyExpandedCard.querySelector('.fav-tab'); if (favBtn) favBtn.remove();
            }

            const isNowExpanded = card.classList.toggle('expanded');
            if (isNowExpanded) {
                currentlyExpandedCard = card;
                // criar painel expandido com infos extras (clonar .meta e parágrafos)
                let panel = card.querySelector('.expanded-panel');
                if (!panel) {
                    panel = document.createElement('div');
                    panel.className = 'expanded-panel';
                    // adicionar cópias das informações existentes para mostrar mais
                    const desc = card.querySelector('p');
                    const meta = card.querySelectorAll('.meta');
                    if (desc) panel.appendChild(desc.cloneNode(true));
                    meta.forEach(m => panel.appendChild(m.cloneNode(true)));
                    // espaço para texto adicional (pode ser preenchido depois)
                    const more = document.createElement('p');
                    more.style.marginTop = '8px';
                    more.style.opacity = '.95';
                    more.innerText = 'Informações adicionais: detalhes sobre habitat, comportamento, alimentação e conservação.';
                    panel.appendChild(more);

                    // botão favoritar
                    const fav = document.createElement('button');
                    fav.className = 'fav-tab' + (isFavorited(card) ? ' favorited' : '');
                    fav.setAttribute('aria-pressed', isFavorited(card) ? 'true' : 'false');
                    fav.innerHTML = '<span class="star">' + (isFavorited(card) ? '★' : '☆') + '</span><span>Favoritar</span>';
                    fav.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        toggleFavorite(card);
                        // atualizar estrela e classe
                        const now = isFavorited(card);
                        fav.classList.toggle('favorited', now);
                        fav.querySelector('.star').innerText = now ? '★' : '☆';
                        fav.setAttribute('aria-pressed', now ? 'true' : 'false');
                        // se estiver filtrando por favoritos, reaplicar filtros
                        if (currentFilter === 'favoritos') applyFilters();
                    });

                    card.appendChild(panel);
                    card.appendChild(fav);
                }
            } else {
                currentlyExpandedCard = null;
                const panel = card.querySelector('.expanded-panel'); if (panel) panel.remove();
                const favBtn = card.querySelector('.fav-tab'); if (favBtn) favBtn.remove();
            }
        });

        // Fechar card expandido quando clicar fora dele
        document.addEventListener('click', (e) => {
            if (currentlyExpandedCard && !e.target.closest('.animal-card.expanded')) {
                currentlyExpandedCard.classList.remove('expanded');
                const panel = currentlyExpandedCard.querySelector('.expanded-panel'); if (panel) panel.remove();
                const favBtn = currentlyExpandedCard.querySelector('.fav-tab'); if (favBtn) favBtn.remove();
                currentlyExpandedCard = null;
            }
        });
    }

    // Inicializar: atualizar estrelas dos favoritos salvos nos .fav-tab buttons existentes no HTML
    function initializeFavoritesUI() {
        const favButtons = Array.from(document.querySelectorAll('.animal-card .fav-tab'));
        favButtons.forEach(btn => {
            const card = btn.closest('.animal-card');
            if (card && isFavorited(card)) {
                btn.classList.add('favorited');
                btn.querySelector('.star').innerText = '★';
                btn.setAttribute('aria-pressed', 'true');
            } else if (btn) {
                btn.classList.remove('favorited');
                btn.querySelector('.star').innerText = '☆';
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    }

    // Chamar inicialização após carregar favoritos
    initializeFavoritesUI();

    // Sort menu handlers (delegation)
    const sortToggle = document.getElementById('sortToggle');
    const sortMenu = document.getElementById('sortMenu');
    if (sortToggle && sortMenu) {
        sortToggle.addEventListener('click', () => {
            const open = sortMenu.classList.toggle('show');
            sortToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            sortMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
        });

        sortMenu.addEventListener('click', e => {
            const opt = e.target.closest('.sort-option');
            if (!opt) return;
            const mode = opt.dataset.sort;

            // Suporte para 'aleatório'
            if (mode === 'random') {
                // Embaralhar lista
                const nodes = Array.from(catalog.querySelectorAll('.animal-card'));
                for (let i = nodes.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
                }
                nodes.forEach(n => catalog.appendChild(n));
            } else {
                sortCatalog(mode);
            }

            const best = document.getElementById('bestiario');
            // Se a ordenação for por raridade ou aleatória -> animar em cascata
            if (mode === 'raridade' || mode === 'random') {
                if (best && best.style.display !== 'none') {
                    const cards = Array.from(best.querySelectorAll('.animal-card'));
                    cards.forEach((card, idx) => {
                        card.classList.remove('visible-card');
                        setTimeout(() => card.classList.add('visible-card'), idx * 140 + 220);
                    });
                } else {
                    // quando não visível, sinalize para animar ao abrir via menu
                    allowBestiarioAnimation = true;
                }
            } else {
                // Para outras ordenações, garantir que os cartões estejam visíveis imediatamente
                if (best && best.style.display !== 'none') revealAllCardsInstant(best);
            }

            // fechar menu
            sortMenu.classList.remove('show');
            sortToggle.setAttribute('aria-expanded', 'false');
            sortMenu.setAttribute('aria-hidden', 'true');
        });
    }

    handleHash();
    applyFilters();


    //Acessibilidade – Enter nos menus
    
    menuLinks.forEach(item => {
        item.setAttribute('tabindex', '0');
        item.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });

    // ======================================
    // CARD EXPANSION & FAVORITES SYSTEM
    // ======================================

    let currentExpandedCard = null;
    const FAVORITES_KEY = 'photozoo_favorites_v1';

    // Mapa de informações adicionais para cada animal
    const animalInfoMap = {
        'onça': { bioma: 'Florestas, Pantanal, Cerrado', habitat: 'Áreas florestais e alagadiças', ameaca: 'Caça e perda de habitat' },
        'mico': { bioma: 'Mata Atlântica', habitat: 'Florestas tropicais', ameaca: 'Desmatamento' },
        'tamandua': { bioma: 'Cerrado, Florestas', habitat: 'Áreas abertas e florestais', ameaca: 'Atropelamento' },
        'lobo': { bioma: 'Cerrado', habitat: 'Campos e pastagens', ameaca: 'Perda de habitat' },
        'muriqui': { bioma: 'Mata Atlântica', habitat: 'Copas de árvores', ameaca: 'Fragmentação florestal' },
        'boto': { bioma: 'Amazônia', habitat: 'Rios e várzeas', ameaca: 'Pesca acidental' },
        'ariranha': { bioma: 'Amazônia, Pantanal', habitat: 'Rios e lagos', ameaca: 'Poluição hídrica' },
        'arara': { bioma: 'Florestas tropicais', habitat: 'Copas de árvores altas', ameaca: 'Tráfico de animais' },
        'harpia': { bioma: 'Amazônia', habitat: 'Copas de árvores primárias', ameaca: 'Destruição florestal' },
        'tucano': { bioma: 'Florestas tropicais', habitat: 'Copas e clareiras florestais', ameaca: 'Desmatamento' },
        'jacu': { bioma: 'Mata Atlântica', habitat: 'Áreas florestais', ameaca: 'Caça ilegal' },
        'jacare': { bioma: 'Pantanal, Cerrado', habitat: 'Rios, lagoas e alagados', ameaca: 'Caça e perda de habitat' },
        'sucuri': { bioma: 'Amazônia', habitat: 'Águas calmas e rios', ameaca: 'Captura ilegal' },
        'tartaruga': { bioma: 'Oceano, Praias', habitat: 'Águas costeiras', ameaca: 'Perda de ninhos' },
        'iguana': { bioma: 'Florestas tropicais', habitat: 'Árvores altas', ameaca: 'Caça' },
        'sapo': { bioma: 'Florestas úmidas', habitat: 'Folhagem úmida', ameaca: 'Poluição' },
        'perereca': { bioma: 'Florestas tropicais', habitat: 'Folhas e arbustos', ameaca: 'Perda de habitat' },
        'pirarucu': { bioma: 'Amazônia', habitat: 'Rios e lagos', ameaca: 'Pesca predatória' },
        'dourado': { bioma: 'Rios brasileiros', habitat: 'Águas rápidas', ameaca: 'Pesca excessiva' },
        'borboleta': { bioma: 'Florestas tropicais', habitat: 'Clareiras florestais', ameaca: 'Perda de plantas hospedeiras' },
        'besouro': { bioma: 'Florestas tropicais', habitat: 'Troncos e galhos', ameaca: 'Desflorestamento' },
        'pau': { bioma: 'Florestas tropicais', habitat: 'Florestas costeiras', ameaca: 'Exploração madeireira' },
        'vitoria': { bioma: 'Amazônia, Pantanal', habitat: 'Lagos e várzeas', ameaca: 'Poluição hídrica' },
        'orquidea': { bioma: 'Florestas tropicais', habitat: 'Epífitas em árvores', ameaca: 'Coleta ilegal' },
        'araucaria': { bioma: 'Mata de Araucárias', habitat: 'Florestas altas', ameaca: 'Exploração florestal' },
        'jequitiba': { bioma: 'Florestas tropicais', habitat: 'Árvores emergentes', ameaca: 'Exploração madeireira' },
        'cedro': { bioma: 'Florestas tropicais', habitat: 'Dossel florestal', ameaca: 'Exploração madeireira' }
    };

    // Função para buscar informações adicionais do animal
    function getAnimalInfo(cardId) {
        for (let key in animalInfoMap) {
            if (cardId.includes(key)) {
                return animalInfoMap[key];
            }
        }
        return { bioma: 'Brasil', habitat: 'Diversos', ameaca: 'Perda de habitat' };
    }

    // Função para popular o painel expandido com informações
    function populateExpandedPanel(card) {
        const panel = card.querySelector('.expanded-panel');
        if (!panel) return;

        const cardId = getCardId(card);
        const info = getAnimalInfo(cardId);
        
        // Se o painel já foi populado, não fazer novamente
        if (panel.querySelector('.expanded-info-section')) return;

        // Criar seções de informação
        const infoSections = [
            { label: 'Bioma', value: info.bioma },
            { label: 'Habitat', value: info.habitat },
            { label: 'Ameaça Principal', value: info.ameaca }
        ];

        infoSections.forEach(section => {
            const div = document.createElement('div');
            div.className = 'expanded-info-section';
            div.innerHTML = `<strong>${section.label}:</strong><p>${section.value}</p>`;
            panel.appendChild(div);
        });
    }

    // Load favorites from localStorage
    function loadFavorites() {
        try {
            const stored = localStorage.getItem(FAVORITES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    // Save favorites to localStorage
    function saveFavorites(favorites) {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        } catch (e) {
            console.warn('Could not save favorites to localStorage');
        }
    }

    // Get animal identifier from card (use first word of data-name)
    function getCardId(card) {
        const name = (card.dataset.name || '').split(' ')[0];
        return name.toLowerCase();
    }

    // Initialize favorite buttons on page load
    function initFavoriteButtons() {
        const favorites = loadFavorites();
        const favSet = new Set(favorites.map(f => f.toLowerCase()));
        
        document.querySelectorAll('.fav-tab').forEach(btn => {
            const card = btn.closest('.animal-card');
            const cardId = getCardId(card);
            
            if (favSet.has(cardId)) {
                btn.classList.add('favorited');
                btn.innerHTML = '<span class="star">★</span> Favorito';
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('favorited');
                btn.innerHTML = '<span class="star">☆</span> Favoritar';
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    }

    // Close expanded card
    function closeExpandedCard() {
        if (currentExpandedCard) {
            currentExpandedCard.classList.remove('expanded');
            document.body.classList.remove('has-expanded-card');
            
            const panel = currentExpandedCard.querySelector('.expanded-panel');
            if (panel) panel.classList.remove('visible');
            
            currentExpandedCard = null;
        }
    }

    // Expand card
    function expandCard(card) {
        if (currentExpandedCard === card) {
            closeExpandedCard();
            return;
        }

        closeExpandedCard();
        
        currentExpandedCard = card;
        card.classList.add('expanded');
        document.body.classList.add('has-expanded-card');
        
        // Populate expanded panel with additional info
        populateExpandedPanel(card);
        
        // Show expanded panel with delay
        const panel = card.querySelector('.expanded-panel');
        if (panel) {
            setTimeout(() => panel.classList.add('visible'), 20);
        }
    }

    // Card click handler for expansion
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.animal-card');
        if (!card) {
            closeExpandedCard();
            return;
        }

        // Don't expand if clicking buttons inside the card
        if (e.target.closest('.fav-tab') || 
            e.target.closest('button') || 
            e.target.closest('a')) {
            return;
        }

        expandCard(card);
    });

    // Favorite button handler
    document.addEventListener('click', (e) => {
        const favBtn = e.target.closest('.fav-tab');
        if (!favBtn) return;

        e.stopPropagation();

        const card = favBtn.closest('.animal-card');
        const cardId = getCardId(card);
        const isFavorited = favBtn.classList.contains('favorited');
        
        let favorites = loadFavorites();
        favorites = favorites.map(f => f.toLowerCase());

        if (isFavorited) {
            // Remove from favorites
            favorites = favorites.filter(f => f !== cardId);
            favBtn.classList.remove('favorited');
            favBtn.innerHTML = '<span class="star">☆</span> Favoritar';
            favBtn.setAttribute('aria-pressed', 'false');
        } else {
            // Add to favorites
            if (!favorites.includes(cardId)) {
                favorites.push(cardId);
            }
            favBtn.classList.add('favorited');
            favBtn.innerHTML = '<span class="star">★</span> Favorito';
            favBtn.setAttribute('aria-pressed', 'true');
        }

        saveFavorites(favorites);

        // Reapply filters if currently showing favorites
        if (currentFilter === 'favoritos') {
            applyFilters();
        }
    });

    // Override applyFilters to handle favorites
    const originalApplyFilters = applyFilters;
    applyFilters = function() {
        const q = (searchInput?.value || '').toLowerCase().trim();
        const cards = Array.from(document.querySelectorAll('.animal-card'));
        
        let favorites = [];
        if (currentFilter === 'favoritos') {
            favorites = loadFavorites().map(f => f.toLowerCase());
        }

        cards.forEach(card => {
            const type  = (card.dataset.type  || '').toLowerCase();
            const names = (card.dataset.name  || '').toLowerCase();
            const text  = (card.innerText     || '').toLowerCase();
            const cardId = getCardId(card);

            let typeMatch = currentFilter === 'todos' || 
                           currentFilter === 'favoritos' ||
                           type === currentFilter;
            
            if (currentFilter === 'favoritos') {
                typeMatch = favorites.includes(cardId);
            }

            const searchMatch = q === '' || names.includes(q) || text.includes(q);
 
            card.style.display = (typeMatch && searchMatch) ? 'flex' : 'none';
        });
    };

    // Initialize favorites on load
    initFavoriteButtons();
});




//TOPBAR – APARECER, SUMIR E ANIMAÇÃO
document.addEventListener("DOMContentLoaded", () => {
    const bar = document.querySelector(".topbar");

    let lastScroll   = 0;
    let hideTimeout  = null;
    let isHovering   = false;
    const TOP_TRIGGER_HEIGHT = 60; // px do topo que dispara a aparição da topbar

    // Mostrar a topbar quando o mouse estiver perto do topo da janela
    window.addEventListener('mousemove', (e) => {
        if (e.clientY <= TOP_TRIGGER_HEIGHT) {
            bar.classList.add('visible');
            if (hideTimeout) clearTimeout(hideTimeout);
        } else {
            if (!isHovering) startHideTimer();
        }
    });
    // Suporte básico para toque (mobile) — ao tocar próximo ao topo, mostra a barra
    window.addEventListener('touchstart', (e) => {
        const touchY = (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
        if (touchY <= TOP_TRIGGER_HEIGHT) {
            bar.classList.add('visible');
            if (hideTimeout) clearTimeout(hideTimeout);
        }
    });


    /* ---------------------------
       Mouse entra → barra aparece
    --------------------------- */
    bar.addEventListener("mouseenter", () => {
        isHovering = true;
        bar.classList.add("visible");
        if (hideTimeout) clearTimeout(hideTimeout);
    });


    /* ---------------------------
       Mouse sai → inicia timer
    --------------------------- */
    bar.addEventListener("mouseleave", () => {
        isHovering = false;
        startHideTimer();
    });


    /* ---------------------------
       Função para ocultar após 10s
    --------------------------- */
    function startHideTimer() {
        if (hideTimeout) clearTimeout(hideTimeout);

        hideTimeout = setTimeout(() => {
            if (!isHovering) bar.classList.remove("visible");
        }, 10000);
    }


    /* ---------------------------
       Controle de scroll
    --------------------------- */
    window.addEventListener("scroll", () => {
        const current = window.scrollY;

        if (current > lastScroll) {
            // Rolando para baixo – mostrar
            bar.classList.add("visible");
            startHideTimer();
        } else {
            // Rolando para cima – esconder
            if (!isHovering) bar.classList.remove("visible");
        }

        lastScroll = current;
    });
});


