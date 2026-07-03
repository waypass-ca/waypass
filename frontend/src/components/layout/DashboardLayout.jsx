import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { NotificationToast } from '../notifications/NotificationToast'
import { AppToastContainer } from '../ui/AppToastContainer'
import { DashboardSkeleton } from '../skeletons/DashboardSkeleton'
import { useDelayedLoading } from '../../hooks/useDelayedLoading'
import { fetchCases } from '../../lib/api.js'

const PATH_TO_SIDEBAR = {
  '/':           'home',
  '/inbox':      'inbox',
  '/cases':      'cases',
  '/cases/new':  'cases',
  '/crematoriums':     'partners',
  '/crematoriums/new': 'partners',
  '/shipping':   'shipping-partners',
  '/calendar':   'pickup-calendar',
  '/book':       'book-cremation',
  '/documents':  'documents',
  '/email-editor': 'email-editor',
  '/financials': 'financials',
  '/settings':   'settings',
}

const SIDEBAR_TO_PATH = {
  home:                '/',
  inbox:               '/inbox',
  cases:               '/cases',
  partners:            '/crematoriums',
  'shipping-partners': '/shipping',
  'pickup-calendar':   '/calendar',
  'book-cremation':    '/book',
  documents:           '/documents',
  'email-editor':      '/email-editor',
  financials:          '/financials',
  settings:            '/settings',
}

function activeSidebarItem(pathname) {
  if (pathname.startsWith('/cases/')) return 'cases'
  return PATH_TO_SIDEBAR[pathname] ?? 'home'
}

export function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCases()
      .then(setCases)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const showSkeleton = useDelayedLoading(loading)

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar activeItem="home" onItemChange={() => {}} />
        <main className="flex-1 px-8 py-7 bg-canvas overflow-auto">
          {showSkeleton && <DashboardSkeleton />}
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <NotificationToast onViewInbox={(itemId) => navigate('/inbox', { state: { activeId: itemId } })} />
      <AppToastContainer />
      <Sidebar
        activeItem={activeSidebarItem(location.pathname)}
        onItemChange={id => {
          const path = SIDEBAR_TO_PATH[id]
          if (path) navigate(path)
        }}
      />
      <Outlet context={{ cases, setCases }} />
    </div>
  )
}
