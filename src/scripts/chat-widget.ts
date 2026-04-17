/**
 * Chat widget client. client:idle hydration.
 *
 * Before hydration, the form works as a regular POST (Worker handles as a
 * one-shot non-streaming response). After hydration, submissions stream via
 * fetch + ReadableStream.
 */

const WORKER_URL = (import.meta as any).env?.PUBLIC_WORKER_URL
  ?? 'https://lovely-chat.muggl3mind.workers.dev';

type Turn = { role: 'user' | 'assistant'; content: string };

interface ChatState {
  history: Turn[];
  streaming: boolean;
}

// Must match the worker's MAX_TURNS. If the worker's value changes, update
// this too. Mismatch causes every message past the worker's limit to fail
// with "conversation too long".
const MAX_TURNS = 4;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdownLite(s: string): string {
  // Minimal: line breaks, bold, italic, inline code, links, lists.
  const escaped = escapeHtml(s);
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
    .replace(/\n/g, '<br>');
}

function appendMessage(
  pane: HTMLElement,
  role: 'user' | 'assistant',
  content: string,
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className =
    role === 'user'
      ? 'text-sm font-semibold'
      : 'text-base leading-relaxed';
  wrap.setAttribute('data-role', role);
  const label = document.createElement('div');
  label.className = 'text-xs uppercase tracking-wider prose-muted mb-1';
  label.textContent = role === 'user' ? 'You' : 'Lovely Wisdom';
  const body = document.createElement('div');
  body.innerHTML = role === 'user' ? escapeHtml(content) : renderMarkdownLite(content);
  wrap.appendChild(label);
  wrap.appendChild(body);
  pane.appendChild(wrap);
  pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return body;
}

function appendError(pane: HTMLElement, message?: string) {
  const div = document.createElement('div');
  div.className = 'text-sm prose-muted rule-line border p-4';
  if (message) {
    div.innerHTML =
      escapeHtml(message).replace(
        /\/contact/g,
        '<a href="/contact" class="text-ink dark:text-ink-dark">/contact</a>',
      );
  } else {
    div.innerHTML =
      'The chat is having a moment. Try again in a sec, or ' +
      '<a href="/contact" class="text-ink dark:text-ink-dark">send a message</a>.';
  }
  pane.appendChild(div);
}

class RateLimitError extends Error {
  constructor(public userMessage: string) {
    super('rate_limited');
  }
}

async function streamResponse(
  body: HTMLElement,
  question: string,
  history: Turn[],
): Promise<string> {
  const res = await fetch(`${WORKER_URL}/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question, history }),
  });

  if (res.status === 429) {
    let msg =
      "You've asked a lot of questions. Give it a few minutes, or use the contact form.";
    try {
      const payload = (await res.json()) as { message?: string };
      if (payload?.message) msg = payload.message;
    } catch {
      /* keep default */
    }
    throw new RateLimitError(msg);
  }

  if (!res.ok || !res.body) {
    throw new Error(`worker ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buf = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    // Parse SSE events line by line.
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const evt = JSON.parse(payload);
        // Workers AI streaming: { response: "token" }
        if (typeof evt.response === 'string') {
          full += evt.response;
          body.innerHTML = renderMarkdownLite(full);
        }
      } catch {
        // ignore partial JSON
      }
    }
  }

  return full;
}

export function initChat() {
  const form = document.getElementById('chat-form') as HTMLFormElement | null;
  const input = document.getElementById('chat-input') as HTMLInputElement | null;
  const pane = document.getElementById('chat-pane') as HTMLElement | null;
  const chips = document.getElementById('chat-chips');
  const resetBtn = document.getElementById('chat-reset') as HTMLButtonElement | null;
  const counter = document.getElementById('chat-counter') as HTMLElement | null;
  if (!form || !input || !pane) return;

  const state: ChatState = { history: [], streaming: false };

  const turnsUsed = () => state.history.length / 2;

  const updateCounter = () => {
    if (!counter) return;
    const used = turnsUsed();
    if (used === 0) {
      counter.hidden = true;
      return;
    }
    counter.hidden = false;
    counter.textContent = `${used} of ${MAX_TURNS} questions used`;
    if (used >= MAX_TURNS) {
      counter.textContent += ' — start a new conversation to ask more.';
    }
  };

  const showReset = () => {
    if (resetBtn) resetBtn.hidden = false;
    updateCounter();
  };

  const submit = async (question: string) => {
    if (state.streaming) return;
    const trimmed = question.trim();
    if (!trimmed) return;
    if (turnsUsed() >= MAX_TURNS) {
      appendMessage(
        pane,
        'assistant',
        "You've reached this chat's question limit. Click **← New conversation** below to start fresh.",
      );
      showReset();
      return;
    }

    pane.classList.remove('hidden');
    appendMessage(pane, 'user', trimmed);
    input.value = '';
    state.streaming = true;

    const assistantBody = appendMessage(pane, 'assistant', '…');

    try {
      const answer = await streamResponse(
        assistantBody,
        trimmed,
        state.history,
      );
      state.history.push({ role: 'user', content: trimmed });
      state.history.push({ role: 'assistant', content: answer || '' });
      showReset();
    } catch (err) {
      assistantBody.parentElement?.remove();
      if (err instanceof RateLimitError) {
        appendError(pane, err.userMessage);
      } else {
        appendError(pane);
      }
      showReset();
    } finally {
      state.streaming = false;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void submit(input.value);
  });

  resetBtn?.addEventListener('click', () => {
    if (state.streaming) return;
    state.history = [];
    pane.innerHTML = '';
    pane.classList.add('hidden');
    resetBtn.hidden = true;
    if (counter) counter.hidden = true;
    input.focus();
  });

  chips?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-chip-id]');
    if (!target) return;
    const text = target.dataset.chipText ?? '';
    // Fire-and-forget beacon for chip click telemetry.
    try {
      navigator.sendBeacon?.(
        `${WORKER_URL}/log?event=chip&id=${encodeURIComponent(target.dataset.chipId ?? '')}`,
      );
    } catch {
      /* ignore */
    }
    input.value = text;
    void submit(text);
  });
}
