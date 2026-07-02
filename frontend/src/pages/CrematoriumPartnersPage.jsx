import { useState, useEffect } from 'react'
import { fetchCrematoriums, createCrematorium, fetchNearbyCrematoriums } from '../lib/api.js'
import { useUser } from '../context/UserContext.jsx'
import { PageTitle } from '../components/layout/PageTitle'
import { Button } from '../components/ui/Button'
import { PageLoadingBar } from '../components/ui/PageLoadingBar.jsx'
import { Search } from 'lucide-react'
import { AddPartnerModal } from '../components/partners/AddPartnerModal'
import { DisconnectModal } from '../components/partners/DisconnectModal'
import { PartnerDetailPage } from './PartnerDetailPage'
import { PartnersList } from '../components/partners/PartnersList'
import { NearbyDiscovery } from '../components/partners/NearbyDiscovery'

export function CrematoriumPartnersPage({ onAddPartner, cases = [], onViewCase }) {
  const { canWrite } = useUser()
  const [tab, setTab] = useState('partners')
  const [crematoriums, setCrematoriums] = useState([])
  const [loading, setLoading] = useState(true)
  const [nearby, setNearby] = useState([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(false)
  const [disconnecting, setDisconnecting] = useState(null)
  const [addingCrm, setAddingCrm] = useState(null)
  const [selectedPartner, setSelectedPartner] = useState(null)

  useEffect(() => {
    fetchCrematoriums().then(setCrematoriums).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError(true),
    )
  }, [])

  useEffect(() => {
    if (!userLocation) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- toggle loading state around the discovery fetch
    setNearbyLoading(true)
    fetchNearbyCrematoriums(userLocation.lat, userLocation.lng)
      .then(setNearby).catch(console.error).finally(() => setNearbyLoading(false))
  }, [userLocation])

  useEffect(() => {
    if (!selectedPartner) return
    const updated = crematoriums.find(c => c.id === selectedPartner.id)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep the open detail view in sync with refreshed list data
    if (updated) setSelectedPartner(updated)
  }, [crematoriums])

  function handleSaved(updated) {
    setCrematoriums(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  function handleDisconnected(id) {
    setCrematoriums(prev => prev.filter(c => c.id !== id))
    setDisconnecting(null)
    if (selectedPartner?.id === id) setSelectedPartner(null)
  }

  async function handleConfirmAdd(enriched) {
    const created = await createCrematorium({
      name: enriched.name,
      location: enriched.location,
      streetAddress: enriched.streetAddress,
      city: enriched.city,
      state: enriched.state,
      zip: enriched.zip,
      phone: enriched.phone,
      website: enriched.website,
      contactName: enriched.contactName,
      contactEmail: enriched.contactEmail,
      rating: enriched.rating,
      userRatingCount: enriched.userRatingCount,
      weekdayDescriptions: enriched.weekdayDescriptions,
    })
    setCrematoriums(prev => [...prev, created])
    setNearby(prev => prev.filter(n => n.id !== enriched.id))
    setAddingCrm(null)
  }


  if (selectedPartner) {
    return (
      <>
        {disconnecting && (
          <DisconnectModal crm={disconnecting} onConfirm={handleDisconnected} onClose={() => setDisconnecting(null)} />
        )}
        <PartnerDetailPage
          crm={selectedPartner}
          cases={cases}
          onBack={() => setSelectedPartner(null)}
          onSave={handleSaved}
          onRemove={crm => setDisconnecting(crm)}
          onViewCase={onViewCase}
        />
      </>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white relative">
      {loading && <PageLoadingBar />}
      {disconnecting && (
        <DisconnectModal crm={disconnecting} onConfirm={handleDisconnected} onClose={() => setDisconnecting(null)} />
      )}
      {addingCrm && (
        <AddPartnerModal crm={addingCrm} onConfirm={handleConfirmAdd} onClose={() => setAddingCrm(null)} />
      )}

      <div className="border-b border-line bg-surface/80 backdrop-blur shrink-0 relative z-10">
        <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-4">
          <PageTitle className="leading-none">Crematorium Partners</PageTitle>
        </div>
        <div className="px-6 pb-3 flex items-end justify-between gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'partners' ? 'Search partners…' : 'Search nearby…'}
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-line bg-white text-[13px] text-ink font-sans placeholder:text-muted outline-none focus:border-ink/60 transition"
            />
          </div>
          <div className="flex bg-surface border border-line rounded-lg p-0.5 h-9 mt-1 shrink-0">
            <button
              onClick={() => { setTab('partners'); setSearch('') }}
              className={`px-3 rounded-md font-sans text-[12px] flex items-center cursor-pointer transition ${
                tab === 'partners' ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-muted hover:text-secondary'
              }`}
            >
              Your Partners
            </button>
            <button
              onClick={() => { setTab('find'); setSearch('') }}
              className={`px-3 rounded-md font-sans text-[12px] flex items-center cursor-pointer transition ${
                tab === 'find' ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-muted hover:text-secondary'
              }`}
            >
              Find a Partner
            </button>
          </div>
        </div>
      </div>

      {tab === 'partners' && (
        <PartnersList
          crematoriums={crematoriums}
          search={search}
          onSelect={setSelectedPartner}
        />
      )}

      {tab === 'find' && (
        <div className="flex flex-col flex-1 min-h-0">
          <NearbyDiscovery
            nearby={nearby}
            nearbyLoading={nearbyLoading}
            userLocation={userLocation}
            locationError={locationError}
            search={search}
            setSearch={setSearch}
            onAdd={canWrite ? crm => setAddingCrm(crm) : undefined}
          />
          <footer className="flex-shrink-0 bg-surface border-t border-line px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-sans text-sm font-medium text-ink">Don&rsquo;t see yours?</p>
              <p className="font-sans text-xs text-muted mt-0.5">Manually add a crematorium that isn&rsquo;t in our directory.</p>
            </div>
            {canWrite && <Button variant="primary" onClick={onAddPartner}>+ Add New</Button>}
          </footer>
        </div>
      )}
    </div>
  )
}
