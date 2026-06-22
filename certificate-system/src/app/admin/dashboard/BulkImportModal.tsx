'use client'

import React, { useState } from 'react'
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react'

interface BulkImportModalProps {
  onClose: () => void
}

export default function BulkImportModal({ onClose }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [summary, setSummary] = useState<{ success: number; errors: string[] } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (selected.name.endsWith('.csv')) {
        setFile(selected)
        setErrorMsg(null)
      } else {
        setErrorMsg('Please select a valid CSV file.')
        setFile(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setErrorMsg(null)
    setSummary(null)

    try {
      const text = await file.text()
      
      // Send parsed CSV lines to bulk-import API endpoint
      const response = await fetch('/api/certificates/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvText: text }),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrorMsg(result.message || 'Bulk import failed.')
      } else {
        setSummary({
          success: result.importedCount,
          errors: result.errors || [],
        })
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during file upload.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 dark:border-neutral-800/50 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-neutral-800 dark:text-neutral-200 h-5 w-5" />
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Bulk Import Certificates</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {!summary ? (
            <>
              {/* CSV Template Guide */}
              <div className="p-4 rounded-xl bg-neutral-500/10 border border-neutral-500/20 text-neutral-600 dark:text-neutral-400 text-xs space-y-1.5">
                <div className="flex items-center gap-1 font-bold uppercase tracking-wider">
                  <HelpCircle size={14} /> CSV Formatting Template
                </div>
                <p>Ensure your CSV headers match the following format exactly (case-sensitive):</p>
                <code className="block bg-white dark:bg-neutral-950 p-2 rounded-lg font-mono font-semibold border border-neutral-500/10 overflow-x-auto select-all">
                  candidate_name,candidate_email,certificate_title,issue_date,expiry_date
                </code>
                <p className="text-gray-400 mt-1">Example: John Doe,john@doe.com,Advanced Robotics,2026-06-21,2028-06-21</p>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex gap-2 items-start">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-gray-300 dark:border-neutral-700 hover:border-neutral-800 dark:hover:border-neutral-200 rounded-2xl p-8 text-center transition-colors relative group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-4 bg-gray-50 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 rounded-full group-hover:text-black dark:group-hover:text-white transition-colors">
                    <Upload size={28} />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-neutral-200">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-neutral-300">Click to upload or drag CSV file</p>
                      <p className="text-xs text-gray-400 mt-1">CSV file up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Import Success Summary */
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Import Completed</h4>
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  Successfully generated and issued <span className="font-bold text-emerald-500">{summary.success}</span> certificates.
                </p>
              </div>

              {summary.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Errors/Skipped Rows ({summary.errors.length}):</p>
                  <div className="max-h-40 overflow-y-auto bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-xs text-red-600 space-y-1 font-mono">
                    {summary.errors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-gray-50 dark:bg-neutral-900/50 border-t border-gray-100 dark:border-neutral-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-white font-bold rounded-xl transition-all text-sm cursor-pointer"
            disabled={uploading}
          >
            {summary ? 'Close' : 'Cancel'}
          </button>
          {!summary && file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold px-6 py-2.5 rounded-xl transition-all text-sm flex items-center gap-2 cursor-pointer shadow-sm border border-neutral-800 dark:border-neutral-200 disabled:opacity-50"
            >
              {uploading ? 'Processing QR Codes...' : 'Import & Issue'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
