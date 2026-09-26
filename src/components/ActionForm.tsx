'use client'

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import type { ActionResult } from '@/types'
import { primaryButton } from './ui'

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>

const PendingContext = createContext(false)

/**
 * A <form> bound to a Server Action that shows its error/success message.
 * Submits via startTransition instead of the `action` prop so React doesn't
 * clear the inputs when the action fails (only on success, if asked).
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  confirmMessage,
  onSuccess,
}: {
  action: Action
  children: React.ReactNode
  className?: string
  resetOnSuccess?: boolean
  confirmMessage?: string
  onSuccess?: () => void
}) {
  const [state, formAction, pending] = useActionState(action, null)
  const formRef = useRef<HTMLFormElement>(null)

  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onSuccessRef.current = onSuccess
  })
  useEffect(() => {
    if (!state?.ok) return
    if (resetOnSuccess) formRef.current?.reset()
    onSuccessRef.current?.()
  }, [state, resetOnSuccess])

  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={(e) => {
        e.preventDefault()
        if (pending) return
        if (confirmMessage && !window.confirm(confirmMessage)) return
        const submitter = (e.nativeEvent as SubmitEvent).submitter
        const formData = new FormData(e.currentTarget, submitter)
        startTransition(() => formAction(formData))
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
      <FormMessage state={state} />
    </form>
  )
}

export function FormMessage({ state }: { state: ActionResult }) {
  if (!state) return null
  if (!state.ok) {
    return (
      <p role="alert" className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">
        {state.error}
      </p>
    )
  }
  if (!state.message) return null
  return (
    <p role="status" className="mt-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2">
      {state.message}
    </p>
  )
}

export function SubmitButton({
  children,
  className = primaryButton,
  name,
  value,
  pendingText = 'Working…',
}: {
  children: React.ReactNode
  className?: string
  name?: string
  value?: string
  pendingText?: string
}) {
  const pending = useContext(PendingContext)
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={clsx(className)}>
      {pending ? pendingText : children}
    </button>
  )
}
