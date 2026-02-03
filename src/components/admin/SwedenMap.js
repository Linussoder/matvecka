'use client'

import { useState } from 'react'

/**
 * Sweden regional map with user distribution visualization
 * Shows all 21 Swedish regions (län) with color coding based on user counts
 */

// Swedish regions with simplified SVG paths
const REGIONS = {
  stockholm: {
    name: 'Stockholm',
    path: 'M 145,180 L 155,175 L 165,180 L 165,195 L 155,200 L 145,195 Z',
    center: [155, 187]
  },
  uppsala: {
    name: 'Uppsala',
    path: 'M 135,155 L 155,150 L 170,155 L 170,175 L 155,180 L 140,175 L 135,165 Z',
    center: [152, 165]
  },
  sodermanland: {
    name: 'Södermanland',
    path: 'M 130,195 L 145,190 L 155,200 L 150,215 L 135,215 L 125,205 Z',
    center: [140, 205]
  },
  ostergotland: {
    name: 'Östergötland',
    path: 'M 115,210 L 135,205 L 150,215 L 145,235 L 125,240 L 110,230 Z',
    center: [130, 222]
  },
  jonkoping: {
    name: 'Jönköping',
    path: 'M 95,235 L 115,230 L 125,245 L 120,265 L 100,270 L 90,255 Z',
    center: [107, 252]
  },
  kronoberg: {
    name: 'Kronoberg',
    path: 'M 100,270 L 120,265 L 130,280 L 125,295 L 105,295 L 95,285 Z',
    center: [112, 282]
  },
  kalmar: {
    name: 'Kalmar',
    path: 'M 125,245 L 145,240 L 155,260 L 150,290 L 130,295 L 120,275 Z',
    center: [137, 270]
  },
  gotland: {
    name: 'Gotland',
    path: 'M 170,230 L 180,225 L 188,235 L 185,255 L 175,260 L 168,250 Z',
    center: [177, 242]
  },
  blekinge: {
    name: 'Blekinge',
    path: 'M 105,300 L 125,295 L 135,305 L 130,315 L 110,318 L 100,310 Z',
    center: [117, 307]
  },
  skane: {
    name: 'Skåne',
    path: 'M 85,305 L 110,300 L 130,310 L 128,330 L 105,340 L 85,335 L 78,320 Z',
    center: [105, 320]
  },
  halland: {
    name: 'Halland',
    path: 'M 70,275 L 90,270 L 95,290 L 88,310 L 72,310 L 65,290 Z',
    center: [80, 290]
  },
  vastra_gotaland: {
    name: 'Västra Götaland',
    path: 'M 55,220 L 85,215 L 95,235 L 90,270 L 70,275 L 55,270 L 45,245 Z',
    center: [70, 245]
  },
  varmland: {
    name: 'Värmland',
    path: 'M 65,155 L 95,145 L 105,165 L 100,195 L 80,200 L 60,190 L 55,170 Z',
    center: [80, 175]
  },
  orebro: {
    name: 'Örebro',
    path: 'M 100,175 L 120,170 L 130,185 L 125,205 L 105,210 L 95,195 Z',
    center: [112, 192]
  },
  vastmanland: {
    name: 'Västmanland',
    path: 'M 115,155 L 135,150 L 145,165 L 140,180 L 125,185 L 115,170 Z',
    center: [130, 167]
  },
  dalarna: {
    name: 'Dalarna',
    path: 'M 85,105 L 115,95 L 130,110 L 125,145 L 100,155 L 80,145 L 75,120 Z',
    center: [102, 125]
  },
  gavleborg: {
    name: 'Gävleborg',
    path: 'M 125,100 L 155,90 L 170,105 L 165,140 L 145,150 L 125,145 Z',
    center: [147, 120]
  },
  vasternorrland: {
    name: 'Västernorrland',
    path: 'M 120,55 L 155,45 L 175,60 L 170,95 L 145,105 L 120,100 L 115,75 Z',
    center: [145, 75]
  },
  jamtland: {
    name: 'Jämtland',
    path: 'M 65,35 L 105,25 L 120,45 L 115,90 L 90,100 L 65,95 L 55,60 Z',
    center: [90, 62]
  },
  vasterbotten: {
    name: 'Västerbotten',
    path: 'M 105,5 L 145,0 L 160,15 L 155,50 L 130,60 L 105,55 L 95,30 Z',
    center: [130, 30]
  },
  norrbotten: {
    name: 'Norrbotten',
    path: 'M 130,-40 L 180,-50 L 200,-30 L 195,10 L 165,25 L 135,20 L 120,-15 Z',
    center: [160, -10]
  }
}

/**
 * Get color based on user count
 */
function getRegionColor(count, maxCount) {
  if (!count || count === 0) return 'fill-gray-100'
  const ratio = count / maxCount

  if (ratio >= 0.8) return 'fill-green-600'
  if (ratio >= 0.6) return 'fill-green-500'
  if (ratio >= 0.4) return 'fill-green-400'
  if (ratio >= 0.2) return 'fill-green-300'
  if (ratio >= 0.1) return 'fill-green-200'
  return 'fill-green-100'
}

export default function SwedenMap({
  data = {}, // { stockholm: 2450, vastra_gotaland: 890, ... }
  loading = false,
  onRegionClick = null,
  className = ''
}) {
  const [hoveredRegion, setHoveredRegion] = useState(null)

  // Calculate max count for color scaling
  const counts = Object.values(data)
  const maxCount = Math.max(...counts, 1)
  const totalUsers = counts.reduce((sum, c) => sum + c, 0)

  // Sort regions by count for legend
  const sortedRegions = Object.entries(data)
    .map(([id, count]) => ({
      id,
      name: REGIONS[id]?.name || id,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Användare per region</h3>
        <p className="text-sm text-gray-500">
          {totalUsers.toLocaleString('sv-SE')} användare totalt
        </p>
      </div>

      <div className="p-6 flex gap-6">
        {/* Map */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <svg
              viewBox="-10 -60 220 420"
              className="w-full max-w-xs mx-auto"
              style={{ height: '400px' }}
            >
              {/* Map regions */}
              {Object.entries(REGIONS).map(([id, region]) => {
                const count = data[id] || 0
                const isHovered = hoveredRegion === id

                return (
                  <g key={id}>
                    <path
                      d={region.path}
                      className={`
                        ${getRegionColor(count, maxCount)}
                        stroke-gray-300
                        transition-all duration-200
                        cursor-pointer
                        ${isHovered ? 'stroke-green-600 stroke-2' : 'stroke-1'}
                      `}
                      onMouseEnter={() => setHoveredRegion(id)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => onRegionClick?.(id, region.name, count)}
                    />
                    {/* Region label (only show for hovered or high-count regions) */}
                    {(isHovered || count > maxCount * 0.3) && (
                      <text
                        x={region.center[0]}
                        y={region.center[1]}
                        textAnchor="middle"
                        className="text-[8px] font-bold fill-gray-700 pointer-events-none"
                      >
                        {count > 0 ? count.toLocaleString('sv-SE') : ''}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          )}
        </div>

        {/* Sidebar with top regions and legend */}
        <div className="w-48 space-y-6">
          {/* Hovered region info */}
          {hoveredRegion && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="font-medium text-green-900">
                {REGIONS[hoveredRegion]?.name}
              </p>
              <p className="text-2xl font-bold text-green-700">
                {(data[hoveredRegion] || 0).toLocaleString('sv-SE')}
              </p>
              <p className="text-xs text-green-600">
                {totalUsers > 0
                  ? Math.round((data[hoveredRegion] || 0) / totalUsers * 100)
                  : 0}% av totalt
              </p>
            </div>
          )}

          {/* Top regions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Topp 5 regioner</h4>
            <div className="space-y-2">
              {sortedRegions.map((region, index) => (
                <div
                  key={region.id}
                  className="flex items-center justify-between text-sm"
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{region.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {region.count.toLocaleString('sv-SE')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Color legend */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Densitet</h4>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded bg-green-100"></div>
              <div className="w-6 h-4 rounded bg-green-200"></div>
              <div className="w-6 h-4 rounded bg-green-300"></div>
              <div className="w-6 h-4 rounded bg-green-400"></div>
              <div className="w-6 h-4 rounded bg-green-500"></div>
              <div className="w-6 h-4 rounded bg-green-600"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Låg</span>
              <span>Hög</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
