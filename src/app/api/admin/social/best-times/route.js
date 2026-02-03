import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Best posting times for Swedish audience based on research
// These are general guidelines for food/lifestyle content in Sweden
const BEST_TIMES = {
  instagram: {
    weekday: [
      { time: '07:00', score: 85, reason: 'Morgonpendling' },
      { time: '12:00', score: 90, reason: 'Lunchpaus' },
      { time: '17:00', score: 75, reason: 'Hemresa' },
      { time: '19:00', score: 95, reason: 'Kvällssurfande' },
      { time: '21:00', score: 80, reason: 'Före sänggående' }
    ],
    weekend: [
      { time: '10:00', score: 90, reason: 'Sen morgon' },
      { time: '14:00', score: 85, reason: 'Eftermiddag' },
      { time: '19:00', score: 80, reason: 'Kvällstid' }
    ],
    bestDays: ['Onsdag', 'Torsdag', 'Söndag'],
    peakTime: '19:00',
    peakDay: 'Onsdag'
  },
  facebook: {
    weekday: [
      { time: '09:00', score: 80, reason: 'Arbetsstart' },
      { time: '13:00', score: 90, reason: 'Lunch' },
      { time: '16:00', score: 75, reason: 'Eftermiddag' },
      { time: '20:00', score: 85, reason: 'Kvällstid' }
    ],
    weekend: [
      { time: '11:00', score: 85, reason: 'Förmiddag' },
      { time: '15:00', score: 80, reason: 'Eftermiddag' },
      { time: '20:00', score: 75, reason: 'Kväll' }
    ],
    bestDays: ['Tisdag', 'Onsdag', 'Fredag'],
    peakTime: '13:00',
    peakDay: 'Tisdag'
  },
  tiktok: {
    weekday: [
      { time: '07:00', score: 75, reason: 'Morgon' },
      { time: '12:00', score: 80, reason: 'Lunch' },
      { time: '19:00', score: 90, reason: 'Primetime' },
      { time: '22:00', score: 95, reason: 'Sen kväll' }
    ],
    weekend: [
      { time: '11:00', score: 85, reason: 'Förmiddag' },
      { time: '20:00', score: 90, reason: 'Kväll' },
      { time: '23:00', score: 80, reason: 'Sen natt' }
    ],
    bestDays: ['Tisdag', 'Torsdag', 'Fredag'],
    peakTime: '22:00',
    peakDay: 'Fredag'
  }
}

// Seasonal adjustments for food content in Sweden
const SEASONAL_TIPS = {
  spring: [
    'Fokusera på lätta sallader och nya grönsaker',
    'Grillsäsongen börjar - recept för utomhusmatlagning',
    'Påsk-relaterat innehåll i mars/april'
  ],
  summer: [
    'Semester-vänliga recept (snabba, enkla)',
    'Midsommar-tema i juni',
    'Kräftskiva i augusti',
    'Lägre engagemang - planera färre inlägg'
  ],
  autumn: [
    'Tillbaka-till-skolan matveckor',
    'Höstmat: soppor, grytor',
    'Halloween i oktober',
    'Engagemanget ökar igen'
  ],
  winter: [
    'Jul-förberedelser i december',
    'Nyårslöften om hälsosam mat i januari',
    'Semlor i februari',
    'Högsta engagemanget på året'
  ]
}

function getCurrentSeason() {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export async function GET(req) {
  try {
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin_session')
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform') || 'instagram'

    const currentSeason = getCurrentSeason()
    const platformData = BEST_TIMES[platform] || BEST_TIMES.instagram

    // Get current day to determine if weekday or weekend
    const today = new Date()
    const isWeekend = today.getDay() === 0 || today.getDay() === 6
    const timesToday = isWeekend ? platformData.weekend : platformData.weekday

    // Find next recommended posting time
    const currentHour = today.getHours()
    const currentMinutes = today.getMinutes()
    const currentTimeNum = currentHour * 60 + currentMinutes

    const nextRecommendedTime = timesToday.find(t => {
      const [hours] = t.time.split(':').map(Number)
      return hours * 60 > currentTimeNum
    }) || timesToday[0]

    return NextResponse.json({
      success: true,
      platform,
      bestTimes: platformData,
      isWeekend,
      timesToday,
      nextRecommendedTime,
      currentSeason,
      seasonalTips: SEASONAL_TIPS[currentSeason],
      generalTips: [
        'Posta konsekvent - minst 3-4 gånger per vecka',
        'Använd svenska hashtags för lokal räckvidd',
        'Interagera med följare inom första timmen',
        'Använd Stories för snabba uppdateringar',
        'Dela recept-videor för högst engagemang'
      ]
    })
  } catch (error) {
    console.error('Failed to get best posting times:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
