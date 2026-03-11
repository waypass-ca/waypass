import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

// ── Packages ──────────────────────────────────────────
const packages = [
  { id: 'essential', name: 'Essential', price: 895, popular: false, features: ['Direct cremation', 'Temporary urn included', 'Death certificate (1 copy)', 'Basic local transport', 'Online arrangement portal'] },
  { id: 'comfort', name: 'Comfort', price: 1395, popular: true, features: ['Direct cremation', 'Handcrafted mahogany urn', 'Death certificates (3 copies)', 'Family transport coordination', 'Online memorial page', 'Dedicated care coordinator'] },
  { id: 'tribute', name: 'Tribute', price: 2195, popular: false, features: ['Direct cremation', 'Premium engraved urn', 'Death certificates (5 copies)', 'Family transport coordination', 'Online memorial page', 'Livestream service included', 'Keepsake memorial jewelry', 'Dedicated care coordinator'] },
]

// ── Addons ────────────────────────────────────────────
const addons = [
  { id: 'urn', name: 'Urn Upgrade', description: 'Premium hand-crafted mahogany urn with engraving', price: 195 },
  { id: 'witnessed', name: 'Witnessed Cremation', description: 'Family members present during the cremation process', price: 250 },
  { id: 'jewelry', name: 'Memorial Jewelry', description: 'Keepsake pendant holding a small portion of ashes', price: 150 },
  { id: 'livestream', name: 'Livestream Service', description: 'HD livestream for remote family members to join', price: 75 },
]

// ── Crematoriums ──────────────────────────────────────
const crematoriums = [
  { id: 'crm-1', name: 'Pacific Cremation Center', location: 'Daly City, CA', distance: '8 miles', active: 2, completed_ytd: 47, avg_turnaround: '2.1 days', avg_fee: '$520', status: 'active', contact: 'admin@pacificcremation.com', phone: '(415) 555-0201', since: 'Jan 2022' },
  { id: 'crm-2', name: 'Evergreen Cremation Services', location: 'Oakland, CA', distance: '14 miles', active: 1, completed_ytd: 28, avg_turnaround: '2.6 days', avg_fee: '$480', status: 'active', contact: 'ops@evergreencremation.com', phone: '(510) 555-0188', since: 'Jun 2022' },
  { id: 'crm-3', name: 'Bay Area Memorial Cremation', location: 'San Jose, CA', distance: '48 miles', active: 0, completed_ytd: 12, avg_turnaround: '3.0 days', avg_fee: '$450', status: 'inactive', contact: 'info@bamcremation.com', phone: '(408) 555-0144', since: 'Mar 2023' },
]

// ── Cases ─────────────────────────────────────────────
const casesRaw = [
  {
    id: 'PSG-2024-0891', deceased: 'Margaret Chen', family: 'Chen Family',
    contact_name: 'Linda Chen', contact_phone: '(415) 555-0182', contact_email: 'linda.chen@email.com', relationship: 'Daughter',
    dob: 'June 12, 1938', dop: 'Feb 28, 2024', location: "St. Mary's Medical Center",
    package_id: 'comfort', package_name: 'Comfort', package_price: 1395,
    addon_names: ['Memorial Jewelry'], status: 'complete', date: 'Mar 1, 2024', amount: 1545,
    crematorium_id: 'crm-1', crematorium_name: 'Pacific Cremation Center', documents: ['Death Certificate (1).pdf', 'Authorization Form.pdf', 'Cremation Permit.pdf'],
    notes: [
      { author: 'Sarah M.', text: 'Family has requested ashes be ready by March 8th for a private ceremony.', time: 'Mar 2, 9:14 AM' },
      { author: 'James R.', text: 'Transport confirmed. Pickup scheduled for 8am tomorrow.', time: 'Mar 3, 4:02 PM' },
    ],
  },
  {
    id: 'PSG-2024-0892', deceased: 'Robert Harmon', family: 'Harmon Family',
    contact_name: 'Patricia Harmon', contact_phone: '(415) 555-0134', contact_email: 'p.harmon@gmail.com', relationship: 'Spouse',
    dob: 'March 4, 1951', dop: 'Mar 2, 2024', location: 'Kaiser Permanente SF',
    package_id: 'essential', package_name: 'Essential', package_price: 895,
    addon_names: [], status: 'transit', date: 'Mar 3, 2024', amount: 895,
    crematorium_id: 'crm-1', crematorium_name: 'Pacific Cremation Center', documents: ['Authorization Form.pdf'],
    notes: [
      { author: 'Sarah M.', text: 'Awaiting death certificate from attending physician.', time: 'Mar 3, 11:30 AM' },
    ],
  },
  {
    id: 'PSG-2024-0893', deceased: 'Eleanor Walsh', family: 'Walsh Family',
    contact_name: 'Thomas Walsh', contact_phone: '(415) 555-0199', contact_email: 'tom.walsh@email.com', relationship: 'Son',
    dob: 'September 19, 1944', dop: 'Mar 4, 2024', location: 'UCSF Medical Center',
    package_id: 'tribute', package_name: 'Tribute', package_price: 2195,
    addon_names: ['Livestream Service'], status: 'cremation', date: 'Mar 5, 2024', amount: 2195,
    crematorium_id: 'crm-2', crematorium_name: 'Evergreen Cremation Services', documents: ['Death Certificate (3).pdf', 'Cremation Permit.pdf', 'Livestream Access.pdf'],
    notes: [
      { author: 'James R.', text: 'Family has 12 remote attendees for the livestream — confirm stream link sent.', time: 'Mar 5, 2:15 PM' },
      { author: 'Sarah M.', text: 'All permits received. Cremation scheduled for Mar 12.', time: 'Mar 6, 9:00 AM' },
    ],
  },
  {
    id: 'PSG-2024-0894', deceased: 'James Okafor', family: 'Okafor Family',
    contact_name: 'Amara Okafor', contact_phone: '(415) 555-0176', contact_email: 'amara.okafor@email.com', relationship: 'Daughter',
    dob: 'January 30, 1957', dop: 'Mar 6, 2024', location: 'Residence',
    package_id: 'comfort', package_name: 'Comfort', package_price: 1395,
    addon_names: ['Witnessed Cremation'], status: 'pending', date: 'Mar 7, 2024', amount: 1645,
    crematorium_id: null, crematorium_name: null, documents: [],
    notes: [],
  },
  {
    id: 'PSG-2024-0895', deceased: 'Dorothy Mills', family: 'Mills Family',
    contact_name: 'Richard Mills', contact_phone: '(415) 555-0141', contact_email: 'rmills@email.com', relationship: 'Son',
    dob: 'April 7, 1949', dop: 'Mar 7, 2024', location: 'Sunrise Hospice',
    package_id: 'essential', package_name: 'Essential', package_price: 895,
    addon_names: [], status: 'pending', date: 'Mar 8, 2024', amount: 895,
    crematorium_id: null, crematorium_name: null, documents: [],
    notes: [],
  },
]

// ── Crematorium Orders ────────────────────────────────
const crematoriumOrders = [
  { id: 'PSG-2024-0893', name: 'Eleanor Walsh', funeral_home: 'Evergreen Memorial', package: 'Tribute', received: 'Mar 5, 2024', scheduled: 'Mar 12, 2024', status: 1, amount: 875, tag: 'family' },
  { id: 'PSG-2024-0892', name: 'Robert Harmon', funeral_home: 'Evergreen Memorial', package: 'Essential', received: 'Mar 3, 2024', scheduled: 'Mar 10, 2024', status: 2, amount: 450, tag: 'direct' },
  { id: 'PSG-2024-0890', name: 'Thomas Bradley', funeral_home: 'Sunrise Funeral Co.', package: 'Comfort', received: 'Mar 1, 2024', scheduled: 'Mar 8, 2024', status: 0, amount: 650, tag: 'direct' },
]

async function seed() {
  console.log('Seeding packages…')
  const { error: pkgErr } = await supabase.from('packages').upsert(packages)
  if (pkgErr) throw pkgErr

  console.log('Seeding addons…')
  const { error: addErr } = await supabase.from('addons').upsert(addons)
  if (addErr) throw addErr

  console.log('Seeding crematoriums…')
  const { error: crmErr } = await supabase.from('crematoriums').upsert(crematoriums)
  if (crmErr) throw crmErr

  console.log('Seeding cases…')
  const caseRows = casesRaw.map(({ notes: _notes, ...c }) => c)
  const { error: caseErr } = await supabase.from('cases').upsert(caseRows)
  if (caseErr) throw caseErr

  console.log('Seeding case notes…')
  const allNotes = casesRaw.flatMap(c =>
    c.notes.map(n => ({ case_id: c.id, author: n.author, text: n.text, time: n.time }))
  )
  if (allNotes.length > 0) {
    const { error: notesErr } = await supabase.from('case_notes').insert(allNotes)
    if (notesErr) throw notesErr
  }

  console.log('Seeding crematorium orders…')
  const { error: ordersErr } = await supabase.from('crematorium_orders').upsert(crematoriumOrders)
  if (ordersErr) throw ordersErr

  console.log('✓ Seed complete')
}

seed().catch(err => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
