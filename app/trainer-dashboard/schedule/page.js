'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronLeft, ChevronRight, Loader2, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function SchedulePage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', type: 'session', startTime: '', endTime: '', traineeId: '', notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [eventsRes, clientsRes] = await Promise.all([
        fetch('/api/trainer/schedule'),
        fetch('/api/trainer/clients')
      ]);
      
      const eventsData = await eventsRes.json();
      const clientsData = await clientsRes.json();
      
      if (eventsData.events) setEvents(eventsData.events);
      if (clientsData.clients) setClients(clientsData.clients);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/trainer/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchData(); // Reload events
      } else {
        window.appAlert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

  // Helper to check if a specific day has events
  const hasEventOnDate = (day) => {
    return events.some(ev => {
      const d = new Date(ev.startTime);
      return d.getDate() === day && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });
  };

  // Events for currently selected date
  const selectedEvents = events.filter(ev => {
    const d = new Date(ev.startTime);
    return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
  });

  const getMonthName = (date) => date.toLocaleString('default', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <Sidebar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 size={40} className="spin" style={{ color: '#22c55e' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Schedule</h1>
            <p>Manage your sessions, consultations, and time blocks.</p>
          </div>
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Event
          </button>
        </div>

        <div className={styles.grid}>
          {/* Calendar Pane */}
          <div className={styles.calendarCard}>
            <div className={styles.calendarHeader}>
              <button 
                className={styles.navBtn} 
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
              >
                <ChevronLeft size={18} />
              </button>
              <h2>{getMonthName(selectedDate)}</h2>
              <button 
                className={styles.navBtn}
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className={styles.daysGrid}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className={styles.dayName}>{d}</div>)}
              {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isActive = day === selectedDate.getDate();
                const hasEvent = hasEventOnDate(day);
                
                return (
                  <div 
                    key={day} 
                    className={`${styles.dayCell} ${isActive ? styles.active : ''}`}
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                  >
                    {day}
                    {hasEvent && <div className={styles.hasEvent} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agenda Pane */}
          <div className={styles.agendaCard}>
            <div className={styles.agendaHeader}>
              Agenda for {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            
            {selectedEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                <Clock size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p>No events scheduled for this day.</p>
              </div>
            ) : (
              <div className={styles.eventList}>
                {selectedEvents.map(ev => (
                  <div key={ev._id} className={styles.eventCard}>
                    <div className={styles.eventTime}>
                      <strong>{new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                      <span>{new Date(ev.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={styles.eventDetails}>
                      <h4>{ev.title}</h4>
                      {ev.trainee && <p>With: {ev.trainee.username}</p>}
                      <span className={styles.eventType}>{ev.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Add Schedule Event</h2>
            <form onSubmit={handleAddEvent}>
              <div className={styles.formGroup}>
                <label>Event Title</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="E.g., 1-on-1 Training" 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Event Type</label>
                <select className={styles.input} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="session">Training Session</option>
                  <option value="consultation">Consultation</option>
                  <option value="block">Block Time (Unavailable)</option>
                </select>
              </div>
              {formData.type !== 'block' && (
                <div className={styles.formGroup}>
                  <label>Client (Optional)</label>
                  <select className={styles.input} value={formData.traineeId} onChange={e => setFormData({...formData, traineeId: e.target.value})}>
                    <option value="">Select a client...</option>
                    {clients.map(c => (
                      <option key={c.user._id} value={c.user._id}>{c.user.username}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Start Time</label>
                  <input type="datetime-local" className={styles.input} required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>End Time</label>
                  <input type="datetime-local" className={styles.input} required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
