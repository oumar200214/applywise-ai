import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum allowed size is 10 MB.' }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()
    let extractedText = ''

    if (fileName.endsWith('.txt')) {
      // ── Plain text ──
      extractedText = buffer.toString('utf-8')

    } else if (fileName.endsWith('.pdf')) {
      // ── PDF extraction ──
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')
      const pdfData = await pdfParse(buffer)
      extractedText = pdfData.text

    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      // ── DOCX extraction ──
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value

    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' },
        { status: 400 }
      )
    }

    // Clean up: collapse multiple blank lines, trim
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (!extractedText || extractedText.length < 20) {
      return NextResponse.json(
        { error: 'Could not extract meaningful text from the file. Please try pasting your CV directly.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      charCount: extractedText.length,
    })
  } catch (error) {
    console.error('CV extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract text from file. Please try pasting your CV directly.' },
      { status: 500 }
    )
  }
}
