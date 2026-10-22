const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aesthetic_notes';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const initialNotes = [
  {
    id: 'note-1',
    title: 'Meeting Notes',
    icon: 'notes',
    color: 'pink',
    content: 'Completed user authentication system and database migration. In progress with frontend setup and REST API endpoints.',
    updatedAt: 'Sep 18, 2025, 08:02 PM',
    createdAt: new Date('2025-09-18T20:02:00').toISOString()
  },
  {
    id: 'note-2',
    title: 'Project Ideas',
    icon: 'bulb',
    color: 'purple',
    content: 'Personal finance tracker app - Plant care reminder app - Recipe cost calculator',
    updatedAt: 'Sep 18, 2025, 08:03 PM',
    createdAt: new Date('2025-09-18T20:03:00').toISOString()
  },
  {
    id: 'note-3',
    title: 'Gratitude Journal',
    icon: 'heart',
    color: 'lavender',
    content: 'Three good things today: 1. Had a great coffee 2. Finished coding project 3. Beautiful walk in the park',
    updatedAt: 'Sep 18, 2025, 08:04 PM',
    createdAt: new Date('2025-09-18T20:04:00').toISOString()
  }
];

function formatUpdatedDate(date = new Date()) {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'notes.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialNotes, null, 2), 'utf-8');
  }
}

function readLocalNotes() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return initialNotes;
  }
}

function writeLocalNotes(notes) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2), 'utf-8');
}

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String, default: 'notes' },
  color: { type: String, default: 'pink' },
  content: { type: String, default: '' },
  updatedAt: { type: String, default: () => formatUpdatedDate() },
  createdAt: { type: Date, default: Date.now }
});

const NoteModel = mongoose.model('Note', noteSchema);
let isMongoConnected = false;

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 2500
}).then(async () => {
  isMongoConnected = true;
  const count = await NoteModel.countDocuments();
  if (count === 0) {
    await NoteModel.insertMany(initialNotes.map(n => ({
      title: n.title,
      icon: n.icon,
      color: n.color,
      content: n.content,
      updatedAt: n.updatedAt
    })));
  }
}).catch(() => {
  isMongoConnected = false;
});

app.get('/api/notes', async (req, res) => {
  try {
    if (isMongoConnected) {
      const notes = await NoteModel.find().sort({ createdAt: 1 });
      const mapped = notes.map(doc => ({
        id: doc._id.toString(),
        title: doc.title,
        icon: doc.icon,
        color: doc.color,
        content: doc.content,
        updatedAt: doc.updatedAt
      }));
      return res.json(mapped);
    } else {
      return res.json(readLocalNotes());
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { title, content, icon = 'notes', color = 'pink' } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const timestamp = formatUpdatedDate();

    if (isMongoConnected) {
      const newNote = await NoteModel.create({
        title: title.trim(),
        content: content ? content.trim() : '',
        icon,
        color,
        updatedAt: timestamp
      });
      return res.status(201).json({
        id: newNote._id.toString(),
        title: newNote.title,
        icon: newNote.icon,
        color: newNote.color,
        content: newNote.content,
        updatedAt: newNote.updatedAt
      });
    } else {
      const notes = readLocalNotes();
      const newNote = {
        id: 'note-' + Date.now(),
        title: title.trim(),
        content: content ? content.trim() : '',
        icon,
        color,
        updatedAt: timestamp,
        createdAt: new Date().toISOString()
      };
      notes.push(newNote);
      writeLocalNotes(notes);
      return res.status(201).json(newNote);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, icon, color } = req.body;
    const timestamp = formatUpdatedDate();

    if (isMongoConnected) {
      const updated = await NoteModel.findByIdAndUpdate(
        id,
        {
          ...(title !== undefined && { title: title.trim() }),
          ...(content !== undefined && { content: content.trim() }),
          ...(icon !== undefined && { icon }),
          ...(color !== undefined && { color }),
          updatedAt: timestamp
        },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: 'Note not found' });
      return res.json({
        id: updated._id.toString(),
        title: updated.title,
        icon: updated.icon,
        color: updated.color,
        content: updated.content,
        updatedAt: updated.updatedAt
      });
    } else {
      const notes = readLocalNotes();
      const index = notes.findIndex(n => n.id === id);
      if (index === -1) return res.status(404).json({ error: 'Note not found' });
      notes[index] = {
        ...notes[index],
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        updatedAt: timestamp
      };
      writeLocalNotes(notes);
      return res.json(notes[index]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const deleted = await NoteModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Note not found' });
      return res.json({ success: true, message: 'Note deleted', id });
    } else {
      let notes = readLocalNotes();
      const initialLength = notes.length;
      notes = notes.filter(n => n.id !== id);
      if (notes.length === initialLength) return res.status(404).json({ error: 'Note not found' });
      writeLocalNotes(notes);
      return res.json({ success: true, message: 'Note deleted', id });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌸 Server running at http://localhost:${PORT}`);
});
