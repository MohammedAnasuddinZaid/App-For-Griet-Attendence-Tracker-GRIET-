// GRIET's current academic departments (as of AY 2026-27).
// These branches are editable/configurable by the user — not hardcoded limits.
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
export const ACADEMIC_YEARS = ['2026-27', '2025-26', '2027-28']

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