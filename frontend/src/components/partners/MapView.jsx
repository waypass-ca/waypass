import { useState, useEffect, useRef } from 'react'
import { WAYPASS_MAP_STYLE } from '../../lib/mapStyles.js'

function makeMarkerIcon(onWaypass, active = false) {
  const fill = active
    ? (onWaypass ? '#2e4a35' : '#1e3a6e')
    : (onWaypass ? '#5a7060' : '#4A72B8')
  const ring = 'white'

  const w  = active ? 34 : 28
  const h  = active ? 46 : 38
  const cx = w / 2

  const path = active
    ? `M17 1C8.72 1 2 7.72 2 16c0 10.8 15 29 15 29S32 26.8 32 16C32 7.72 25.28 1 17 1z`
    : `M14 1C7.37 1 2 6.37 2 13c0 8.8 12 24 12 24S26 21.8 26 13C26 6.37 20.63 1 14 1z`

  const [ringCy, ringR, dotR] = active ? [15, 6.5, 3] : [12.5, 5.5, 2.5]

  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <path d="${path}" fill="${fill}"/>
      <circle cx="${cx}" cy="${ringCy}" r="${ringR}" fill="${ring}"/>
      <circle cx="${cx}" cy="${ringCy}" r="${dotR}" fill="${fill}"/>
    </svg>`
  )

  return {
    url: `data:image/svg+xml;charset=utf-8,${svg}`,
    scaledSize: new window.google.maps.Size(w, h),
    anchor: new window.google.maps.Point(cx, h),
  }
}

export function MapView({ nearby, userLocation, hoveredId, selectedId, onMarkerClick, onMapClick }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerMapRef = useRef({})
  const infoWindowRef = useRef(null)
  const iconsRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    let interval
    function tryInit() {
      if (!containerRef.current || !window.google?.maps || mapRef.current) return
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center: userLocation ?? { lat: 43.65, lng: -79.38 },
        zoom: 11,
        styles: WAYPASS_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
        gestureHandling: 'cooperative',
      })
      mapRef.current.addListener('click', () => onMapClick?.())
      iconsRef.current = {
        waypass: { normal: makeMarkerIcon(true, false), active: makeMarkerIcon(true, true) },
        plain:   { normal: makeMarkerIcon(false, false), active: makeMarkerIcon(false, true) },
      }
      setMapReady(true)
      clearInterval(interval)
    }
    tryInit()
    if (!mapRef.current) interval = setInterval(tryInit, 150)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (mapRef.current && userLocation) mapRef.current.panTo(userLocation)
  }, [userLocation])

  useEffect(() => {
    if (!mapReady || !window.google?.maps) return
    Object.values(markerMapRef.current).forEach(({ marker }) => marker.setMap(null))
    markerMapRef.current = {}
    if (infoWindowRef.current) infoWindowRef.current.close()

    const bounds = new window.google.maps.LatLngBounds()
    let hasPoints = false

    nearby.forEach(crm => {
      if (!crm.lat || !crm.lng) return
      const pos = { lat: crm.lat, lng: crm.lng }
      bounds.extend(pos)
      hasPoints = true

      const icons = iconsRef.current?.[crm.onWaypass ? 'waypass' : 'plain']
      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapRef.current,
        icon: icons?.normal,
      })

      const photoHtml = crm.photos?.[0]
        ? `<img src="${crm.photos[0]}" alt="" style="width:230px;height:120px;object-fit:cover;border-radius:6px;display:block;margin-bottom:8px;">`
        : ''
      const ratingHtml = crm.rating
        ? `<div style="display:flex;align-items:center;gap:4px;margin-top:3px">
            <span style="font-size:11px;font-weight:700;color:#2c2522">${crm.rating.toFixed(1)}</span>
            <span style="color:#F4B942;font-size:12px;letter-spacing:-1px">${'★'.repeat(Math.round(crm.rating))}${'☆'.repeat(5 - Math.round(crm.rating))}</span>
            ${crm.userRatingCount ? `<span style="font-size:10px;color:#9e8e82">(${crm.userRatingCount.toLocaleString()})</span>` : ''}
           </div>`
        : ''
      const iwContent = `<div style="font-family:'DM Sans',sans-serif;padding:2px;max-width:230px">
        ${photoHtml}
        <p style="font-weight:600;font-size:13px;margin:0 0 2px;color:#2c2522;line-height:1.3">${crm.name}</p>
        <p style="font-size:11px;color:#9e8e82;margin:0;line-height:1.4">${crm.location}</p>
        ${ratingHtml}
        ${crm.onWaypass ? '<span style="display:inline-flex;align-items:center;margin-top:6px;font-size:10px;font-weight:700;color:#5a7060;background:#edf2ee;padding:2px 7px;border-radius:4px;text-transform:uppercase;letter-spacing:0.06em">On Waypass</span>' : ''}
      </div>`

      function openIW() {
        if (infoWindowRef.current) infoWindowRef.current.close()
        const iw = new window.google.maps.InfoWindow({
          content: iwContent,
          headerDisabled: true,
          pixelOffset: new window.google.maps.Size(0, -4),
        })
        iw.open({ map: mapRef.current, anchor: marker })
        infoWindowRef.current = iw
      }

      marker.addListener('click', () => {
        openIW()
        onMarkerClick?.(crm.id)
      })

      markerMapRef.current[crm.id] = { marker, openIW, onWaypass: crm.onWaypass }
    })

    if (hasPoints) {
      if (Object.keys(markerMapRef.current).length === 1) {
        mapRef.current.setCenter(bounds.getCenter())
        mapRef.current.setZoom(13)
      } else {
        mapRef.current.fitBounds(bounds, 72)
      }
    }
  }, [nearby, mapReady])

  useEffect(() => {
    if (!mapReady) return
    Object.entries(markerMapRef.current).forEach(([id, { marker, onWaypass }]) => {
      const highlighted = id === hoveredId || id === selectedId
      const icons = iconsRef.current?.[onWaypass ? 'waypass' : 'plain']
      marker.setIcon(highlighted ? icons?.active : icons?.normal)
      marker.setZIndex(highlighted ? 999 : 1)
    })
  }, [hoveredId, selectedId, mapReady])

  useEffect(() => {
    if (!mapReady) return
    if (selectedId != null) {
      const entry = markerMapRef.current[selectedId]
      if (entry) {
        entry.openIW()
        mapRef.current?.panTo(entry.marker.getPosition())
      }
    } else {
      infoWindowRef.current?.close()
    }
  }, [selectedId, mapReady])

  return <div ref={containerRef} className="w-full h-full" />
}
