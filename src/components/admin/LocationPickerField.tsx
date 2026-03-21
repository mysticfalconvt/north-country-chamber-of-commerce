'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Style, Circle, Fill, Stroke } from 'ol/style'
import { Modify } from 'ol/interaction'
import { useForm, useFormFields } from '@payloadcms/ui'

// Default center: Newport, VT
const DEFAULT_LAT = 44.9369
const DEFAULT_LNG = -72.2052

function createPinStyle(): Style {
  return new Style({
    image: new Circle({
      radius: 10,
      fill: new Fill({ color: '#EF4444' }),
      stroke: new Stroke({ color: '#FFFFFF', width: 2.5 }),
    }),
  })
}

export const LocationPickerField: React.FC = () => {
  const { dispatchFields, getDataByPath } = useForm()

  // Read coordinate values from form state
  const latitude = useFormFields(
    ([fields]) => fields['coordinates.latitude']?.value as number | undefined,
  )
  const longitude = useFormFields(
    ([fields]) => fields['coordinates.longitude']?.value as number | undefined,
  )

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const vectorSourceRef = useRef<VectorSource | null>(null)
  const modifyRef = useRef<Modify | null>(null)

  const [editing, setEditing] = useState(false)
  const [geocodeStatus, setGeocodeStatus] = useState<string | null>(null)

  const currentLat = latitude ?? null
  const currentLng = longitude ?? null
  const hasCoordinates = currentLat !== null && currentLng !== null

  const setCoordinates = useCallback(
    (lat: number, lng: number) => {
      dispatchFields({
        type: 'UPDATE',
        path: 'coordinates.latitude',
        value: lat,
      })
      dispatchFields({
        type: 'UPDATE',
        path: 'coordinates.longitude',
        value: lng,
      })
    },
    [dispatchFields],
  )

  const updatePin = useCallback((lat: number, lng: number) => {
    const source = vectorSourceRef.current
    if (!source) return

    source.clear()
    const feature = new Feature({
      geometry: new Point(fromLonLat([lng, lat])),
    })
    feature.setStyle(createPinStyle())
    source.addFeature(feature)
  }, [])

  // Stable ref for setCoordinates to avoid re-creating interactions
  const setCoordinatesRef = useRef(setCoordinates)
  setCoordinatesRef.current = setCoordinates

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return

    const centerLat = currentLat ?? DEFAULT_LAT
    const centerLng = currentLng ?? DEFAULT_LNG

    const vectorSource = new VectorSource()
    vectorSourceRef.current = vectorSource

    const vectorLayer = new VectorLayer({ source: vectorSource })

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), vectorLayer],
      view: new View({
        center: fromLonLat([centerLng, centerLat]),
        zoom: hasCoordinates ? 15 : 11,
      }),
    })

    mapInstanceRef.current = map

    if (hasCoordinates) {
      const feature = new Feature({
        geometry: new Point(fromLonLat([currentLng!, currentLat!])),
      })
      feature.setStyle(createPinStyle())
      vectorSource.addFeature(feature)
    }

    return () => {
      map.setTarget(undefined)
      mapInstanceRef.current = null
      vectorSourceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync pin position when coordinates change from outside
  useEffect(() => {
    if (!mapInstanceRef.current || !vectorSourceRef.current) return
    if (hasCoordinates) {
      updatePin(currentLat!, currentLng!)
      mapInstanceRef.current.getView().animate({
        center: fromLonLat([currentLng!, currentLat!]),
        duration: 300,
      })
    }
  }, [currentLat, currentLng, hasCoordinates, updatePin])

  // Manage edit mode
  useEffect(() => {
    const map = mapInstanceRef.current
    const source = vectorSourceRef.current
    if (!map || !source) return

    if (!editing) {
      if (modifyRef.current) {
        map.removeInteraction(modifyRef.current)
        modifyRef.current = null
      }
      return
    }

    const modify = new Modify({ source })
    map.addInteraction(modify)
    modifyRef.current = modify

    modify.on('modifyend', () => {
      const features = source.getFeatures()
      if (features.length > 0) {
        const geom = features[0].getGeometry() as Point
        const coords = toLonLat(geom.getCoordinates())
        setCoordinatesRef.current(
          Math.round(coords[1] * 1000000) / 1000000,
          Math.round(coords[0] * 1000000) / 1000000,
        )
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClick = (event: any) => {
      const coords = toLonLat(event.coordinate)
      const lat = Math.round(coords[1] * 1000000) / 1000000
      const lng = Math.round(coords[0] * 1000000) / 1000000

      updatePin(lat, lng)
      setCoordinatesRef.current(lat, lng)
    }

    map.on('click', handleClick)

    return () => {
      map.removeInteraction(modify)
      modifyRef.current = null
      map.un('click', handleClick)
    }
  }, [editing, updatePin])

  const handleLookupAddress = async () => {
    const address = getDataByPath<string>('address')
    const city = getDataByPath<string>('city')
    const state = getDataByPath<string>('state')
    const zipCode = getDataByPath<string>('zipCode')

    const parts = [address, city, state, zipCode].filter(Boolean)
    if (parts.length === 0) {
      setGeocodeStatus('No address provided')
      setTimeout(() => setGeocodeStatus(null), 3000)
      return
    }

    const query = parts.join(', ')
    setGeocodeStatus('Searching...')

    try {
      const params = new URLSearchParams({
        format: 'json',
        limit: '1',
        country: 'USA',
      })
      if (address) params.append('street', address)
      if (city) params.append('city', city)
      if (state) params.append('state', state)
      if (zipCode) params.append('postalcode', zipCode)

      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'North Country Chamber of Commerce (contact@northcountrychamber.com)',
        },
      })
      let results = await response.json()

      // Fallback to city/state if structured query fails
      if ((!results || results.length === 0) && city && state) {
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${city}, ${state}, USA`)}&limit=1`
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'North Country Chamber of Commerce (contact@northcountrychamber.com)',
          },
        })
        results = await fallbackResponse.json()
      }

      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat)
        const lng = parseFloat(results[0].lon)

        updatePin(lat, lng)
        setCoordinates(lat, lng)

        mapInstanceRef.current?.getView().animate({
          center: fromLonLat([lng, lat]),
          zoom: 15,
          duration: 500,
        })

        setGeocodeStatus('Location found')
      } else {
        setGeocodeStatus('Address not found')
      }
    } catch {
      setGeocodeStatus('Lookup failed')
    }

    setTimeout(() => setGeocodeStatus(null), 3000)
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className="btn btn--size-small"
          style={{
            padding: '0.375rem 0.75rem',
            fontSize: '0.875rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--theme-elevation-300)',
            backgroundColor: editing ? 'var(--theme-elevation-150)' : 'transparent',
            cursor: 'pointer',
            color: 'var(--theme-text)',
          }}
        >
          {editing ? 'Done Editing' : 'Edit Location'}
        </button>
        <button
          type="button"
          onClick={handleLookupAddress}
          style={{
            padding: '0.375rem 0.75rem',
            fontSize: '0.875rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--theme-elevation-300)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: 'var(--theme-text)',
          }}
        >
          Lookup Address
        </button>
        {geocodeStatus && (
          <span style={{ fontSize: '0.875rem', color: 'var(--theme-elevation-500)' }}>
            {geocodeStatus}
          </span>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '350px',
            borderRadius: '0.5rem',
            border: `2px solid ${editing ? 'var(--theme-success-500, #22c55e)' : 'var(--theme-elevation-300)'}`,
            backgroundColor: '#f5f5f5',
            cursor: editing ? 'crosshair' : 'default',
            transition: 'border-color 0.15s',
          }}
        />
        {editing && (
          <div
            style={{
              position: 'absolute',
              top: '0.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 500,
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            Click to place pin or drag to move
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          fontSize: '0.875rem',
          color: 'var(--theme-elevation-500)',
          marginTop: '0.5rem',
        }}
      >
        <span>
          Lat:{' '}
          <span style={{ fontFamily: 'monospace' }}>
            {hasCoordinates ? currentLat!.toFixed(6) : '—'}
          </span>
        </span>
        <span>
          Lng:{' '}
          <span style={{ fontFamily: 'monospace' }}>
            {hasCoordinates ? currentLng!.toFixed(6) : '—'}
          </span>
        </span>
      </div>
    </div>
  )
}
