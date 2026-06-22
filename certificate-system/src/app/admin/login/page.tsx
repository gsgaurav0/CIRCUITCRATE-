'use client'

import React, { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Award, Lock, Mail, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setErrorMsg(authError.message || 'Invalid login credentials.')
        setLoading(false)
        return
      }

      if (user) {
        // Query the profile table to verify they are admin
        const { data: profile, error: dbError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (dbError || !profile || profile.role !== 'admin') {
          setErrorMsg('Access denied. Administrator privileges are required.')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        // Successfully logged in as admin, redirect to dashboard
        router.replace('/admin/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('Login exception:', err)
      setErrorMsg(
        err?.message || 
        (typeof err === 'object' ? JSON.stringify(err) : String(err)) || 
        'An unexpected error occurred.'
      )
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900 flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/verify" className="flex items-center gap-2.5">
          <img 
            src="/logo.png" 
            alt="CircuitCrate Logo" 
            className="h-8 w-auto object-contain dark:brightness-110"
            draggable={false}
          />
          <span className="font-extrabold text-sm tracking-wider text-gray-900 dark:text-white uppercase">
            ADMIN
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[450px] relative group">
          {/* Animated colorful backdrop glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-500 via-neutral-500 to-neutral-700 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          
          <div className="relative bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="mx-auto w-12 h-12 bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 rounded-full flex items-center justify-center mb-4">
                <Lock size={22} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Admin Console
              </h2>
              <p className="text-gray-500 dark:text-neutral-400 text-sm mt-1">
                Secure access for authorized administrators only.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex gap-2.5 items-start">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-colors text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-colors text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold rounded-xl transition-all shadow-sm border border-neutral-800 dark:border-neutral-200 cursor-pointer disabled:opacity-50 mt-2 text-sm flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-500 dark:text-neutral-600">
        &copy; {new Date().getFullYear()} CircuitCrate Private Limited. All rights reserved.
      </footer>
    </div>
  )
}
