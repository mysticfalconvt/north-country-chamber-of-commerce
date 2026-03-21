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
import { Button } from '@/components/ui/button'

export interface LocationPickerProps {
  latitude?: number | null
  longitude?: number | null
  onCoordinatesChange: (lat: number, lng: number) => void
  address?: string
  city?: string
  state?: string
  zipCode?: string
  className?: string
  height?: string
}

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

export function LocationPicker({
  latitude,
  longitude,
  onCoordinatesChange,
  address,
  city,
  state,
  zipCode,
  className = '',
  height = '350px',
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const vectorSourceRef = useRef<VectorSource | null>(null)
  const modifyRef = useRef<Modify | null>(null)

  const [editing, setEditing] = useState(false)
  const [geocodeStatus, setGeocodeStatus] = useState<string | null>(null)

  const currentLat = latitude ?? null
  const currentLng = longitude ?? null
  const hasCoordinates = currentLat !== null && currentLng !== null

  // Stable callback ref to avoid re-creating the map when callback identity changes
  const onCoordinatesChangeRef = useRef(onCoordinatesChange)
  onCoordinatesChangeRef.current = onCoordinatesChange

  const updatePin = useCallback(
    (lat: number, lng: number) => {
      const source = vectorSourceRef.current
      if (!source) return

      source.clear()
      const feature = new Feature({
        geometry: new Point(fromLonLat([lng, lat])),
      })
      feature.setStyle(createPinStyle())
      source.addFeature(feature)
    },
    [],
  )

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
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([centerLng, centerLat]),
        zoom: hasCoordinates ? 15 : 11,
      }),
    })

    mapInstanceRef.current = map

    // Place initial pin if we have coordinates
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
    // Only run on mount/unmount
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

  // Manage edit mode: click handler + modify interaction
  useEffect(() => {
    const map = mapInstanceRef.current
    const source = vectorSourceRef.current
    if (!map || !source) return

    if (!editing) {
      // Remove modify interaction if present
      if (modifyRef.current) {
        map.removeInteraction(modifyRef.current)
        modifyRef.current = null
      }
      return
    }

    // Add modify interaction for dragging the pin
    const modify = new Modify({ source })
    map.addInteraction(modify)
    modifyRef.current = modify

    modify.on('modifyend', () => {
      const features = source.getFeatures()
      if (features.length > 0) {
        const geom = features[0].getGeometry() as Point
        const coords = toLonLat(geom.getCoordinates())
        onCoordinatesChangeRef.current(
          Math.round(coords[1] * 1000000) / 1000000,
          Math.round(coords[0] * 1000000) / 1000000,
        )
      }
    })

    // Click handler to place/move pin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClick = (event: any) => {
      const coords = toLonLat(event.coordinate)
      const lat = Math.round(coords[1] * 1000000) / 1000000
      const lng = Math.round(coords[0] * 1000000) / 1000000

      updatePin(lat, lng)
      onCoordinatesChangeRef.current(lat, lng)
    }

    map.on('click', handleClick)

    return () => {
      map.removeInteraction(modify)
      modifyRef.current = null
      map.un('click', handleClick)
    }
  }, [editing, updatePin])

  const handleLookupAddress = async () => {
    const parts = [address, city, state, zipCode].filter(Boolean)
    if (parts.length === 0) {
      setGeocodeStatus('No address provided')
      setTimeout(() => setGeocodeStatus(null), 3000)
      return
    }

    const query = parts.join(', ')
    setGeocodeStatus('Searching...')

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      })
      const results = await response.json()

      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat)
        const lng = parseFloat(results[0].lon)

        updatePin(lat, lng)
        onCoordinatesChangeRef.current(lat, lng)

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
    <div className={`space-y-3 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant={editing ? 'default' : 'outline'}
          size="sm"
          onClick={() => setEditing((prev) => !prev)}
        >
          {editing ? 'Done Editing' : 'Edit Location'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLookupAddress}
        >
          Lookup Address
        </Button>
        {geocodeStatus && (
          <span className="text-sm text-muted-foreground">{geocodeStatus}</span>
        )}
      </div>

      {/* Map container */}
      <div className="relative">
        <div
          ref={mapRef}
          className={`w-full rounded-lg border-2 transition-colors ${
            editing ? 'border-primary' : 'border-border'
          }`}
          style={{
            height,
            backgroundColor: '#f5f5f5',
            cursor: editing ? 'crosshair' : 'default',
          }}
        />
        {editing && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1 rounded-full pointer-events-none select-none">
            Click to place pin or drag to move
          </div>
        )}
      </div>

      {/* Coordinates display */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Lat: <span className="font-mono">{hasCoordinates ? currentLat!.toFixed(6) : '—'}</span>
        </span>
        <span>
          Lng: <span className="font-mono">{hasCoordinates ? currentLng!.toFixed(6) : '—'}</span>
        </span>
      </div>
    </div>
  )
}
