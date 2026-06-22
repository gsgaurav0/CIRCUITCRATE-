'use client'

import React, { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Save, Sparkles, Calendar } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import QRCode from 'qrcode'

const certificateSchema = z.object({
  candidate_name: z.string().min(2, 'Candidate name must be at least 2 characters.'),
  candidate_email: z.string().email('Please enter a valid email address.'),
  certificate_title: z.string().min(3, 'Certificate title must be at least 3 characters.'),
  issue_date: z.string().min(1, 'Issue date is required.'),
  expiry_date: z.string().optional().nullable(),
  verification_status: z.boolean(),
  certificate_type: z.enum(['course', 'position', 'project', 'internship']),
})

type CertificateFormData = z.infer<typeof certificateSchema>

export default function NewCertificatePage() {
  const [submitting, setSubmitting] = useState(false)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Refs for custom smooth calendar input selectors
  const issueDateInputRef = useRef<HTMLInputElement | null>(null)
  const expiryDateInputRef = useRef<HTMLInputElement | null>(null)

  // Manual zero-dependency date formatter
  const formatReadableDate = (dateStr: string) => {
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

  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      verification_status: true,
      expiry_date: '',
      certificate_type: 'course',
    }
  })

  const selectedType = watch('certificate_type')

  // Auto Generate unique Certificate ID
  const generateId = () => {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(100000 + Math.random() * 900000)
    return `CERT-${year}-${randomNum}`
  }

  // Generate QR code and return both public URL and base64 DataURL
  const generateQRCode = async (certificateId: string): Promise<{ publicUrl: string; dataUrl: string }> => {
    const verifyUrl = `${window.location.origin}/certificate/${certificateId}`

    const dataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    })

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const fileName = `${certificateId}.png`
    const { error } = await supabase.storage
      .from('qr-codes')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (error) {
      throw new Error(`Failed to upload QR code: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage.from('qr-codes').getPublicUrl(fileName)
    return { publicUrl, dataUrl }
  }

  // Draw and compile PDF on the client side using jsPDF
  const generatePDFBlob = async (certificateId: string, data: CertificateFormData, qrDataUrl: string): Promise<Blob> => {
    const { jsPDF } = await import('jspdf')
    
    // Create portrait A4 PDF (210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // 1. Draw elegant dark green double borders (similar to example)
    doc.setDrawColor(20, 83, 45) // Dark green
    doc.setLineWidth(1)
    doc.rect(5, 5, 200, 287) // Outer border
    doc.setLineWidth(0.5)
    doc.rect(7, 7, 196, 283) // Inner border

    // 2. Corners filigree/ticks
    doc.setLineWidth(1.5)
    // Top-left
    doc.line(10, 10, 25, 10)
    doc.line(10, 10, 10, 25)
    // Top-right
    doc.line(200, 10, 185, 10)
    doc.line(200, 10, 200, 25)
    // Bottom-left
    doc.line(10, 287, 25, 287)
    doc.line(10, 287, 10, 272)
    // Bottom-right
    doc.line(200, 287, 185, 287)
    doc.line(200, 287, 200, 272)

    // 3. Logo & Company Name
    doc.setTextColor(17, 24, 39) // Dark gray
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('CIRCUITCRATE', 105, 32, { align: 'center' })
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('EMPOWERING THE NEXT GENERATION OF MAKERS', 105, 38, { align: 'center' })

    // 4. Certificate Title
    doc.setTextColor(20, 83, 45)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    
    let titleHeader = ''
    let bodyText = ''
    let subtext = ''

    if (data.certificate_type === 'project') {
      titleHeader = 'CERTIFICATE OF COMPLETION'
      bodyText = `This is to officially certify that the candidate "${data.candidate_name}" has successfully completed and finalized the technical project requirements for:`
      subtext = `During the project build phase, the candidate demonstrated proficiency in hardware integration, coding, and system testing. Verified registry lookup confirms this credential remains valid and active.`
    } else if (data.certificate_type === 'internship') {
      titleHeader = 'CERTIFICATE OF INTERNSHIP'
      bodyText = `This is to officially certify that the candidate "${data.candidate_name}" has successfully completed their tenure and served as an Intern in the position of:`
      subtext = `During their internship tenure, the candidate demonstrated outstanding learning agility, technical capability, and commitment to CircuitCrate. Verified registry lookup confirms this positioning credential remains valid and active.`
    } else if (data.certificate_type === 'position') {
      titleHeader = 'CERTIFICATE OF RECOGNITION'
      bodyText = `This is to officially certify that the candidate "${data.candidate_name}" has successfully served and held the position of:`
      subtext = `During their tenure, the candidate demonstrated outstanding leadership, technical expertise, and dedication to the organizational goals. Verified registry lookup confirms this positioning credential remains valid and active.`
    } else {
      // Default: course
      titleHeader = 'CERTIFICATE OF ACHIEVEMENT'
      bodyText = `This is to officially certify that the candidate "${data.candidate_name}" has successfully met the evaluation standards and is awarded this certification for completing all curriculum requirements for:`
      subtext = `During their course of study, the candidate demonstrated technical competence, finalized practical hardware projects, and satisfied the requirements for graduation. Verified registry lookup confirms this credential remains valid and active.`
    }

    doc.text(titleHeader, 105, 62, { align: 'center' })

    // 5. Ref ID and Issue Date
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`Ref: ${certificateId}`, 20, 82)
    const hasExpiry = data.expiry_date && data.expiry_date.trim() !== ''
    if ((data.certificate_type === 'internship' || data.certificate_type === 'position') && hasExpiry) {
      doc.text(`Tenure: ${formatReadableDate(data.issue_date)} - ${formatReadableDate(data.expiry_date!)}`, 190, 82, { align: 'right' })
    } else if (data.certificate_type === 'internship' || data.certificate_type === 'position') {
      doc.text(`Start Date: ${formatReadableDate(data.issue_date)}`, 190, 82, { align: 'right' })
    } else if (data.certificate_type === 'project' && hasExpiry) {
      doc.text(`Worked On: ${formatReadableDate(data.issue_date)} - ${formatReadableDate(data.expiry_date!)}`, 190, 82, { align: 'right' })
    } else {
      doc.text(`Issue Date: ${formatReadableDate(data.issue_date)}`, 190, 82, { align: 'right' })
    }

    // 6. Certification Text
    doc.setTextColor(55, 65, 81)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    
    const splitBody = doc.splitTextToSize(bodyText, 170)
    doc.text(splitBody, 20, 102)

    // 7. Course/Position Title (Large, Bold Cyan)
    doc.setTextColor(6, 182, 212) // Cyan
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    const splitTitle = doc.splitTextToSize(data.certificate_title.toUpperCase(), 170)
    doc.text(splitTitle, 105, 136, { align: 'center' })

    // 8. Description details
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    const splitSub = doc.splitTextToSize(subtext, 170)
    doc.text(splitSub, 20, 162)

    // 9. Rosette Seal (similar to example)
    const sealX = 105
    const sealY = 210
    
    // Outer green ring
    doc.setDrawColor(20, 83, 45)
    doc.setFillColor(20, 83, 45)
    doc.circle(sealX, sealY, 15, 'F')
    
    // Gold ring
    doc.setDrawColor(234, 179, 8)
    doc.setFillColor(234, 179, 8)
    doc.circle(sealX, sealY, 12, 'F')
    
    // Inner green core
    doc.setDrawColor(20, 83, 45)
    doc.setFillColor(20, 83, 45)
    doc.circle(sealX, sealY, 10, 'F')

    // Ribbon tails
    doc.setLineWidth(2)
    doc.setDrawColor(20, 83, 45)
    doc.line(sealX - 4, sealY + 12, sealX - 8, sealY + 28)
    doc.line(sealX + 4, sealY + 12, sealX + 8, sealY + 28)

    // 10. Signatures
    // Left signature: David Lee Jhon
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(12)
    doc.setTextColor(17, 24, 39)
    doc.text('David Lee Jhon', 40, 238, { align: 'center' })
    doc.setLineWidth(0.5)
    doc.setDrawColor(156, 163, 175)
    doc.line(20, 240, 60, 240)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text('David Lee Jhon', 40, 246, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.text('Chief Executive Officer', 40, 251, { align: 'center' })

    // Right signature: Maria Susan
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(12)
    doc.setTextColor(17, 24, 39)
    doc.text('Maria Susan', 170, 238, { align: 'center' })
    doc.line(150, 240, 190, 240)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text('Maria Susan', 170, 246, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.text('Human Resource', 170, 251, { align: 'center' })

    // 11. Add QR Code
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 92, 238, 26, 26)
      doc.setFontSize(6)
      doc.setTextColor(156, 163, 175)
      doc.text('SCAN TO VERIFY', 105, 268, { align: 'center' })
    }

    return doc.output('blob')
  }

  // Upload compiled PDF to Supabase Storage
  const uploadPdfFile = async (pdfBlob: Blob, certificateId: string): Promise<string> => {
    setPdfUploading(true)
    try {
      const fileName = `${certificateId}.pdf`
      
      const { error } = await supabase.storage
        .from('certificates')
        .upload(fileName, pdfBlob, {
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
      const certificateId = generateId()
      
      // 1. Generate & Upload QR Code
      const { publicUrl: qrUrl, dataUrl: qrDataUrl } = await generateQRCode(certificateId)

      // 2. Auto-Generate PDF Blob using jsPDF
      const pdfBlob = await generatePDFBlob(certificateId, data, qrDataUrl)

      // 3. Upload PDF Blob to Supabase Storage
      const pdfUrl = await uploadPdfFile(pdfBlob, certificateId)

      // Get logged in admin ID for logs
      const { data: { user } } = await supabase.auth.getUser()

      // Insert record
      const { error: dbError } = await supabase
        .from('certificates')
        .insert({
          certificate_id: certificateId,
          candidate_name: data.candidate_name,
          candidate_email: data.candidate_email,
          certificate_title: data.certificate_title,
          issue_date: data.issue_date,
          expiry_date: data.expiry_date || null,
          verification_status: data.verification_status,
          certificate_pdf_url: pdfUrl,
          qr_code_url: qrUrl,
          certificate_type: data.certificate_type,
        })

      if (dbError) {
        throw new Error(dbError.message)
      }

      // Log the admin audit action
      if (user) {
        await supabase.from('admin_audit_logs').insert({
          admin_id: user.id,
          action: 'CREATE_CERTIFICATE',
          target_id: certificateId,
          details: { ...data, certificate_id: certificateId, source: 'auto_pdf_generation' }
        })
      }

      router.push('/admin/dashboard')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while generating the certificate.')
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
              Issue New Certificate
            </h1>
            <p className="text-gray-500 dark:text-neutral-400 text-sm">
              Complete candidate details below. The official PDF document and verification QR code will be **automatically generated**.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
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
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-colors text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
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
                  placeholder="candidate@email.com"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-colors text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-colors text-sm text-gray-900 dark:text-white cursor-pointer"
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

            {/* Auto Generation Features Info Box */}
            <div className="p-4 rounded-2xl bg-neutral-500/5 border border-neutral-500/25 flex gap-3 text-neutral-600 dark:text-neutral-400 text-xs">
              <Sparkles className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider block mb-0.5">Auto-Generation Features Active</span>
                By clicking &quot;Issue Certificate&quot;, the system will automatically:
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>Generate a unique secure Certificate ID.</li>
                  <li>Create a verification QR code and host it in Supabase Storage.</li>
                  <li>Compile a professional, print-ready PDF certificate (with green borders, signatures, and rosette seal) and upload it.</li>
                </ul>
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
                className="px-6 py-3 bg-white hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-white font-bold rounded-xl transition-all text-sm cursor-pointer"
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
                    Compiling PDF & QR...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Issue & Generate PDF
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-500 dark:text-neutral-600">
        &copy; {new Date().getFullYear()} CircuitCrate Private Limited. All rights reserved.
      </footer>
    </div>
  )
}
