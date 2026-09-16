// Telangana government 2026 holiday calendar data.
// Source: https://www.telangana.gov.in/downloads/calendar-2026/
//
// IMPORTANT: These are STATE HOLIDAY CANDIDATES. A Telangana state holiday is
// NOT automatically guaranteed to be a GRIET closure. The UI must label such
// events as "State Holiday — verify GRIET schedule" until a GRIET-specific
// rule/override confirms the college is closed.
import type { CalendarEvent } from '@/types'

interface HolidayCandidate {
  date: string
  title: string
  note: string
}

const HOLIDAYS: HolidayCandidate[] = [
  { date: '2026-01-01', title: 'New Year', note: 'State holiday candidate' },
  { date: '2026-01-14', title: 'Bhogi', note: 'State holiday candidate' },
  { date: '2026-01-15', title: 'Sankranti / Pongal', note: 'State holiday candidate' },
  { date: '2026-01-16', title: 'Kanumu', note: 'State holiday candidate' },
  { date: '2026-01-17', title: 'Shab-e-Meraj', note: 'State holiday candidate' },
  { date: '2026-01-26', title: 'Republic Day', note: 'State holiday candidate' },
  { date: '2026-02-15', title: 'Mahashivarathri', note: 'State holiday candidate' },
  { date: '2026-03-03', title: 'Holi', note: 'State holiday candidate' },
  { date: '2026-03-10', title: 'Shahadat HZT Ali', note: 'State holiday candidate' },
  { date: '2026-03-13', title: 'Jumatul-Vida', note: 'State holiday candidate' },
  { date: '2026-03-17', title: 'Shab-e-Qader', note: 'State holiday candidate' },
  { date: '2026-03-19', title: 'Ugadi', note: 'State holiday candidate' },
  { date: '2026-03-21', title: 'Ramzan / Eid-ul-Fitr', note: 'State holiday candidate' },
  { date: '2026-03-22', title: 'Following day of Ramzan / Eid-ul-Fitr', note: 'State holiday candidate' },
  { date: '2026-03-27', title: 'Sri Rama Navami', note: 'State holiday candidate' },
  { date: '2026-03-31', title: 'Mahaveer Jayanthi', note: 'State holiday candidate' },
  { date: '2026-04-03', title: 'Good Friday', note: 'State holiday candidate' },
  { date: '2026-04-05', title: 'Babu Jagjivan Ram Birthday', note: 'State holiday candidate' },
  { date: '2026-04-14', title: 'Dr. B.R. Ambedkar Birthday', note: 'State holiday candidate' },
  { date: '2026-04-20', title: 'Basava Jayanthi', note: 'State holiday candidate' },
  { date: '2026-05-01', title: 'Buddha Purnima', note: 'State holiday candidate' },
  { date: '2026-05-27', title: 'Eid-ul-Adha / Bakrid', note: 'State holiday candidate' },
  { date: '2026-06-04', title: 'Eid-e-Ghadeer', note: 'State holiday candidate' },
  { date: '2026-06-25', title: '9th Moharram', note: 'State holiday candidate' },
  { date: '2026-06-26', title: 'Moharram', note: 'State holiday candidate' },
  { date: '2026-07-16', title: 'Ratha Yatra', note: 'State holiday candidate' },
  { date: '2026-08-04', title: 'Arbayeen', note: 'State holiday candidate' },
  { date: '2026-08-10', title: 'Bonalu', note: 'State holiday candidate' },
  { date: '2026-08-15', title: 'Independence Day / Parsi New Year', note: 'State holiday candidate' },
  { date: '2026-08-21', title: 'Varalakshmi Vratham', note: 'State holiday candidate' },
  { date: '2026-08-26', title: 'Eid Milad-un-Nabi', note: 'State holiday candidate' },
  { date: '2026-08-28', title: 'Sravana Purnima / Rakhi Purnima', note: 'State holiday candidate' },
  { date: '2026-09-04', title: 'Sri Krishnashtami', note: 'State holiday candidate' },
  { date: '2026-09-14', title: 'Vinayaka Chavithi', note: 'State holiday candidate' },
  { date: '2026-09-23', title: 'Yazdahum Shareef', note: 'State holiday candidate' },
  { date: '2026-10-02', title: 'Mahatma Gandhi Jayanthi', note: 'State holiday candidate' },
  { date: '2026-10-18', title: 'Saddula Bathukamma', note: 'State holiday candidate' },
  { date: '2026-10-19', title: 'Maharnavami', note: 'State holiday candidate' },
  { date: '2026-10-20', title: 'Vijaya Dasami (Dussehra)', note: 'State holiday candidate' },
  { date: '2026-10-21', title: 'Following day of Vijaya Dasami', note: 'State holiday candidate' },
  { date: '2026-10-26', title: 'Birthday of Hazrath Syed Mohd. Juvanpuri', note: 'State holiday candidate' },
  { date: '2026-11-08', title: 'Naraka Chathurdhi / Deepavali', note: 'State holiday candidate' },
  { date: '2026-11-24', title: 'Karthika Pournami', note: 'State holiday candidate' },
  { date: '2026-12-24', title: 'Christmas Eve', note: 'State holiday candidate' },
  { date: '2026-12-25', title: 'Christmas', note: 'State holiday candidate' },
  { date: '2026-12-26', title: 'Boxing Day / Hazrath Ali Birthday', note: 'State holiday candidate' }
]

export function getTelanganaHolidaySeedEvents(): CalendarEvent[] {
  const now = new Date().toISOString()
  return HOLIDAYS.map((h) => ({
    id: `tg-${h.date}`,
    date: h.date,
    title: h.title,
    description: `${h.note}. Not automatically a GRIET closure — verify GRIET schedule before relying on this.`,
    eventType: 'HOLIDAY' as const,
    source: 'TELANGANA_STATE_CALENDAR' as const,
    sourcePriority: 4,
    affectsAttendance: false,
    isCollegeClosed: false,
    isInstructionalDay: false,
    isManualOverride: false,
    createdAt: now,
    updatedAt: now
  }))
}