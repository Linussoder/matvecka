'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Animated counter component that smoothly transitions between values
 * @param {number} value - Current value to display
 * @param {string} label - Label for the counter
 * @param {string} icon - Icon component to display
 * @param {string} color - Color theme (green, blue, violet, amber, red)
 * @param {boolean} pulse - Whether to show pulse animation on updates
 * @param {string} suffix - Optional suffix (e.g., '%', 'kr')
 * @param {string} prefix - Optional prefix (e.g., '+')
 */
export default function LiveCounter({
  value = 0,
  label,
  icon: Icon,
  color = 'green',
  pulse = true,
  suffix = '',
  prefix = '',
  trend = null, // 'up', 'down', or null
  trendValue = null
}) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isPulsing, setIsPulsing] = useState(false)
  const prevValueRef = useRef(value)

  // Animate value changes
  useEffect(() => {
    if (value === prevValueRef.current) return

    const startValue = prevValueRef.current
    const endValue = value
    const duration = 500 // ms
    const startTime = Date.now()

    // Trigger pulse animation
    if (pulse) {
      setIsPulsing(true)
      setTimeout(() => setIsPulsing(false), 600)
    }

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (endValue - startValue) * eased)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }

    requestAnimationFrame(animate)
    prevValueRef.current = value
  }, [value, pulse])

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-500',
      text: 'text-green-600',
      pulse: 'ring-green-400'
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
      pulse: 'ring-blue-400'
    },
    violet: {
      bg: 'bg-violet-50',
      icon: 'bg-violet-500',
      text: 'text-violet-600',
      pulse: 'ring-violet-400'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'bg-amber-500',
      text: 'text-amber-600',
      pulse: 'ring-amber-400'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-500',
      text: 'text-red-600',
      pulse: 'ring-red-400'
    }
  }

  const colors = colorClasses[color] || colorClasses.green

  return (
    <div className={`relative p-4 rounded-xl ${colors.bg} transition-all duration-300`}>
      {/* Pulse ring animation */}
      {isPulsing && (
        <div className={`absolute inset-0 rounded-xl ring-2 ${colors.pulse} animate-ping opacity-75`} />
      )}

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">
            {prefix}
            {typeof displayValue === 'number'
              ? displayValue.toLocaleString('sv-SE')
              : displayValue}
            {suffix}
          </p>

          {/* Trend indicator */}
          {trend && trendValue !== null && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                </svg>
              )}
              <span>{trend === 'up' ? '+' : '-'}{trendValue}%</span>
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div className={`p-2 rounded-lg ${colors.icon}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Live indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      </div>
    </div>
  )
}

/**
 * Grid of live counters with real-time updates
 */
export function LiveCounterGrid({ counters }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {counters.map((counter, index) => (
        <LiveCounter key={index} {...counter} />
      ))}
    </div>
  )
}
