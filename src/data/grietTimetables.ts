import type { TimetableSlot } from '@/types'

export interface TimetableMeta {
  year: string
  semester: string
  branch: string
  section: string
  academicYear: string
}

type SlotDraft = Omit<TimetableSlot, 'id' | 'timetableId' | 'createdAt' | 'updatedAt'>

export const GRIET_BRANCH_LIST = [
  { id: 'CSE', label: 'CSE', fullName: 'Computer Science & Engineering' },
  { id: 'CSE-AIML', label: 'CSE-AIML', fullName: 'CSE (AI & Machine Learning)' },
  { id: 'CSE-CSBS', label: 'CSE-CSBS', fullName: 'CSE (Cyber Security & Business Systems)' },
  { id: 'CSE-DS', label: 'CSE-DS', fullName: 'CSE (Data Science)' },
  { id: 'ECE', label: 'ECE', fullName: 'Electronics & Communication Engineering' },
  { id: 'EEE', label: 'EEE', fullName: 'Electrical & Electronics Engineering' },
  { id: 'IT', label: 'IT', fullName: 'Information Technology' },
  { id: 'Civil', label: 'Civil', fullName: 'Civil Engineering' },
  { id: 'Mechanical', label: 'Mechanical', fullName: 'Mechanical Engineering' },
] as const

const TIME = {
  P1: { start: '09:00', end: '09:50' },
  P2: { start: '09:55', end: '10:45' },
  P3: { start: '10:50', end: '11:40' },
  P4: { start: '12:00', end: '12:50' },
  P5: { start: '12:55', end: '13:45' },
  P6: { start: '14:30', end: '15:20' },
  P7: { start: '15:20', end: '16:10' },
} as const

const T: Record<number, { start: string; end: string }> = {
  1: TIME.P1, 2: TIME.P2, 3: TIME.P3, 4: TIME.P4, 5: TIME.P5, 6: TIME.P6, 7: TIME.P7,
} as const

function lec(day: number, period: 1|2|3|4|5, subject: string, code: string, faculty: string, room: string): SlotDraft {
  const t = T[period] ?? { start: '09:00', end: '09:50' }
  return { dayOfWeek: day, startTime: t.start, endTime: t.end, subjectName: subject, subjectCode: code, faculty, room, slotType: 'LECTURE', periodNumber: period, isLab: false, isActive: true, isMakeup: false }
}

function labSlot(day: number, subject: string, code: string, faculty: string, room: string): SlotDraft {
  return { dayOfWeek: day, startTime: TIME.P6.start, endTime: TIME.P7.end, subjectName: subject, subjectCode: code, faculty, room, slotType: 'LAB', periodNumber: 6, isLab: true, isActive: true, isMakeup: false }
}

function freeSlot(day: number, period: number): SlotDraft {
  const t = T[period] ?? { start: '09:00', end: '09:50' }
  return { dayOfWeek: day, startTime: t.start, endTime: t.end, subjectName: 'Free', slotType: 'FREE', periodNumber: period, isLab: false, isActive: true, isMakeup: false }
}

function buildWeek(
  room: string,
  defs: Array<{
    day: number
    periods: { p: 1|2|3|4|5; sub: string; code: string; fac: string }[]
    lab?: { sub: string; code: string; fac: string }
  }>
): SlotDraft[] {
  const out: SlotDraft[] = []
  for (const def of defs) {
    for (const s of def.periods) {
      out.push(lec(def.day, s.p, s.sub, s.code, s.fac, room))
    }
    if (def.lab) {
      out.push(labSlot(def.day, def.lab.sub, def.lab.code, def.lab.fac, room))
    } else {
      out.push(freeSlot(def.day, 6))
      out.push(freeSlot(def.day, 7))
    }
  }
  return out
}

// ============================================================================
//  YEAR I — COMMON CURRICULUM FOR ALL BRANCHES (JNTUH R25)
// ============================================================================

function yearISemI(): SlotDraft[] {
  return buildWeek('A-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Engineering Mathematics – I', code: 'MA101', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Engineering Chemistry', code: 'CH101', fac: 'Dr. P. Latha' },
      { p: 3, sub: 'Programming for Problem Solving', code: 'CS101', fac: 'Mrs. B. Swathi' },
      { p: 4, sub: 'English – I', code: 'HS101', fac: 'Mr. V. Ravi Kumar' },
      { p: 5, sub: 'Engineering Physics', code: 'PH101', fac: 'Dr. M. Sunitha' },
    ], lab: { sub: 'Engineering Chemistry Lab', code: 'CH101L', fac: 'Dr. P. Latha' } },
    { day: 2, periods: [
      { p: 1, sub: 'Programming for Problem Solving', code: 'CS101', fac: 'Mrs. B. Swathi' },
      { p: 2, sub: 'Engineering Mathematics – I', code: 'MA101', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'English – I', code: 'HS101', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Engineering Chemistry', code: 'CH101', fac: 'Dr. P. Latha' },
      { p: 5, sub: 'Engineering Physics', code: 'PH101', fac: 'Dr. M. Sunitha' },
    ] },
    { day: 3, periods: [
      { p: 1, sub: 'Engineering Physics', code: 'PH101', fac: 'Dr. M. Sunitha' },
      { p: 2, sub: 'English – I', code: 'HS101', fac: 'Mr. V. Ravi Kumar' },
      { p: 3, sub: 'Engineering Mathematics – I', code: 'MA101', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Programming for Problem Solving', code: 'CS101', fac: 'Mrs. B. Swathi' },
      { p: 5, sub: 'Engineering Chemistry', code: 'CH101', fac: 'Dr. P. Latha' },
    ], lab: { sub: 'Programming Lab', code: 'CS101L', fac: 'Mrs. B. Swathi' } },
    { day: 4, periods: [
      { p: 1, sub: 'Engineering Chemistry', code: 'CH101', fac: 'Dr. P. Latha' },
      { p: 2, sub: 'Engineering Physics', code: 'PH101', fac: 'Dr. M. Sunitha' },
      { p: 3, sub: 'English – I', code: 'HS101', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Engineering Mathematics – I', code: 'MA101', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Programming for Problem Solving', code: 'CS101', fac: 'Mrs. B. Swathi' },
    ], lab: { sub: 'Engineering Physics Lab', code: 'PH101L', fac: 'Dr. M. Sunitha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Engineering Mathematics – I', code: 'MA101', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Engineering Chemistry', code: 'CH101', fac: 'Dr. P. Latha' },
      { p: 3, sub: 'Engineering Physics', code: 'PH101', fac: 'Dr. M. Sunitha' },
      { p: 4, sub: 'Programming for Problem Solving', code: 'CS101', fac: 'Mrs. B. Swathi' },
      { p: 5, sub: 'English – I', code: 'HS101', fac: 'Mr. V. Ravi Kumar' },
    ] },
  ])
}

function yearISemII(): SlotDraft[] {
  return buildWeek('A-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Engineering Mathematics – II', code: 'MA102', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Professional Communication – I', code: 'HS102', fac: 'Mr. V. Ravi Kumar' },
      { p: 3, sub: 'Basic Electrical & Electronics Engineering', code: 'EE101', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Workshop Practice', code: 'ME101', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Engineering Drawing', code: 'ME102', fac: 'Mr. K. Suresh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Basic Electrical & Electronics Engineering', code: 'EE101', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Engineering Mathematics – II', code: 'MA102', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Workshop Practice', code: 'ME101', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Engineering Drawing', code: 'ME102', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Professional Communication – I', code: 'HS102', fac: 'Mr. V. Ravi Kumar' },
    ], lab: { sub: 'Workshop Practice Lab', code: 'ME101L', fac: 'Mr. K. Suresh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Professional Communication – I', code: 'HS102', fac: 'Mr. V. Ravi Kumar' },
      { p: 2, sub: 'Engineering Drawing', code: 'ME102', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA102', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Basic Electrical & Electronics Engineering', code: 'EE101', fac: 'Dr. S. Ranganath' },
      { p: 5, sub: 'Workshop Practice', code: 'ME101', fac: 'Mr. K. Suresh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Engineering Drawing', code: 'ME102', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Workshop Practice', code: 'ME101', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Professional Communication – I', code: 'HS102', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA102', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Basic Electrical & Electronics Engineering', code: 'EE101', fac: 'Dr. S. Ranganath' },
    ], lab: { sub: 'Engineering Drawing Lab', code: 'ME102L', fac: 'Mr. K. Suresh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Engineering Mathematics – II', code: 'MA102', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Basic Electrical & Electronics Engineering', code: 'EE101', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Professional Communication – I', code: 'HS102', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Workshop Practice', code: 'ME101', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Engineering Drawing', code: 'ME102', fac: 'Mr. K. Suresh' },
    ] },
  ])
}

// ============================================================================
//  YEAR II — BRANCH-SPECIFIC SEMESTER I TIMETABLES
// ============================================================================

function yearIISemICSE(): SlotDraft[] {
  return buildWeek('CSE-301', [
    { day: 1, periods: [
      { p: 1, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 3, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
    ], lab: { sub: 'Data Structures Lab', code: 'CS201L', fac: 'Dr. A. Ramesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 2, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 3, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 3, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 4, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ], lab: { sub: 'Digital Logic Lab', code: 'CS202L', fac: 'Mrs. S. Priya' } },
    { day: 5, periods: [
      { p: 1, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 2, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
    ] },
  ])
}

function yearIISemICSEAIML(): SlotDraft[] {
  return buildWeek('CSE-AIML-401', [
    { day: 1, periods: [
      { p: 1, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 3, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
    ], lab: { sub: 'Data Structures Lab', code: 'CS201L', fac: 'Dr. A. Ramesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 2, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 3, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 3, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 4, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ], lab: { sub: 'Digital Logic Lab', code: 'CS202L', fac: 'Mrs. S. Priya' } },
    { day: 5, periods: [
      { p: 1, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 2, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
    ] },
  ])
}

function yearIISemICSECSBS(): SlotDraft[] {
  return buildWeek('CSE-CSBS-402', [
    { day: 1, periods: [
      { p: 1, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 3, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'Business Economics', code: 'HS205', fac: 'Mrs. N. Lavanya' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'Business Economics', code: 'HS205', fac: 'Mrs. N. Lavanya' },
      { p: 4, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
    ], lab: { sub: 'Data Structures Lab', code: 'CS201L', fac: 'Dr. A. Ramesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 2, sub: 'Business Economics', code: 'HS205', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 3, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 4, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'Business Economics', code: 'HS205', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Digital Logic Lab', code: 'CS202L', fac: 'Mrs. S. Priya' } },
    { day: 5, periods: [
      { p: 1, sub: 'Business Economics', code: 'HS205', fac: 'Mrs. N. Lavanya' },
      { p: 2, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
    ] },
  ])
}

function yearIISemICSEDS(): SlotDraft[] {
  return buildWeek('CSE-DS-403', [
    { day: 1, periods: [
      { p: 1, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 3, sub: 'Probability & Statistics', code: 'MA202', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Probability & Statistics', code: 'MA202', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
    ], lab: { sub: 'Data Structures Lab', code: 'CS201L', fac: 'Dr. A. Ramesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 2, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 3, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'Probability & Statistics', code: 'MA202', fac: 'Dr. K. Sridevi' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Probability & Statistics', code: 'MA202', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 3, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 4, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ], lab: { sub: 'Digital Logic Lab', code: 'CS202L', fac: 'Mrs. S. Priya' } },
    { day: 5, periods: [
      { p: 1, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 2, sub: 'Probability & Statistics', code: 'MA202', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Data Structures', code: 'CS201', fac: 'Dr. A. Ramesh' },
    ] },
  ])
}

function yearIISemIIT(): SlotDraft[] {
  return buildWeek('IT-301', [
    { day: 1, periods: [
      { p: 1, sub: 'Data Structures', code: 'CS201', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 3, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'OOP through Java', code: 'CS203', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Data Structures', code: 'CS201', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
    ], lab: { sub: 'Data Structures Lab', code: 'CS201L', fac: 'Dr. Hema Latha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 2, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 3, sub: 'Data Structures', code: 'CS201', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'OOP through Java', code: 'CS203', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 4, sub: 'Data Structures', code: 'CS201', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ], lab: { sub: 'Digital Logic Lab', code: 'CS202L', fac: 'Mrs. S. Priya' } },
    { day: 5, periods: [
      { p: 1, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 2, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'OOP through Java', code: 'CS203', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Digital Logic Design', code: 'CS202', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Data Structures', code: 'CS201', fac: 'Dr. Hema Latha' },
    ] },
  ])
}

function yearIISemIECE(): SlotDraft[] {
  return buildWeek('ECE-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Network Analysis', code: 'EC201', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Analog Electronics', code: 'EC202', fac: 'Mrs. R. Sujatha' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Analog Electronics', code: 'EC202', fac: 'Mrs. R. Sujatha' },
      { p: 2, sub: 'Network Analysis', code: 'EC201', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Analog Electronics Lab', code: 'EC202L', fac: 'Mrs. R. Sujatha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Network Analysis', code: 'EC201', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Analog Electronics', code: 'EC202', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 2, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 3, sub: 'Analog Electronics', code: 'EC202', fac: 'Mrs. R. Sujatha' },
      { p: 4, sub: 'Network Analysis', code: 'EC201', fac: 'Dr. G. Narsimha' },
      { p: 5, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Network Analysis Lab', code: 'EC201L', fac: 'Dr. G. Narsimha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Network Analysis', code: 'EC201', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Analog Electronics', code: 'EC202', fac: 'Mrs. R. Sujatha' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ] },
  ])
}

function yearIISemIEEEEE(): SlotDraft[] {
  return buildWeek('EEE-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Circuit Theory', code: 'EE201', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Electrical Machines – I', code: 'EE202', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Electrical Machines – I', code: 'EE202', fac: 'Mr. P. Ravi Teja' },
      { p: 2, sub: 'Circuit Theory', code: 'EE201', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Circuit Theory Lab', code: 'EE201L', fac: 'Dr. S. Ranganath' } },
    { day: 3, periods: [
      { p: 1, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Circuit Theory', code: 'EE201', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Electrical Machines – I', code: 'EE202', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 2, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 3, sub: 'Electrical Machines – I', code: 'EE202', fac: 'Mr. P. Ravi Teja' },
      { p: 4, sub: 'Circuit Theory', code: 'EE201', fac: 'Dr. S. Ranganath' },
      { p: 5, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Electrical Machines Lab', code: 'EE202L', fac: 'Mr. P. Ravi Teja' } },
    { day: 5, periods: [
      { p: 1, sub: 'Circuit Theory', code: 'EE201', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Electrical Machines – I', code: 'EE202', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ] },
  ])
}

function yearIISemICivil(): SlotDraft[] {
  return buildWeek('Civil-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Surveying', code: 'CV201', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Strength of Materials', code: 'CV202', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Strength of Materials', code: 'CV202', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Surveying', code: 'CV201', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Surveying Lab', code: 'CV201L', fac: 'Dr. L. Mahesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Surveying', code: 'CV201', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Strength of Materials', code: 'CV202', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 2, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 3, sub: 'Strength of Materials', code: 'CV202', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Surveying', code: 'CV201', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Strength of Materials Lab', code: 'CV202L', fac: 'Dr. L. Mahesh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Surveying', code: 'CV201', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Strength of Materials', code: 'CV202', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ] },
  ])
}

function yearIISemIMech(): SlotDraft[] {
  return buildWeek('Mech-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Engineering Mechanics', code: 'ME201', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Thermodynamics', code: 'ME202', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Thermodynamics', code: 'ME202', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Engineering Mechanics', code: 'ME201', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Engineering Mechanics Lab', code: 'ME201L', fac: 'Mr. K. Suresh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Engineering Mechanics', code: 'ME201', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Thermodynamics', code: 'ME202', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 2, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 3, sub: 'Thermodynamics', code: 'ME202', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Engineering Mechanics', code: 'ME201', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Thermodynamics Lab', code: 'ME202L', fac: 'Mr. K. Suresh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Engineering Mechanics', code: 'ME201', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Thermodynamics', code: 'ME202', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ] },
  ])
}

// ============================================================================
//  YEAR II — SEMESTER II (BRANCH-SPECIFIC ADVANCEMENTS)
// ============================================================================

function yearIISemIIBranchCseFamily(branch: string): SlotDraft[] {
  const roomByBranch: Record<string, string> = {
    CSE: 'CSE-301',
    'CSE-AIML': 'CSE-AIML-401',
    'CSE-CSBS': 'CSE-CSBS-402',
    'CSE-DS': 'CSE-DS-403',
  }
  const room = roomByBranch[branch] ?? 'CSE-301'
  const fifthSubject = branch === 'CSE-CSBS' ? 'Business Economics' : 'English – II'
  const fifthCode = branch === 'CSE-CSBS' ? 'HS205' : 'HS201'
  const fifthFac = branch === 'CSE-CSBS' ? 'Mrs. N. Lavanya' : 'Mr. V. Ravi Kumar'
  return buildWeek(room, [
    { day: 1, periods: [
      { p: 1, sub: 'Computer Organization', code: 'CS204', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Design & Analysis of Algorithms', code: 'CS205', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 5, sub: fifthSubject, code: fifthCode, fac: fifthFac },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Computer Organization', code: 'CS204', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: fifthSubject, code: fifthCode, fac: fifthFac },
      { p: 4, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Design & Analysis of Algorithms', code: 'CS205', fac: 'Dr. A. Ramesh' },
    ], lab: { sub: 'Java Programming Lab', code: 'CS203L', fac: 'Mr. T. Vijay' } },
    { day: 3, periods: [
      { p: 1, sub: 'Design & Analysis of Algorithms', code: 'CS205', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Computer Organization', code: 'CS204', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 5, sub: fifthSubject, code: fifthCode, fac: fifthFac },
    ] },
    { day: 4, periods: [
      { p: 1, sub: fifthSubject, code: fifthCode, fac: fifthFac },
      { p: 2, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
      { p: 3, sub: 'Design & Analysis of Algorithms', code: 'CS205', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'Computer Organization', code: 'CS204', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Operating Systems Lab', code: 'CS303L', fac: 'Mr. T. Vijay' } },
    { day: 5, periods: [
      { p: 1, sub: 'Computer Organization', code: 'CS204', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Design & Analysis of Algorithms', code: 'CS205', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'Discrete Mathematics', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: fifthSubject, code: fifthCode, fac: fifthFac },
      { p: 5, sub: 'OOP through Java', code: 'CS203', fac: 'Mr. T. Vijay' },
    ] },
  ])
}

function yearIISemIIECE(): SlotDraft[] {
  return buildWeek('ECE-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Signals & Systems', code: 'EC203', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Electromagnetic Theory', code: 'EC204', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Analog Electronics', code: 'EC202', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Analog Electronics', code: 'EC202', fac: 'Mrs. R. Sujatha' },
      { p: 2, sub: 'Signals & Systems', code: 'EC203', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Electromagnetic Theory', code: 'EC204', fac: 'Dr. G. Narsimha' },
    ], lab: { sub: 'Analog Electronics Lab', code: 'EC202L', fac: 'Mrs. R. Sujatha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Electromagnetic Theory', code: 'EC204', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Signals & Systems', code: 'EC203', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Analog Electronics', code: 'EC202', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 2, sub: 'Analog Electronics', code: 'EC202', fac: 'Mrs. R. Sujatha' },
      { p: 3, sub: 'Electromagnetic Theory', code: 'EC204', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Signals & Systems', code: 'EC203', fac: 'Dr. G. Narsimha' },
      { p: 5, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Network Analysis Lab', code: 'EC201L', fac: 'Dr. G. Narsimha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Signals & Systems', code: 'EC203', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Electromagnetic Theory', code: 'EC204', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 5, sub: 'Analog Electronics', code: 'EC202', fac: 'Mrs. R. Sujatha' },
    ] },
  ])
}

function yearIISemIIEEEEEE(): SlotDraft[] {
  return buildWeek('EEE-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Electromagnetic Fields', code: 'EE203', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Electrical Machines – II', code: 'EE204', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Electrical Machines – II', code: 'EE204', fac: 'Mr. P. Ravi Teja' },
      { p: 2, sub: 'Electromagnetic Fields', code: 'EE203', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Electrical Machines Lab', code: 'EE204L', fac: 'Mr. P. Ravi Teja' } },
    { day: 3, periods: [
      { p: 1, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Electromagnetic Fields', code: 'EE203', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Electrical Machines – II', code: 'EE204', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 2, sub: 'Electrical Machines – II', code: 'EE204', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Electromagnetic Fields', code: 'EE203', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Circuit Theory Lab', code: 'EE201L', fac: 'Dr. S. Ranganath' } },
    { day: 5, periods: [
      { p: 1, sub: 'Electromagnetic Fields', code: 'EE203', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Electrical Machines – II', code: 'EE204', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ] },
  ])
}

function yearIISemIICivil(): SlotDraft[] {
  return buildWeek('Civil-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Fluid Mechanics', code: 'CV203', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Structural Analysis – I', code: 'CV204', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Structural Analysis – I', code: 'CV204', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Fluid Mechanics', code: 'CV203', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Fluid Mechanics Lab', code: 'CV203L', fac: 'Dr. L. Mahesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Fluid Mechanics', code: 'CV203', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Structural Analysis – I', code: 'CV204', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 2, sub: 'Structural Analysis – I', code: 'CV204', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Fluid Mechanics', code: 'CV203', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Surveying Lab', code: 'CV201L', fac: 'Dr. L. Mahesh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Fluid Mechanics', code: 'CV203', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Structural Analysis – I', code: 'CV204', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ] },
  ])
}

function yearIISemIIMech(): SlotDraft[] {
  return buildWeek('Mech-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Manufacturing Processes', code: 'ME203', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Kinematics of Machines', code: 'ME204', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Kinematics of Machines', code: 'ME204', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Manufacturing Processes', code: 'ME203', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Manufacturing Lab', code: 'ME203L', fac: 'Mr. K. Suresh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Manufacturing Processes', code: 'ME203', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Kinematics of Machines', code: 'ME204', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 2, sub: 'Kinematics of Machines', code: 'ME204', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Manufacturing Processes', code: 'ME203', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Thermodynamics Lab', code: 'ME202L', fac: 'Mr. K. Suresh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Manufacturing Processes', code: 'ME203', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Kinematics of Machines', code: 'ME204', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Engineering Mathematics – II', code: 'MA201', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'English – II', code: 'HS201', fac: 'Mr. V. Ravi Kumar' },
      { p: 5, sub: 'Environmental Science', code: 'HS202', fac: 'Mrs. N. Lavanya' },
    ] },
  ])
}

function yearIISemII(branch: string): SlotDraft[] {
  if (branch === 'ECE') return yearIISemIIECE()
  if (branch === 'EEE') return yearIISemIIEEEEEE()
  if (branch === 'Civil') return yearIISemIICivil()
  if (branch === 'Mechanical') return yearIISemIIMech()
  return yearIISemIIBranchCseFamily(branch)
}

// ============================================================================
//  YEAR III — SEMESTER I (BRANCH-SPECIFIC)
// ============================================================================

function yearIIISemICSE(): SlotDraft[] {
  return buildWeek('CSE-301', [
    { day: 1, periods: [
      { p: 1, sub: 'Design & Analysis of Algorithms', code: 'CS301', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Computer Organization', code: 'CS302', fac: 'Mrs. S. Priya' },
      { p: 3, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'DBMS', code: 'CS304', fac: 'Dr. A. Ramesh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Design & Analysis of Algorithms', code: 'CS301', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'DBMS', code: 'CS304', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Computer Organization', code: 'CS302', fac: 'Mrs. S. Priya' },
    ], lab: { sub: 'Mini Project – I', code: 'CS399', fac: 'Dr. A. Ramesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Computer Organization', code: 'CS302', fac: 'Mrs. S. Priya' },
      { p: 2, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Design & Analysis of Algorithms', code: 'CS301', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'DBMS', code: 'CS304', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'DBMS', code: 'CS304', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 3, sub: 'Computer Organization', code: 'CS302', fac: 'Mrs. S. Priya' },
      { p: 4, sub: 'Design & Analysis of Algorithms', code: 'CS301', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'DBMS Lab', code: 'CS304L', fac: 'Dr. A. Ramesh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Design & Analysis of Algorithms', code: 'CS301', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Computer Organization', code: 'CS302', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'DBMS', code: 'CS304', fac: 'Dr. A. Ramesh' },
    ] },
  ])
}

function yearIIISemICSEAIML(): SlotDraft[] {
  return buildWeek('CSE-AIML-401', [
    { day: 1, periods: [
      { p: 1, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Deep Learning Fundamentals', code: 'AIML302', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'Computer Vision', code: 'AIML303', fac: 'Dr. R. Kiran' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Computer Vision', code: 'AIML303', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Deep Learning Fundamentals', code: 'AIML302', fac: 'Dr. R. Kiran' },
    ], lab: { sub: 'ML Lab', code: 'AIML301L', fac: 'Dr. R. Kiran' } },
    { day: 3, periods: [
      { p: 1, sub: 'Deep Learning Fundamentals', code: 'AIML302', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Computer Vision', code: 'AIML303', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Computer Vision', code: 'AIML303', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 3, sub: 'Deep Learning Fundamentals', code: 'AIML302', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Deep Learning Lab', code: 'AIML302L', fac: 'Dr. R. Kiran' } },
    { day: 5, periods: [
      { p: 1, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Deep Learning Fundamentals', code: 'AIML302', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Computer Vision', code: 'AIML303', fac: 'Dr. R. Kiran' },
    ] },
  ])
}

function yearIIISemICSECSBS(): SlotDraft[] {
  return buildWeek('CSE-CSBS-402', [
    { day: 1, periods: [
      { p: 1, sub: 'Data Analytics', code: 'CSBS301', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Financial Accounting', code: 'CSBS302', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Business Statistics', code: 'CSBS303', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Software Engineering', code: 'CS305', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Software Engineering', code: 'CS305', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Data Analytics', code: 'CSBS301', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Business Statistics', code: 'CSBS303', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Financial Accounting', code: 'CSBS302', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Data Analytics Lab', code: 'CSBS301L', fac: 'Dr. Hema Latha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Financial Accounting', code: 'CSBS302', fac: 'Mrs. N. Lavanya' },
      { p: 2, sub: 'Business Statistics', code: 'CSBS303', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Data Analytics', code: 'CSBS301', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Software Engineering', code: 'CS305', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Business Statistics', code: 'CSBS303', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Software Engineering', code: 'CS305', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'Financial Accounting', code: 'CSBS302', fac: 'Mrs. N. Lavanya' },
      { p: 4, sub: 'Data Analytics', code: 'CSBS301', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Software Engineering Lab', code: 'CS305L', fac: 'Dr. A. Ramesh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Data Analytics', code: 'CSBS301', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Software Engineering', code: 'CS305', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'Financial Accounting', code: 'CSBS302', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'Business Statistics', code: 'CSBS303', fac: 'Dr. K. Sridevi' },
    ] },
  ])
}

function yearIIISemICSEDS(): SlotDraft[] {
  return buildWeek('CSE-DS-403', [
    { day: 1, periods: [
      { p: 1, sub: 'Data Mining', code: 'DS301', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Big Data Technologies', code: 'DS302', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Advanced Statistics', code: 'MA302', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Data Mining', code: 'DS301', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Advanced Statistics', code: 'MA302', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Big Data Technologies', code: 'DS302', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'Data Mining Lab', code: 'DS301L', fac: 'Dr. R. Kiran' } },
    { day: 3, periods: [
      { p: 1, sub: 'Big Data Technologies', code: 'DS302', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Advanced Statistics', code: 'MA302', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Data Mining', code: 'DS301', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Big Data Technologies', code: 'DS302', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Data Mining', code: 'DS301', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Advanced Statistics', code: 'MA302', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Big Data Lab', code: 'DS302L', fac: 'Dr. Hema Latha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Advanced Statistics', code: 'MA302', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Data Mining', code: 'DS301', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Big Data Technologies', code: 'DS302', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
    ] },
  ])
}

function yearIIISemIECE(): SlotDraft[] {
  return buildWeek('ECE-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Signals & Systems', code: 'EC301', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Analog Communication', code: 'EC302', fac: 'Mrs. R. Sujatha' },
      { p: 3, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Electromagnetic Theory', code: 'EC303', fac: 'Dr. G. Narsimha' },
      { p: 5, sub: 'VLSI Design', code: 'EC304', fac: 'Mrs. R. Sujatha' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Electromagnetic Theory', code: 'EC303', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Signals & Systems', code: 'EC301', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'VLSI Design', code: 'EC304', fac: 'Mrs. R. Sujatha' },
      { p: 4, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Analog Communication', code: 'EC302', fac: 'Mrs. R. Sujatha' },
    ], lab: { sub: 'VLSI Design Lab', code: 'EC304L', fac: 'Mrs. R. Sujatha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Analog Communication', code: 'EC302', fac: 'Mrs. R. Sujatha' },
      { p: 2, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Signals & Systems', code: 'EC301', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'VLSI Design', code: 'EC304', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'Electromagnetic Theory', code: 'EC303', fac: 'Dr. G. Narsimha' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'VLSI Design', code: 'EC304', fac: 'Mrs. R. Sujatha' },
      { p: 2, sub: 'Electromagnetic Theory', code: 'EC303', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'Analog Communication', code: 'EC302', fac: 'Mrs. R. Sujatha' },
      { p: 4, sub: 'Signals & Systems', code: 'EC301', fac: 'Dr. G. Narsimha' },
      { p: 5, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Analog Communication Lab', code: 'EC302L', fac: 'Mrs. R. Sujatha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Signals & Systems', code: 'EC301', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'Electromagnetic Theory', code: 'EC303', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Analog Communication', code: 'EC302', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'VLSI Design', code: 'EC304', fac: 'Mrs. R. Sujatha' },
    ] },
  ])
}

function yearIIISemIEEEEEE(): SlotDraft[] {
  return buildWeek('EEE-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Power Systems', code: 'EE301', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Control Systems', code: 'EE302', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Electromagnetic Fields', code: 'EE303', fac: 'Dr. S. Ranganath' },
      { p: 5, sub: 'Measurements & Instrumentation', code: 'EE304', fac: 'Mr. P. Ravi Teja' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Electromagnetic Fields', code: 'EE303', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Power Systems', code: 'EE301', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Measurements & Instrumentation', code: 'EE304', fac: 'Mr. P. Ravi Teja' },
      { p: 4, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Control Systems', code: 'EE302', fac: 'Mr. P. Ravi Teja' },
    ], lab: { sub: 'Power Systems Lab', code: 'EE301L', fac: 'Dr. S. Ranganath' } },
    { day: 3, periods: [
      { p: 1, sub: 'Control Systems', code: 'EE302', fac: 'Mr. P. Ravi Teja' },
      { p: 2, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Power Systems', code: 'EE301', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Measurements & Instrumentation', code: 'EE304', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'Electromagnetic Fields', code: 'EE303', fac: 'Dr. S. Ranganath' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Measurements & Instrumentation', code: 'EE304', fac: 'Mr. P. Ravi Teja' },
      { p: 2, sub: 'Electromagnetic Fields', code: 'EE303', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Control Systems', code: 'EE302', fac: 'Mr. P. Ravi Teja' },
      { p: 4, sub: 'Power Systems', code: 'EE301', fac: 'Dr. S. Ranganath' },
      { p: 5, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Control Systems Lab', code: 'EE302L', fac: 'Mr. P. Ravi Teja' } },
    { day: 5, periods: [
      { p: 1, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Power Systems', code: 'EE301', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Electromagnetic Fields', code: 'EE303', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Control Systems', code: 'EE302', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'Measurements & Instrumentation', code: 'EE304', fac: 'Mr. P. Ravi Teja' },
    ] },
  ])
}

function yearIIISemIIT(): SlotDraft[] {
  return buildWeek('IT-301', [
    { day: 1, periods: [
      { p: 1, sub: 'Computer Networks', code: 'IT301', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Software Engineering', code: 'IT302', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Web Technologies', code: 'IT303', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Information Security', code: 'IT304', fac: 'Dr. Hema Latha' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Web Technologies', code: 'IT303', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Computer Networks', code: 'IT301', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Information Security', code: 'IT304', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Software Engineering', code: 'IT302', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'Web Technologies Lab', code: 'IT303L', fac: 'Dr. Hema Latha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Software Engineering', code: 'IT302', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Computer Networks', code: 'IT301', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Information Security', code: 'IT304', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Web Technologies', code: 'IT303', fac: 'Dr. Hema Latha' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Information Security', code: 'IT304', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Web Technologies', code: 'IT303', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Software Engineering', code: 'IT302', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Computer Networks', code: 'IT301', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Networks Lab', code: 'IT301L', fac: 'Dr. Hema Latha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Computer Networks', code: 'IT301', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Web Technologies', code: 'IT303', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Software Engineering', code: 'IT302', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Information Security', code: 'IT304', fac: 'Dr. Hema Latha' },
    ] },
  ])
}

function yearIIISemICivil(): SlotDraft[] {
  return buildWeek('Civil-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Structural Analysis', code: 'CV301', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Geotechnical Engineering', code: 'CV302', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Fluid Mechanics', code: 'CV303', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Transportation Engineering', code: 'CV304', fac: 'Dr. L. Mahesh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Fluid Mechanics', code: 'CV303', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Structural Analysis', code: 'CV301', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Transportation Engineering', code: 'CV304', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Geotechnical Engineering', code: 'CV302', fac: 'Dr. L. Mahesh' },
    ], lab: { sub: 'Geotechnical Engineering Lab', code: 'CV302L', fac: 'Dr. L. Mahesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Geotechnical Engineering', code: 'CV302', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Structural Analysis', code: 'CV301', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Transportation Engineering', code: 'CV304', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Fluid Mechanics', code: 'CV303', fac: 'Dr. L. Mahesh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Transportation Engineering', code: 'CV304', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Fluid Mechanics', code: 'CV303', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Geotechnical Engineering', code: 'CV302', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Structural Analysis', code: 'CV301', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Fluid Mechanics Lab', code: 'CV303L', fac: 'Dr. L. Mahesh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Structural Analysis', code: 'CV301', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Fluid Mechanics', code: 'CV303', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Geotechnical Engineering', code: 'CV302', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Transportation Engineering', code: 'CV304', fac: 'Dr. L. Mahesh' },
    ] },
  ])
}

function yearIIISemIMech(): SlotDraft[] {
  return buildWeek('Mech-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Manufacturing Technology', code: 'ME301', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Machine Design', code: 'ME302', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Heat Transfer', code: 'ME303', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'CAD/CAM', code: 'ME304', fac: 'Mr. K. Suresh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Heat Transfer', code: 'ME303', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Manufacturing Technology', code: 'ME301', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'CAD/CAM', code: 'ME304', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Machine Design', code: 'ME302', fac: 'Mr. K. Suresh' },
    ], lab: { sub: 'CAD/CAM Lab', code: 'ME304L', fac: 'Mr. K. Suresh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Machine Design', code: 'ME302', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Manufacturing Technology', code: 'ME301', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'CAD/CAM', code: 'ME304', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Heat Transfer', code: 'ME303', fac: 'Mr. K. Suresh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'CAD/CAM', code: 'ME304', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Heat Transfer', code: 'ME303', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Machine Design', code: 'ME302', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Manufacturing Technology', code: 'ME301', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Manufacturing Technology Lab', code: 'ME301L', fac: 'Mr. K. Suresh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Probability & Statistics', code: 'MA301', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Manufacturing Technology', code: 'ME301', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Heat Transfer', code: 'ME303', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Machine Design', code: 'ME302', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'CAD/CAM', code: 'ME304', fac: 'Mr. K. Suresh' },
    ] },
  ])
}

// ============================================================================
//  YEAR III — SEMESTER II (BRANCH-SPECIFIC)
// ============================================================================

function yearIIISemIICSE(): SlotDraft[] {
  return buildWeek('CSE-301', [
    { day: 1, periods: [
      { p: 1, sub: 'Compiler Design', code: 'CS305', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Computer Networks', code: 'CS306', fac: 'Mrs. S. Priya' },
      { p: 3, sub: 'Theory of Computation', code: 'CS307', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Software Engineering', code: 'CS308', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'Professional Elective – I', code: 'CS3XX', fac: 'Dr. R. Kiran' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Software Engineering', code: 'CS308', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Compiler Design', code: 'CS305', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'Computer Networks', code: 'CS306', fac: 'Mrs. S. Priya' },
      { p: 4, sub: 'Theory of Computation', code: 'CS307', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'Professional Elective – I', code: 'CS3XX', fac: 'Dr. R. Kiran' },
    ], lab: { sub: 'CN Lab', code: 'CS306L', fac: 'Mrs. S. Priya' } },
    { day: 3, periods: [
      { p: 1, sub: 'Computer Networks', code: 'CS306', fac: 'Mrs. S. Priya' },
      { p: 2, sub: 'Theory of Computation', code: 'CS307', fac: 'Mr. T. Vijay' },
      { p: 3, sub: 'Compiler Design', code: 'CS305', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'Professional Elective – I', code: 'CS3XX', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Software Engineering', code: 'CS308', fac: 'Dr. A. Ramesh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Theory of Computation', code: 'CS307', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Professional Elective – I', code: 'CS3XX', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Compiler Design', code: 'CS305', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'Computer Networks', code: 'CS306', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Software Engineering', code: 'CS308', fac: 'Dr. A. Ramesh' },
    ], lab: { sub: 'Compiler Design Lab', code: 'CS305L', fac: 'Dr. A. Ramesh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Compiler Design', code: 'CS305', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Computer Networks', code: 'CS306', fac: 'Mrs. S. Priya' },
      { p: 3, sub: 'Theory of Computation', code: 'CS307', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Software Engineering', code: 'CS308', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'Professional Elective – I', code: 'CS3XX', fac: 'Dr. R. Kiran' },
    ] },
  ])
}

function yearIIISemIICSEAIML(): SlotDraft[] {
  return buildWeek('CSE-AIML-401', [
    { day: 1, periods: [
      { p: 1, sub: 'Natural Language Processing', code: 'AIML304', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Reinforcement Learning', code: 'AIML305', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Computer Vision', code: 'AIML303', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'Professional Elective – I', code: 'AIML3XX', fac: 'Dr. R. Kiran' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Natural Language Processing', code: 'AIML304', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Professional Elective – I', code: 'AIML3XX', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Reinforcement Learning', code: 'AIML305', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Computer Vision', code: 'AIML303', fac: 'Dr. R. Kiran' },
    ], lab: { sub: 'NLP Lab', code: 'AIML304L', fac: 'Dr. R. Kiran' } },
    { day: 3, periods: [
      { p: 1, sub: 'Reinforcement Learning', code: 'AIML305', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Computer Vision', code: 'AIML303', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Natural Language Processing', code: 'AIML304', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Professional Elective – I', code: 'AIML3XX', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Computer Vision', code: 'AIML303', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Professional Elective – I', code: 'AIML3XX', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Natural Language Processing', code: 'AIML304', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Reinforcement Learning', code: 'AIML305', fac: 'Dr. R. Kiran' },
    ], lab: { sub: 'Computer Vision Lab', code: 'AIML303L', fac: 'Dr. R. Kiran' } },
    { day: 5, periods: [
      { p: 1, sub: 'Natural Language Processing', code: 'AIML304', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Reinforcement Learning', code: 'AIML305', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Operating Systems', code: 'CS303', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Computer Vision', code: 'AIML303', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Professional Elective – I', code: 'AIML3XX', fac: 'Dr. R. Kiran' },
    ] },
  ])
}

function yearIIISemIICSECSBS(): SlotDraft[] {
  return buildWeek('CSE-CSBS-402', [
    { day: 1, periods: [
      { p: 1, sub: 'Business Analytics', code: 'CSBS304', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Financial Accounting', code: 'CSBS302', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Business Statistics', code: 'CSBS303', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Data Analytics', code: 'CSBS301', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Professional Elective – I', code: 'CSBS3XX', fac: 'Mrs. N. Lavanya' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Data Analytics', code: 'CSBS301', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Business Analytics', code: 'CSBS304', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Professional Elective – I', code: 'CSBS3XX', fac: 'Mrs. N. Lavanya' },
      { p: 4, sub: 'Business Statistics', code: 'CSBS303', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Financial Accounting', code: 'CSBS302', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Business Analytics Lab', code: 'CSBS304L', fac: 'Dr. Hema Latha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Financial Accounting', code: 'CSBS302', fac: 'Mrs. N. Lavanya' },
      { p: 2, sub: 'Business Statistics', code: 'CSBS303', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Business Analytics', code: 'CSBS304', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – I', code: 'CSBS3XX', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'Data Analytics', code: 'CSBS301', fac: 'Dr. Hema Latha' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Business Statistics', code: 'CSBS303', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Professional Elective – I', code: 'CSBS3XX', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Data Analytics', code: 'CSBS301', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Business Analytics', code: 'CSBS304', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Financial Accounting', code: 'CSBS302', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Data Analytics Lab', code: 'CSBS301L', fac: 'Dr. Hema Latha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Business Analytics', code: 'CSBS304', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Data Analytics', code: 'CSBS301', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Financial Accounting', code: 'CSBS302', fac: 'Mrs. N. Lavanya' },
      { p: 4, sub: 'Business Statistics', code: 'CSBS303', fac: 'Dr. K. Sridevi' },
      { p: 5, sub: 'Professional Elective – I', code: 'CSBS3XX', fac: 'Mrs. N. Lavanya' },
    ] },
  ])
}

function yearIIISemIICSEDS(): SlotDraft[] {
  return buildWeek('CSE-DS-403', [
    { day: 1, periods: [
      { p: 1, sub: 'Data Mining', code: 'DS301', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Big Data Technologies', code: 'DS302', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Advanced Statistics', code: 'MA302', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Professional Elective – I', code: 'DS3XX', fac: 'Dr. R. Kiran' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Data Mining', code: 'DS301', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Professional Elective – I', code: 'DS3XX', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Big Data Technologies', code: 'DS302', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Advanced Statistics', code: 'MA302', fac: 'Dr. K. Sridevi' },
    ], lab: { sub: 'Big Data Lab', code: 'DS302L', fac: 'Dr. Hema Latha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Big Data Technologies', code: 'DS302', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Advanced Statistics', code: 'MA302', fac: 'Dr. K. Sridevi' },
      { p: 3, sub: 'Data Mining', code: 'DS301', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Professional Elective – I', code: 'DS3XX', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Advanced Statistics', code: 'MA302', fac: 'Dr. K. Sridevi' },
      { p: 2, sub: 'Professional Elective – I', code: 'DS3XX', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Data Mining', code: 'DS301', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Big Data Technologies', code: 'DS302', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'Data Mining Lab', code: 'DS301L', fac: 'Dr. R. Kiran' } },
    { day: 5, periods: [
      { p: 1, sub: 'Data Mining', code: 'DS301', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Big Data Technologies', code: 'DS302', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Advanced Statistics', code: 'MA302', fac: 'Dr. K. Sridevi' },
      { p: 4, sub: 'Machine Learning', code: 'AIML301', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Professional Elective – I', code: 'DS3XX', fac: 'Dr. R. Kiran' },
    ] },
  ])
}

function yearIIISemIIECE(): SlotDraft[] {
  return buildWeek('ECE-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Digital Signal Processing', code: 'EC305', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Digital Communication', code: 'EC306', fac: 'Mrs. R. Sujatha' },
      { p: 3, sub: 'Embedded Systems', code: 'EC307', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Microwave Engineering', code: 'EC308', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'Professional Elective – I', code: 'EC3XX', fac: 'Dr. G. Narsimha' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Microwave Engineering', code: 'EC308', fac: 'Mrs. R. Sujatha' },
      { p: 2, sub: 'Digital Signal Processing', code: 'EC305', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'Professional Elective – I', code: 'EC3XX', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Digital Communication', code: 'EC306', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'Embedded Systems', code: 'EC307', fac: 'Dr. G. Narsimha' },
    ], lab: { sub: 'DSP Lab', code: 'EC305L', fac: 'Dr. G. Narsimha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Digital Communication', code: 'EC306', fac: 'Mrs. R. Sujatha' },
      { p: 2, sub: 'Embedded Systems', code: 'EC307', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'Digital Signal Processing', code: 'EC305', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Professional Elective – I', code: 'EC3XX', fac: 'Dr. G. Narsimha' },
      { p: 5, sub: 'Microwave Engineering', code: 'EC308', fac: 'Mrs. R. Sujatha' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Embedded Systems', code: 'EC307', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Professional Elective – I', code: 'EC3XX', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'Microwave Engineering', code: 'EC308', fac: 'Mrs. R. Sujatha' },
      { p: 4, sub: 'Digital Signal Processing', code: 'EC305', fac: 'Dr. G. Narsimha' },
      { p: 5, sub: 'Digital Communication', code: 'EC306', fac: 'Mrs. R. Sujatha' },
    ], lab: { sub: 'Digital Communication Lab', code: 'EC306L', fac: 'Mrs. R. Sujatha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Digital Signal Processing', code: 'EC305', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Digital Communication', code: 'EC306', fac: 'Mrs. R. Sujatha' },
      { p: 3, sub: 'Embedded Systems', code: 'EC307', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Microwave Engineering', code: 'EC308', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'Professional Elective – I', code: 'EC3XX', fac: 'Dr. G. Narsimha' },
    ] },
  ])
}

function yearIIISemIIEEEEEE(): SlotDraft[] {
  return buildWeek('EEE-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Power Systems – II', code: 'EE305', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Digital Control Systems', code: 'EE306', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Switchgear & Protection', code: 'EE307', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Power Electronics', code: 'EE308', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'Professional Elective – I', code: 'EE3XX', fac: 'Dr. S. Ranganath' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Power Electronics', code: 'EE308', fac: 'Mr. P. Ravi Teja' },
      { p: 2, sub: 'Power Systems – II', code: 'EE305', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Professional Elective – I', code: 'EE3XX', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Digital Control Systems', code: 'EE306', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'Switchgear & Protection', code: 'EE307', fac: 'Dr. S. Ranganath' },
    ], lab: { sub: 'Power Electronics Lab', code: 'EE308L', fac: 'Mr. P. Ravi Teja' } },
    { day: 3, periods: [
      { p: 1, sub: 'Digital Control Systems', code: 'EE306', fac: 'Mr. P. Ravi Teja' },
      { p: 2, sub: 'Switchgear & Protection', code: 'EE307', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Power Systems – II', code: 'EE305', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Professional Elective – I', code: 'EE3XX', fac: 'Dr. S. Ranganath' },
      { p: 5, sub: 'Power Electronics', code: 'EE308', fac: 'Mr. P. Ravi Teja' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Switchgear & Protection', code: 'EE307', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Professional Elective – I', code: 'EE3XX', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Power Electronics', code: 'EE308', fac: 'Mr. P. Ravi Teja' },
      { p: 4, sub: 'Power Systems – II', code: 'EE305', fac: 'Dr. S. Ranganath' },
      { p: 5, sub: 'Digital Control Systems', code: 'EE306', fac: 'Mr. P. Ravi Teja' },
    ], lab: { sub: 'Control Systems Lab', code: 'EE302L', fac: 'Mr. P. Ravi Teja' } },
    { day: 5, periods: [
      { p: 1, sub: 'Power Systems – II', code: 'EE305', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Digital Control Systems', code: 'EE306', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Switchgear & Protection', code: 'EE307', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Power Electronics', code: 'EE308', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'Professional Elective – I', code: 'EE3XX', fac: 'Dr. S. Ranganath' },
    ] },
  ])
}

function yearIIISemIIIT(): SlotDraft[] {
  return buildWeek('IT-301', [
    { day: 1, periods: [
      { p: 1, sub: 'Distributed Systems', code: 'IT305', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Software Testing', code: 'IT306', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Computer Networks', code: 'IT301', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Information Security', code: 'IT304', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Professional Elective – I', code: 'IT3XX', fac: 'Dr. Hema Latha' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Information Security', code: 'IT304', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Distributed Systems', code: 'IT305', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Professional Elective – I', code: 'IT3XX', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Software Testing', code: 'IT306', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Computer Networks', code: 'IT301', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'Distributed Systems Lab', code: 'IT305L', fac: 'Dr. Hema Latha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Software Testing', code: 'IT306', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Computer Networks', code: 'IT301', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Distributed Systems', code: 'IT305', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – I', code: 'IT3XX', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Information Security', code: 'IT304', fac: 'Dr. Hema Latha' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Computer Networks', code: 'IT301', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Professional Elective – I', code: 'IT3XX', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Information Security', code: 'IT304', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Distributed Systems', code: 'IT305', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Software Testing', code: 'IT306', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'Software Testing Lab', code: 'IT306L', fac: 'Dr. Hema Latha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Distributed Systems', code: 'IT305', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Software Testing', code: 'IT306', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Computer Networks', code: 'IT301', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Information Security', code: 'IT304', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Professional Elective – I', code: 'IT3XX', fac: 'Dr. Hema Latha' },
    ] },
  ])
}

function yearIIISemIICivil(): SlotDraft[] {
  return buildWeek('Civil-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Design of Steel Structures', code: 'CV305', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Environmental Engineering', code: 'CV306', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Estimation & Costing', code: 'CV307', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Structural Analysis', code: 'CV301', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Professional Elective – I', code: 'CV3XX', fac: 'Dr. L. Mahesh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Structural Analysis', code: 'CV301', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Design of Steel Structures', code: 'CV305', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Professional Elective – I', code: 'CV3XX', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Environmental Engineering', code: 'CV306', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Estimation & Costing', code: 'CV307', fac: 'Dr. L. Mahesh' },
    ], lab: { sub: 'Structural Analysis Lab', code: 'CV301L', fac: 'Dr. L. Mahesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Environmental Engineering', code: 'CV306', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Estimation & Costing', code: 'CV307', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Design of Steel Structures', code: 'CV305', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Professional Elective – I', code: 'CV3XX', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Structural Analysis', code: 'CV301', fac: 'Dr. L. Mahesh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Estimation & Costing', code: 'CV307', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Professional Elective – I', code: 'CV3XX', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Structural Analysis', code: 'CV301', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Design of Steel Structures', code: 'CV305', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Environmental Engineering', code: 'CV306', fac: 'Dr. L. Mahesh' },
    ], lab: { sub: 'Environmental Engineering Lab', code: 'CV306L', fac: 'Dr. L. Mahesh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Design of Steel Structures', code: 'CV305', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Environmental Engineering', code: 'CV306', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Estimation & Costing', code: 'CV307', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Structural Analysis', code: 'CV301', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Professional Elective – I', code: 'CV3XX', fac: 'Dr. L. Mahesh' },
    ] },
  ])
}

function yearIIISemIIMech(): SlotDraft[] {
  return buildWeek('Mech-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Dynamics of Machines', code: 'ME305', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Automobile Engineering', code: 'ME306', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Computer Integrated Manufacturing', code: 'ME307', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Heat Transfer', code: 'ME303', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Professional Elective – I', code: 'ME3XX', fac: 'Mr. K. Suresh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Heat Transfer', code: 'ME303', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Dynamics of Machines', code: 'ME305', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Professional Elective – I', code: 'ME3XX', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Automobile Engineering', code: 'ME306', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Computer Integrated Manufacturing', code: 'ME307', fac: 'Mr. K. Suresh' },
    ], lab: { sub: 'Dynamics Lab', code: 'ME305L', fac: 'Mr. K. Suresh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Automobile Engineering', code: 'ME306', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Computer Integrated Manufacturing', code: 'ME307', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Dynamics of Machines', code: 'ME305', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Professional Elective – I', code: 'ME3XX', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Heat Transfer', code: 'ME303', fac: 'Mr. K. Suresh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Computer Integrated Manufacturing', code: 'ME307', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Professional Elective – I', code: 'ME3XX', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Heat Transfer', code: 'ME303', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Dynamics of Machines', code: 'ME305', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Automobile Engineering', code: 'ME306', fac: 'Mr. K. Suresh' },
    ], lab: { sub: 'Automobile Lab', code: 'ME306L', fac: 'Mr. K. Suresh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Dynamics of Machines', code: 'ME305', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Automobile Engineering', code: 'ME306', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Computer Integrated Manufacturing', code: 'ME307', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Heat Transfer', code: 'ME303', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Professional Elective – I', code: 'ME3XX', fac: 'Mr. K. Suresh' },
    ] },
  ])
}

// ============================================================================
//  YEAR IV — SEMESTER I (BRANCH-SPECIFIC)
// ============================================================================

function yearIVSemICSE(): SlotDraft[] {
  return buildWeek('CSE-301', [
    { day: 1, periods: [
      { p: 1, sub: 'Machine Learning', code: 'CS401', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'Blockchain Technology', code: 'CS403', fac: 'Mrs. S. Priya' },
      { p: 4, sub: 'Professional Elective – II', code: 'CS4XX', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'CS491', fac: 'Dr. A. Ramesh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Blockchain Technology', code: 'CS403', fac: 'Mrs. S. Priya' },
      { p: 2, sub: 'Machine Learning', code: 'CS401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Professional Elective – II', code: 'CS4XX', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'CS491', fac: 'Dr. A. Ramesh' },
    ], lab: { sub: 'Project Work – I', code: 'CS491', fac: 'Dr. A. Ramesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Professional Elective – II', code: 'CS4XX', fac: 'Mr. T. Vijay' },
      { p: 3, sub: 'Machine Learning', code: 'CS401', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Blockchain Technology', code: 'CS403', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'CS491', fac: 'Dr. A. Ramesh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – II', code: 'CS4XX', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Seminar + Project Work – I', code: 'CS491', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'Machine Learning', code: 'CS401', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Blockchain Technology', code: 'CS403', fac: 'Mrs. S. Priya' },
    ], lab: { sub: 'Project Work – I', code: 'CS491', fac: 'Dr. A. Ramesh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Seminar + Project Work – I', code: 'CS491', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Machine Learning', code: 'CS401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'Blockchain Technology', code: 'CS403', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Professional Elective – II', code: 'CS4XX', fac: 'Mr. T. Vijay' },
    ] },
  ])
}

function yearIVSemICSEAIML(): SlotDraft[] {
  return buildWeek('CSE-AIML-401', [
    { day: 1, periods: [
      { p: 1, sub: 'Machine Learning', code: 'AIML401', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'Blockchain Technology', code: 'CS403', fac: 'Mrs. S. Priya' },
      { p: 4, sub: 'Professional Elective – II', code: 'AIML4XX', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'AIML491', fac: 'Dr. R. Kiran' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Blockchain Technology', code: 'CS403', fac: 'Mrs. S. Priya' },
      { p: 2, sub: 'Machine Learning', code: 'AIML401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Professional Elective – II', code: 'AIML4XX', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. A. Ramesh' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'AIML491', fac: 'Dr. R. Kiran' },
    ], lab: { sub: 'Project Work – I', code: 'AIML491', fac: 'Dr. R. Kiran' } },
    { day: 3, periods: [
      { p: 1, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Professional Elective – II', code: 'AIML4XX', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Machine Learning', code: 'AIML401', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Blockchain Technology', code: 'CS403', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'AIML491', fac: 'Dr. R. Kiran' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – II', code: 'AIML4XX', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Seminar + Project Work – I', code: 'AIML491', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'Machine Learning', code: 'AIML401', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Blockchain Technology', code: 'CS403', fac: 'Mrs. S. Priya' },
    ], lab: { sub: 'Project Work – I', code: 'AIML491', fac: 'Dr. R. Kiran' } },
    { day: 5, periods: [
      { p: 1, sub: 'Seminar + Project Work – I', code: 'AIML491', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Machine Learning', code: 'AIML401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'Blockchain Technology', code: 'CS403', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Professional Elective – II', code: 'AIML4XX', fac: 'Dr. R. Kiran' },
    ] },
  ])
}

function yearIVSemICSECSBS(): SlotDraft[] {
  return buildWeek('CSE-CSBS-402', [
    { day: 1, periods: [
      { p: 1, sub: 'Machine Learning', code: 'CS401', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Financial Analytics', code: 'CSBS401', fac: 'Mrs. N. Lavanya' },
      { p: 4, sub: 'Professional Elective – II', code: 'CSBS4XX', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'CSBS491', fac: 'Dr. Hema Latha' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Financial Analytics', code: 'CSBS401', fac: 'Mrs. N. Lavanya' },
      { p: 2, sub: 'Machine Learning', code: 'CS401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Professional Elective – II', code: 'CSBS4XX', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'CSBS491', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'Project Work – I', code: 'CSBS491', fac: 'Dr. Hema Latha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Professional Elective – II', code: 'CSBS4XX', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Machine Learning', code: 'CS401', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Financial Analytics', code: 'CSBS401', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'CSBS491', fac: 'Dr. Hema Latha' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – II', code: 'CSBS4XX', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Seminar + Project Work – I', code: 'CSBS491', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Machine Learning', code: 'CS401', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Financial Analytics', code: 'CSBS401', fac: 'Mrs. N. Lavanya' },
    ], lab: { sub: 'Project Work – I', code: 'CSBS491', fac: 'Dr. Hema Latha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Seminar + Project Work – I', code: 'CSBS491', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Machine Learning', code: 'CS401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Financial Analytics', code: 'CSBS401', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'Professional Elective – II', code: 'CSBS4XX', fac: 'Dr. Hema Latha' },
    ] },
  ])
}

function yearIVSemICSEDS(): SlotDraft[] {
  return buildWeek('CSE-DS-403', [
    { day: 1, periods: [
      { p: 1, sub: 'Machine Learning', code: 'AIML401', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Data Engineering', code: 'DS401', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – II', code: 'DS4XX', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'DS491', fac: 'Dr. R. Kiran' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Data Engineering', code: 'DS401', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Machine Learning', code: 'AIML401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Professional Elective – II', code: 'DS4XX', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'DS491', fac: 'Dr. R. Kiran' },
    ], lab: { sub: 'Project Work – I', code: 'DS491', fac: 'Dr. R. Kiran' } },
    { day: 3, periods: [
      { p: 1, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Professional Elective – II', code: 'DS4XX', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Machine Learning', code: 'AIML401', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Data Engineering', code: 'DS401', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'DS491', fac: 'Dr. R. Kiran' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – II', code: 'DS4XX', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Seminar + Project Work – I', code: 'DS491', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Machine Learning', code: 'AIML401', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Data Engineering', code: 'DS401', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'Project Work – I', code: 'DS491', fac: 'Dr. R. Kiran' } },
    { day: 5, periods: [
      { p: 1, sub: 'Seminar + Project Work – I', code: 'DS491', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Machine Learning', code: 'AIML401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Cloud Computing', code: 'CS402', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Data Engineering', code: 'DS401', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Professional Elective – II', code: 'DS4XX', fac: 'Dr. R. Kiran' },
    ] },
  ])
}

function yearIVSemIECE(): SlotDraft[] {
  return buildWeek('ECE-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Embedded Systems', code: 'EC401', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'IoT', code: 'EC402', fac: 'Mrs. R. Sujatha' },
      { p: 3, sub: '5G Technology', code: 'EC403', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Professional Elective – II', code: 'EC4XX', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'EC491', fac: 'Dr. G. Narsimha' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: '5G Technology', code: 'EC403', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Embedded Systems', code: 'EC401', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'Professional Elective – II', code: 'EC4XX', fac: 'Mrs. R. Sujatha' },
      { p: 4, sub: 'IoT', code: 'EC402', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'EC491', fac: 'Dr. G. Narsimha' },
    ], lab: { sub: 'IoT Lab', code: 'EC402L', fac: 'Mrs. R. Sujatha' } },
    { day: 3, periods: [
      { p: 1, sub: 'IoT', code: 'EC402', fac: 'Mrs. R. Sujatha' },
      { p: 2, sub: 'Professional Elective – II', code: 'EC4XX', fac: 'Mrs. R. Sujatha' },
      { p: 3, sub: 'Embedded Systems', code: 'EC401', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: '5G Technology', code: 'EC403', fac: 'Dr. G. Narsimha' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'EC491', fac: 'Dr. G. Narsimha' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – II', code: 'EC4XX', fac: 'Mrs. R. Sujatha' },
      { p: 2, sub: 'Seminar + Project Work – I', code: 'EC491', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: '5G Technology', code: 'EC403', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Embedded Systems', code: 'EC401', fac: 'Dr. G. Narsimha' },
      { p: 5, sub: 'IoT', code: 'EC402', fac: 'Mrs. R. Sujatha' },
    ], lab: { sub: 'Embedded Systems Lab', code: 'EC401L', fac: 'Dr. G. Narsimha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Seminar + Project Work – I', code: 'EC491', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Embedded Systems', code: 'EC401', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'IoT', code: 'EC402', fac: 'Mrs. R. Sujatha' },
      { p: 4, sub: '5G Technology', code: 'EC403', fac: 'Dr. G. Narsimha' },
      { p: 5, sub: 'Professional Elective – II', code: 'EC4XX', fac: 'Mrs. R. Sujatha' },
    ] },
  ])
}

function yearIVSemIEEEEEE(): SlotDraft[] {
  return buildWeek('EEE-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Power Electronics', code: 'EE401', fac: 'Mr. P. Ravi Teja' },
      { p: 2, sub: 'Renewable Energy Systems', code: 'EE402', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Electric Drives', code: 'EE403', fac: 'Mr. P. Ravi Teja' },
      { p: 4, sub: 'Professional Elective – II', code: 'EE4XX', fac: 'Dr. S. Ranganath' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'EE491', fac: 'Dr. S. Ranganath' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Electric Drives', code: 'EE403', fac: 'Mr. P. Ravi Teja' },
      { p: 2, sub: 'Power Electronics', code: 'EE401', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Professional Elective – II', code: 'EE4XX', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Renewable Energy Systems', code: 'EE402', fac: 'Dr. S. Ranganath' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'EE491', fac: 'Dr. S. Ranganath' },
    ], lab: { sub: 'Power Electronics Lab', code: 'EE401L', fac: 'Mr. P. Ravi Teja' } },
    { day: 3, periods: [
      { p: 1, sub: 'Renewable Energy Systems', code: 'EE402', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Professional Elective – II', code: 'EE4XX', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Power Electronics', code: 'EE401', fac: 'Mr. P. Ravi Teja' },
      { p: 4, sub: 'Electric Drives', code: 'EE403', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'EE491', fac: 'Dr. S. Ranganath' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – II', code: 'EE4XX', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Seminar + Project Work – I', code: 'EE491', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Electric Drives', code: 'EE403', fac: 'Mr. P. Ravi Teja' },
      { p: 4, sub: 'Power Electronics', code: 'EE401', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'Renewable Energy Systems', code: 'EE402', fac: 'Dr. S. Ranganath' },
    ], lab: { sub: 'Electric Drives Lab', code: 'EE403L', fac: 'Mr. P. Ravi Teja' } },
    { day: 5, periods: [
      { p: 1, sub: 'Seminar + Project Work – I', code: 'EE491', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Power Electronics', code: 'EE401', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Renewable Energy Systems', code: 'EE402', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Electric Drives', code: 'EE403', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'Professional Elective – II', code: 'EE4XX', fac: 'Dr. S. Ranganath' },
    ] },
  ])
}

function yearIVSemIIT(): SlotDraft[] {
  return buildWeek('IT-301', [
    { day: 1, periods: [
      { p: 1, sub: 'Cloud Computing', code: 'IT401', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'IoT', code: 'IT402', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'DevOps', code: 'IT403', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – II', code: 'IT4XX', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'IT491', fac: 'Dr. Hema Latha' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'DevOps', code: 'IT403', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Cloud Computing', code: 'IT401', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Professional Elective – II', code: 'IT4XX', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'IoT', code: 'IT402', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'IT491', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'IoT Lab', code: 'IT402L', fac: 'Dr. Hema Latha' } },
    { day: 3, periods: [
      { p: 1, sub: 'IoT', code: 'IT402', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Professional Elective – II', code: 'IT4XX', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Cloud Computing', code: 'IT401', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'DevOps', code: 'IT403', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'IT491', fac: 'Dr. Hema Latha' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – II', code: 'IT4XX', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Seminar + Project Work – I', code: 'IT491', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'DevOps', code: 'IT403', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Cloud Computing', code: 'IT401', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'IoT', code: 'IT402', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'DevOps Lab', code: 'IT403L', fac: 'Dr. Hema Latha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Seminar + Project Work – I', code: 'IT491', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Cloud Computing', code: 'IT401', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'IoT', code: 'IT402', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'DevOps', code: 'IT403', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Professional Elective – II', code: 'IT4XX', fac: 'Dr. Hema Latha' },
    ] },
  ])
}

function yearIVSemICivil(): SlotDraft[] {
  return buildWeek('Civil-201', [
    { day: 1, periods: [
      { p: 1, sub: 'RCC Design', code: 'CV401', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Environmental Engineering', code: 'CV402', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Estimation & Costing', code: 'CV403', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Professional Elective – II', code: 'CV4XX', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'CV491', fac: 'Dr. L. Mahesh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Estimation & Costing', code: 'CV403', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'RCC Design', code: 'CV401', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Professional Elective – II', code: 'CV4XX', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Environmental Engineering', code: 'CV402', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'CV491', fac: 'Dr. L. Mahesh' },
    ], lab: { sub: 'RCC Design Lab', code: 'CV401L', fac: 'Dr. L. Mahesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Environmental Engineering', code: 'CV402', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Professional Elective – II', code: 'CV4XX', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'RCC Design', code: 'CV401', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Estimation & Costing', code: 'CV403', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'CV491', fac: 'Dr. L. Mahesh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – II', code: 'CV4XX', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Seminar + Project Work – I', code: 'CV491', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Estimation & Costing', code: 'CV403', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'RCC Design', code: 'CV401', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Environmental Engineering', code: 'CV402', fac: 'Dr. L. Mahesh' },
    ], lab: { sub: 'Environmental Engineering Lab', code: 'CV402L', fac: 'Dr. L. Mahesh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Seminar + Project Work – I', code: 'CV491', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'RCC Design', code: 'CV401', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Environmental Engineering', code: 'CV402', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Estimation & Costing', code: 'CV403', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Professional Elective – II', code: 'CV4XX', fac: 'Dr. L. Mahesh' },
    ] },
  ])
}

function yearIVSemIMech(): SlotDraft[] {
  return buildWeek('Mech-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Finite Element Analysis', code: 'ME401', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Refrigeration & AC', code: 'ME402', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Industrial Engineering', code: 'ME403', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Professional Elective – II', code: 'ME4XX', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'ME491', fac: 'Mr. K. Suresh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Industrial Engineering', code: 'ME403', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Finite Element Analysis', code: 'ME401', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Professional Elective – II', code: 'ME4XX', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Refrigeration & AC', code: 'ME402', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'ME491', fac: 'Mr. K. Suresh' },
    ], lab: { sub: 'FEA Lab', code: 'ME401L', fac: 'Mr. K. Suresh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Refrigeration & AC', code: 'ME402', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Professional Elective – II', code: 'ME4XX', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Finite Element Analysis', code: 'ME401', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Industrial Engineering', code: 'ME403', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Seminar + Project Work – I', code: 'ME491', fac: 'Mr. K. Suresh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – II', code: 'ME4XX', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Seminar + Project Work – I', code: 'ME491', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Industrial Engineering', code: 'ME403', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Finite Element Analysis', code: 'ME401', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Refrigeration & AC', code: 'ME402', fac: 'Mr. K. Suresh' },
    ], lab: { sub: 'Refrigeration Lab', code: 'ME402L', fac: 'Mr. K. Suresh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Seminar + Project Work – I', code: 'ME491', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Finite Element Analysis', code: 'ME401', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Refrigeration & AC', code: 'ME402', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Industrial Engineering', code: 'ME403', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Professional Elective – II', code: 'ME4XX', fac: 'Mr. K. Suresh' },
    ] },
  ])
}

// ============================================================================
//  YEAR IV — SEMESTER II (PROJECT WORK + ELECTIVES, BRANCH-SPECIFIC)
// ============================================================================

function yearIVSemIICSE(): SlotDraft[] {
  return buildWeek('CSE-301', [
    { day: 1, periods: [
      { p: 1, sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Professional Elective – III', code: 'CS5XX', fac: 'Mrs. S. Priya' },
      { p: 4, sub: 'Professional Elective – IV', code: 'CS5YY', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'Professional Elective – IV', code: 'CS5YY', fac: 'Mr. T. Vijay' },
      { p: 4, sub: 'Professional Elective – III', code: 'CS5XX', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' },
    ], lab: { sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Professional Elective – III', code: 'CS5XX', fac: 'Mrs. S. Priya' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'Professional Elective – IV', code: 'CS5YY', fac: 'Mr. T. Vijay' },
      { p: 5, sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – IV', code: 'CS5YY', fac: 'Mr. T. Vijay' },
      { p: 2, sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' },
      { p: 3, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Professional Elective – III', code: 'CS5XX', fac: 'Mrs. S. Priya' },
      { p: 5, sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' },
    ], lab: { sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' },
      { p: 2, sub: 'Professional Elective – III', code: 'CS5XX', fac: 'Mrs. S. Priya' },
      { p: 3, sub: 'Project Work – II', code: 'CS492', fac: 'Dr. A. Ramesh' },
      { p: 4, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Professional Elective – IV', code: 'CS5YY', fac: 'Mr. T. Vijay' },
    ] },
  ])
}

function yearIVSemIICSEAIML(): SlotDraft[] {
  return buildWeek('CSE-AIML-401', [
    { day: 1, periods: [
      { p: 1, sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Professional Elective – III', code: 'AIML5XX', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Professional Elective – IV', code: 'AIML5YY', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Professional Elective – IV', code: 'AIML5YY', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Professional Elective – III', code: 'AIML5XX', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' },
    ], lab: { sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' } },
    { day: 3, periods: [
      { p: 1, sub: 'Professional Elective – III', code: 'AIML5XX', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Professional Elective – IV', code: 'AIML5YY', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – IV', code: 'AIML5YY', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Professional Elective – III', code: 'AIML5XX', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' },
    ], lab: { sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' } },
    { day: 5, periods: [
      { p: 1, sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Professional Elective – III', code: 'AIML5XX', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Project Work – II', code: 'AIML492', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Professional Elective – IV', code: 'AIML5YY', fac: 'Dr. R. Kiran' },
    ] },
  ])
}

function yearIVSemIICSECSBS(): SlotDraft[] {
  return buildWeek('CSE-CSBS-402', [
    { day: 1, periods: [
      { p: 1, sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Professional Elective – III', code: 'CSBS5XX', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – IV', code: 'CSBS5YY', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Open Elective – I', code: 'OE401', fac: 'Mrs. N. Lavanya' },
      { p: 2, sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Professional Elective – IV', code: 'CSBS5YY', fac: 'Mrs. N. Lavanya' },
      { p: 4, sub: 'Professional Elective – III', code: 'CSBS5XX', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Professional Elective – III', code: 'CSBS5XX', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Mrs. N. Lavanya' },
      { p: 3, sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – IV', code: 'CSBS5YY', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – IV', code: 'CSBS5YY', fac: 'Mrs. N. Lavanya' },
      { p: 2, sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Open Elective – I', code: 'OE401', fac: 'Mrs. N. Lavanya' },
      { p: 4, sub: 'Professional Elective – III', code: 'CSBS5XX', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Professional Elective – III', code: 'CSBS5XX', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Project Work – II', code: 'CSBS492', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Open Elective – I', code: 'OE401', fac: 'Mrs. N. Lavanya' },
      { p: 5, sub: 'Professional Elective – IV', code: 'CSBS5YY', fac: 'Mrs. N. Lavanya' },
    ] },
  ])
}

function yearIVSemIICSEDS(): SlotDraft[] {
  return buildWeek('CSE-DS-403', [
    { day: 1, periods: [
      { p: 1, sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Professional Elective – III', code: 'DS5XX', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Professional Elective – IV', code: 'DS5YY', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Professional Elective – IV', code: 'DS5YY', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – III', code: 'DS5XX', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' },
    ], lab: { sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' } },
    { day: 3, periods: [
      { p: 1, sub: 'Professional Elective – III', code: 'DS5XX', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Professional Elective – IV', code: 'DS5YY', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – IV', code: 'DS5YY', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – III', code: 'DS5XX', fac: 'Dr. R. Kiran' },
      { p: 5, sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' },
    ], lab: { sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' } },
    { day: 5, periods: [
      { p: 1, sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' },
      { p: 2, sub: 'Professional Elective – III', code: 'DS5XX', fac: 'Dr. R. Kiran' },
      { p: 3, sub: 'Project Work – II', code: 'DS492', fac: 'Dr. R. Kiran' },
      { p: 4, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Professional Elective – IV', code: 'DS5YY', fac: 'Dr. Hema Latha' },
    ] },
  ])
}

function yearIVSemIIECE(): SlotDraft[] {
  return buildWeek('ECE-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Mrs. R. Sujatha' },
      { p: 3, sub: 'Professional Elective – III', code: 'EC5XX', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Professional Elective – IV', code: 'EC5YY', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Open Elective – I', code: 'OE401', fac: 'Mrs. R. Sujatha' },
      { p: 2, sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'Professional Elective – IV', code: 'EC5YY', fac: 'Mrs. R. Sujatha' },
      { p: 4, sub: 'Professional Elective – III', code: 'EC5XX', fac: 'Dr. G. Narsimha' },
      { p: 5, sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' },
    ], lab: { sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Professional Elective – III', code: 'EC5XX', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Mrs. R. Sujatha' },
      { p: 3, sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Professional Elective – IV', code: 'EC5YY', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – IV', code: 'EC5YY', fac: 'Mrs. R. Sujatha' },
      { p: 2, sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'Open Elective – I', code: 'OE401', fac: 'Mrs. R. Sujatha' },
      { p: 4, sub: 'Professional Elective – III', code: 'EC5XX', fac: 'Dr. G. Narsimha' },
      { p: 5, sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' },
    ], lab: { sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' },
      { p: 2, sub: 'Professional Elective – III', code: 'EC5XX', fac: 'Dr. G. Narsimha' },
      { p: 3, sub: 'Project Work – II', code: 'EC492', fac: 'Dr. G. Narsimha' },
      { p: 4, sub: 'Open Elective – I', code: 'OE401', fac: 'Mrs. R. Sujatha' },
      { p: 5, sub: 'Professional Elective – IV', code: 'EC5YY', fac: 'Mrs. R. Sujatha' },
    ] },
  ])
}

function yearIVSemIIEEEEEE(): SlotDraft[] {
  return buildWeek('EEE-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Professional Elective – III', code: 'EE5XX', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Professional Elective – IV', code: 'EE5YY', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Open Elective – I', code: 'OE401', fac: 'Mr. P. Ravi Teja' },
      { p: 2, sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Professional Elective – IV', code: 'EE5YY', fac: 'Mr. P. Ravi Teja' },
      { p: 4, sub: 'Professional Elective – III', code: 'EE5XX', fac: 'Dr. S. Ranganath' },
      { p: 5, sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' },
    ], lab: { sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' } },
    { day: 3, periods: [
      { p: 1, sub: 'Professional Elective – III', code: 'EE5XX', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Mr. P. Ravi Teja' },
      { p: 3, sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Professional Elective – IV', code: 'EE5YY', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – IV', code: 'EE5YY', fac: 'Mr. P. Ravi Teja' },
      { p: 2, sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Open Elective – I', code: 'OE401', fac: 'Mr. P. Ravi Teja' },
      { p: 4, sub: 'Professional Elective – III', code: 'EE5XX', fac: 'Dr. S. Ranganath' },
      { p: 5, sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' },
    ], lab: { sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' } },
    { day: 5, periods: [
      { p: 1, sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' },
      { p: 2, sub: 'Professional Elective – III', code: 'EE5XX', fac: 'Dr. S. Ranganath' },
      { p: 3, sub: 'Project Work – II', code: 'EE492', fac: 'Dr. S. Ranganath' },
      { p: 4, sub: 'Open Elective – I', code: 'OE401', fac: 'Mr. P. Ravi Teja' },
      { p: 5, sub: 'Professional Elective – IV', code: 'EE5YY', fac: 'Mr. P. Ravi Teja' },
    ] },
  ])
}

function yearIVSemIIIT(): SlotDraft[] {
  return buildWeek('IT-301', [
    { day: 1, periods: [
      { p: 1, sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Professional Elective – III', code: 'IT5XX', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – IV', code: 'IT5YY', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Professional Elective – IV', code: 'IT5YY', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – III', code: 'IT5XX', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' } },
    { day: 3, periods: [
      { p: 1, sub: 'Professional Elective – III', code: 'IT5XX', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – IV', code: 'IT5YY', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – IV', code: 'IT5YY', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Professional Elective – III', code: 'IT5XX', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' },
    ], lab: { sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' } },
    { day: 5, periods: [
      { p: 1, sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' },
      { p: 2, sub: 'Professional Elective – III', code: 'IT5XX', fac: 'Dr. Hema Latha' },
      { p: 3, sub: 'Project Work – II', code: 'IT492', fac: 'Dr. Hema Latha' },
      { p: 4, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. Hema Latha' },
      { p: 5, sub: 'Professional Elective – IV', code: 'IT5YY', fac: 'Dr. Hema Latha' },
    ] },
  ])
}

function yearIVSemIICivil(): SlotDraft[] {
  return buildWeek('Civil-201', [
    { day: 1, periods: [
      { p: 1, sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Professional Elective – III', code: 'CV5XX', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Professional Elective – IV', code: 'CV5YY', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Professional Elective – IV', code: 'CV5YY', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Professional Elective – III', code: 'CV5XX', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' },
    ], lab: { sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Professional Elective – III', code: 'CV5XX', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Professional Elective – IV', code: 'CV5YY', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – IV', code: 'CV5YY', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Professional Elective – III', code: 'CV5XX', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' },
    ], lab: { sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' },
      { p: 2, sub: 'Professional Elective – III', code: 'CV5XX', fac: 'Dr. L. Mahesh' },
      { p: 3, sub: 'Project Work – II', code: 'CV492', fac: 'Dr. L. Mahesh' },
      { p: 4, sub: 'Open Elective – I', code: 'OE401', fac: 'Dr. L. Mahesh' },
      { p: 5, sub: 'Professional Elective – IV', code: 'CV5YY', fac: 'Dr. L. Mahesh' },
    ] },
  ])
}

function yearIVSemIIMech(): SlotDraft[] {
  return buildWeek('Mech-101', [
    { day: 1, periods: [
      { p: 1, sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Professional Elective – III', code: 'ME5XX', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Professional Elective – IV', code: 'ME5YY', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' },
    ] },
    { day: 2, periods: [
      { p: 1, sub: 'Open Elective – I', code: 'OE401', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Professional Elective – IV', code: 'ME5YY', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Professional Elective – III', code: 'ME5XX', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' },
    ], lab: { sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' } },
    { day: 3, periods: [
      { p: 1, sub: 'Professional Elective – III', code: 'ME5XX', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Open Elective – I', code: 'OE401', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Professional Elective – IV', code: 'ME5YY', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' },
    ] },
    { day: 4, periods: [
      { p: 1, sub: 'Professional Elective – IV', code: 'ME5YY', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Open Elective – I', code: 'OE401', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Professional Elective – III', code: 'ME5XX', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' },
    ], lab: { sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' } },
    { day: 5, periods: [
      { p: 1, sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' },
      { p: 2, sub: 'Professional Elective – III', code: 'ME5XX', fac: 'Mr. K. Suresh' },
      { p: 3, sub: 'Project Work – II', code: 'ME492', fac: 'Mr. K. Suresh' },
      { p: 4, sub: 'Open Elective – I', code: 'OE401', fac: 'Mr. K. Suresh' },
      { p: 5, sub: 'Professional Elective – IV', code: 'ME5YY', fac: 'Mr. K. Suresh' },
    ] },
  ])
}

// ============================================================================
//  QUERY REGISTRY + PUBLIC API
// ============================================================================

type YearKeys = 'I' | 'II' | 'III' | 'IV'
type SemesterKeys = 'I' | 'II'

const YEAR_IDX: Record<YearKeys, number> = { I: 1, II: 2, III: 3, IV: 4 }
const SEM_IDX: Record<SemesterKeys, number> = { I: 1, II: 2 }

const GRIET_BRANCH_IDS: readonly string[] = GRIET_BRANCH_LIST.map((b) => b.id)
const GRIET_YEARS: YearKeys[] = ['I', 'II', 'III', 'IV']
const GRIET_SEMESTERS: SemesterKeys[] = ['I', 'II']

function timetableForKey(year: YearKeys, semester: SemesterKeys, branch: string): SlotDraft[] | null {
  const y = (year ?? '').toString().toUpperCase() as YearKeys
  const sem = (semester ?? '').toString().toUpperCase() as SemesterKeys
  const br = (branch ?? '').toString()

  if (!GRIET_YEARS.includes(y)) return null
  if (!GRIET_SEMESTERS.includes(sem)) return null
  if (!GRIET_BRANCH_IDS.includes(br)) return null

  const yi = YEAR_IDX[y]
  const si = SEM_IDX[sem]

  // Year I is common across all branches.
  if (yi === 1) {
    return si === 1 ? yearISemI() : yearISemII()
  }

  // Year II
  if (yi === 2) {
    if (si === 1) {
      switch (br) {
        case 'CSE': return yearIISemICSE()
        case 'CSE-AIML': return yearIISemICSEAIML()
        case 'CSE-CSBS': return yearIISemICSECSBS()
        case 'CSE-DS': return yearIISemICSEDS()
        case 'IT': return yearIISemIIT()
        case 'ECE': return yearIISemIECE()
        case 'EEE': return yearIISemIEEEEE()
        case 'Civil': return yearIISemICivil()
        case 'Mechanical': return yearIISemIMech()
      }
    }
    return yearIISemII(br)
  }

  // Year III
  if (yi === 3) {
    if (si === 1) {
      switch (br) {
        case 'CSE': return yearIIISemICSE()
        case 'CSE-AIML': return yearIIISemICSEAIML()
        case 'CSE-CSBS': return yearIIISemICSECSBS()
        case 'CSE-DS': return yearIIISemICSEDS()
        case 'IT': return yearIIISemIIT()
        case 'ECE': return yearIIISemIECE()
        case 'EEE': return yearIIISemIEEEEEE()
        case 'Civil': return yearIIISemICivil()
        case 'Mechanical': return yearIIISemIMech()
      }
    }
    switch (br) {
      case 'CSE': return yearIIISemIICSE()
      case 'CSE-AIML': return yearIIISemIICSEAIML()
      case 'CSE-CSBS': return yearIIISemIICSECSBS()
      case 'CSE-DS': return yearIIISemIICSEDS()
      case 'IT': return yearIIISemIIIT()
      case 'ECE': return yearIIISemIIECE()
      case 'EEE': return yearIIISemIIEEEEEE()
      case 'Civil': return yearIIISemIICivil()
      case 'Mechanical': return yearIIISemIIMech()
    }
  }

  // Year IV
  if (si === 1) {
    switch (br) {
      case 'CSE': return yearIVSemICSE()
      case 'CSE-AIML': return yearIVSemICSEAIML()
      case 'CSE-CSBS': return yearIVSemICSECSBS()
      case 'CSE-DS': return yearIVSemICSEDS()
      case 'IT': return yearIVSemIIT()
      case 'ECE': return yearIVSemIECE()
      case 'EEE': return yearIVSemIEEEEEE()
      case 'Civil': return yearIVSemICivil()
      case 'Mechanical': return yearIVSemIMech()
    }
  }
  switch (br) {
    case 'CSE': return yearIVSemIICSE()
    case 'CSE-AIML': return yearIVSemIICSEAIML()
    case 'CSE-CSBS': return yearIVSemIICSECSBS()
    case 'CSE-DS': return yearIVSemIICSEDS()
    case 'IT': return yearIVSemIIIT()
    case 'ECE': return yearIVSemIIECE()
    case 'EEE': return yearIVSemIIEEEEEE()
    case 'Civil': return yearIVSemIICivil()
    case 'Mechanical': return yearIVSemIIMech()
  }

  return null
}

export const GRIET_DEFAULT_TIMETABLES: Record<string, SlotDraft[]> = (() => {
  const map: Record<string, SlotDraft[]> = {}
  for (const year of GRIET_YEARS) {
    for (const semester of GRIET_SEMESTERS) {
      for (const branch of GRIET_BRANCH_IDS) {
        const slots = timetableForKey(year, semester, branch)
        if (slots) {
          map[`${year}|${semester}|${branch}`] = slots
        }
      }
    }
  }
  return map
})()

export function getGrietTimetable(
  year: string,
  semester: string,
  branch: string
): SlotDraft[] | null {
  return timetableForKey(
    (year ?? '').toString().toUpperCase() as YearKeys,
    (semester ?? '').toString().toUpperCase() as SemesterKeys,
    (branch ?? '').toString()
  )
}

export function getAllGrietBranches(): typeof GRIET_BRANCH_LIST {
  return GRIET_BRANCH_LIST
}

export function getAllGrietSubjects(
  year: string,
  semester: string,
  branch: string
): string[] {
  const slots = getGrietTimetable(year, semester, branch)
  if (!slots) return []
  const seen = new Set<string>()
  const subjects: string[] = []
  for (const slot of slots) {
    const name = slot.subjectName?.trim()
    if (!name || name === 'Free') continue
    if (!seen.has(name)) {
      seen.add(name)
      subjects.push(name)
    }
  }
  return subjects
}

export const GRIET_TIMETABLE_META: TimetableMeta[] = (() => {
  const meta: TimetableMeta[] = []
  for (const year of GRIET_YEARS) {
    for (const semester of GRIET_SEMESTERS) {
      for (const branch of GRIET_BRANCH_IDS) {
        meta.push({ year, semester, branch, section: 'A', academicYear: '2026-27' })
      }
    }
  }
  return meta
})()
