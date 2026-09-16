// About GRIET — Gokaraju Rangaraju Institute of Engineering and Technology
// Affiliated to JNTUH | NAAC Accredited | Bachupally, Hyderabad, Telangana
// https://griet.ac.in
//
// Some quick info I looked up for the "About" pages in Settings/Setup.

export const GRIET_COLLEGE_INFO = {
  name: 'Gokaraju Rangaraju Institute of Engineering and Technology',
  shortName: 'GRIET',
  location: 'Bachupally, Hyderabad, Telangana 500090',
  affiliatedTo: 'Jawaharlal Nehru Technological University, Hyderabad (JNTUH)',
  established: 1997,
  website: 'https://griet.ac.in',
  phone: '+91 40 2304 2755',
  email: 'info@griet.ac.in',
} as const

export const GRIET_FOUNDERS = [
  {
    name: 'Late Shri Gokaraju Rangaraju',
    role: 'Founder',
    description: 'Visionary educationist and philanthropist who established GRIET in 1997 with the mission of providing quality technical education in Telangana.',
  },
  {
    name: 'Dr. Gokaraju Ganga Raju',
    role: 'Founder & Chairman',
    description: 'Son of Late Shri Gokaraju Rangaraju, Dr. Ganga Raju continues to lead the GRIET group of institutions, driving academic excellence and infrastructure development.',
  },
] as const

export const APP_BUILDER = {
  name: 'Mohammed Anasuddin Zaid',
  role: 'Student Developer',
  note: 'This is an independent student project — not affiliated with or endorsed by GRIET.',
} as const

// GRIET's current departments. Nothing here is hardcoded as a hard limit —
// you can add any branch you want in the setup wizard.
export const GRIET_BRANCHES = [
  { id: 'CSE', label: 'CSE', fullName: 'Computer Science & Engineering' },
  { id: 'CSE-AIML', label: 'CSE-AIML', fullName: 'CSE (AI & Machine Learning)' },
  { id: 'CSE-CSBS', label: 'CSE-CSBS', fullName: 'CSE (Computer Science & Business Systems)' },
  { id: 'CSE-DS', label: 'CSE-DS', fullName: 'CSE (Data Science)' },
  { id: 'ECE', label: 'ECE', fullName: 'Electronics & Communication Engineering' },
  { id: 'EEE', label: 'EEE', fullName: 'Electrical & Electronics Engineering' },
  { id: 'IT', label: 'IT', fullName: 'Information Technology' },
  { id: 'Civil', label: 'Civil', fullName: 'Civil Engineering' },
  { id: 'Mechanical', label: 'Mechanical', fullName: 'Mechanical Engineering' }
]

export const YEARS = ['I', 'II', 'III', 'IV']
export const SEMESTERS = ['I', 'II']
export const ACADEMIC_YEARS = ['2025-26', '2026-27', '2027-28']

// Configurable sections — never assume every department has A/B/C/D/H.
// Students can add arbitrary section identifiers like I, J, K, or "CSE-A".
export const DEFAULT_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export const ABSENCE_REASONS = [
  { id: 'SICK', label: 'Sick' },
  { id: 'PERSONAL', label: 'Personal' },
  { id: 'FAMILY', label: 'Family' },
  { id: 'TRAVEL', label: 'Travel' },
  { id: 'EMERGENCY', label: 'Emergency' },
  { id: 'COLLEGE_ACTIVITY', label: 'College activity' },
  { id: 'OTHER', label: 'Other' }
] as const

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const SLOT_TYPES = ['LECTURE', 'LAB', 'TUTORIAL', 'ACTIVITY', 'FREE', 'OTHER'] as const

export const ATTENDANCE_STATUSES = [
  { id: 'PRESENT', label: 'Present', color: '#16a34a' },
  { id: 'ABSENT', label: 'Absent', color: '#dc2626' },
  { id: 'EXCUSED', label: 'Excused', color: '#d97706' },
  { id: 'NOT_HELD', label: 'Not held', color: '#6b7280' },
  { id: 'ONLINE', label: 'Online', color: '#0284c7' }
] as const