import React from 'react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { verifyCertificate } from '@/lib/services/certificateService'
import { ShieldCheck, ShieldAlert, Award, Calendar, Mail, FileText, Printer, ArrowLeft, Linkedin, Copy } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import CopyLinkedInButton from './CopyLinkedInButton'
import PrintButton from './PrintButton'

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

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CertificateDetailPage({ params }: PageProps) {
  const { id } = await params

  // Fetch client details for logging
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  const userAgent = headersList.get('user-agent') || 'unknown'
  const referrer = headersList.get('referer') || 'direct'

  // Fetch and log verification
  const cert = await verifyCertificate(id, { ipAddress, userAgent, referrer })

  // Extract date details for LinkedIn Integration
  let issueYear = ''
  let issueMonth = ''
  let expiryYear = ''
  let expiryMonth = ''

  if (cert) {
    const parsedDate = Date.parse(cert.issue_date)
    if (!isNaN(parsedDate)) {
      const issueDate = new Date(parsedDate)
      issueYear = issueDate.getFullYear().toString()
      issueMonth = (issueDate.getMonth() + 1).toString()
    } else {
      const today = new Date()
      issueYear = today.getFullYear().toString()
      issueMonth = (today.getMonth() + 1).toString()
    }

    if (cert.expiry_date) {
      const expiryDate = new Date(cert.expiry_date)
      expiryYear = expiryDate.getFullYear().toString()
      expiryMonth = (expiryDate.getMonth() + 1).toString()
    }
  }

  // Generate LinkedIn Certification Add URL
  // https://www.linkedin.com/certifications/add
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://circuitcrate.tech'
  const certUrl = `${siteUrl}/certificate/${id}`
  const linkedinUrl = cert
    ? `https://www.linkedin.com/certifications/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
        cert.certificate_title
      )}&organizationName=CircuitCrate&certId=${encodeURIComponent(
        cert.certificate_id
      )}&certUrl=${encodeURIComponent(certUrl)}&issueYear=${issueYear}&issueMonth=${issueMonth}${
        expiryYear ? `&expirationYear=${expiryYear}&expirationMonth=${expiryMonth}` : ''
      }`
    : '#'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900 flex flex-col print:bg-white print:text-black">
      {/* Navbar - hidden on print */}
      <header className="border-b border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md sticky top-0 z-50 print:hidden">
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
            <Link
              href="/verify"
              className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={16} /> Back to Search
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 print:py-0">
        {!cert ? (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-12 text-center shadow-xl">
            <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert size={36} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Invalid Certificate</h1>
            <p className="text-gray-600 dark:text-neutral-400 max-w-md mx-auto mb-8">
              The certificate ID <span className="font-bold text-red-500">"{id}"</span> is not recognized by our registry or has been revoked.
            </p>
            <Link
              href="/verify"
              className="bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold py-3 px-6 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm border border-neutral-800 dark:border-neutral-200"
            >
              Back to Search Portal
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Certificate Presentation Card */}
            <div className="bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800/80 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden print:border-0 print:shadow-none print:p-0">
              
              {/* Decorative Corner Borders */}
              <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-neutral-950 dark:border-neutral-50 rounded-tl-3xl opacity-20 print:hidden"></div>
              <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-neutral-950 dark:border-neutral-50 rounded-tr-3xl opacity-20 print:hidden"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-neutral-950 dark:border-neutral-50 rounded-bl-3xl opacity-20 print:hidden"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-neutral-950 dark:border-neutral-50 rounded-br-3xl opacity-20 print:hidden"></div>

              {/* Verified Badge */}
              <div className="flex justify-between items-start mb-8 print:mb-6">
                <div>
                  <div className="text-xs font-black text-neutral-500 dark:text-neutral-400 tracking-widest uppercase mb-1">
                    Official Verification Page
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-400 dark:text-neutral-500">
                    CircuitCrate Private Limited
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-black uppercase tracking-wider border border-emerald-500/20 shadow-sm">
                  <ShieldCheck size={16} />
                  Verified ✅
                </div>
              </div>

              {/* Certificate Core Display */}
              <div className="text-center py-8 border-t border-b border-gray-100 dark:border-neutral-800/50 my-6">
                <p className="text-gray-500 dark:text-neutral-400 font-medium uppercase tracking-widest text-sm mb-4">
                  This certifies that
                </p>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-6">
                  {cert.candidate_name}
                </h1>
                <p className="text-gray-500 dark:text-neutral-400 font-medium uppercase tracking-widest text-sm mb-4 px-4">
                  {cert.certificate_type === 'project' && 'has successfully completed and finalized the technical project requirements for'}
                  {cert.certificate_type === 'internship' && 'has successfully completed their internship tenure and served as an Intern in the position of'}
                  {cert.certificate_type === 'position' && 'has successfully served and held the position of'}
                  {(!cert.certificate_type || cert.certificate_type === 'course') && 'has successfully completed the requirements for'}
                </p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-800 dark:text-neutral-200 max-w-2xl mx-auto leading-snug">
                  {cert.certificate_title}
                </h2>
              </div>

              {/* Metadata details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm md:text-base mb-8 text-gray-600 dark:text-neutral-400">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Award size={20} className="text-neutral-500" />
                    <span>
                      Certificate ID:{' '}
                      <span className="font-mono font-black text-gray-900 dark:text-white">
                        {cert.certificate_id}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-neutral-500" />
                    <span>
                      Candidate Email:{' '}
                      <span className="font-semibold text-gray-800 dark:text-neutral-200">
                        {cert.candidate_email}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-neutral-500" />
                    <span>
                      {cert.certificate_type === 'internship' || cert.certificate_type === 'position' ? 'Start Journey' : 'Issue Date'}:{' '}
                      <span className="font-semibold text-gray-800 dark:text-neutral-200">
                        {formatReadableDate(cert.issue_date)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-neutral-500" />
                    <span>
                      {cert.certificate_type === 'internship' || cert.certificate_type === 'position' ? 'Worked With Us Till' :
                       cert.certificate_type === 'project' ? 'Worked On This Till' : 'Expiry Date'}:{' '}
                      <span className="font-semibold text-gray-800 dark:text-neutral-200">
                        {cert.expiry_date ? formatReadableDate(cert.expiry_date) : (cert.certificate_type === 'internship' || cert.certificate_type === 'position' ? 'Present' : 'No Expiration')}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom section: QR Code & Signature preview */}
              <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-gray-100 dark:border-neutral-800/50">
                <div className="flex items-center gap-4 mb-6 md:mb-0">
                  {cert.qr_code_url && (
                    <img
                      src={cert.qr_code_url}
                      alt="Verification QR Code"
                      className="w-24 h-24 p-1.5 bg-white border border-gray-200 rounded-xl"
                    />
                  )}
                  <div className="text-xs text-gray-400 dark:text-neutral-500 max-w-xs">
                    Scan the QR code to verify this certificate directly on our official site:
                    <br />
                    <span className="font-semibold text-neutral-600 dark:text-neutral-400">{certUrl}</span>
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <div className="font-signature text-3xl font-normal text-neutral-800 dark:text-neutral-200 mb-1">
                    CircuitCrate
                  </div>
                  <div className="w-40 h-0.5 bg-gray-300 dark:bg-neutral-800 mx-auto md:ml-auto mb-2"></div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                    Authorized Registrar
                  </p>
                </div>
              </div>

              {/* Certificate PDF download & Print actions */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 print:hidden">
                <PrintButton />
                {cert.certificate_pdf_url && (
                  <a
                    href={cert.certificate_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-black dark:bg-white hover:bg-neutral-900 dark:hover:bg-neutral-100 text-white dark:text-black font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-neutral-800 dark:border-neutral-200"
                  >
                    <FileText size={18} />
                    Download Original PDF
                  </a>
                )}
              </div>
            </div>

            {/* LinkedIn Integration Panel - hidden on print */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800/80 rounded-3xl p-6 md:p-8 shadow-lg print:hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 rounded-xl">
                  <Linkedin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add to LinkedIn Profile</h3>
                  <p className="text-sm text-gray-500 dark:text-neutral-400">
                    Add this certification to your LinkedIn Licenses & Certifications directory.
                  </p>
                </div>
              </div>

              {/* Form fields to copy-paste */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                <CopyLinkedInButton label="Certification Name" value={cert.certificate_title} />
                <CopyLinkedInButton label="Issuing Organization" value="CircuitCrate" />
                <CopyLinkedInButton label="Credential ID" value={cert.certificate_id} />
                <CopyLinkedInButton label="Credential URL" value={certUrl} />
              </div>

              {/* Direct Add Button */}
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center bg-[#0077b5] hover:bg-[#006297] text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Linkedin size={18} />
                Add to LinkedIn Profile Directly
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer - hidden on print */}
      <footer className="border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 py-8 text-center text-sm text-gray-500 dark:text-neutral-500 print:hidden mt-12">
        <div className="max-w-6xl mx-auto px-4">
          &copy; {new Date().getFullYear()} CircuitCrate Private Limited. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
