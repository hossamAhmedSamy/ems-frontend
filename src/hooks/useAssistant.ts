import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import type {
  AiUsage,
  AssistantChatResponse,
  AssistantMessage,
  AssistantPendingAction,
} from '../lib/types';

// Token-economy rules implemented here (not in the UI):
// - Opening/closing the panel never calls the LLM. The welcome line is a
//   hardcoded local pick and is never sent to the backend.
// - The transcript is client-held (sessionStorage: survives panel toggles and
//   navigation, dies with the tab) and capped — the backend slices to 20 too.
// - One in-flight request at a time; approving a card costs zero LLM tokens.

const TRANSCRIPT_KEY = 'ems-assistant-transcript';
const MAX_MESSAGES = 20;

export const WELCOME_LINES = [
  'Hi! Ask me about your expenses, or tell me to add one.',
  'Hello — try “what did we spend this month?”',
  'Ready when you are. I can look things up or create expenses for you.',
  'Hi there! Ask about branches, categories, or spending trends.',
  'What can I do for you? Creating an expense takes one sentence.',
];

function loadTranscript(): AssistantMessage[] {
  try {
    const raw = sessionStorage.getItem(TRANSCRIPT_KEY);
    const parsed = raw ? (JSON.parse(raw) as AssistantMessage[]) : [];
    return Array.isArray(parsed) ? parsed.slice(-MAX_MESSAGES) : [];
  } catch {
    return [];
  }
}

export function useAssistant(open: boolean) {
  const [messages, setMessages] = useState<AssistantMessage[]>(loadTranscript);
  const [pending, setPending] = useState<AssistantPendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const welcomeRef = useRef(WELCOME_LINES[Math.floor(Math.random() * WELCOME_LINES.length)]);
  const queryClient = useQueryClient();

  useEffect(() => {
    sessionStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  }, [messages]);

  // Our own DB endpoint (no LLM cost); only fetched while the panel is open.
  const usage = useQuery({
    queryKey: ['tenant', 'ai-usage'],
    queryFn: () => api.get<AiUsage>('/ai/usage'),
    enabled: open,
    staleTime: 60_000,
  });
  const chatUsage = usage.data?.features.find((f) => f.feature === 'chat');
  const quotaExhausted = !!chatUsage && chatUsage.used >= chatUsage.limit;

  const refreshUsage = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['tenant', 'ai-usage'] }),
    [queryClient],
  );

  const append = useCallback((msg: AssistantMessage) => {
    setMessages((cur) => [...cur, msg].slice(-MAX_MESSAGES));
  }, []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      setError(null);
      setPending(null);
      setBusy(true);
      const history = [...messages, { role: 'user' as const, content }].slice(-MAX_MESSAGES);
      setMessages(history);
      try {
        const res = await api.post<AssistantChatResponse>('/ai/chat', { messages: history });
        if (res.reply) append({ role: 'assistant', content: res.reply });
        setPending(res.pendingAction);
        void refreshUsage();
      } catch (err) {
        if (err instanceof ApiError && err.status === 503) {
          setError('AI features are not enabled for this workspace yet.');
        } else {
          setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
        }
      } finally {
        setBusy(false);
      }
    },
    [append, busy, messages, refreshUsage],
  );

  const approve = useCallback(async () => {
    if (!pending || busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ result: unknown; message: string }>('/ai/chat/confirm', {
        tool: pending.tool,
        input: pending.input,
      });
      append({ role: 'assistant', content: res.message });
      setPending(null);
      // The write may affect lists/dashboard the user has open.
      void queryClient.invalidateQueries({ queryKey: ['tenant'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The action failed — nothing was saved.');
    } finally {
      setBusy(false);
    }
  }, [append, busy, pending, queryClient]);

  const dismiss = useCallback(() => {
    if (!pending) return;
    // Kept in the transcript so the model knows the proposal was declined.
    append({ role: 'assistant', content: 'Cancelled — nothing was saved.' });
    setPending(null);
  }, [append, pending]);

  const reset = useCallback(() => {
    setMessages([]);
    setPending(null);
    setError(null);
    welcomeRef.current = WELCOME_LINES[Math.floor(Math.random() * WELCOME_LINES.length)];
    sessionStorage.removeItem(TRANSCRIPT_KEY);
  }, []);

  return {
    messages,
    welcome: welcomeRef.current,
    pending,
    busy,
    error,
    chatUsage,
    quotaExhausted,
    send,
    approve,
    dismiss,
    reset,
  };
}
