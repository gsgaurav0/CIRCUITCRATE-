'use client'

import React, { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Search, ShieldCheck, ShieldAlert, Award, Calendar, Mail, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

interface Certificate {
  id: string
  certificate_id: string
  candidate_name: string
  candidate_email: string
  certificate_title: string
  issue_date: string
  expiry_date?: string | null
  verification_status: boolean
  certificate_pdf_url?: string | null
  certificate_type: 'course' | 'position' | 'project' | 'internship'
}

// Manual zero-dependency date formatter
const formatReadableDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const monthIndex = parseInt(month, 10) - 1
  if (monthIndex < 0 || monthIndex > 11) return dateStr
  return `${months[monthIndex]} ${parseInt(day, 10)}, ${year}`
}

export default function VerifyPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      // The public RLS policy only allows selecting verification_status = true
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .or(`certificate_id.eq.${query.trim()},candidate_email.ilike.${query.trim()}`)
        .order('issue_date', { ascending: false })

      if (error) {
        console.error('Search error:', error)
      } else {
        setResults(data || [])
        // If results are found, log verification attempts
        if (data && data.length > 0) {
          // Log verification attempts for each matching certificate
          for (const cert of data) {
            await supabase.from('verification_logs').insert({
              certificate_id: cert.certificate_id,
              ip_address: 'browser-verify',
              user_agent: window.navigator.userAgent,
              referrer: window.location.origin
            })
          }
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/verify" className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="CircuitCrate Logo" 
              className="h-8 w-auto object-contain dark:brightness-110"
              draggable={false}
            />
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 flex flex-col items-center">
        <div className="text-center max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-neutral-500/20">
            Secure Registry
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
            Verify Certificate Validity
          </h1>
          <p className="text-gray-600 dark:text-neutral-400 text-lg leading-relaxed">
            Enter a unique Certificate ID or Candidate Email Address to search the official registry of CircuitCrate Private Limited.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mb-12">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-500 to-neutral-500 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xl overflow-hidden">
              <div className="flex items-center pl-4 pr-2 text-gray-400">
                <Search size={22} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. CERT-2026-1024 or candidate@email.com"
                className="w-full py-5 px-3 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none text-base md:text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold px-8 py-5 transition-all text-base md:text-lg flex items-center gap-2 cursor-pointer shadow-sm border border-neutral-800 dark:border-neutral-200 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Search Results */}
        <div className="w-full max-w-2xl space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-neutral-500/20 border-t-neutral-800 dark:border-t-neutral-200 rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-neutral-400 font-medium">Querying database...</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="bg-red-500/5 border border-red-500/20 dark:border-red-500/10 rounded-2xl p-8 text-center shadow-md">
              <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert size={26} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-red-400 mb-2">Verification Failed</h3>
              <p className="text-gray-600 dark:text-neutral-400 max-w-md mx-auto">
                No matching certificate was found with <span className="font-semibold text-red-500">&quot;{query}&quot;</span>. Ensure details are correct or contact issuing administrator.
              </p>
            </div>
          )}

          {!loading && results.map((cert) => (
            <div
              key={cert.id}
              className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              {/* Badge Top Right */}
              <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/20">
                <ShieldCheck size={14} />
                Verified ✅
              </div>

              {/* Company Info */}
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 tracking-widest uppercase mb-4">
                CircuitCrate Private Limited
              </div>

              {/* Title & Name */}
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-tight">
                {cert.certificate_title}
              </h3>
              <p className="text-lg font-semibold text-gray-700 dark:text-neutral-300 mb-6 flex items-center gap-2">
                Candidate: {cert.candidate_name}
              </p>

              {/* Detail fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-gray-100 dark:border-neutral-800/50 py-4 mb-6 text-sm text-gray-600 dark:text-neutral-400">
                <div className="flex items-center gap-2.5">
                  <Award size={18} className="text-neutral-500" />
                  <span>ID: <span className="font-mono font-bold text-gray-900 dark:text-white">{cert.certificate_id}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail size={18} className="text-neutral-500" />
                  <span>Email: <span className="font-semibold">{cert.candidate_email}</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar size={18} className="text-neutral-500" />
                  <span>
                    {cert.certificate_type === 'internship' || cert.certificate_type === 'position' ? 'Start Journey' : 'Issue Date'}:{' '}
                    <span className="font-semibold">{formatReadableDate(cert.issue_date)}</span>
                  </span>
                </div>
                {(cert.expiry_date || cert.certificate_type === 'internship' || cert.certificate_type === 'position') && (
                  <div className="flex items-center gap-2.5">
                    <Calendar size={18} className="text-neutral-500" />
                    <span>
                      {cert.certificate_type === 'internship' || cert.certificate_type === 'position' ? 'Worked With Us Till' :
                       cert.certificate_type === 'project' ? 'Worked On This Till' : 'Expiry Date'}:{' '}
                      <span className={`font-semibold ${cert.certificate_type === 'internship' || cert.certificate_type === 'position' ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                        {cert.expiry_date ? formatReadableDate(cert.expiry_date) : 'Present'}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/certificate/${cert.certificate_id}`}
                  className="flex-1 text-center bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-900 dark:text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-gray-200 dark:border-neutral-700 cursor-pointer"
                >
                  <ExternalLink size={16} />
                  View Details Page
                </Link>
                {cert.certificate_pdf_url && (
                  <a
                    href={cert.certificate_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm border border-neutral-800 dark:border-neutral-200"
                  >
                    <FileText size={16} />
                    Download PDF Certificate
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 py-8 text-center text-sm text-gray-500 dark:text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>
            &copy; {new Date().getFullYear()} CircuitCrate Private Limited. All rights reserved.
          </span>
          <Link 
            href="/admin" 
            className="text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Admin Console
          </Link>
        </div>
      </footer>
    </div>
  )
}
