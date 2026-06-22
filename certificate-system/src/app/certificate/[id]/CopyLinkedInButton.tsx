'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyLinkedInButtonProps {
  label: string
  value: string
}

export default function CopyLinkedInButton({ label, value }: CopyLinkedInButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="space-y-1">
      <span className="text-xs font-bold text-gray-500 dark:text-neutral-500 block uppercase tracking-wider">
        {label}
      </span>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={value}
          className="flex-1 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-lg py-2 px-3 text-gray-800 dark:text-neutral-200 focus:outline-none overflow-ellipsis font-medium"
        />
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 cursor-pointer text-gray-600 dark:text-neutral-400 transition-colors flex items-center justify-center min-w-[40px]"
          title={`Copy ${label}`}
        >
          {copied ? (
            <Check size={16} className="text-emerald-500" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
    </div>
  )
}
