export const CUSTODY_STAGES = [
  'Removal from Location',
  'Received at Funeral Home',
  'Transported to Crematory',
  'Received at Crematory',
  'Cremation Started',
  'Cremation Completed',
  'Remains Processed',
  'Returned to Funeral Home',
  'Delivered to Family',
]

export const CUSTODY_STATUS_MILESTONES = { 2: 'transit', 4: 'cremation', 8: 'complete' }
export const EMPTY_CUSTODY = Array.from({ length: 9 }, () => ({ completed: false, staff: null, timestamp: null }))
