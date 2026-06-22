import QRCode from 'qrcode'
import { createClient } from '../supabase/server'

export interface CertificateInput {
  candidate_name: string
  candidate_email: string
  certificate_title: string
  issue_date: string
  expiry_date?: string | null
  verification_status: boolean
  certificate_pdf_url?: string | null
  certificate_type?: 'course' | 'position' | 'project' | 'internship' | null
}

export interface Certificate extends CertificateInput {
  id: string
  certificate_id: string
  qr_code_url: string
  created_at: string
  updated_at: string
}

// Generate automatic unique Certificate ID
// Format: CERT-YYYY-XXXX (where YYYY is current year, XXXX is 4-digit unique string)
export function generateCertificateId(): string {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  return `CERT-${year}-${randomNum}`
}

// Generate QR Code image and upload to Supabase storage
export async function generateAndUploadQRCode(certificateId: string, siteUrl: string): Promise<string> {
  const supabase = await createClient()
  const verifyUrl = `${siteUrl}/certificate/${certificateId}`

  // Generate QR Code as Data URL
  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })

  // Convert base64 to buffer
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  // Upload to Supabase Storage
  const fileName = `${certificateId}.png`
  const { data, error } = await supabase.storage
    .from('qr-codes')
    .upload(fileName, buffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload QR code to storage: ${error.message}`)
  }

  // Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('qr-codes')
    .getPublicUrl(fileName)

  return publicUrl
}

// Audit logger helper
async function logAdminAction(action: string, targetId: string, details: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action,
      target_id: targetId,
      details,
    })
  }
}

// CRUD actions
export async function createCertificate(input: CertificateInput, siteUrl: string) {
  const supabase = await createClient()
  const certificateId = generateCertificateId()
  const qrCodeUrl = await generateAndUploadQRCode(certificateId, siteUrl)

  const { data, error } = await supabase
    .from('certificates')
    .insert({
      ...input,
      certificate_id: certificateId,
      qr_code_url: qrCodeUrl,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create certificate: ${error.message}`)
  }

  await logAdminAction('CREATE_CERTIFICATE', certificateId, { input })
  return data as Certificate
}

export async function updateCertificate(id: string, input: Partial<CertificateInput>, siteUrl?: string) {
  const supabase = await createClient()
  
  // Fetch existing first to check if we need to regenerate QR code due to change of certificate_id
  const { data: existing, error: fetchError } = await supabase
    .from('certificates')
    .select('certificate_id, qr_code_url')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw new Error(`Certificate not found: ${fetchError.message}`)
  }

  let qrCodeUrl = existing.qr_code_url

  // If a new siteUrl is provided, regenerate QR code just in case
  if (siteUrl) {
    qrCodeUrl = await generateAndUploadQRCode(existing.certificate_id, siteUrl)
  }

  const { data, error } = await supabase
    .from('certificates')
    .update({
      ...input,
      qr_code_url: qrCodeUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update certificate: ${error.message}`)
  }

  await logAdminAction('UPDATE_CERTIFICATE', existing.certificate_id, { changes: input })
  return data as Certificate
}

export async function deleteCertificate(id: string) {
  const supabase = await createClient()

  // Fetch certificate details first for logging and storage cleanup
  const { data: existing, error: fetchError } = await supabase
    .from('certificates')
    .select('certificate_id, certificate_pdf_url, qr_code_url')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw new Error(`Certificate not found: ${fetchError.message}`)
  }

  // Delete from database
  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete certificate: ${error.message}`)
  }

  // Attempt to delete files from storage
  try {
    const qrFileName = `${existing.certificate_id}.png`
    await supabase.storage.from('qr-codes').remove([qrFileName])

    if (existing.certificate_pdf_url) {
      const pdfFileName = existing.certificate_pdf_url.split('/').pop()
      if (pdfFileName) {
        await supabase.storage.from('certificates').remove([pdfFileName])
      }
    }
  } catch (storageError) {
    console.error('Failed to clean up certificate files from storage:', storageError)
  }

  await logAdminAction('DELETE_CERTIFICATE', existing.certificate_id, { id })
  return true
}

export async function getCertificateByCertificateId(certificateId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('certificate_id', certificateId)
    .maybeSingle()

  if (error) {
    throw new Error(`Error fetching certificate: ${error.message}`)
  }

  return data as Certificate | null
}

export async function verifyCertificate(
  certificateId: string, 
  meta: { ipAddress?: string; userAgent?: string; referrer?: string }
) {
  const supabase = await createClient()
  
  // Increment audit log query
  const cert = await getCertificateByCertificateId(certificateId)

  // Write verification log entry (even if not found, we can log the attempt or only log valid ones)
  if (cert) {
    await supabase.from('verification_logs').insert({
      certificate_id: certificateId,
      ip_address: meta.ipAddress || 'unknown',
      user_agent: meta.userAgent || 'unknown',
      referrer: meta.referrer || 'unknown'
    })
  }

  return cert
}

export async function searchCertificates(query: string) {
  const supabase = await createClient()
  
  // Search query filters across certificate_id, candidate_name, or candidate_email
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .or(`certificate_id.ilike.%${query}%,candidate_name.ilike.%${query}%,candidate_email.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Search failed: ${error.message}`)
  }

  return data as Certificate[]
}
