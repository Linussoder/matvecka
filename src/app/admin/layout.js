'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  HomeIcon, DocumentIcon, CubeIcon, UsersIcon, CreditCardIcon, ChartBarIcon,
  PhotoIcon, EnvelopeIcon, CalendarIcon, UserGroupIcon, BellIcon, ChartPieIcon,
  CurrencyDollarIcon, FlagIcon, SparklesIcon, PencilSquareIcon, CogIcon,
  SunIcon, MoonIcon, Bars3Icon, XMarkIcon, ArrowTopRightOnSquareIcon,
  ArrowRightOnRectangleIcon, ChevronDownIcon, TagIcon, EyeIcon,
  BookOpenIcon, LanguageIcon, ServerIcon
} from '@/components/admin/Icons'

// Beaker icon for experiments
function BeakerIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 15.5m14.8-.2l-.71-1.422a2.25 2.25 0 00-1.612-1.28l-1.628-.244M5 15.5l-.71-1.422a2.25 2.25 0 01-1.612-1.28l-1.628-.244M5 15.5v2.756c0 .813.422 1.568 1.116 1.998l1.004.602A2.25 2.25 0 008.25 21h7.5a2.25 2.25 0 001.13-.144l1.004-.602A2.25 2.25 0 0019 18.756V15.5" />
    </svg>
  )
}

// Navigation structure - organized into logical dropdowns
const dataTools = [
  { href: '/admin/flyers', label: 'Reklamblad', icon: DocumentIcon },
  { href: '/admin/products', label: 'Produkter', icon: CubeIcon },
  { href: '/admin/prices', label: 'Prisjämförelse', icon: CurrencyDollarIcon },
]

const userTools = [
  { href: '/admin/users', label: 'Användare', icon: UsersIcon },
  { href: '/admin/subscriptions', label: 'Prenumerationer', icon: CreditCardIcon },
  { href: '/admin/segments', label: 'Segment', icon: UserGroupIcon },
]

const marketingTools = [
  { href: '/admin/ads', label: 'Ad Studio', icon: PhotoIcon },
  { href: '/admin/emails', label: 'Email Hub', icon: EnvelopeIcon },
  { href: '/admin/social', label: 'Social Scheduler', icon: CalendarIcon },
  { href: '/admin/notifications', label: 'Push Notiser', icon: BellIcon },
  { href: '/admin/promo', label: 'Kampanjkoder', icon: TagIcon },
]

const analyticsTools = [
  { href: '/admin/analytics', label: 'Statistik', icon: ChartBarIcon },
  { href: '/admin/analytics-live', label: 'Realtid', icon: ChartPieIcon },
  { href: '/admin/revenue', label: 'Intäkter', icon: CreditCardIcon },
  { href: '/admin/cohorts', label: 'Kohorter', icon: UserGroupIcon },
  { href: '/admin/sessions', label: 'Sessioner', icon: EyeIcon },
  { href: '/admin/experiments', label: 'A/B Tester', icon: BeakerIcon },
  { href: '/admin/assistant', label: 'AI Assistent', icon: SparklesIcon },
]

const contentTools = [
  { href: '/admin/recipes', label: 'Recepthantering', icon: SparklesIcon },
  { href: '/admin/calendar', label: 'Innehållskalender', icon: CalendarIcon },
  { href: '/admin/translations', label: 'Översättningar', icon: LanguageIcon },
]

const systemTools = [
  { href: '/admin/api-usage', label: 'API-användning', icon: ChartBarIcon },
  { href: '/admin/flags', label: 'Feature Flags', icon: FlagIcon },
  { href: '/admin/deployments', label: 'Deployment', icon: ServerIcon },
  { href: '/admin/content', label: 'Sajtinnehåll', icon: PencilSquareIcon },
]

// Reusable mobile nav section
function MobileNavSection({ title, items, isActive, onClose }) {
  return (
    <>
      <p className="px-3 py-2 mt-4 text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
      {items.map(item => {
        const Icon = item.icon
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded text-sm ${
              active
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </>
  )
}

// Reusable dropdown component
function NavDropdown({ name, label, icon: Icon, items, isOpen, onToggle, isActive, onLinkClick, isItemActive }) {
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
          isActive
            ? 'bg-slate-700 text-white'
            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-50">
          {items.map(item => {
            const ItemIcon = item.icon
            const active = isItemActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <ItemIcon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [openDropdown, setOpenDropdown] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('admin-dark-mode')
    if (saved !== null) {
      setDarkMode(saved === 'true')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('admin-dark-mode', darkMode.toString())
  }, [darkMode])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenDropdown(null)
    if (openDropdown) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [openDropdown])

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  if (pathname === '/admin/login') {
    return children
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const isActive = (href, exact = false) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isGroupActive = (items) => items.some(item => isActive(item.href))

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
        {/* Professional Navigation Header */}
        <header className="bg-slate-800 dark:bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-[1800px] mx-auto px-4">
            <div className="flex items-center h-12">
              {/* Logo */}
              <Link href="/admin" className="font-semibold text-white flex items-center gap-2 mr-8">
                <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold">M</span>
                </div>
                <span className="hidden sm:inline">Admin</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1 flex-1">
                {/* Dashboard - standalone */}
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                    pathname === '/admin'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {/* Data Dropdown */}
                <NavDropdown
                  name="data"
                  label="Data"
                  icon={CubeIcon}
                  items={dataTools}
                  isOpen={openDropdown === 'data'}
                  onToggle={() => toggleDropdown('data')}
                  isActive={isGroupActive(dataTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  isItemActive={isActive}
                />

                {/* Users Dropdown */}
                <NavDropdown
                  name="users"
                  label="Användare"
                  icon={UsersIcon}
                  items={userTools}
                  isOpen={openDropdown === 'users'}
                  onToggle={() => toggleDropdown('users')}
                  isActive={isGroupActive(userTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  isItemActive={isActive}
                />

                {/* Marketing Dropdown */}
                <NavDropdown
                  name="marketing"
                  label="Marketing"
                  icon={PhotoIcon}
                  items={marketingTools}
                  isOpen={openDropdown === 'marketing'}
                  onToggle={() => toggleDropdown('marketing')}
                  isActive={isGroupActive(marketingTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  isItemActive={isActive}
                />

                {/* Content Dropdown */}
                <NavDropdown
                  name="content"
                  label="Innehåll"
                  icon={BookOpenIcon}
                  items={contentTools}
                  isOpen={openDropdown === 'content'}
                  onToggle={() => toggleDropdown('content')}
                  isActive={isGroupActive(contentTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  isItemActive={isActive}
                />

                {/* Analytics Dropdown */}
                <NavDropdown
                  name="analytics"
                  label="Analytics"
                  icon={ChartBarIcon}
                  items={analyticsTools}
                  isOpen={openDropdown === 'analytics'}
                  onToggle={() => toggleDropdown('analytics')}
                  isActive={isGroupActive(analyticsTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  isItemActive={isActive}
                />

                {/* System Dropdown */}
                <NavDropdown
                  name="system"
                  label="System"
                  icon={CogIcon}
                  items={systemTools}
                  isOpen={openDropdown === 'system'}
                  onToggle={() => toggleDropdown('system')}
                  isActive={isGroupActive(systemTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  isItemActive={isActive}
                />
              </nav>

              {/* Right Actions */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                  title={darkMode ? 'Ljust läge' : 'Mörkt läge'}
                >
                  {darkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                </button>

                <Link
                  href="/"
                  target="_blank"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  <span>Sajt</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Logga ut</span>
                </button>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded"
                >
                  {mobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-700 bg-slate-800 max-h-[80vh] overflow-y-auto">
              <nav className="p-4 space-y-1">
                {/* Dashboard */}
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-sm ${
                    pathname === '/admin'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <HomeIcon className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>

                <MobileNavSection title="Data" items={dataTools} isActive={isActive} onClose={() => setMobileMenuOpen(false)} />
                <MobileNavSection title="Användare" items={userTools} isActive={isActive} onClose={() => setMobileMenuOpen(false)} />
                <MobileNavSection title="Marketing" items={marketingTools} isActive={isActive} onClose={() => setMobileMenuOpen(false)} />
                <MobileNavSection title="Innehåll" items={contentTools} isActive={isActive} onClose={() => setMobileMenuOpen(false)} />
                <MobileNavSection title="Analytics" items={analyticsTools} isActive={isActive} onClose={() => setMobileMenuOpen(false)} />
                <MobileNavSection title="System" items={systemTools} isActive={isActive} onClose={() => setMobileMenuOpen(false)} />
              </nav>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-48px)]">
          {children}
        </main>
      </div>
    </div>
  )
}
