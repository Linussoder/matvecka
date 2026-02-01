'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function Header() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef(null)
  const supabase = createClient()

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setMobileMenuOpen(false)
    window.location.href = '/'
  }

  function getUserDisplayName() {
    if (!user) return ''
    if (user.user_metadata?.full_name) return user.user_metadata.full_name
    if (user.email) return user.email.split('@')[0]
    return 'Användare'
  }

  function getUserInitials() {
    const name = getUserDisplayName()
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <nav className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl md:text-2xl font-bold text-green-600">
            🛒 Matvecka
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              Erbjudanden
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/meal-planner"
                      className="text-gray-600 hover:text-green-600 transition-colors"
                    >
                      Matplanering
                    </Link>

                    {/* Dropdown Menu */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
                      >
                        Mina sidor
                        <svg
                          className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                          <Link
                            href="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-xl">📊</span>
                            <div>
                              <p className="font-medium">Dashboard</p>
                              <p className="text-xs text-gray-500">Översikt & statistik</p>
                            </div>
                          </Link>

                          <Link
                            href="/my-plans"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-xl">📋</span>
                            <div>
                              <p className="font-medium">Mina matplaner</p>
                              <p className="text-xs text-gray-500">Se sparade planer</p>
                            </div>
                          </Link>

                          <Link
                            href="/my-shopping-lists"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-xl">🛒</span>
                            <div>
                              <p className="font-medium">Mina inköpslistor</p>
                              <p className="text-xs text-gray-500">Tidigare listor</p>
                            </div>
                          </Link>

                          <div className="border-t border-gray-100 my-2"></div>

                          <Link
                            href="/settings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-xl">⚙️</span>
                            <div>
                              <p className="font-medium">Inställningar</p>
                              <p className="text-xs text-gray-500">Konto & preferenser</p>
                            </div>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* User section */}
                    <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold text-sm">
                            {getUserInitials()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700 font-medium hidden lg:block max-w-[120px] truncate">
                          {getUserDisplayName()}
                        </span>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                      >
                        Logga ut
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-gray-600 hover:text-green-600 transition-colors"
                    >
                      Logga in
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Kom igång
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-green-600"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4">
            <div className="flex flex-col space-y-1">
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                🏷️ Erbjudanden
              </Link>

              {!loading && user ? (
                <>
                  <Link
                    href="/meal-planner"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    🍽️ Matplanering
                  </Link>

                  <div className="border-t border-gray-100 my-2"></div>
                  <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Mina sidor</p>

                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    📊 Dashboard
                  </Link>
                  <Link
                    href="/my-plans"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    📋 Mina matplaner
                  </Link>
                  <Link
                    href="/my-shopping-lists"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    🛒 Mina inköpslistor
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    ⚙️ Inställningar
                  </Link>

                  <div className="border-t border-gray-100 my-2"></div>

                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">
                          {getUserInitials()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{getUserDisplayName()}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="mx-4 py-3 text-red-600 hover:bg-red-50 rounded-lg text-left px-4"
                  >
                    Logga ut
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-100 my-2"></div>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    Logga in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mx-4 py-3 bg-green-600 text-white rounded-lg text-center font-medium"
                  >
                    Kom igång gratis
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
