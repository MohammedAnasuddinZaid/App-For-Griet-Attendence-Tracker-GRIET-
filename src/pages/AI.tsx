import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, Plus, Trash2, Loader2, History, Lock } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { Button, Card, Badge, EmptyState, useToast, ConfirmDialog } from '@/components/ui'
import { processAiMessage } from '@/services/ai/orchestrator'
import {
  getAiConversations, saveAiConversation, getAiMessages, saveAiMessage, saveAiInteraction,
  deleteAiConversation
} from '@/services/dataService'
import { uid } from '@/utils'
import { cn } from '@/utils/cn'
import type { AiConversation, AiMessage } from '@/types'

const QUICK_PROMPTS = [
  'What is my current attendance?',
  'How many classes can I miss?',
  'Which subject needs most attention?',
  'Plan to reach 80% attendance'
]

export default function AiPage() {
  const { profile } = useApp()
  const toast = useToast()

  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AiConversation | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!profile) return
    getAiConversations(profile.id).then(setConversations)
  }, [profile, profile?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  if (!profile) {
    return <EmptyState icon={<Sparkles size={28} />} title="Set up a profile first" />
  }

  async function selectConversation(id: string) {
    setActiveId(id)
    setMessages(await getAiMessages(id))
    setShowHistory(false)
  }

  async function newChat() {
    if (!profile) return
    const now = new Date().toISOString()
    const conv: AiConversation = { id: uid('conv'), profileId: profile.id, title: 'New chat', createdAt: now, updatedAt: now }
    await saveAiConversation(conv)
    setActiveId(conv.id)
    setMessages([])
    setConversations(await getAiConversations(profile.id))
  }

  async function confirmDeleteConversation() {
    if (!deleteTarget || !profile) return
    await deleteAiConversation(deleteTarget.id)
    if (activeId === deleteTarget.id) {
      setActiveId(null)
      setMessages([])
    }
    setDeleteTarget(null)
    setConversations(await getAiConversations(profile.id))
    toast({ type: 'info', message: 'Conversation deleted.' })
  }

  async function send() {
    if (!profile) return
    const text = input.trim()
    if (!text || busy) return
    setInput('')

    let convId = activeId
    const now = new Date().toISOString()
    if (!convId) {
      const conv: AiConversation = {
        id: uid('conv'),
        profileId: profile.id,
        title: text.length > 42 ? text.slice(0, 42) + '…' : text,
        createdAt: now,
        updatedAt: now
      }
      await saveAiConversation(conv)
      convId = conv.id
      setActiveId(convId)
    }

    const userMsg: AiMessage = {
      id: uid('msg'),
      conversationId: convId,
      profileId: profile.id,
      role: 'user',
      content: text,
      createdAt: now
    }
    await saveAiMessage(userMsg)
    setMessages((prev) => [...prev, userMsg])
    setBusy(true)

    try {
      const { response, intent } = await processAiMessage(text, profile, convId)
      const asstMsg: AiMessage = {
        id: uid('msg'),
        conversationId: convId,
        profileId: profile.id,
        role: 'assistant',
        content: response.text,
        intent,
        responseType: response.type,
        createdAt: new Date().toISOString()
      }
      await saveAiMessage(asstMsg)
      setMessages((prev) => [...prev, asstMsg])
      await saveAiInteraction({
        id: uid('int'),
        profileId: profile.id,
        timestamp: new Date().toISOString(),
        question: text,
        intent: String(intent ?? ''),
        summary: response.text.slice(0, 200),
        conversationId: convId
      }).catch(() => {})
      setConversations(await getAiConversations(profile.id))
    } catch (err) {
      const errMsg: AiMessage = {
        id: uid('msg'),
        conversationId: convId,
        profileId: profile.id,
        role: 'assistant',
        content: err instanceof Error ? `Could not complete that request: ${err.message}` : 'Something went wrong while answering.',
        responseType: 'ERROR',
        createdAt: new Date().toISOString()
      }
      await saveAiMessage(errMsg).catch(() => {})
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="text-brand-500" aria-hidden /> Attendance AI
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ask anything about your attendance</p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => setShowHistory((v) => !v)}>
            <History size={15} aria-hidden /> History
          </Button>
          <Button size="sm" onClick={() => void newChat()}><Plus size={15} aria-hidden /> New</Button>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* Sidebar (desktop) */}
        <div className={cn(
          'fixed inset-y-0 left-60 top-0 z-40 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 transition-transform',
          showHistory ? 'translate-x-0' : '-translate-x-full',
          'hidden lg:block'
        )}>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => void selectConversation(id)}
            onDelete={setDeleteTarget}
            current={conversations.find((c) => c.id === activeId)}
          />
        </div>

        <Card className="flex-1 flex flex-col min-h-[60vh] lg:min-h-[66vh] overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin" style={{ maxHeight: 'calc(100vh - 320px)' }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center text-center py-10 px-4">
                <div className="size-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-500 mb-3">
                  <Sparkles size={22} aria-hidden />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ask about your attendance</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-[260px]">
                  Calculations are verified locally from your timetable and calendar — the assistant explains, it doesn't guess.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button key={q} onClick={() => { setInput(q); }} className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin" aria-hidden /> Computing from your data…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-slate-200/80 dark:border-slate-800 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                rows={1}
                placeholder="e.g. How many classes can I miss this week?"
                className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm max-h-32"
              />
              <Button size="md" disabled={busy || !input.trim()} onClick={() => void send()} aria-label="Send">
                <Send size={16} aria-hidden />
              </Button>
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
              <Lock size={10} aria-hidden /> Runs locally. Your attendance data never leaves this device.
            </p>
          </div>
        </Card>
      </div>

      {/* Mobile history sheet */}
      {showHistory && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => setShowHistory(false)} />
          <div className="absolute bottom-0 inset-x-0 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 p-4 pb-safe">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">History</h3>
              <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Close</button>
            </div>
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={(id) => void selectConversation(id)}
              onDelete={setDeleteTarget}
              current={conversations.find((c) => c.id === activeId)}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this conversation?"
        description={`"${deleteTarget?.title ?? 'Conversation'}" and its messages will be removed.`}
        onConfirm={() => void confirmDeleteConversation()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function ConversationList({ conversations, activeId, onSelect, onDelete, current }: {
  conversations: AiConversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (c: AiConversation) => void
  current?: AiConversation
}) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="space-y-1.5">
      {current && (
        <div className="mb-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 px-3 py-2">
          <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 truncate">{current.title}</p>
        </div>
      )}
      {conversations.length === 0 ? (
        <p className="text-xs text-slate-400 px-2 py-4 text-center">No conversations yet</p>
      ) : (
        conversations.map((c) => (
          <div key={c.id} className="group flex items-center gap-1">
            <button
              onClick={() => onSelect(c.id)}
              className={cn('flex-1 min-w-0 rounded-xl px-3 py-2 text-left transition-colors',
                activeId === c.id ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')}
            >
              <p className="text-xs font-medium truncate">{c.title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {c.updatedAt.slice(0, 10) === today ? 'Today' : c.updatedAt.slice(0, 10)}
              </p>
            </button>
            <button onClick={() => onDelete(c)} className="p-1.5 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500" aria-label="Delete conversation">
              <Trash2 size={13} />
            </button>
          </div>
        ))
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: AiMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
        isUser
          ? 'bg-brand-600 text-white rounded-br-md'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md'
      )}>
        {!isUser && message.responseType && message.responseType !== 'TEXT' && (
          <div className="mb-1.5">
            <Badge tone={message.responseType === 'WARNING' ? 'warning' : message.responseType === 'ERROR' ? 'danger' : 'info'}>{message.responseType}</Badge>
          </div>
        )}
        <RichText text={message.content} />
      </div>
    </div>
  )
}

function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
  let inList: number | null = null
  const blocks: { type: 'list' | 'text'; items?: string[]; text?: string; ordered?: boolean }[] = []

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { inList = null; continue }
    const olMatch = /^(\d+)[.)]\s+(.*)$/.exec(line)
    const ulMatch = /^[-•*]\s+(.*)$/.exec(line)
    if (olMatch) {
      if (inList === null || blocks[blocks.length - 1]?.type !== 'list') {
        blocks.push({ type: 'list', items: [olMatch[2]!], ordered: true })
      } else {
        blocks[blocks.length - 1]?.items?.push(olMatch[2]!)
      }
      inList = 0
    } else if (ulMatch) {
      if (inList === null || blocks[blocks.length - 1]?.type !== 'list') {
        blocks.push({ type: 'list', items: [ulMatch[1]!], ordered: false })
      } else {
        blocks[blocks.length - 1]?.items?.push(ulMatch[1]!)
      }
      inList = 0
    } else {
      inList = null
      blocks.push({ type: 'text', text: raw })
    }
  }

  return (
    <div className="space-y-1.5 whitespace-pre-wrap">
      {blocks.map((b, i) => {
        if (b.type === 'list') {
          const Tag = b.ordered ? 'ol' : 'ul'
          return (
            <Tag key={i} className={cn('pl-4 space-y-0.5', b.ordered && 'list-decimal', !b.ordered && 'list-disc')}>
              {b.items?.map((item, j) => <li key={j}><RichSpan text={item} /></li>)}
            </Tag>
          )
        }
        return <p key={i}><RichSpan text={b.text ?? ''} /></p>
      })}
    </div>
  )
}

function RichSpan({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
        }
        return <span key={i}>{p}</span>
      })}
    </>
  )
}