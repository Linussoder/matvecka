'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

// Clean Heroicons - consistent outline style matching pa1.png
const HomeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const DocumentIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)

const CubeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
)

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

const CreditCardIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
)

const ChartBarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)

const MegaphoneIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
  </svg>
)

const BookOpenIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
)

const CogIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const UserGroupIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
)

const CurrencyDollarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ChartPieIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
  </svg>
)

const BeakerIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 15.5m14.8-.2l-.71-1.422a2.25 2.25 0 00-1.612-1.28l-1.628-.244M5 15.5l-.71-1.422a2.25 2.25 0 01-1.612-1.28l-1.628-.244M5 15.5v2.756c0 .813.422 1.568 1.116 1.998l1.004.602A2.25 2.25 0 008.25 21h7.5a2.25 2.25 0 001.13-.144l1.004-.602A2.25 2.25 0 0019 18.756V15.5" />
  </svg>
)

const EnvelopeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
)

const CalendarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
)

const BellIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const TagIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
)

const SparklesIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
)

const FlagIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
  </svg>
)

const ServerIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" />
  </svg>
)

const PencilSquareIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
)

const SunIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
)

const MoonIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
)

const Bars3Icon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)

const XMarkIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ArrowTopRightOnSquareIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
)

const ArrowRightOnRectangleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)

const ChevronDownIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
)

// ============================================
// SIMPLIFIED NAVIGATION STRUCTURE
// ============================================

// Data tools - simple, keep as is
const dataTools = [
  { href: '/admin/flyers', label: 'Reklamblad', icon: DocumentIcon },
  { href: '/admin/products', label: 'Produkter', icon: CubeIcon },
  { href: '/admin/prices', label: 'Priser', icon: CurrencyDollarIcon },
]

// User tools - simple, keep as is
const userTools = [
  { href: '/admin/users', label: 'Användare', icon: UsersIcon },
  { href: '/admin/subscriptions', label: 'Prenumerationer', icon: CreditCardIcon },
  { href: '/admin/segments', label: 'Segment', icon: UserGroupIcon },
]

// Analytics - CONSOLIDATED (was 7 separate pages)
const analyticsTools = [
  { href: '/admin/analytics', label: 'Översikt', icon: ChartBarIcon },
  { href: '/admin/analytics?tab=live', label: 'Realtid', icon: ChartPieIcon },
  { href: '/admin/analytics?tab=revenue', label: 'Intäkter', icon: CreditCardIcon },
  { href: '/admin/analytics?tab=cohorts', label: 'Kohorter', icon: UserGroupIcon },
  { href: '/admin/analytics?tab=experiments', label: 'A/B Tester', icon: BeakerIcon },
]

// Recipes - CONSOLIDATED (was 4 separate pages)
const recipeTools = [
  { href: '/admin/recipes', label: 'Hantering', icon: BookOpenIcon },
  { href: '/admin/recipes?tab=quality', label: 'Kvalitet', icon: ChartBarIcon },
  { href: '/admin/recipes?tab=verified', label: 'Verifierade', icon: SparklesIcon },
  { href: '/admin/recipes?tab=ingredients', label: 'Ingredienser', icon: CubeIcon },
]

// Marketing - CONSOLIDATED (was 10+ separate pages including automations)
const marketingTools = [
  { href: '/admin/marketing', label: 'Dashboard', icon: MegaphoneIcon },
  { href: '/admin/marketing?tab=social', label: 'Social', icon: CalendarIcon },
  { href: '/admin/marketing?tab=email', label: 'Email', icon: EnvelopeIcon },
  { href: '/admin/marketing?tab=ads', label: 'Ads', icon: CurrencyDollarIcon },
  { href: '/admin/marketing?tab=push', label: 'Push', icon: BellIcon },
  { href: '/admin/marketing?tab=promo', label: 'Kampanjkoder', icon: TagIcon },
  { href: '/admin/marketing?tab=calendar', label: 'Kalender', icon: CalendarIcon },
  { href: '/admin/marketing?tab=influencers', label: 'Influencers', icon: UsersIcon },
]

// System tools - keep as is
const systemTools = [
  { href: '/admin/api-usage', label: 'API-användning', icon: ChartBarIcon },
  { href: '/admin/flags', label: 'Feature Flags', icon: FlagIcon },
  { href: '/admin/deployments', label: 'Deployment', icon: ServerIcon },
  { href: '/admin/content', label: 'Innehåll', icon: PencilSquareIcon },
]

// Reusable dropdown component
function NavDropdown({ label, icon: Icon, items, isOpen, onToggle, isActive, onLinkClick, pathname }) {
  const isItemActive = (href) => {
    if (href.includes('?')) {
      return pathname === href || pathname.startsWith(href.split('?')[0])
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

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
        <div className="absolute top-full left-0 mt-1 w-48 bg-slate-800 dark:bg-slate-900 rounded-lg shadow-xl border border-slate-700 py-1 z-50">
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

// Reusable mobile nav section
function MobileNavSection({ title, items, pathname, onClose }) {
  const isActive = (href) => {
    if (href.includes('?')) {
      return pathname === href || pathname.startsWith(href.split('?')[0])
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

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

  const isGroupActive = (items) => items.some(item => {
    if (item.href.includes('?')) {
      return pathname === item.href || pathname.startsWith(item.href.split('?')[0])
    }
    return pathname === item.href || pathname.startsWith(item.href + '/')
  })

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
        {/* Navigation Header */}
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
                  label="Data"
                  icon={CubeIcon}
                  items={dataTools}
                  isOpen={openDropdown === 'data'}
                  onToggle={() => toggleDropdown('data')}
                  isActive={isGroupActive(dataTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  pathname={pathname}
                />

                {/* Users Dropdown */}
                <NavDropdown
                  label="Användare"
                  icon={UsersIcon}
                  items={userTools}
                  isOpen={openDropdown === 'users'}
                  onToggle={() => toggleDropdown('users')}
                  isActive={isGroupActive(userTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  pathname={pathname}
                />

                {/* Analytics Dropdown - CONSOLIDATED */}
                <NavDropdown
                  label="Analytics"
                  icon={ChartBarIcon}
                  items={analyticsTools}
                  isOpen={openDropdown === 'analytics'}
                  onToggle={() => toggleDropdown('analytics')}
                  isActive={isGroupActive(analyticsTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  pathname={pathname}
                />

                {/* Recipes Dropdown - CONSOLIDATED */}
                <NavDropdown
                  label="Recept"
                  icon={BookOpenIcon}
                  items={recipeTools}
                  isOpen={openDropdown === 'recipes'}
                  onToggle={() => toggleDropdown('recipes')}
                  isActive={isGroupActive(recipeTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  pathname={pathname}
                />

                {/* Marketing Dropdown - CONSOLIDATED */}
                <NavDropdown
                  label="Marketing"
                  icon={MegaphoneIcon}
                  items={marketingTools}
                  isOpen={openDropdown === 'marketing'}
                  onToggle={() => toggleDropdown('marketing')}
                  isActive={isGroupActive(marketingTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  pathname={pathname}
                />

                {/* System Dropdown */}
                <NavDropdown
                  label="System"
                  icon={CogIcon}
                  items={systemTools}
                  isOpen={openDropdown === 'system'}
                  onToggle={() => toggleDropdown('system')}
                  isActive={isGroupActive(systemTools)}
                  onLinkClick={() => setOpenDropdown(null)}
                  pathname={pathname}
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
            <div className="lg:hidden border-t border-slate-700 bg-slate-800 dark:bg-slate-900 max-h-[80vh] overflow-y-auto">
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

                <MobileNavSection title="Data" items={dataTools} pathname={pathname} onClose={() => setMobileMenuOpen(false)} />
                <MobileNavSection title="Användare" items={userTools} pathname={pathname} onClose={() => setMobileMenuOpen(false)} />
                <MobileNavSection title="Analytics" items={analyticsTools} pathname={pathname} onClose={() => setMobileMenuOpen(false)} />
                <MobileNavSection title="Recept" items={recipeTools} pathname={pathname} onClose={() => setMobileMenuOpen(false)} />
                <MobileNavSection title="Marketing" items={marketingTools} pathname={pathname} onClose={() => setMobileMenuOpen(false)} />
                <MobileNavSection title="System" items={systemTools} pathname={pathname} onClose={() => setMobileMenuOpen(false)} />
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
