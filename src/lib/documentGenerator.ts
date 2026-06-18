export function generateCV_DOCX(cvData: any, filename: string = 'Tailored_CV.doc') {
  if (!cvData) return

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>
      <h1 style="text-align:center">${cvData.header_section || 'CV'}</h1>
      <br/>
      <h2>PROFESSIONAL SUMMARY</h2>
      <p>${cvData.summary_section?.replace(/\n/g, '<br/>') || ''}</p>
      <br/>
      <h2>EXPERIENCE</h2>
      <p>${cvData.experience_section?.replace(/\n/g, '<br/>') || ''}</p>
      <br/>
      <h2>EDUCATION</h2>
      <p>${cvData.education_section?.replace(/\n/g, '<br/>') || ''}</p>
      <br/>
      <h2>SKILLS</h2>
      <p>${cvData.skills_section?.replace(/\n/g, '<br/>') || ''}</p>
    </body></html>
  `

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generateLetter_DOCX(letterData: any, filename: string = 'Cover_Letter.doc') {
  if (!letterData) return

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>
      <p>${letterData.opening_paragraph?.replace(/\n/g, '<br/>') || ''}</p><br/>
      <p>${letterData.body_paragraph_1?.replace(/\n/g, '<br/>') || ''}</p><br/>
      <p>${letterData.body_paragraph_2?.replace(/\n/g, '<br/>') || ''}</p><br/>
      <p>${letterData.closing_paragraph?.replace(/\n/g, '<br/>') || ''}</p>
    </body></html>
  `

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printToPDF() {
  window.print()
}
