import toast from 'react-hot-toast';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import React from 'react';

export const customToast = {
  success: (msg) => toast(msg, {
    icon: <CheckCircle2 color="#22c55e" />,
    style: { border: '1px solid rgba(34, 197, 94, 0.2)', background: 'var(--color-surface-elevated)', color: 'var(--color-text)' }
  }),
  error: (msg) => toast(msg, {
    icon: <AlertTriangle color="#ef4444" />,
    style: { border: '1px solid rgba(239, 68, 68, 0.2)', background: 'var(--color-surface-elevated)', color: 'var(--color-text)' }
  }),
  info: (msg) => toast(msg, {
    icon: <Info color="#3b82f6" />,
    style: { border: '1px solid rgba(59, 130, 246, 0.2)', background: 'var(--color-surface-elevated)', color: 'var(--color-text)' }
  })
};
