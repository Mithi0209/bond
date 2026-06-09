import React from 'react'
import clsx from 'clsx'

export function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-emerald-100 bg-white p-4 shadow-soft',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
      : variant === 'danger'
        ? 'bg-rose-600 text-white hover:bg-rose-700'
        : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
  return <button className={clsx(base, styles, className)} {...props} />
}

export function TextInput({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-emerald-900/80">
        {label}
      </div>
      <input
        {...props}
        className={clsx(
          'w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm outline-none',
          'focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100',
        )}
      />
    </label>
  )
}

export function NumberInput({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <TextInput
      label={label}
      inputMode="numeric"
      type="number"
      step="1"
      min="0"
      {...props}
    />
  )
}

export function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-emerald-900/80">
        {label}
      </div>
      <textarea
        {...props}
        className={clsx(
          'w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm outline-none',
          'focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100',
        )}
        rows={3}
      />
    </label>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 md:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-3">
          <div className="text-sm font-semibold text-emerald-900">{title}</div>
          <button
            className="rounded-lg px-2 py-1 text-sm text-emerald-900/70 hover:bg-emerald-50"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

