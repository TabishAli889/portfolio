import { requireAdminPage } from '@/lib/auth-guard'
import { listMessages } from '@/lib/admin-data'
import { InboxList } from '@/components/admin/InboxList'

export const metadata = { title: 'Inbox' }

export default async function InboxPage() {
  await requireAdminPage()
  const messages = await listMessages()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl">Inbox</h1>
        <p className="mt-1.5 text-sm text-fog-400">
          Messages are written to the database before the notification email is attempted, so
          nothing is lost if Gmail is unavailable.
        </p>
      </header>

      <InboxList messages={messages} />
    </div>
  )
}
