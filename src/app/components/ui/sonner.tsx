"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster"
      toastOptions={{
        classNames: {
          toast:
            "bg-background/95 backdrop-blur-sm text-foreground rounded-2xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.2)] border border-border/20 px-4 py-3 hover:shadow-[0_12px_24px_-12px_rgba(0,0,0,0.2)] transition-all duration-200",
          description: 
            "text-muted-foreground text-sm mt-1",
          actionButton:
            "bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity",
          cancelButton:
            "bg-muted text-muted-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity",
          title: 
            "text-foreground font-semibold text-sm",
          loader: 
            "text-primary",
          closeButton: 
            "rounded-lg opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring",
          success: 
            "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 rounded-full p-1",
          error: 
            "bg-destructive/15 text-destructive dark:text-destructive-foreground rounded-full p-1",
          info: 
            "bg-blue-500/15 text-blue-500 dark:text-blue-400 rounded-full p-1",
          warning: 
            "bg-amber-500/15 text-amber-500 dark:text-amber-400 rounded-full p-1"
        },
      }}
      {...props}
    />
  )
}

export { Toaster }