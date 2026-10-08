'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, X, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import AIResponseRenderer from '@/components/AIResponseRenderer';
import styles from './AIModal.module.css';

export default function AIModal({ isOpen, onClose, initialMessage }) {
  useEffect(() => { if (initialMessage) { setMessages([{ role: 'ai', text: initialMessage }]); } }, [initialMessage]);

  const [messages, setMessages] = useState([
    { role: 'ai', text: initialMessage || 'Hello! I am your TemprFit AI Coach. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleRegenerate = async () => {
    if (messages.length < 2 || isTyping) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;
    
    const newMessages = [...messages];
    if (newMessages[newMessages.length - 1].role === 'ai') {
      newMessages.pop();
    }
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: lastUserMsg.text }),
      });
      const data = await res.json();
      const text = res.ok ? data.message.content : (data.error || 'Something went wrong - try again.');
      setMessages(prev => [...prev, { role: 'ai', text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Could not reach the AI coach. Check your connection and try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      const text = res.ok ? data.message.content : (data.error || 'Something went wrong — try again.');
      setMessages(prev => [...prev, { role: 'ai', text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Could not reach the AI coach. Check your connection and try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.aiInfo}>
            <div className={styles.aiAvatar}>
              <Image src="/images/brand/my-logo.png" alt="" width={22} height={22} />
            </div>
            <div>
              <h3>TemprFit AI Coach</h3>
              <span className={styles.status}>Online</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.messages} ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
              <div className={styles.avatar}>
                {msg.role === 'ai' ? (
                  <Image src="/images/brand/my-logo.png" alt="" width={16} height={16} />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className={styles.bubble}>
                {msg.role === 'ai' ? (
                  <>
                    <AIResponseRenderer content={msg.text} />
                    {i === messages.length - 1 && (
                      <button onClick={handleRegenerate} style={{ marginTop: '12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px' }}>
                        <RefreshCw size={14} /> Regenerate Response
                      </button>
                    )}
                  </>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className={`${styles.message} ${styles.ai}`}>
              <div className={styles.avatar}>
                <Image src="/images/brand/my-logo.png" alt="" width={16} height={16} />
              </div>
              <div className={styles.typing}>
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        <div className={styles.inputArea}>
          <input
            type="text"
            placeholder="Ask your AI coach anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button className={styles.sendBtn} onClick={handleSend}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}