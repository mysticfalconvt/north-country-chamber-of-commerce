'use client'

import React, { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import { Feature } from 'ol'
import { Point } from 'ol/geom'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Style, Circle, Fill, Stroke, Text } from 'ol/style'

export interface BusinessLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  membershipTier?: 'basic' | 'premium' | 'featured'
  slug: string
  phone?: string
}

interface BusinessMapProps {
  businesses: BusinessLocation[]
  onBusinessClick?: (businessId: string) => void
  className?: string
  minHeight?: string
}

export function BusinessMap({ businesses, onBusinessClick, className = '', minHeight = '500px' }: BusinessMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current || !tooltipRef.current) return

    // Default center on Newport, VT
    const newportCoords = fromLonLat([-72.2052, 44.9369])

    // Create features for each business with coordinates
    const features = businesses
      .filter((b) => b.latitude && b.longitude)
      .map((business) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([business.longitude, business.latitude])),
          name: business.name,
          id: business.id,
          tier: business.membershipTier || 'basic',
          slug: business.slug,
          phone: business.phone || '',
        })

        // Style based on membership tier
        const colors = {
          featured: '#F59E0B', // Amber
          premium: '#10B981', // Green
          basic: '#3B82F6', // Blue
        }

        feature.setStyle(
          new Style({
            image: new Circle({
              radius: business.membershipTier === 'featured' ? 8 : 6,
              fill: new Fill({
                color: colors[business.membershipTier || 'basic'],
              }),
              stroke: new Stroke({
                color: '#FFFFFF',
                width: 2,
              }),
            }),
            text: new Text({
              text: business.membershipTier === 'featured' ? '★' : '',
              fill: new Fill({ color: '#FFFFFF' }),
              offsetY: 0,
              font: '10px sans-serif',
            }),
          }),
        )

        return feature
      })

    // Create vector source and layer
    const vectorSource = new VectorSource({
      features,
    })

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    })

    // Create map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: newportCoords,
        zoom: features.length > 0 ? 12 : 11,
      }),
    })

    // Fit to features if any exist
    if (features.length > 0) {
      if (features.length === 1) {
        // For single location, center directly on the point
        const coordinate = (features[0].getGeometry() as Point).getCoordinates()
        const view = map.getView()
        view.setCenter(coordinate)
        view.setZoom(15)
      } else {
        // For multiple locations, fit to extent
        const extent = vectorSource.getExtent()
        map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          maxZoom: 15,
        })
      }
    }

    // Handle clicks
    if (onBusinessClick) {
      map.on('click', (event) => {
        map.forEachFeatureAtPixel(event.pixel, (feature) => {
          const id = feature.get('id')
          if (id) {
            onBusinessClick(id)
          }
        })
      })
    }

    // Change cursor and show tooltip on hover
    map.on('pointermove', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat)

      if (feature) {
        map.getTargetElement().style.cursor = 'pointer'

        // Show tooltip
        const name = feature.get('name')
        const phone = feature.get('phone')

        if (tooltipRef.current) {
          tooltipRef.current.innerHTML = `
            <div class="bg-card text-card-foreground border rounded-lg shadow-lg p-3 max-w-xs">
              <div class="font-semibold">${name}</div>
              ${phone ? `<div class="text-sm text-muted-foreground mt-1">${phone}</div>` : ''}
            </div>
          `
          tooltipRef.current.style.display = 'block'

          // Position tooltip using screen coordinates
          const originalEvent = event.originalEvent as MouseEvent
          if (originalEvent) {
            tooltipRef.current.style.left = `${originalEvent.clientX + 10}px`
            tooltipRef.current.style.top = `${originalEvent.clientY}px`
          }
        }
      } else {
        map.getTargetElement().style.cursor = ''
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none'
        }
      }
    })

    mapInstanceRef.current = map

    // Cleanup
    return () => {
      map.setTarget(undefined)
    }
  }, [businesses, onBusinessClick])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={mapRef}
        className={`w-full h-full rounded-lg border ${className}`}
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: minHeight,
          backgroundColor: '#f5f5f5',
        }}
      />
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          display: 'none',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
    </div>
  )
}
