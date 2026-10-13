'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  Mail,
  MailOpen,
  Reply,
  Trash2,
} from 'lucide-react'
import { deleteMessage, setMessageRead } from '@/lib/actions'
import type { AdminMessage } from '@/lib/content-types'
import { ConfirmButton } from './ConfirmButton'

/**
 * Contact-form inbox.
 *
 * Message bodies are rendered as plain text inside a `whitespace-pre-wrap`
 * block - never as HTML. This is visitor-supplied content, so it gets no
 * markup privileges at all.
 */
export function InboxList({ messages }: { messages: AdminMessage[] }) {
  const router = useRouter()
  const [openId, setOpenId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const visible = filter === 'unread' ? messages.filter((message) => !message.read) : messages

  function toggleRead(message: AdminMessage) {
    startTransition(async () => {
      const result = await setMessageRead(message.id, !message.read)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      router.refresh()
    })
  }

  function open(message: AdminMessage) {
    const next = openId === message.id ? null : message.id
    setOpenId(next)

    // Opening an unread message marks it read, like any mail client.
    if (next && !message.read) {
      startTransition(async () => {
        await setMessageRead(message.id, true)
        router.refresh()
      })
    }
  }

  function remove(message: AdminMessage) {
    startTransition(async () => {
      const result = await deleteMessage(message.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Message deleted.')
      router.refresh()
    })
  }

  if (messages.length === 0) {
    return (
      <div className="glass p-10 text-center">
        <Mail className="mx-auto size-7 text-fog-500" aria-hidden />
        <p className="mt-3 text-sm text-fog-400">No messages yet.</p>
        <p className="mt-1 text-xs text-fog-500">
          Submissions from the contact form appear here immediately, before the email is sent.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="group" aria-label="Filter messages">
        {(['all', 'unread'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={`chip chip-interactive capitalize ${
              filter === option ? '!border-neon-cyan/60 !text-neon-cyan' : ''
            }`}
          >
            {option}
            {option === 'unread' && (
              <span className="ml-1 text-fog-500">
                ({messages.filter((message) => !message.read).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="glass p-8 text-center text-sm text-fog-400">
          Nothing unread. Everything is caught up.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((message) => {
            const isOpen = openId === message.id
            return (
              <li
                key={message.id}
                className={`glass overflow-hidden ${message.read ? '' : 'border-neon-cyan/35'}`}
              >
                <div className="flex items-start gap-3 p-4">
                  <span
                    className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg border ${
                      message.read
                        ? 'border-ink-600 bg-ink-800/70 text-fog-500'
                        : 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
                    }`}
                  >
                    {message.read ? (
                      <MailOpen className="size-4" aria-hidden />
                    ) : (
                      <Mail className="size-4" aria-hidden />
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={() => open(message)}
                    aria-expanded={isOpen}
                    className="min-w-0 flex-1 cursor-pointer text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`truncate text-sm ${
                          message.read ? 'text-fog-200' : 'font-medium text-fog-50'
                        }`}
                      >
                        {message.name}
                      </span>
                      <span className="truncate text-xs text-fog-500">{message.email}</span>
                      {!message.emailSent && (
                        <span
                          title={message.emailError || 'The notification email did not send.'}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[0.65rem] text-amber-300"
                        >
                          <AlertTriangle className="size-3" aria-hidden />
                          Email not sent
                        </span>
                      )}
                    </div>

                    {!isOpen && (
                      <p className="mt-1 truncate text-xs text-fog-500">{message.message}</p>
                    )}

                    <p className="mt-1 flex items-center gap-1 text-[0.7rem] text-fog-500">
                      <Clock className="size-3" aria-hidden />
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => toggleRead(message)}
                      title={message.read ? 'Mark as unread' : 'Mark as read'}
                      aria-label={message.read ? 'Mark as unread' : 'Mark as read'}
                      className="rounded-lg border border-ink-600 p-2 text-fog-400 transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan disabled:opacity-50"
                    >
                      {message.read ? (
                        <Mail className="size-3.5" aria-hidden />
                      ) : (
                        <MailOpen className="size-3.5" aria-hidden />
                      )}
                    </button>

                    <ConfirmButton
                      onConfirm={() => remove(message)}
                      disabled={isPending}
                      label=""
                      confirmLabel="Sure?"
                      className="rounded-lg border border-ink-600 px-2 py-2 text-xs text-fog-400 transition-colors hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
                      icon={<Trash2 className="size-3.5" aria-hidden />}
                    />

                    <ChevronDown
                      className={`size-4 text-fog-500 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-ink-700 bg-ink-900/50 p-4">
                    {/* Plain text only - this is untrusted visitor input. */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-fog-200">
                      {message.message}
                    </p>

                    {message.emailError && (
                      <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-200/90">
                        Email delivery error: {message.emailError}
                      </p>
                    )}

                    <a
                      href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(
                        `Re: your message`,
                      )}`}
                      className="btn btn-ghost mt-4 !py-2 !text-xs"
                    >
                      <Reply className="size-3.5" aria-hidden />
                      Reply by email
                    </a>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
