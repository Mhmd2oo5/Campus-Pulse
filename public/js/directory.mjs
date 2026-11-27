import { categories, resources, preferences, normalizeFilters, filterResources, recommendResources, parseSaved } from './directory-model.mjs';

const $ = selector => document.querySelector(selector);
const icons = {
  book: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/>',
  monitor: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8m-4-5v5"/>',
  printer: '<path d="M7 8V3h10v5M7 17H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-3"/><path d="M7 14h10v7H7zM17 11h1"/>',
  cup: '<path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm13 1h2a3 3 0 0 1 0 6h-2M7 2v2m4-2v2m4-2v2"/>',
  pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  bookmark: '<path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4-6 4Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const savedKey = 'cp_saved_resources';
let saved = [];
try { saved = parseSaved(localStorage.getItem(savedKey)); } catch { /* Continue with in-memory saves. */ }
let filters = normalizeFilters();
let opener;
let openerArea;
const scrollToDirectory = () => $('#directory').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });

function readUrl() {
  const params = new URLSearchParams(location.search);
  filters = normalizeFilters({ query: params.get('q'), category: params.get('category'), sort: params.get('sort'), savedOnly: params.get('view') === 'saved' });
  $('#resource-search').value = filters.query;
  $('#sort-resources').value = filters.sort;
}

function writeUrl() {
  const url = new URL(location.href);
  for (const key of ['q', 'category', 'sort', 'view']) url.searchParams.delete(key);
  if (filters.query) url.searchParams.set('q', filters.query);
  if (filters.category !== 'all') url.searchParams.set('category', filters.category);
  if (filters.sort !== 'featured') url.searchParams.set('sort', filters.sort);
  if (filters.savedOnly) url.searchParams.set('view', 'saved');
  history.replaceState(null, '', url);
}

function card(resource, compact = false) {
  const category = categories.find(item => item.id === resource.category);
  const isSaved = saved.includes(resource.id);
  return `<article class="resource-card${compact ? ' compact-card' : ''}">
    <div class="card-art art-${escape(resource.category)}"><img src="assets/${escape(resource.art)}.svg" alt="" loading="lazy" width="600" height="320"><span class="sample-badge">Sample resource</span>
      <button class="save-button${isSaved ? ' is-saved' : ''}" type="button" data-save="${escape(resource.id)}" aria-pressed="${isSaved}" aria-label="${isSaved ? 'Unsave' : 'Save'} ${escape(resource.name)}">${icon('bookmark')}</button>
    </div>
    <div class="card-body"><p class="category-label text-${escape(resource.category)}">${icon(category.icon)}${escape(category.singular)}</p>
      <h3><button type="button" class="title-button" data-details="${escape(resource.id)}">${escape(resource.name)}</button></h3>
      <p class="resource-location">${icon('pin')}${escape(resource.location)}</p>
      <div class="feature-list">${resource.features.slice(0, 2).map(feature => `<span>${escape(feature)}</span>`).join('')}</div>
      <div class="card-bottom"><span>Condition: Unknown</span><button type="button" class="text-button" data-details="${escape(resource.id)}" aria-label="View details for ${escape(resource.name)}">View details</button></div>
    </div></article>`;
}

function render() {
  const filtered = filterResources(resources, filters, saved);
  $('#resource-grid').innerHTML = filtered.map(resource => card(resource)).join('');
  $('#result-count').textContent = `${filtered.length} sample ${filtered.length === 1 ? 'resource' : 'resources'}${filters.query ? ` matching “${filters.query}”` : ''}`;
  $('#directory-title').textContent = filters.savedOnly ? 'Your saved places.' : 'A place for every plan.';
  $('#empty-state').hidden = filtered.length > 0;
  $('#empty-title').textContent = filters.savedOnly && saved.length === 0 ? 'Your next favorite is waiting.' : 'No places found.';
  $('#empty-description').textContent = filters.savedOnly && saved.length === 0 ? 'Save a resource with the bookmark button to find it here.' : 'Try a different search or clear your filters to explore every resource.';
  $('#clear-filters').hidden = !filters.query && filters.category === 'all' && !filters.savedOnly && filters.sort === 'featured';
  $('#saved-count').textContent = saved.length;
  updateNavigation();
  document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === filters.category)));
}

function updateNavigation() {
  const forYou = location.hash === '#recommendations';
  $('#for-you-nav').setAttribute('aria-current', forYou ? 'location' : 'false');
  $('#saved-nav').setAttribute('aria-current', !forYou && filters.savedOnly ? 'location' : 'false');
  $('#explore-nav').setAttribute('aria-current', !forYou && !filters.savedOnly ? 'location' : 'false');
}

function updateFilters(changes) {
  filters = normalizeFilters({ ...filters, ...changes });
  writeUrl();
  render();
}

function toggleSaved(id) {
  if (!resources.some(resource => resource.id === id)) return;
  saved = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
  let persisted = true;
  try { localStorage.setItem(savedKey, JSON.stringify(saved)); } catch { persisted = false; }
  render();
  renderRecommendations();
  if ($('#resource-dialog').open) updateDialogSave(id);
  const name = resources.find(resource => resource.id === id).name;
  $('#announcements').textContent = `${name} ${saved.includes(id) ? 'saved' : 'removed from saved places'}.${persisted ? '' : ' Storage is unavailable; changes last only for this visit.'}`;
}

function updateDialogSave(id) {
  const button = $('#dialog-save');
  // Only update the resource currently shown in the dialog.
  if (button.dataset.save !== id) return;
  button.textContent = saved.includes(id) ? 'Remove from saved' : 'Save this resource';
  button.setAttribute('aria-pressed', String(saved.includes(id)));
}

function openDetails(id, trigger) {
  const resource = resources.find(item => item.id === id);
  if (!resource) return;
  const category = categories.find(item => item.id === resource.category);
  opener = trigger;
  openerArea = trigger.closest('#recommendation-grid') ? '#recommendation-grid' : '#resource-grid';
  $('#dialog-art').src = `assets/${resource.art}.svg`;
  $('#dialog-category').textContent = category.singular;
  $('#dialog-title').textContent = resource.name;
  $('#dialog-location').textContent = resource.location;
  $('#dialog-description').textContent = resource.description;
  $('#dialog-capacity').textContent = resource.capacity;
  $('#dialog-active').textContent = resource.active ? 'Active in sample directory' : 'Inactive';
  $('#dialog-features').replaceChildren(...resource.features.map(feature => {
    const item = document.createElement('li');
    item.textContent = feature;
    return item;
  }));
  $('#dialog-save').dataset.save = resource.id;
  updateDialogSave(resource.id);
  $('#resource-dialog').showModal();
}

function renderRecommendations() {
  const category = $('#recommendation-category').value;
  const building = $('#recommendation-location').value;
  const matches = recommendResources(resources, { category, building });
  const preview = matches.slice(0, 2);
  $('#recommendation-grid').innerHTML = preview.length ? preview.map(resource => card(resource, true)).join('') : '<p class="recommendation-empty">No sample resources match this building and category. Try any building.</p>';
  $('#recommendation-status').textContent = `Showing ${preview.length} of ${matches.length} possible places · ${$('#recommendation-preference').value.toLowerCase()} preference unverified`;
}

function updatePreferences() {
  $('#recommendation-preference').replaceChildren(...preferences[$('#recommendation-category').value].map(preference => new Option(preference, preference)));
}

for (const building of [...new Set(resources.map(resource => resource.building))].sort()) {
  $('#recommendation-location').append(new Option(building, building));
}
updatePreferences();

$('#category-grid').innerHTML = categories.map(category => `<button type="button" class="category-tile" data-category="${category.id}" aria-pressed="false"><span class="category-icon icon-${category.id}">${icon(category.icon)}</span><span><strong>${category.label}</strong><small>${category.note}</small></span><span class="category-total">${resources.filter(resource => resource.category === category.id).length}</span></button>`).join('');
$('#category-filters').innerHTML = [{ id: 'all', label: 'All resources' }, ...categories].map(category => `<button type="button" class="filter-button" data-category="${category.id}" aria-pressed="${category.id === 'all'}">${category.label}</button>`).join('');

document.addEventListener('click', event => {
  const category = event.target.closest('[data-category]');
  const save = event.target.closest('[data-save]');
  const details = event.target.closest('[data-details]');
  if (category) {
    updateFilters({ category: category.dataset.category });
    if (category.closest('#category-grid')) scrollToDirectory();
  }
  if (save) {
    const id = save.dataset.save;
    const section = save.closest('#recommendation-grid') ? '#recommendation-grid' : '#resource-grid';
    toggleSaved(id);
    if (!$('#resource-dialog').open) {
      // Rendering replaces cards; retain keyboard focus at the equivalent control.
      (document.querySelector(`${section} [data-save="${id}"]`) || $('#directory-title')).focus({ preventScroll: true });
    }
  }
  if (details) openDetails(details.dataset.details, details);
});

$('#search-form').addEventListener('submit', event => {
  event.preventDefault();
  updateFilters({ query: $('#resource-search').value });
  scrollToDirectory();
  $('#directory-title').focus({ preventScroll: true });
});
$('#resource-search').addEventListener('input', () => updateFilters({ query: $('#resource-search').value }));
$('#sort-resources').addEventListener('change', event => updateFilters({ sort: event.target.value }));
$('#recommendation-category').addEventListener('change', () => { updatePreferences(); renderRecommendations(); });
$('#recommendation-location').addEventListener('change', renderRecommendations);
$('#recommendation-preference').addEventListener('change', renderRecommendations);

function resetFilters() {
  $('#resource-search').value = '';
  $('#sort-resources').value = 'featured';
  updateFilters({ query: '', category: 'all', savedOnly: false, sort: 'featured' });
}
$('#clear-filters').addEventListener('click', resetFilters);
$('#empty-reset').addEventListener('click', () => { resetFilters(); $('#directory-title').focus(); });
$('#saved-nav').addEventListener('click', () => { updateFilters({ savedOnly: true }); closeMenu(); });
$('#explore-nav').addEventListener('click', () => { updateFilters({ savedOnly: false }); closeMenu(); });
$('#for-you-nav').addEventListener('click', closeMenu);
$('#dialog-close').addEventListener('click', () => $('#resource-dialog').close());
$('#resource-dialog').addEventListener('click', event => {
  const bounds = event.currentTarget.getBoundingClientRect();
  if (event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) event.currentTarget.close();
});
$('#resource-dialog').addEventListener('close', () => {
  // The original opener may have been replaced when a saved state changed.
  const id = opener?.dataset.details;
  (opener?.isConnected ? opener : document.querySelector(`${openerArea} [data-details="${id}"]`) || $('#directory-title')).focus({ preventScroll: true });
});

function closeMenu() {
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
  $('#site-navigation').classList.remove('is-open');
}
$('#menu-toggle').addEventListener('click', () => {
  const open = $('#menu-toggle').getAttribute('aria-expanded') !== 'true';
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
  $('#site-navigation').classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && $('#menu-toggle').getAttribute('aria-expanded') === 'true') { closeMenu(); $('#menu-toggle').focus(); }
});
window.addEventListener('popstate', () => { readUrl(); render(); });
window.addEventListener('hashchange', updateNavigation);
window.addEventListener('storage', event => {
  if (event.key === savedKey || event.key === null) { saved = parseSaved(event.newValue); render(); renderRecommendations(); if ($('#resource-dialog').open) updateDialogSave($('#dialog-save').dataset.save); }
});

try {
  const user = JSON.parse(sessionStorage.getItem('cp_current_user') || 'null');
  if (typeof user?.username === 'string') {
    $('#account-link').hidden = true;
    $('#account-user').textContent = `Hi, ${user.username}`;
    $('#account-user').hidden = false;
    $('#logout-btn').hidden = false;
  }
} catch { /* A missing or malformed demo session does not block browsing. */ }
$('#logout-btn').addEventListener('click', () => {
  try { sessionStorage.removeItem('cp_current_user'); } catch { /* The demo session is already unavailable. */ }
  location.href = 'login.html';
});
readUrl();
render();
renderRecommendations();
