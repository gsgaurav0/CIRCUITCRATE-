'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Award, ArrowLeft, Loader2, Save, FileText, CheckCircle, Calendar } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

const certificateSchema = z.object({
  candidate_name: z.string().min(2, 'Candidate name must be at least 2 characters.'),
  candidate_email: z.string().email('Please enter a valid email address.'),
  certificate_title: z.string().min(3, 'Certificate title must be at least 3 characters.'),
  issue_date: z.string().min(1, 'Issue date is required.'),
  expiry_date: z.string().optional().nullable(),
  verification_status: z.boolean(),
  certificate_type: z.enum(['course', 'position', 'project', 'internship']).optional(),
})

type CertificateFormData = z.infer<typeof certificateSchema>

export default function EditCertificatePage() {
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Refs for custom smooth calendar input selectors
  const issueDateInputRef = useRef<HTMLInputElement | null>(null)
  const expiryDateInputRef = useRef<HTMLInputElement | null>(null)

  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema)
  })

  const selectedType = watch('certificate_type')

  // Fetch certificate details on mount
  useEffect(() => {
    const fetchCert = async () => {
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          setErrorMsg(`Error loading certificate: ${error.message}`)
        } else if (data) {
          reset({
            candidate_name: data.candidate_name,
            candidate_email: data.candidate_email,
            certificate_title: data.certificate_title,
            issue_date: data.issue_date,
            expiry_date: data.expiry_date || '',
            verification_status: data.verification_status,
            certificate_type: data.certificate_type || 'course',
          })
          setExistingPdfUrl(data.certificate_pdf_url)
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error occurred while loading data.')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchCert()
  }, [id, reset])

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0])
    }
  }

  const uploadPdfFile = async (): Promise<string | null> => {
    if (!pdfFile) return null
    setPdfUploading(true)

    try {
      const fileExt = pdfFile.name.split('.').pop()
      const fileName = `pdf_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error } = await supabase.storage
        .from('certificates')
        .upload(fileName, pdfFile, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (error) {
        throw new Error(`PDF upload failed: ${error.message}`)
      }

      const { data: { publicUrl } } = supabase.storage.from('certificates').getPublicUrl(fileName)
      return publicUrl
    } finally {
      setPdfUploading(false)
    }
  }

  const onSubmit = async (data: CertificateFormData) => {
    setSubmitting(true)
    setErrorMsg(null)

    try {
      // Upload PDF if exists, otherwise reuse existing
      let pdfUrl = existingPdfUrl
      if (pdfFile) {
        pdfUrl = await uploadPdfFile()
      }

      // Get logged in admin ID for logs
      const { data: { user } } = await supabase.auth.getUser()

      // Update record
      const { error: dbError } = await supabase
        .from('certificates')
        .update({
          candidate_name: data.candidate_name,
          candidate_email: data.candidate_email,
          certificate_title: data.certificate_title,
          issue_date: data.issue_date,
          expiry_date: data.expiry_date || null,
          verification_status: data.verification_status,
          certificate_pdf_url: pdfUrl,
          certificate_type: data.certificate_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (dbError) {
        throw new Error(dbError.message)
      }

      // Log the admin audit action
      if (user) {
        await supabase.from('admin_audit_logs').insert({
          admin_id: user.id,
          action: 'UPDATE_CERTIFICATE',
          target_id: id,
          details: { ...data, id }
        })
      }

      router.push('/admin/dashboard')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving the certificate.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="CircuitCrate Logo" 
              className="h-8 w-auto object-contain dark:brightness-110"
              draggable={false}
            />
            <span className="font-extrabold text-sm tracking-wider text-gray-900 dark:text-white uppercase">
              ADMIN
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="text-sm font-bold text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              Edit Certificate
            </h1>
            <p className="text-gray-500 dark:text-neutral-400 text-sm">
              Modify certificate metadata, update PDF copy, or change verification status.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 size={36} className="animate-spin text-neutral-800 dark:text-neutral-200" />
              <p className="text-sm text-gray-500">Loading certificate data...</p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex gap-2">
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Candidate Details Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block">
                      Candidate Full Name
                    </label>
                    <input
                      type="text"
                      {...register('candidate_name')}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-colors text-sm"
                    />
                    {errors.candidate_name && (
                      <p className="text-xs font-bold text-red-500">{errors.candidate_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block">
                      Candidate Email Address
                    </label>
                    <input
                      type="email"
                      {...register('candidate_email')}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-colors text-sm"
                    />
                    {errors.candidate_email && (
                      <p className="text-xs font-bold text-red-500">{errors.candidate_email.message}</p>
                    )}
                  </div>
                </div>

                {/* Type & Title Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block">
                      Certificate Type
                    </label>
                    <select
                      {...register('certificate_type')}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-colors text-sm cursor-pointer"
                    >
                      <option value="course">Course Completion</option>
                      <option value="project">Project Completion</option>
                      <option value="internship">Internship Certificate</option>
                      <option value="position">Position / Designation</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block">
                      {selectedType === 'course' && 'Course Name'}
                      {selectedType === 'project' && 'Project Name'}
                      {selectedType === 'internship' && 'Internship Position'}
                      {selectedType === 'position' && 'Position / Designation'}
                    </label>
                    <input
                      type="text"
                      {...register('certificate_title')}
                      placeholder={
                        selectedType === 'course' ? "e.g. Master Class in Embedded IoT Systems" :
                        selectedType === 'project' ? "e.g. Smart Weather Station with IoT" :
                        selectedType === 'internship' ? "e.g. Embedded Firmware Engineer Intern" :
                        "e.g. Senior Technical Instructor"
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-colors text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                    {errors.certificate_title && (
                      <p className="text-xs font-bold text-red-500">{errors.certificate_title.message}</p>
                    )}
                  </div>
                </div>

                {/* Dates/Duration Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block">
                      {selectedType === 'internship' || selectedType === 'position' ? 'Start Work / Start Journey' : 'Issue Date'}
                    </label>
                    <div 
                      onClick={() => issueDateInputRef.current?.showPicker()} 
                      className="relative flex items-center bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl px-4 py-3 cursor-pointer focus-within:ring-2 focus-within:ring-neutral-500/20 focus-within:border-neutral-500 transition-colors"
                    >
                      <input
                        type="date"
                        className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-sm text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                        {...register('issue_date')}
                        ref={(e) => {
                          register('issue_date').ref(e)
                          issueDateInputRef.current = e
                        }}
                      />
                      <Calendar className="absolute right-4 text-gray-400 dark:text-neutral-500 pointer-events-none" size={18} />
                    </div>
                    {errors.issue_date && (
                      <p className="text-xs font-bold text-red-500">{errors.issue_date.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block">
                      {selectedType === 'internship' || selectedType === 'position' ? 'Worked With Us Till (Optional)' :
                       selectedType === 'project' ? 'Worked On This Till (Optional)' : 'Expiry Date (Optional)'}
                    </label>
                    <div 
                      onClick={() => expiryDateInputRef.current?.showPicker()} 
                      className="relative flex items-center bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl px-4 py-3 cursor-pointer focus-within:ring-2 focus-within:ring-neutral-500/20 focus-within:border-neutral-500 transition-colors"
                    >
                      <input
                        type="date"
                        className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-sm text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                        {...register('expiry_date')}
                        ref={(e) => {
                          register('expiry_date').ref(e)
                          expiryDateInputRef.current = e
                        }}
                      />
                      <Calendar className="absolute right-4 text-gray-400 dark:text-neutral-500 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                {/* File Upload PDF */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 dark:text-neutral-500 uppercase tracking-widest block">
                    Certificate PDF Document
                  </label>
                  <div className="flex flex-col bg-gray-50 dark:bg-neutral-800 p-4 border border-gray-200 dark:border-neutral-700/80 rounded-xl space-y-3">
                    {existingPdfUrl && (
                      <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 font-bold bg-neutral-500/5 p-2 rounded-lg border border-neutral-500/10 self-start">
                        <FileText size={14} />
                        <a href={existingPdfUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          View Current PDF File
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfChange}
                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-500/10 file:text-neutral-600 dark:file:text-neutral-400 hover:file:bg-neutral-500/20 file:cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-400 dark:text-neutral-500">Select new file to overwrite current PDF.</p>
                    </div>
                  </div>
                </div>

                {/* Status Checkbox */}
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="verification_status"
                    {...register('verification_status')}
                    className="w-4 h-4 rounded border-gray-300 bg-gray-50 text-neutral-800 dark:text-neutral-200 focus:ring-neutral-500"
                  />
                  <label htmlFor="verification_status" className="text-sm font-semibold text-gray-700 dark:text-neutral-300 select-none cursor-pointer">
                    Set Certificate Status to Active/Verified ✅
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800/50">
                  <Link
                    href="/admin/dashboard"
                    className="px-6 py-3 bg-white hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-white font-bold rounded-xl transition-all text-sm"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting || pdfUploading}
                    className="bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold px-6 py-3 rounded-xl transition-all text-sm flex items-center gap-2 cursor-pointer shadow-sm border border-neutral-800 dark:border-neutral-200 disabled:opacity-50"
                  >
                    {submitting || pdfUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>

              </form>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-500 dark:text-neutral-600">
        &copy; {new Date().getFullYear()} CircuitCrate Private Limited. All rights reserved.
      </footer>
    </div>
  )
}
