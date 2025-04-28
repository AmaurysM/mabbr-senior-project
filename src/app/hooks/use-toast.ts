"use client"

import { toast as sonnerToast } from 'sonner'
import * as React from "react"

type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

function toast({ title, description, action, ...props }: ToastProps) {
  return sonnerToast(title as string, {
    description,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    ...props
  })
}

function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  }
}

export { useToast, toast }