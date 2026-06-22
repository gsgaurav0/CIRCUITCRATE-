import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

// Helper to parse CSV manually without installing heavy external parsers
function parseCSV(text: string) {
  const lines = text.split(/\r?\n/)
  if (lines.length <= 1) return []
  
  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
  
  const results: any[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Split by comma, handling potential quotes
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ''))
    
    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    results.push(obj)
  }
  
  return results
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication and admin role first
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized access.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ message: 'Admin privileges required.' }, { status: 403 })
    }

    const { csvText } = await request.json()
    if (!csvText) {
      return NextResponse.json({ message: 'CSV content is required.' }, { status: 400 })
    }

    const rows = parseCSV(csvText)
    if (rows.length === 0) {
      return NextResponse.json({ message: 'CSV is empty or invalid.' }, { status: 400 })
    }

    let importedCount = 0
    const errors: string[] = []
    const origin = request.nextUrl.origin

    // Process rows sequentially
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      const rowNum = index + 2 // 1-indexed header + 1-indexed data row
      
      const {
        candidate_name,
        candidate_email,
        certificate_title,
        issue_date,
        expiry_date
      } = row

      // Simple validation
      if (!candidate_name || !candidate_email || !certificate_title || !issue_date) {
        errors.push(`Row ${rowNum}: Missing required fields. candidate_name, candidate_email, certificate_title, issue_date are required.`)
        continue
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(candidate_email)) {
        errors.push(`Row ${rowNum}: Invalid email address "${candidate_email}".`)
        continue
      }

      try {
        // 1. Generate unique Certificate ID
        const year = new Date(issue_date).getFullYear() || new Date().getFullYear()
        const randomNum = Math.floor(100000 + Math.random() * 900000)
        const certificateId = `CERT-${year}-${randomNum}`

        // 2. Generate QR Code
        const verifyUrl = `${origin}/certificate/${certificateId}`
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 300,
        })
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')

        // 3. Upload QR Code to storage
        const qrFileName = `${certificateId}.png`
        const { error: uploadError } = await supabase.storage
          .from('qr-codes')
          .upload(qrFileName, buffer, {
            contentType: 'image/png',
            upsert: true,
          })

        if (uploadError) {
          throw new Error(`QR upload failed: ${uploadError.message}`)
        }

        const { data: { publicUrl: qrCodeUrl } } = supabase.storage
          .from('qr-codes')
          .getPublicUrl(qrFileName)

        // 4. Insert into database
        const { error: dbError } = await supabase
          .from('certificates')
          .insert({
            certificate_id: certificateId,
            candidate_name,
            candidate_email,
            certificate_title,
            issue_date,
            expiry_date: expiry_date || null,
            verification_status: true,
            qr_code_url: qrCodeUrl,
          })

        if (dbError) {
          // Clean up QR code if DB insert fails
          await supabase.storage.from('qr-codes').remove([qrFileName])
          throw new Error(`Database insert failed: ${dbError.message}`)
        }

        // 5. Log audit action
        await supabase.from('admin_audit_logs').insert({
          admin_id: user.id,
          action: 'CREATE_CERTIFICATE',
          target_id: certificateId,
          details: { source: 'bulk_import', rowNum, candidate_name, certificate_title }
        })

        importedCount++
      } catch (err: any) {
        errors.push(`Row ${rowNum}: ${err.message || 'Unknown processing error.'}`)
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      errors,
    })

  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal server error.' }, { status: 500 })
  }
}
