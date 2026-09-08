// Minimal stand-in for `sonner` (the subset the web app uses:
// toast.success / error / loading / dismiss with optional description).
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../lib/cn';

type ToastKind = 'success' | 'error' | 'loading' | 'default';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  description?: string;
}
interface ToastOptions {
  description?: string;
  duration?: number;
}

type Listener = (items: ToastItem[]) => void;
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  listeners.forEach((l) => l([...items]));
}

function push(kind: ToastKind, message: string, opts?: ToastOptions): number {
  const id = nextId++;
  items = [...items, { id, kind, message, description: opts?.description }];
  emit();
  if (kind !== 'loading') {
    timers.set(
      id,
      setTimeout(() => toast.dismiss(id), opts?.duration ?? 3000)
    );
  }
  return id;
}

export const toast = {
  message: (message: string, opts?: ToastOptions) => push('default', message, opts),
  success: (message: string, opts?: ToastOptions) => push('success', message, opts),
  error: (message: string, opts?: ToastOptions) => push('error', message, opts),
  loading: (message: string, opts?: ToastOptions) => push('loading', message, opts),
  dismiss: (id?: number) => {
    if (id === undefined) {
      items = [];
    } else {
      const t = timers.get(id);
      if (t) clearTimeout(t);
      timers.delete(id);
      items = items.filter((i) => i.id !== id);
    }
    emit();
  },
};

const KIND_CLASS: Record<ToastKind, string> = {
  success: 'border-green-500/40',
  error: 'border-red-500/40',
  loading: 'border-border',
  default: 'border-border',
};

const KIND_PREFIX: Record<ToastKind, string> = { success: '✓', error: '✕', loading: '…', default: '' };

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <View pointerEvents="none" className="absolute left-0 right-0 items-center gap-2 px-4" style={{ top: insets.top + 8 }}>
      {list.map((t) => (
        <ToastBubble key={t.id} item={t} />
      ))}
    </View>
  );
}

function ToastBubble({ item }: { item: ToastItem }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className={cn('w-full max-w-[420px] rounded-xl border bg-card px-4 py-3 shadow-md', KIND_CLASS[item.kind])}
    >
      <Text className="text-sm font-medium text-foreground">
        {KIND_PREFIX[item.kind] ? `${KIND_PREFIX[item.kind]} ` : ''}{item.message}
      </Text>
      {item.description ? <Text className="mt-0.5 text-xs text-muted-foreground">{item.description}</Text> : null}
    </Animated.View>
  );
}
