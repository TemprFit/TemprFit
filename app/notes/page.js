'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pin, Mic, Download, Share, Send } from 'lucide-react';
import { get, set } from 'idb-keyval';
import styles from './page.module.css';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [showForm, setShowForm] = useState(false);

  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        if (navigator.onLine) {
          await syncOfflineNotes();
          const res = await fetch('/api/notes');
          const data = await res.json();
          if (data.notes) {
            const formatted = data.notes.map(n => ({...n, id: n._id, date: new Date(n.createdAt).toISOString().slice(0, 10)}));
            setNotes(formatted);
            await set('cached_notes', formatted);
          }
        } else {
          const cached = await get('cached_notes');
          if (cached) setNotes(cached);
        }
      } catch (e) {
        const cached = await get('cached_notes');
        if (cached) setNotes(cached);
      }
    };
    loadNotes();

    window.addEventListener('online', loadNotes);
    return () => window.removeEventListener('online', loadNotes);
  }, []);

  const toggleListen = () => {
    if (isListening) {
      setIsListening(false);
      if (window.recognition) {
        window.recognition.stop();
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.appAlert('Your browser does not support voice input.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setNewNote((prev) => ({ ...prev, content: prev.content + (prev.content && !prev.content.endsWith(' ') ? ' ' : '') + finalTranscript }));
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    window.recognition = recognition;
    recognition.start();
  };

  const syncOfflineNotes = async () => {
    const queue = await get('offline_notes_queue') || [];
    if (queue.length === 0) return;
    
    for (const note of queue) {
      if (note.action === 'POST') {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(note.data),
        }).catch(() => {});
      } else if (note.action === 'DELETE') {
        await fetch(`/api/notes?id=${note.id}`, { method: 'DELETE' }).catch(() => {});
      }
    }
    await set('offline_notes_queue', []);
  };

  const addNote = async () => {
    if (!newNote.title) return;
    
    if (!navigator.onLine) {
      const tempNote = { ...newNote, _id: 'temp_' + Date.now(), createdAt: new Date().toISOString() };
      const formatted = {...tempNote, id: tempNote._id, date: tempNote.createdAt.slice(0, 10)};
      setNotes([formatted, ...notes]);
      
      const queue = await get('offline_notes_queue') || [];
      queue.push({ action: 'POST', data: newNote });
      await set('offline_notes_queue', queue);
      await set('cached_notes', [formatted, ...notes]);
      
      setNewNote({ title: '', content: '' });
      setShowForm(false);
      return;
    }

    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNote),
    });
    if (res.ok) {
      const data = await res.json();
      const n = data.note;
      setNotes([{...n, id: n._id, date: new Date(n.createdAt).toISOString().slice(0, 10)}, ...notes]);
      setNewNote({ title: '', content: '' });
      setShowForm(false);
    }
  };

  const deleteNote = async (id) => {
    if (!navigator.onLine) {
      const filtered = notes.filter(n => n.id !== id);
      setNotes(filtered);
      const queue = await get('offline_notes_queue') || [];
      queue.push({ action: 'DELETE', id });
      await set('offline_notes_queue', queue);
      await set('cached_notes', filtered);
      return;
    }

    const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const togglePin = (id) => setNotes(notes.map(n => n.id === id ? {...n, pinned: !n.pinned} : n));

  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1>Workout <span className={styles.gradient}>Notes</span></h1>
          <button className={styles.newBtn} onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> New Note
          </button>
        </div>

        {showForm && (
          <div className={styles.form}>
            <input 
              type="text" 
              placeholder="Note title..." 
              value={newNote.title}
              onChange={e => setNewNote({...newNote, title: e.target.value})}
            />
            <textarea 
              placeholder="Write your notes here..." 
              rows={4}
              value={newNote.content}
              onChange={e => setNewNote({...newNote, content: e.target.value})}
            />
            <div className={styles.formActions}>
              <button 
                className={styles.micBtn} 
                onClick={toggleListen}
                style={{ background: isListening ? 'rgba(239,68,68,0.1)' : '', color: isListening ? '#ef4444' : '', borderColor: isListening ? 'rgba(239,68,68,0.2)' : '' }}
              >
                <Mic size={16} className={isListening ? styles.pulse : ''} /> 
                {isListening ? 'Listening...' : 'Voice'}
              </button>
              <div className={styles.formRight}>
                <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button className={styles.saveBtn} onClick={addNote}>Save Note</button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.notesGrid}>
          {sorted.map(note => (
            <div key={note.id} className={`${styles.note} ${note.pinned ? styles.pinned : ''}`}>
              <div className={styles.noteHeader}>
                <h3>{note.title}</h3>
                <div className={styles.noteActions}>
                  <button onClick={() => togglePin(note.id)} className={note.pinned ? styles.pinnedBtn : ''} title="Pin">
                    <Pin size={14} />
                  </button>
                  <button onClick={() => {
                    const blob = new Blob([note.content], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${note.title}.md`;
                    a.click();
                  }} title="Download">
                    <Download size={14} />
                  </button>
                  <button onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: note.title, text: note.content });
                    } else {
                      navigator.clipboard.writeText(note.content);
                      window.appAlert('Copied to clipboard');
                    }
                  }} title="Share">
                    <Share size={14} />
                  </button>
                  <button onClick={async () => {
                     try {
                       const res = await fetch('/api/moments', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ caption: `**${note.title}**\n\n${note.content}`, mediaUrl: '' })
                       });
                       if (res.ok) {
                         window.appAlert('Note shared to Moments successfully!');
                       } else {
                         window.appAlert('Failed to share to Moments.');
                       }
                     } catch (e) {
                       window.appAlert('Error sharing to Moments.');
                     }
                  }} title="Share to Moments">
                    <Send size={14} />
                  </button>
                  <button onClick={() => deleteNote(note.id)} className={styles.deleteBtn} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className={styles.noteContent}>{note.content}</p>
              <span className={styles.noteDate}>{note.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
