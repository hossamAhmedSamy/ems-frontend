import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useAssistant } from '../../../hooks/useAssistant';
import { cn } from '../../../lib/utils';
import type { AssistantMessage } from '../../../lib/types';

function Bubble({ msg }: { msg: AssistantMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words',
          isUser ? 'bg-brand-600 text-white' : 'bg-surface-muted text-slate-800',
        )}
      >
        {msg.content}
      </div>
    </div>
  );
}

export function AssistantPanel({ onClose }: { onClose: () => void }) {
  const a = useAssistant(true);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [a.messages, a.pending, a.busy]);

  const submit = () => {
    const text = input.trim();
    if (!text || a.busy || a.quotaExhausted) return;
    setInput('');
    void a.send(text);
  };

  return (
    <div
      className={cn(
        'fixed z-50 bg-white flex flex-col shadow-elevated border border-slate-200',
        // Mobile: full-screen sheet. Desktop: bottom-right panel.
        'inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[600px] md:max-h-[80vh] md:rounded-xl',
      )}
    >
      <header className="flex items-center gap-3 px-4 h-14 border-b border-slate-200 shrink-0">
        <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900">Assistant</div>
          <div className="text-[11px] text-slate-500">
            {a.chatUsage
              ? `${a.chatUsage.used}/${a.chatUsage.limit} messages today`
              : 'Grounded in your workspace data'}
          </div>
        </div>
        <button
          aria-label="New chat"
          title="New chat"
          onClick={a.reset}
          className="p-2 rounded-md text-slate-500 hover:bg-surface-muted hover:text-slate-900"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          aria-label="Close assistant"
          onClick={onClose}
          className="p-2 rounded-md text-slate-500 hover:bg-surface-muted hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Hardcoded welcome — never sent to the API, costs zero tokens. */}
        {a.messages.length === 0 && <Bubble msg={{ role: 'assistant', content: a.welcome }} />}
        {a.messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}

        {a.pending && (
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-brand-700">
              Needs your approval
            </div>
            <div className="text-sm text-slate-800">{a.pending.summary}</div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => void a.approve()} loading={a.busy}>
                Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={a.dismiss} disabled={a.busy}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {a.busy && !a.pending && (
          <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
            Thinking…
          </div>
        )}

        {a.error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {a.error}
          </div>
        )}
      </div>

      <footer className="p-3 border-t border-slate-200 shrink-0">
        {a.quotaExhausted ? (
          <div className="text-xs text-slate-500 text-center py-2">
            Daily message limit reached — resets tomorrow.
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Ask, or tell me what to create…"
              className="flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32"
            />
            <Button size="sm" onClick={submit} disabled={a.busy || !input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
}
