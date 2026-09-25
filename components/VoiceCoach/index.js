'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, Bot } from 'lucide-react';
import styles from './VoiceCoach.module.css';

export default function VoiceCoach({ context = {}, autoSpeakPrompt = '', syncKey = '' }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [supported, setSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const recognitionRef = useRef(null);
  const latestSyncKey = useRef(syncKey);

  useEffect(() => {
    latestSyncKey.current = syncKey;
  }, [syncKey]);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        await handleVoiceQuery(text, latestSyncKey.current);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setSupported(false);
    }

    const loadVoices = () => {
      if (!window.speechSynthesis) return;
      const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
      setAvailableVoices(voices);
      if (voices.length > 0) {
        // default to something good if not already set
        const defaultV = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.lang === 'en-US') || voices[0];
        setSelectedVoiceURI(prev => prev || defaultV.voiceURI);
      }
    };

    if (window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle active auto-speak triggers
  // Removed per user request: AI should not auto-talk unless you tap the speak button.
  // The user will tap the mic to initiate conversation.

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
      // Stop any current speech
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleVoiceQuery = async (query, currentKey) => {
    if (!query) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/coach/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context }),
      });
      const data = await res.json();
      
      if (data.reply && latestSyncKey.current === currentKey) {
        speakResponse(data.reply);
      }
    } catch (e) {
      console.error(e);
      if (latestSyncKey.current === currentKey) {
        speakResponse("Sorry, I had trouble connecting. Could you repeat that?");
      }
    }
    if (latestSyncKey.current === currentKey) {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text) => {
    if (!window.speechSynthesis || isMutedRef.current) return;
    window.speechSynthesis.cancel(); // Clear queue

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.05;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utterance.onerror = () => setIsSpeaking(false);

    if (selectedVoiceURI) {
      const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  };

  if (!supported) return null;

  return (
    <div className={`${styles.voiceCoach} ${isListening ? styles.listening : ''} ${isSpeaking ? styles.speaking : ''}`}>
      
      {!isListening && !isSpeaking && !isProcessing && !transcript && (
        <div className={styles.ctaBanner} onClick={toggleListen}>
          <Bot size={18} />
          <span>Tap to talk to Coach</span>
        </div>
      )}

      <div className={styles.controls}>
        <button 
          className={`${styles.muteButton} ${isMuted ? styles.muted : ''}`}
          onClick={() => {
            const nextMuted = !isMuted;
            setIsMuted(nextMuted);
            isMutedRef.current = nextMuted;
            if (nextMuted && window.speechSynthesis) {
              window.speechSynthesis.pause();
              window.speechSynthesis.cancel();
            }
            setIsSpeaking(false);
          }}
          title={isMuted ? "Unmute AI Coach" : "Mute AI Coach"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <button 
          className={`${styles.micButton} ${isListening ? styles.activeMic : ''}`}
          onClick={toggleListen}
          title={isListening ? "Stop listening" : "Talk to Coach"}
        >
          {isListening ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        
        {availableVoices.length > 0 && (
          <select 
            className={styles.voiceSelect}
            value={selectedVoiceURI}
            onChange={(e) => setSelectedVoiceURI(e.target.value)}
          >
            {availableVoices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.statusArea}>
        {isListening && <div className={styles.pulseIndicator}>Listening...</div>}
        {isProcessing && <div className={styles.processing}><Loader2 size={16} className="spin" /> Coach is thinking...</div>}
        {isSpeaking && (
          <div className={styles.speakingIndicator}>
            <Volume2 size={16} /> Coach is speaking
            <div className={styles.visualizer}>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
              <div className={styles.bar}></div>
            </div>
          </div>
        )}
      </div>

      {transcript && !isListening && !isProcessing && !isSpeaking && (
        <div className={styles.lastTranscript}>
          <Sparkles size={14} style={{ color: '#8b5cf6', flexShrink: 0 }} />
          <p>"{transcript}"</p>
        </div>
      )}
    </div>
  );
}
