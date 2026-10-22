let currentNotes = [];
let noteToDeleteId = null;
let currentFilter = 'all';

const notesGrid = document.getElementById('notesGrid');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const footerStats = document.getElementById('footerStats');
const footerDbStatus = document.getElementById('footerDbStatus');
const notesCountBadge = document.getElementById('notesCountBadge');
const categoryChips = document.getElementById('categoryChips');
const emptyState = document.getElementById('emptyState');
const btnQuickAdd = document.getElementById('btnQuickAdd');

const noteModal = document.getElementById('noteModal');
const modalTitleText = document.getElementById('modalTitleText');
const modalHeaderBadge = document.getElementById('modalHeaderBadge');
const noteForm = document.getElementById('noteForm');
const noteIdInput = document.getElementById('noteIdInput');
const noteTitleInput = document.getElementById('noteTitleInput');
const noteContentInput = document.getElementById('noteContentInput');
const btnCancelModal = document.getElementById('btnCancelModal');
const btnDismissModal = document.getElementById('btnDismissModal');
const iconPicker = document.getElementById('iconPicker');

const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const deleteNoteTitle = document.getElementById('deleteNoteTitle');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');
const toastContainer = document.getElementById('toastContainer');

let selectedIcon = 'notes';
let selectedColor = 'pink';

const ICONS_EMOJI = {
  notes: '📝',
  bulb: '💡',
  heart: '💜',
  star: '⭐',
  book: '📚',
  code: '💻'
};

document.addEventListener('DOMContentLoaded', () => {
  fetchNotes();
  setupEventListeners();
});

function setupEventListeners() {
  btnQuickAdd.addEventListener('click', openAddModal);

  searchInput.addEventListener('input', applyFilters);
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    applyFilters();
  });

  categoryChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      applyFilters();
    });
  });

  btnCancelModal.addEventListener('click', closeModal);
  btnDismissModal.addEventListener('click', closeModal);
  noteModal.addEventListener('click', (e) => {
    if (e.target === noteModal) closeModal();
  });

  iconPicker.querySelectorAll('.icon-option').forEach(opt => {
    opt.addEventListener('click', () => {
      iconPicker.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedIcon = opt.dataset.icon;
      selectedColor = opt.dataset.color;
      modalHeaderBadge.textContent = opt.querySelector('.icon-preview').textContent;
    });
  });

  noteForm.addEventListener('submit', handleSaveNote);

  btnCancelDelete.addEventListener('click', () => {
    deleteConfirmModal.style.display = 'none';
    noteToDeleteId = null;
  });
  btnConfirmDelete.addEventListener('click', executeDeleteNote);
  deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) {
      deleteConfirmModal.style.display = 'none';
      noteToDeleteId = null;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (noteModal.style.display === 'flex') closeModal();
      if (deleteConfirmModal.style.display === 'flex') {
        deleteConfirmModal.style.display = 'none';
        noteToDeleteId = null;
      }
    }
  });
}

async function fetchNotes() {
  try {
    const res = await fetch('/api/notes');
    if (!res.ok) throw new Error('Network error');
    currentNotes = await res.json();
    applyFilters();
  } catch (err) {
    console.error('Error fetching notes:', err);
    showToast('⚠️ Could not connect to backend server');
    if (footerDbStatus) footerDbStatus.innerHTML = '<span class="status-dot" style="background:#f04473"></span> Offline';
  }
}

function applyFilters() {
  const query = searchInput.value.toLowerCase().trim();
  clearSearchBtn.style.display = query ? 'block' : 'none';

  let filtered = [...currentNotes];

  if (currentFilter !== 'all') {
    filtered = filtered.filter(n => (n.icon || 'notes') === currentFilter);
  }

  if (query) {
    filtered = filtered.filter(n =>
      (n.title && n.title.toLowerCase().includes(query)) ||
      (n.content && n.content.toLowerCase().includes(query))
    );
  }

  renderNotes(filtered);

  const total = currentNotes.length;
  if (notesCountBadge) notesCountBadge.textContent = `${total} note${total === 1 ? '' : 's'}`;
  if (footerStats) footerStats.textContent = `🌸 Showing ${filtered.length} note${filtered.length === 1 ? '' : 's'}`;
}

function renderNotes(notes) {
  notesGrid.innerHTML = '';

  if (notes.length === 0 && (searchInput.value.trim() || currentFilter !== 'all')) {
    emptyState.style.display = 'block';
    notesGrid.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  notesGrid.style.display = 'grid';

  notes.forEach((note) => {
    const card = createNoteCard(note);
    notesGrid.appendChild(card);
  });

  const addCard = createAddNoteCard();
  notesGrid.appendChild(addCard);
}

function createNoteCard(note) {
  const card = document.createElement('article');
  card.className = 'note-card';

  const iconEmoji = ICONS_EMOJI[note.icon] || '📝';
  const colorClass = note.color || 'pink';

  card.innerHTML = `
    <div>
      <div class="card-header">
        <div class="card-title-group">
          <div class="card-icon-badge ${colorClass}">
            ${iconEmoji}
          </div>
          <h2 class="card-title">${escapeHtml(note.title)}</h2>
        </div>
        <div class="card-actions">
          <button class="btn-card-action btn-edit" title="Edit note">Edit</button>
          <button class="btn-card-action btn-delete" title="Delete note">Delete</button>
        </div>
      </div>
      <div class="card-body">${escapeHtml(note.content || '')}</div>
    </div>
    <div class="card-footer">
      <div class="footer-timestamp">
        <span>🕒</span>
        <span>${escapeHtml(note.updatedAt || 'Recently')}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (!e.target.closest('.card-actions')) openEditModal(note);
  });

  card.querySelector('.btn-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(note);
  });

  card.querySelector('.btn-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    confirmDeleteNote(note);
  });

  return card;
}

function createAddNoteCard() {
  const addCard = document.createElement('div');
  addCard.className = 'add-note-card';
  addCard.setAttribute('role', 'button');
  addCard.setAttribute('tabindex', '0');

  addCard.innerHTML = `
    <div class="plus-circle">+</div>
    <div class="add-note-label">Add New Note</div>
  `;

  addCard.addEventListener('click', openAddModal);
  addCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openAddModal();
    }
  });

  return addCard;
}

function openAddModal() {
  noteForm.reset();
  noteIdInput.value = '';
  modalTitleText.textContent = 'Add New Note';
  modalHeaderBadge.textContent = '📝';
  selectIconOption('notes', 'pink');
  noteModal.style.display = 'flex';
  setTimeout(() => noteTitleInput.focus(), 50);
}

function openEditModal(note) {
  noteIdInput.value = note.id;
  noteTitleInput.value = note.title;
  noteContentInput.value = note.content || '';
  modalTitleText.textContent = 'Edit Note';
  modalHeaderBadge.textContent = ICONS_EMOJI[note.icon] || '📝';
  selectIconOption(note.icon || 'notes', note.color || 'pink');
  noteModal.style.display = 'flex';
  setTimeout(() => noteTitleInput.focus(), 50);
}

function selectIconOption(iconName, colorName) {
  selectedIcon = iconName;
  selectedColor = colorName;
  iconPicker.querySelectorAll('.icon-option').forEach(opt => {
    if (opt.dataset.icon === iconName) {
      opt.classList.add('selected');
    } else {
      opt.classList.remove('selected');
    }
  });
}

function closeModal() {
  noteModal.style.display = 'none';
}

async function handleSaveNote(e) {
  e.preventDefault();
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();
  const id = noteIdInput.value;

  if (!title) return;

  const payload = { title, content, icon: selectedIcon, color: selectedColor };

  try {
    if (id) {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      const idx = currentNotes.findIndex(n => n.id === id);
      if (idx !== -1) currentNotes[idx] = updated;
      showToast('🌸 Note updated!');
    } else {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Create failed');
      const created = await res.json();
      currentNotes.push(created);
      showToast('🌸 Note added!');
    }

    closeModal();
    applyFilters();
  } catch (err) {
    console.error('Error saving note:', err);
    showToast('⚠️ Could not save note');
  }
}

function confirmDeleteNote(note) {
  noteToDeleteId = note.id;
  deleteNoteTitle.textContent = `Are you sure you want to delete "${note.title}"?`;
  deleteConfirmModal.style.display = 'flex';
}

async function executeDeleteNote() {
  if (!noteToDeleteId) return;

  try {
    const res = await fetch(`/api/notes/${noteToDeleteId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');

    currentNotes = currentNotes.filter(n => n.id !== noteToDeleteId);
    deleteConfirmModal.style.display = 'none';
    noteToDeleteId = null;
    showToast('🗑️ Note deleted!');
    applyFilters();
  } catch (err) {
    console.error('Error deleting note:', err);
    showToast('⚠️ Could not delete note');
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
