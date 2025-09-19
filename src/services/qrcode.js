import QRCode from 'qrcode'

export const generateQRCode = async (ambulanceId) => {
  try {
    const url = `${window.location.origin}/join/${ambulanceId}`
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#FFFFFF'
      },
      width: 256
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

export const downloadQRCode = async (ambulanceId, ambulanceName) => {
  try {
    const qrCodeDataURL = await generateQRCode(ambulanceId)

    // Create download link
    const link = document.createElement('a')
    link.href = qrCodeDataURL
    link.download = `QR-${ambulanceName}-${ambulanceId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error downloading QR code:', error)
    throw error
  }
}