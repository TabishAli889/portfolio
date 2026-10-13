'use client'

import { GripVertical, Plus, Trash2 } from 'lucide-react'

/**
 * Editors for the two repeating field shapes in the registry.
 *
 * `stringList` (paragraphs, bullets, roles) is a one-per-line textarea - far
 * faster to edit than a row of inputs, and it round-trips cleanly to a string
 * array. `tags` is the same idea but also splits on commas. `keyValueList`
 * (the About "quick facts") needs two values per row, so it gets real inputs.
 */

export function StringListField({
  id,
  value,
  onChange,
  rows = 6,
  placeholder,
  disabled,
  describedBy,
  splitOnCommas = false,
  invalid,
}: {
  id?: string
  value: string[]
  onChange: (next: string[]) => void
  rows?: number
  placeholder?: string
  disabled?: boolean
  describedBy?: string
  splitOnCommas?: boolean
  invalid?: boolean
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      disabled={disabled}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      placeholder={placeholder}
      className={`field resize-y font-sans leading-relaxed ${invalid ? 'field-error' : ''}`}
      value={value.join('\n')}
      onChange={(event) => {
        const raw = event.target.value
        // No trimming or filtering here: doing it per keystroke would eat the
        // space you just typed and swallow blank lines mid-edit. The form
        // normalises the array once, on submit (see ResourceForm.cleanValues).
        onChange(splitOnCommas ? raw.split(/[\n,]/) : raw.split('\n'))
      }}
    />
  )
}

export function KeyValueListField({
  value,
  onChange,
  disabled,
  max = 8,
  labelPlaceholder = 'Label',
  valuePlaceholder = 'Value',
}: {
  value: { label: string; value: string }[]
  onChange: (next: { label: string; value: string }[]) => void
  disabled?: boolean
  max?: number
  labelPlaceholder?: string
  valuePlaceholder?: string
}) {
  function update(index: number, patch: Partial<{ label: string; value: string }>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <div className="space-y-2">
      {value.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <GripVertical className="size-4 shrink-0 text-fog-500" aria-hidden />
          <input
            type="text"
            value={row.label}
            disabled={disabled}
            placeholder={labelPlaceholder}
            aria-label={`${labelPlaceholder} ${index + 1}`}
            className="field !py-2 !text-sm sm:max-w-[40%]"
            onChange={(event) => update(index, { label: event.target.value })}
          />
          <input
            type="text"
            value={row.value}
            disabled={disabled}
            placeholder={valuePlaceholder}
            aria-label={`${valuePlaceholder} ${index + 1}`}
            className="field !py-2 !text-sm"
            onChange={(event) => update(index, { value: event.target.value })}
          />
          <button
            type="button"
            disabled={disabled}
            aria-label={`Remove row ${index + 1}`}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            className="shrink-0 rounded-lg border border-ink-600 p-2 text-fog-400 transition-colors hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-200"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      ))}

      {value.length < max && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...value, { label: '', value: '' }])}
          className="btn btn-ghost !px-3 !py-1.5 !text-xs"
        >
          <Plus className="size-3.5" aria-hidden />
          Add row
        </button>
      )}
    </div>
  )
}
