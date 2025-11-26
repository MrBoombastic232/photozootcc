
// backend.js
// Provides: section routing (via hash), search and filter for the catalog

document.addEventListener('DOMContentLoaded', () => {
	const sections = Array.from(document.querySelectorAll('main .card, main section.card'));
	const menuLinks = Array.from(document.querySelectorAll('.menu-item'));
	const filterButtons = Array.from(document.querySelectorAll('.filters [data-filter]'));
	const searchInput = document.getElementById('searchInput');
	let currentFilter = 'todos';
	let currentUser = null;

	function showSection(id) {
		sections.forEach(s => s.style.display = 'none');
		const sel = document.getElementById(id);
		if (sel) {
			sel.style.display = 'block';
			const heading = sel.querySelector('h2, h1');
			if (heading && typeof heading.focus === 'function') heading.focus();
		}
	}

	function applyFilters() {
		const q = (searchInput && searchInput.value || '').toLowerCase().trim();
		const cards = Array.from(document.querySelectorAll('.animal-card'));
		cards.forEach(card => {
			const type = (card.dataset.type || '').toLowerCase();
			const names = (card.dataset.name || '').toLowerCase();
			const text = (card.innerText || '').toLowerCase();
			const typeMatch = (currentFilter === 'todos') || (type === currentFilter);
			const searchMatch = q === '' || names.includes(q) || text.includes(q);
			card.style.display = (typeMatch && searchMatch) ? 'flex' : 'none';
		});
	}

	// Wire filter buttons
	if (filterButtons.length) {
		filterButtons.forEach(btn => {
			btn.addEventListener('click', (e) => {
				filterButtons.forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				currentFilter = btn.dataset.filter || 'todos';
				applyFilters();
			});
			// keyboard support
			btn.setAttribute('tabindex', '0');
			btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
		});
	}

	// Search input
	if (searchInput) {
		searchInput.addEventListener('input', () => applyFilters());
		searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyFilters(); } });
	}

	// Hash routing and menu activation
	function activateMenuFor(id) {
		menuLinks.forEach(link => {
			const href = link.getAttribute('href') || '';
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

	function handleHash() {
		let id = location.hash && location.hash.length > 1 ? location.hash.substring(1) : 'enciclopedia';
		// Normalise legacy/alternate names: some files used 'empresa' for the Sobre section.
		if (id === 'empresa') id = 'sobre';
		showSection(id);
		activateMenuFor(id);
	}

	window.addEventListener('hashchange', handleHash);
	// ensure clicks on menu update view immediately
	menuLinks.forEach(link => link.addEventListener('click', () => setTimeout(handleHash, 0)));

	// Initialize: hide all, show target, apply filters
	sections.forEach(s => s.style.display = 'none');
	handleHash();
	applyFilters();

	// No authentication in this static demo. The site shows content directly.
	currentUser = null;

	// Continue as guest button
	const guestBtn = document.getElementById('continueGuest');
	if (guestBtn) {
		guestBtn.addEventListener('click', () => {
			showSection('enciclopedia');
			applyFilters();
		});
	}

	// small accessibility: allow Enter on menu items to follow link
	menuLinks.forEach(item => {
		item.setAttribute('tabindex', '0');
		item.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); } });
	});
});

