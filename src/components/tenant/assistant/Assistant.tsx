import { useState } from 'react';
import { AssistantBubble } from './AssistantBubble';
import { AssistantPanel } from './AssistantPanel';

// The assistant launcher + panel. Opening and closing is purely client-side —
// no API or LLM call happens until the user actually sends a message.
export function Assistant() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {!open && <AssistantBubble open={open} onToggle={() => setOpen(true)} />}
      {open && <AssistantPanel onClose={() => setOpen(false)} />}
    </>
  );
}
