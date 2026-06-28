'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { Send, Bot, User, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
  };
}

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  documents?: Doc[];
}

const SourceDocuments: React.FC<{ documents: Doc[] }> = ({ documents }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!documents || documents.length === 0) return null;

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-medium text-violet-300 hover:text-violet-200 transition-colors cursor-pointer"
      >
        <FileText className="size-3.5" />
        <span>{documents.length} source{documents.length > 1 ? 's' : ''} referenced</span>
        {isOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {documents.map((doc, i) => (
            <div
              key={i}
              className="rounded-lg bg-white/5 border border-white/10 p-3 text-xs"
            >
              <div className="flex items-center gap-2 mb-1.5 text-violet-300">
                <FileText className="size-3" />
                <span className="font-medium">
                  {doc.metadata?.source
                    ? doc.metadata.source.split('/').pop()?.split(' - ').pop()
                    : `Source ${i + 1}`}
                </span>
                {doc.metadata?.loc?.pageNumber && (
                  <span className="text-muted-foreground">
                    · Page {doc.metadata.loc.pageNumber}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed line-clamp-4">
                {doc.pageContent}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-3 px-4 py-2">
    <div className="flex-shrink-0 size-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
      <Bot className="size-4 text-white" />
    </div>
    <div className="bg-slate-800/80 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex items-center gap-1.5">
        <div className="size-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="size-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="size-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

const MessageBubble: React.FC<{ message: IMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex items-start gap-3 px-4 py-2 ${isUser ? 'flex-row-reverse' : ''
        } animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 size-8 rounded-full flex items-center justify-center shadow-lg ${isUser
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
          : 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-violet-500/20'
          }`}
      >
        {isUser ? (
          <User className="size-4 text-white" />
        ) : (
          <Bot className="size-4 text-white" />
        )}
      </div>

      {/* Message content */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm shadow-lg shadow-emerald-500/10'
            : 'bg-slate-800/80 border border-white/10 text-slate-100 rounded-tl-sm backdrop-blur-sm'
            }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Source documents (assistant only) */}
        {!isUser && message.documents && message.documents.length > 0 && (
          <div className="mt-1 bg-slate-800/50 border border-white/5 rounded-xl px-4 py-1">
            <SourceDocuments documents={message.documents} />
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
    <div className="size-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mb-5 shadow-lg shadow-violet-500/5">
      <Bot className="size-8 text-violet-400" />
    </div>
    <h2 className="text-xl font-semibold text-white mb-2">
      PDF Assistant
    </h2>
    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
      Upload a PDF on the left, then ask me anything about its contents. I&apos;ll find the relevant passages and answer your question.
    </p>
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      {['What is this document about?', 'Summarize the key points', 'What experience is listed?'].map(
        (suggestion) => (
          <span
            key={suggestion}
            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground"
          >
            {suggestion}
          </span>
        )
      )}
    </div>
  </div>
);

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendChatMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch(
        `http://localhost:8000/chat?message=${encodeURIComponent(userMessage)}`
      );
      const data = await res.json();

      if (data?.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ ${data.error}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data?.answer,
            documents: data?.docs,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '⚠️ Could not reach the server. Please make sure the backend is running.',
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 backdrop-blur-md bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Bot className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">PDF Chat</h1>
            <p className="text-xs text-muted-foreground">
              Ask questions about your uploaded documents
            </p>
          </div>
          {isLoading && (
            <div className="ml-auto flex items-center gap-2 text-xs text-violet-400">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Thinking…</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-thin">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} />
          ))
        )}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="flex gap-2 items-center bg-slate-800/80 border border-white/10 rounded-2xl px-4 py-2 backdrop-blur-sm shadow-lg shadow-black/20 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20 transition-all">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your PDF…"
            disabled={isLoading}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent text-white placeholder:text-slate-500 h-10 text-sm"
          />
          <Button
            onClick={handleSendChatMessage}
            disabled={!message.trim() || isLoading}
            size="icon"
            className="flex-shrink-0 size-9 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 disabled:opacity-30 disabled:shadow-none transition-all cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
