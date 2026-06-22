'use client'

import React from 'react'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-900 dark:text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-gray-200 dark:border-neutral-700"
    >
      <Printer size={18} />
      Print / Save as PDF
    </button>
  )
}
