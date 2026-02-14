import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erreur réseau' }));
        toast({ title: 'Erreur', description: err.error || 'Une erreur est survenue', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error('No body');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw || !raw.startsWith('data: ')) continue;
          const json = raw.slice(6).trim();
          if (json === '[DONE]') continue;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de contacter l\'assistant', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105",
          open ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <Bot className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">Assistant SpeedWork</p>
              <p className="text-xs opacity-80">IA • En ligne</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Bonjour ! Comment puis-je vous aider ?</p>
                <p className="text-xs mt-1">Posez-moi une question sur vos factures, devis, ou l'application.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-shadow"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
