import { FEATURES } from './features.js'

export async function uploadToCloudinary(file) {
  if (!FEATURES.cloudinary) throw new Error('Image upload is disabled (VITE_ENABLE_CLOUDINARY)')
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary env vars not set (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)')
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message ?? 'Cloudinary upload failed')
  }
  const data = await res.json()
  return data.secure_url
}
