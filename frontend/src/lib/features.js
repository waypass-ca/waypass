// Feature flags for external API integrations.
// Set the corresponding env var to 'true' to enable; anything else disables.
export const FEATURES = {
  googleMaps: import.meta.env.VITE_ENABLE_GOOGLE_MAPS === 'true',
  cloudinary:  import.meta.env.VITE_ENABLE_CLOUDINARY === 'true',
}
