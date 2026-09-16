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
  P7: { start: '15:25', end: '16:15' },
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

interface Sub {
  sub: string
  code: string
  fac: string
}

type Period5 = 1 | 2 | 3 | 4 | 5

function makeWeek(
  room: string,
  cores: [Sub, Sub, Sub, Sub, Sub],
  labs: Partial<Record<Period5, Sub>>,
  auxs: Partial<Record<Period5, Partial<Record<Period5, Sub>>>> = {}
): SlotDraft[] {
  const defs: Array<{
    day: number
    periods: { p: Period5; sub: string; code: string; fac: string }[]
    lab?: { sub: string; code: string; fac: string }
  }> = []
  for (let d = 1; d <= 5; d++) {
    const day = d as Period5
    const periods: { p: Period5; sub: string; code: string; fac: string }[] = []
    for (let p = 1; p <= 5; p++) {
      const period = p as Period5
      const base = cores[(d - 1 + p - 1) % 5]!
      const rep = auxs[day]?.[period]
      periods.push({ p: period, sub: rep?.sub ?? base.sub, code: rep?.code ?? base.code, fac: rep?.fac ?? base.fac })
    }
    const lab = labs[day]
    defs.push(lab ? { day, periods, lab } : { day, periods })
  }
  return buildWeek(room, defs)
}

// ============================================================================
//  YEAR I — COMMON CURRICULUM FOR ALL BRANCHES (JNTUH R25)
// ============================================================================

function yearISemI(): SlotDraft[] {
  return buildWeek('A-201', [
    {
      day: 1,
      periods: [
        { p: 1, sub: 'Matrices and Calculus', code: 'MA101BS', fac: 'Dr. K. Sridevi' },
        { p: 2, sub: 'Engineering Chemistry', code: 'CH102BS', fac: 'Dr. P. Latha' },
        { p: 3, sub: 'Programming for Problem Solving', code: 'CS103ES', fac: 'Mrs. B. Swathi' },
        { p: 4, sub: 'Engineering Drawing & Computer Aided Drafting', code: 'ME105ES', fac: 'Mr. K. Suresh' },
        { p: 5, sub: 'Matrices and Calculus', code: 'MA101BS', fac: 'Dr. K. Sridevi' },
      ],
      lab: { sub: 'Engineering Chemistry Lab', code: 'CH109BS', fac: 'Dr. P. Latha' },
    },
    {
      day: 2,
      periods: [
        { p: 1, sub: 'Engineering Chemistry', code: 'CH102BS', fac: 'Dr. P. Latha' },
        { p: 2, sub: 'Programming for Problem Solving', code: 'CS103ES', fac: 'Mrs. B. Swathi' },
        { p: 3, sub: 'Engineering Drawing & Computer Aided Drafting', code: 'ME105ES', fac: 'Mr. K. Suresh' },
        { p: 4, sub: 'Matrices and Calculus', code: 'MA101BS', fac: 'Dr. K. Sridevi' },
        { p: 5, sub: 'Programming for Problem Solving', code: 'CS103ES', fac: 'Mrs. B. Swathi' },
      ],
    },
    {
      day: 3,
      periods: [
        { p: 1, sub: 'Programming for Problem Solving', code: 'CS103ES', fac: 'Mrs. B. Swathi' },
        { p: 2, sub: 'Engineering Drawing & Computer Aided Drafting', code: 'ME105ES', fac: 'Mr. K. Suresh' },
        { p: 3, sub: 'Matrices and Calculus', code: 'MA101BS', fac: 'Dr. K. Sridevi' },
        { p: 4, sub: 'Engineering Chemistry', code: 'CH102BS', fac: 'Dr. P. Latha' },
        { p: 5, sub: 'Engineering Drawing & Computer Aided Drafting', code: 'ME105ES', fac: 'Mr. K. Suresh' },
      ],
      lab: { sub: 'Programming for Problem Solving Lab', code: 'CS107ES', fac: 'Mrs. B. Swathi' },
    },
    {
      day: 4,
      periods: [
        { p: 1, sub: 'Engineering Drawing & Computer Aided Drafting', code: 'ME105ES', fac: 'Mr. K. Suresh' },
        { p: 2, sub: 'Matrices and Calculus', code: 'MA101BS', fac: 'Dr. K. Sridevi' },
        { p: 3, sub: 'Engineering Chemistry', code: 'CH102BS', fac: 'Dr. P. Latha' },
        { p: 4, sub: 'Programming for Problem Solving', code: 'CS103ES', fac: 'Mrs. B. Swathi' },
        { p: 5, sub: 'IT Workshop', code: 'CS109ES', fac: 'Mrs. B. Swathi' },
      ],
      lab: { sub: 'English Language & Communication Skills Lab', code: 'EN108HS', fac: 'Mr. V. Ravi Kumar' },
    },
    {
      day: 5,
      periods: [
        { p: 1, sub: 'Matrices and Calculus', code: 'MA101BS', fac: 'Dr. K. Sridevi' },
        { p: 2, sub: 'Engineering Chemistry', code: 'CH102BS', fac: 'Dr. P. Latha' },
        { p: 3, sub: 'Programming for Problem Solving', code: 'CS103ES', fac: 'Mrs. B. Swathi' },
        { p: 4, sub: 'Engineering Drawing & Computer Aided Drafting', code: 'ME105ES', fac: 'Mr. K. Suresh' },
        { p: 5, sub: 'Matrices and Calculus', code: 'MA101BS', fac: 'Dr. K. Sridevi' },
      ],
      lab: { sub: 'IT Workshop', code: 'CS109ES', fac: 'Mrs. B. Swathi' },
    },
  ])
}

function yearISemII(): SlotDraft[] {
  return makeWeek(
    'A-201',
    [
      { sub: 'Ordinary Differential Equations & Vector Calculus', code: 'MA201BS', fac: 'Dr. K. Sridevi' },
      { sub: 'Advanced Engineering Physics', code: 'PH202BS', fac: 'Dr. M. Sunitha' },
      { sub: 'Engineering Drawing & Computer Aided Drafting', code: 'ME203ES', fac: 'Mr. K. Suresh' },
      { sub: 'Basic Electrical Engineering', code: 'EE204ES', fac: 'Dr. S. Ranganath' },
      { sub: 'Data Structures', code: 'CS205ES', fac: 'Mrs. B. Swathi' },
    ],
    {
      1: { sub: 'Advanced Engineering Physics Lab', code: 'PH206BS', fac: 'Dr. M. Sunitha' },
      2: { sub: 'Basic Electrical Engineering Lab', code: 'EE209ES', fac: 'Dr. S. Ranganath' },
      3: { sub: 'Data Structures Lab', code: 'CS207ES', fac: 'Mrs. B. Swathi' },
      4: { sub: 'Python Programming Lab', code: 'CS208ES', fac: 'Mrs. B. Swathi' },
      5: { sub: 'IT Workshop', code: 'CS210ES', fac: 'Mrs. B. Swathi' },
    }
  )
}

// ============================================================================
//  YEAR II — SEMESTER I (JNTUH R25)
// ============================================================================

function yearIISemICSE(): SlotDraft[] {
  return makeWeek(
    'CSE-301',
    [
      { sub: 'Computer-Oriented Statistical Methods', code: 'MA301PC', fac: 'Dr. K. Sridevi' },
      { sub: 'Computer Organization & Architecture', code: 'CS302PC', fac: 'Dr. A. Ramesh' },
      { sub: 'Object-Oriented Programming through Java', code: 'CS303PC', fac: 'Mr. T. Vijay' },
      { sub: 'Operating Systems', code: 'CS304PC', fac: 'Dr. A. Ramesh' },
      { sub: 'Database Management Systems', code: 'CS305PC', fac: 'Mrs. S. Priya' },
    ],
    {
      1: { sub: 'OOP through Java Lab', code: 'CS307PC', fac: 'Mr. T. Vijay' },
      2: { sub: 'Software Engineering Lab', code: 'CS308PC', fac: 'Mrs. S. Priya' },
      3: { sub: 'DBMS Lab', code: 'CS309PC', fac: 'Dr. A. Ramesh' },
      4: { sub: 'Computational Mathematics Lab', code: 'MA306PC', fac: 'Dr. K. Sridevi' },
      5: { sub: 'Node JS/React JS/Django', code: 'CS310SD', fac: 'Dr. Hema Latha' },
    },
    {
      2: { 5: { sub: 'Environmental Science', code: 'VA300ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIISemIUnitAimlDs(room: string): SlotDraft[] {
  return makeWeek(
    room,
    [
      { sub: 'Mathematical & Statistical Foundations', code: 'MA401BS', fac: 'Dr. K. Sridevi' },
      { sub: 'Computer Organization & Architecture', code: 'CS302PC', fac: 'Dr. A. Ramesh' },
      { sub: 'Object-Oriented Programming through Java', code: 'CS303PC', fac: 'Mr. T. Vijay' },
      { sub: 'Software Engineering', code: 'CS304PC', fac: 'Mrs. S. Priya' },
      { sub: 'Database Management System', code: 'CS305PC', fac: 'Dr. A. Ramesh' },
    ],
    {
      1: { sub: 'OOP through Java Lab', code: 'CS307PC', fac: 'Mr. T. Vijay' },
      2: { sub: 'Software Engineering Lab', code: 'CS308PC', fac: 'Mrs. S. Priya' },
      3: { sub: 'DBMS Lab', code: 'CS309PC', fac: 'Dr. A. Ramesh' },
      4: { sub: 'Computational Mathematics Lab', code: 'MA306PC', fac: 'Dr. K. Sridevi' },
      5: { sub: 'Node JS/React JS/Django', code: 'CS310SD', fac: 'Dr. Hema Latha' },
    }
  )
}

function yearIISemICSECSBS(): SlotDraft[] {
  return makeWeek(
    'CSE-CSBS-402',
    [
      { sub: 'Mathematical & Statistical Foundations', code: 'MA301BS', fac: 'Dr. K. Sridevi' },
      { sub: 'Computer Organization', code: 'CB302PC', fac: 'Dr. A. Ramesh' },
      { sub: 'Business Statistics Using R', code: 'CB303PC', fac: 'Dr. Hema Latha' },
      { sub: 'Software Engineering', code: 'CS304PC', fac: 'Mrs. S. Priya' },
      { sub: 'Database Management Systems', code: 'CS305PC', fac: 'Dr. A. Ramesh' },
    ],
    {
      1: { sub: 'DBMS Lab', code: 'CS307PC', fac: 'Dr. A. Ramesh' },
      2: { sub: 'Business Statistics Using R Lab', code: 'CS308PC', fac: 'Dr. Hema Latha' },
      3: { sub: 'Algorithms Lab', code: 'CS309PC', fac: 'Dr. A. Ramesh' },
      4: { sub: 'Computational Mathematics Lab', code: 'MA306PC', fac: 'Dr. K. Sridevi' },
      5: { sub: 'Data Visualization', code: 'CB310SD', fac: 'Dr. Hema Latha' },
    }
  )
}

function yearIISemIECE(): SlotDraft[] {
  return makeWeek(
    'ECE-201',
    [
      { sub: 'Signals & Systems', code: 'EC301PC', fac: 'Dr. G. Narsimha' },
      { sub: 'Analog Electronics', code: 'EC302PC', fac: 'Mrs. R. Sujatha' },
      { sub: 'Electromagnetic Theory', code: 'EC303PC', fac: 'Dr. G. Narsimha' },
      { sub: 'Control Systems', code: 'EC304PC', fac: 'Mrs. R. Sujatha' },
      { sub: 'Electronic Devices & Circuits', code: 'EC305PC', fac: 'Dr. G. Narsimha' },
    ],
    {
      1: { sub: 'Modelling & Simulation Lab', code: 'EC307PC', fac: 'Dr. G. Narsimha' },
      2: { sub: 'Electronic Devices & Circuits Lab', code: 'EC308PC', fac: 'Mrs. R. Sujatha' },
      3: { sub: 'Digital Logic Design Lab', code: 'EC309PC', fac: 'Mrs. R. Sujatha' },
      4: { sub: 'Computational Mathematics Lab', code: 'MA306PC', fac: 'Dr. K. Sridevi' },
      5: { sub: 'Linux & Shell Scripting', code: 'EC310SD', fac: 'Dr. G. Narsimha' },
    },
    {
      2: { 5: { sub: 'Environmental Science', code: 'VA300ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIISemIEEEEEE(): SlotDraft[] {
  return makeWeek(
    'EEE-101',
    [
      { sub: 'Electromagnetic Fields', code: 'EE301PC', fac: 'Dr. S. Ranganath' },
      { sub: 'Electrical Machines - I', code: 'EE302PC', fac: 'Mr. P. Ravi Teja' },
      { sub: 'Electronic Devices & Circuits', code: 'EE303PC', fac: 'Dr. S. Ranganath' },
      { sub: 'Power Systems - I', code: 'EE304PC', fac: 'Mr. P. Ravi Teja' },
      { sub: 'Electrical Measurements & Sensors', code: 'EE305PC', fac: 'Dr. S. Ranganath' },
    ],
    {
      1: { sub: 'Electrical Machines - I Lab', code: 'EE307PC', fac: 'Mr. P. Ravi Teja' },
      3: { sub: 'Electrical Measurements Lab', code: 'EE308PC', fac: 'Dr. S. Ranganath' },
      4: { sub: 'Electronic Devices & Circuits Lab', code: 'EE309PC', fac: 'Dr. S. Ranganath' },
      5: { sub: 'Design of Electrical Systems using AutoCAD', code: 'EE310SD', fac: 'Mr. P. Ravi Teja' },
    },
    {
      2: { 5: { sub: 'Innovation & Entrepreneurship', code: 'MS306HS', fac: 'Mrs. N. Lavanya' } },
      3: { 5: { sub: 'Environmental Science', code: 'VA300ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIISemIIT(): SlotDraft[] {
  return makeWeek(
    'IT-301',
    [
      { sub: 'Mathematical & Statistical Foundations', code: 'MA301BS', fac: 'Dr. K. Sridevi' },
      { sub: 'Computer Organization & Microprocessor', code: 'IT302PC', fac: 'Dr. Hema Latha' },
      { sub: 'Java Programming', code: 'IT303PC', fac: 'Dr. Hema Latha' },
      { sub: 'Operating Systems', code: 'IT304PC', fac: 'Dr. Hema Latha' },
      { sub: 'Introduction to IoT', code: 'IT305PC', fac: 'Dr. Hema Latha' },
    ],
    {
      1: { sub: 'Java Programming Lab', code: 'IT307PC', fac: 'Dr. Hema Latha' },
      2: { sub: 'Operating Systems Lab', code: 'IT308PC', fac: 'Dr. Hema Latha' },
      3: { sub: 'IoT Lab', code: 'IT309PC', fac: 'Dr. Hema Latha' },
      4: { sub: 'Computational Mathematics Lab', code: 'MA306PC', fac: 'Dr. K. Sridevi' },
      5: { sub: 'Data Visualization', code: 'IT310SD', fac: 'Dr. Hema Latha' },
    }
  )
}

function yearIISemICivil(): SlotDraft[] {
  return makeWeek(
    'Civil-201',
    [
      { sub: 'Probability & Statistics', code: 'CV301PC', fac: 'Dr. K. Sridevi' },
      { sub: 'Building Planning & Construction', code: 'CV302PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Strength of Materials', code: 'CV303PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Surveying & Geomatics', code: 'CV304PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Fluid Mechanics', code: 'CV305PC', fac: 'Dr. L. Mahesh' },
    ],
    {
      1: { sub: 'Computer Aided Building Drafting Lab', code: 'CV307PC', fac: 'Dr. L. Mahesh' },
      2: { sub: 'Strength of Materials Lab', code: 'CV308PC', fac: 'Dr. L. Mahesh' },
      3: { sub: 'Surveying & Geomatics Lab', code: 'CV309PC', fac: 'Dr. L. Mahesh' },
      4: { sub: 'Computational Mathematics Lab', code: 'MA306PC', fac: 'Dr. K. Sridevi' },
      5: { sub: 'Design Thinking Lab', code: 'CV310SD', fac: 'Dr. L. Mahesh' },
    }
  )
}

function yearIISemIMech(): SlotDraft[] {
  return makeWeek(
    'Mech-101',
    [
      { sub: 'Engineering Mechanics', code: 'ME301PC', fac: 'Mr. K. Suresh' },
      { sub: 'Thermodynamics', code: 'ME302PC', fac: 'Mr. K. Suresh' },
      { sub: 'Manufacturing Technology', code: 'ME303PC', fac: 'Mr. K. Suresh' },
      { sub: 'Materials Science & Engineering', code: 'ME304PC', fac: 'Mr. K. Suresh' },
      { sub: 'Machine Drawing', code: 'ME305PC', fac: 'Mr. K. Suresh' },
    ],
    {
      1: { sub: 'Thermodynamics Lab', code: 'ME307PC', fac: 'Mr. K. Suresh' },
      2: { sub: 'Manufacturing Technology Lab', code: 'ME308PC', fac: 'Mr. K. Suresh' },
      3: { sub: 'Materials Testing Lab', code: 'ME309PC', fac: 'Mr. K. Suresh' },
      4: { sub: 'Computational Mathematics Lab', code: 'MA306PC', fac: 'Dr. K. Sridevi' },
      5: { sub: 'CAD/CAM Lab', code: 'ME310SD', fac: 'Mr. K. Suresh' },
    }
  )
}

// ============================================================================
//  YEAR II — SEMESTER II (JNTUH R25)
// ============================================================================

function yearIISemIIUnitCseDs(room: string): SlotDraft[] {
  return makeWeek(
    room,
    [
      { sub: 'Discrete Mathematics', code: 'CS401PC', fac: 'Dr. K. Sridevi' },
      { sub: 'Software Engineering', code: 'CS402PC', fac: 'Dr. A. Ramesh' },
      { sub: 'Algorithm Design & Analysis', code: 'CS403PC', fac: 'Mr. T. Vijay' },
      { sub: 'Computer Networks', code: 'CS404PC', fac: 'Mrs. S. Priya' },
      { sub: 'Machine Learning', code: 'CS405PC', fac: 'Dr. R. Kiran' },
    ],
    {
      1: { sub: 'Software Engineering Lab', code: 'CS407PC', fac: 'Mrs. S. Priya' },
      2: { sub: 'Computer Networks Lab', code: 'CS408PC', fac: 'Mrs. S. Priya' },
      3: { sub: 'Machine Learning Lab', code: 'CS409PC', fac: 'Dr. R. Kiran' },
      4: { sub: 'Computational Mathematics Lab', code: 'MA406PC', fac: 'Dr. K. Sridevi' },
      5: { sub: 'Data Visualization', code: 'CS410SD', fac: 'Dr. Hema Latha' },
    }
  )
}

function yearIISemIICSEAIML(): SlotDraft[] {
  return makeWeek(
    'CSE-AIML-401',
    [
      { sub: 'Discrete Mathematics', code: 'CS401PC', fac: 'Dr. K. Sridevi' },
      { sub: 'Operating Systems', code: 'CS402PC', fac: 'Dr. A. Ramesh' },
      { sub: 'Algorithms Design & Analysis', code: 'CS403PC', fac: 'Mr. T. Vijay' },
      { sub: 'Computer Networks', code: 'CS404PC', fac: 'Mrs. S. Priya' },
      { sub: 'Machine Learning', code: 'CS405PC', fac: 'Dr. R. Kiran' },
    ],
    {
      1: { sub: 'Operating Systems Lab', code: 'CS407PC', fac: 'Dr. A. Ramesh' },
      3: { sub: 'Computer Networks Lab', code: 'CS408PC', fac: 'Mrs. S. Priya' },
      4: { sub: 'Machine Learning Lab', code: 'CS409PC', fac: 'Dr. R. Kiran' },
      5: { sub: 'Data Visualization', code: 'CS410SD', fac: 'Dr. Hema Latha' },
    },
    {
      2: { 5: { sub: 'Innovation & Entrepreneurship', code: 'MS406HS', fac: 'Mrs. N. Lavanya' } },
      3: { 5: { sub: 'Indian Knowledge System', code: 'VA400HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIISemIICSECSBS(): SlotDraft[] {
  return makeWeek(
    'CSE-CSBS-402',
    [
      { sub: 'Discrete Mathematics', code: 'CS401PC', fac: 'Dr. K. Sridevi' },
      { sub: 'Operating Systems', code: 'CS402PC', fac: 'Dr. A. Ramesh' },
      { sub: 'Artificial Intelligence', code: 'CB403PC', fac: 'Dr. R. Kiran' },
      { sub: 'Software Engineering', code: 'CS404PC', fac: 'Mrs. S. Priya' },
      { sub: 'Business Economics & Financial Analysis', code: 'MS405HS', fac: 'Mrs. N. Lavanya' },
    ],
    {
      1: { sub: 'Operating Systems Lab', code: 'CS407PC', fac: 'Dr. A. Ramesh' },
      3: { sub: 'AI Lab', code: 'CS408PC', fac: 'Dr. R. Kiran' },
      4: { sub: 'Software Engineering Lab', code: 'CS409PC', fac: 'Mrs. S. Priya' },
      5: { sub: 'Node JS/React JS/Django', code: 'CS410SD', fac: 'Dr. Hema Latha' },
    },
    {
      2: { 5: { sub: 'Innovation & Entrepreneurship', code: 'MS406HS', fac: 'Mrs. N. Lavanya' } },
      3: { 5: { sub: 'Indian Knowledge System', code: 'VA400HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIISemIIECE(): SlotDraft[] {
  return makeWeek(
    'ECE-201',
    [
      { sub: 'Digital Signal Processing', code: 'EC401PC', fac: 'Dr. G. Narsimha' },
      { sub: 'Analog Communication', code: 'EC402PC', fac: 'Mrs. R. Sujatha' },
      { sub: 'VLSI Design', code: 'EC403PC', fac: 'Mrs. R. Sujatha' },
      { sub: 'Microprocessors & Microcontrollers', code: 'EC404PC', fac: 'Dr. G. Narsimha' },
      { sub: 'Information Theory & Coding', code: 'EC405PC', fac: 'Mrs. R. Sujatha' },
    ],
    {
      1: { sub: 'DSP Lab', code: 'EC407PC', fac: 'Dr. G. Narsimha' },
      3: { sub: 'Communication Systems Lab', code: 'EC408PC', fac: 'Mrs. R. Sujatha' },
      4: { sub: 'VLSI Design Lab', code: 'EC409PC', fac: 'Mrs. R. Sujatha' },
      5: { sub: 'Data Visualization', code: 'EC410SD', fac: 'Dr. G. Narsimha' },
    },
    {
      2: { 5: { sub: 'Innovation & Entrepreneurship', code: 'MS406HS', fac: 'Mrs. N. Lavanya' } },
      3: { 5: { sub: 'Indian Knowledge System', code: 'VA400HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIISemIIEEEEEE(): SlotDraft[] {
  return makeWeek(
    'EEE-101',
    [
      { sub: 'Numerical Methods & Complex Variables', code: 'EE401PC', fac: 'Dr. K. Sridevi' },
      { sub: 'Control Systems', code: 'EE402PC', fac: 'Dr. S. Ranganath' },
      { sub: 'Digital Electronics', code: 'EE403PC', fac: 'Mr. P. Ravi Teja' },
      { sub: 'Power Systems - II', code: 'EE404PC', fac: 'Dr. S. Ranganath' },
      { sub: 'Electrical Machines - II', code: 'EE405PC', fac: 'Mr. P. Ravi Teja' },
    ],
    {
      1: { sub: 'Digital Electronics Lab', code: 'EE406PC', fac: 'Mr. P. Ravi Teja' },
      3: { sub: 'Control Systems Lab', code: 'EE407PC', fac: 'Dr. S. Ranganath' },
      4: { sub: 'Power Systems Lab', code: 'EE408PC', fac: 'Dr. S. Ranganath' },
      5: { sub: 'PCB Design', code: 'EE409PC', fac: 'Mr. P. Ravi Teja' },
    },
    {
      2: { 5: { sub: 'Indian Knowledge System', code: 'VA400HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIISemIIIT(): SlotDraft[] {
  return makeWeek(
    'IT-301',
    [
      { sub: 'Discrete Mathematics', code: 'CS401PC', fac: 'Dr. K. Sridevi' },
      { sub: 'Software Engineering', code: 'IT402PC', fac: 'Dr. Hema Latha' },
      { sub: 'Web Technologies', code: 'IT403PC', fac: 'Dr. Hema Latha' },
      { sub: 'Computer Networks', code: 'CS404PC', fac: 'Dr. Hema Latha' },
      { sub: 'Database Management Systems', code: 'IT405PC', fac: 'Dr. Hema Latha' },
    ],
    {
      1: { sub: 'DBMS Lab', code: 'CS407PC', fac: 'Dr. Hema Latha' },
      3: { sub: 'Computer Networks Lab', code: 'IT408PC', fac: 'Dr. Hema Latha' },
      4: { sub: 'Web Programming Lab', code: 'IT409PC', fac: 'Dr. Hema Latha' },
      5: { sub: 'Node JS/React JS/Django/UI Design Flutter', code: 'IT410SD', fac: 'Dr. Hema Latha' },
    },
    {
      2: { 5: { sub: 'Innovation & Entrepreneurship', code: 'MS406HS', fac: 'Mrs. N. Lavanya' } },
      3: { 5: { sub: 'Indian Knowledge System', code: 'VA400HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIISemIICivil(): SlotDraft[] {
  return makeWeek(
    'Civil-201',
    [
      { sub: 'Concrete Technology', code: 'CV401PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Advanced Strength of Materials', code: 'CV402PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Geotechnical Engineering', code: 'CV403PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Transportation Engineering', code: 'CV404PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Environmental Engineering', code: 'CV405PC', fac: 'Dr. L. Mahesh' },
    ],
    {
      1: { sub: 'Geotechnical Engineering Lab', code: 'CV406PC', fac: 'Dr. L. Mahesh' },
      2: { sub: 'Transportation Engineering Lab', code: 'CV407PC', fac: 'Dr. L. Mahesh' },
      3: { sub: 'Environmental Engineering Lab', code: 'CV408PC', fac: 'Dr. L. Mahesh' },
      4: { sub: 'Digital Surveying & GIS Lab', code: 'CV409SD', fac: 'Dr. L. Mahesh' },
      5: { sub: 'Real Time/Field Based Project', code: 'CV410PC', fac: 'Dr. L. Mahesh' },
    },
    {
      2: { 5: { sub: 'Innovation & Entrepreneurship', code: 'MS406HS', fac: 'Mrs. N. Lavanya' } },
      3: { 5: { sub: 'Environmental Science', code: 'VA400ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIISemIIMech(): SlotDraft[] {
  return makeWeek(
    'Mech-101',
    [
      { sub: 'Fluid Mechanics & Hydraulic Machines', code: 'ME401PC', fac: 'Mr. K. Suresh' },
      { sub: 'Machine Design', code: 'ME402PC', fac: 'Mr. K. Suresh' },
      { sub: 'Heat Transfer', code: 'ME403PC', fac: 'Mr. K. Suresh' },
      { sub: 'Dynamics of Machinery', code: 'ME404PC', fac: 'Mr. K. Suresh' },
      { sub: 'Metrology & Quality Engineering', code: 'ME405PC', fac: 'Mr. K. Suresh' },
    ],
    {
      1: { sub: 'Fluid Mechanics Lab', code: 'ME406PC', fac: 'Mr. K. Suresh' },
      3: { sub: 'Heat Transfer Lab', code: 'ME407PC', fac: 'Mr. K. Suresh' },
      4: { sub: 'Metrology Lab', code: 'ME408PC', fac: 'Mr. K. Suresh' },
      5: { sub: 'Data Visualization', code: 'ME409SD', fac: 'Mr. K. Suresh' },
    },
    {
      2: { 5: { sub: 'Innovation & Entrepreneurship', code: 'MS406HS', fac: 'Mrs. N. Lavanya' } },
      3: { 5: { sub: 'Indian Knowledge System', code: 'VA400HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

// ============================================================================
//  YEAR III — SEMESTER I (JNTUH R25)
// ============================================================================

function yearIIISemICSE(): SlotDraft[] {
  return makeWeek(
    'CSE-301',
    [
      { sub: 'Automata Theory & Compiler Design', code: 'CS501PC', fac: 'Dr. A. Ramesh' },
      { sub: 'Artificial Intelligence', code: 'CS502PC', fac: 'Dr. R. Kiran' },
      { sub: 'DevOps', code: 'CS503PC', fac: 'Mr. T. Vijay' },
      { sub: 'Professional Elective - I', code: 'PE-I', fac: 'Dr. A. Ramesh' },
      { sub: 'Open Elective - I', code: 'OE-I', fac: 'Mrs. S. Priya' },
    ],
    {
      1: { sub: 'AI Lab', code: 'CS504PC', fac: 'Dr. R. Kiran' },
      3: { sub: 'DevOps Lab', code: 'CS505PC', fac: 'Mr. T. Vijay' },
      4: { sub: 'UI Design Flutter/Android', code: 'CS506SD', fac: 'Mrs. S. Priya' },
    },
    {
      5: { 5: { sub: 'Indian Knowledge System', code: 'VA500HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIUnitAimlDs(room: string): SlotDraft[] {
  return makeWeek(
    room,
    [
      { sub: 'Computer Vision', code: 'AI501PC', fac: 'Dr. R. Kiran' },
      { sub: 'Reinforcement Learning', code: 'AI502PC', fac: 'Dr. R. Kiran' },
      { sub: 'Expert Systems', code: 'AI503PC', fac: 'Dr. R. Kiran' },
      { sub: 'Professional Elective - I', code: 'PE-I', fac: 'Dr. R. Kiran' },
      { sub: 'Open Elective - I', code: 'OE-I', fac: 'Dr. Hema Latha' },
    ],
    {
      1: { sub: 'Computer Vision Lab', code: 'AI504PC', fac: 'Dr. R. Kiran' },
      3: { sub: 'Reinforcement Learning Lab', code: 'AI505PC', fac: 'Dr. R. Kiran' },
      4: { sub: 'Prompt Engineering', code: 'AI506SD', fac: 'Dr. Hema Latha' },
    },
    {
      5: { 5: { sub: 'Indian Knowledge System', code: 'VA500HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemICSECSBS(): SlotDraft[] {
  return makeWeek(
    'CSE-CSBS-402',
    [
      { sub: 'Automata Theory & Compiler Design', code: 'CB501PC', fac: 'Dr. A. Ramesh' },
      { sub: 'Web Technologies', code: 'CB502PC', fac: 'Dr. Hema Latha' },
      { sub: 'Business Analytics', code: 'CB503PC', fac: 'Dr. Hema Latha' },
      { sub: 'Professional Elective - I', code: 'PE-I', fac: 'Dr. Hema Latha' },
      { sub: 'Open Elective - I', code: 'OE-I', fac: 'Mrs. N. Lavanya' },
    ],
    {
      1: { sub: 'Web Technologies Lab', code: 'CB504PC', fac: 'Dr. Hema Latha' },
      3: { sub: 'Business Analytics Lab', code: 'CB505PC', fac: 'Dr. Hema Latha' },
      4: { sub: 'Full Stack Development Lab', code: 'CB506SD', fac: 'Dr. Hema Latha' },
    },
    {
      5: { 5: { sub: 'Indian Knowledge System', code: 'VA500HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIIT(): SlotDraft[] {
  return makeWeek(
    'IT-301',
    [
      { sub: 'Machine Learning', code: 'CI501PC', fac: 'Dr. R. Kiran' },
      { sub: 'Information Security', code: 'CI502PC', fac: 'Dr. Hema Latha' },
      { sub: 'Web Technologies', code: 'CI503PC', fac: 'Dr. Hema Latha' },
      { sub: 'Professional Elective - I', code: 'PE-I', fac: 'Dr. Hema Latha' },
      { sub: 'Open Elective - I', code: 'OE-I', fac: 'Dr. R. Kiran' },
    ],
    {
      1: { sub: 'Machine Learning Lab', code: 'CI504PC', fac: 'Dr. R. Kiran' },
      3: { sub: 'Information Security Lab', code: 'CI505PC', fac: 'Dr. Hema Latha' },
      4: { sub: 'Full Stack Development Lab', code: 'CI506SD', fac: 'Dr. Hema Latha' },
    },
    {
      5: { 5: { sub: 'Indian Knowledge System', code: 'VA500HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIECE(): SlotDraft[] {
  return makeWeek(
    'ECE-201',
    [
      { sub: 'Control Systems', code: 'EC501PC', fac: 'Mrs. R. Sujatha' },
      { sub: 'Digital Communication', code: 'EC502PC', fac: 'Dr. G. Narsimha' },
      { sub: 'Computer Architecture', code: 'EC503PC', fac: 'Dr. G. Narsimha' },
      { sub: 'Professional Elective - I', code: 'PE-I', fac: 'Mrs. R. Sujatha' },
      { sub: 'Open Elective - I', code: 'OE-I', fac: 'Dr. G. Narsimha' },
    ],
    {
      1: { sub: 'Control Systems Lab', code: 'EC504PC', fac: 'Mrs. R. Sujatha' },
      3: { sub: 'Digital Communication Lab', code: 'EC505PC', fac: 'Dr. G. Narsimha' },
      4: { sub: 'Embedded Systems Lab', code: 'EC506SD', fac: 'Mrs. R. Sujatha' },
    },
    {
      5: { 5: { sub: 'Indian Knowledge System', code: 'VA500HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIEEEEEE(): SlotDraft[] {
  return makeWeek(
    'EEE-101',
    [
      { sub: 'Power Electronics', code: 'EE501PC', fac: 'Mr. P. Ravi Teja' },
      { sub: 'Microprocessors & Microcontrollers', code: 'EE502PC', fac: 'Dr. S. Ranganath' },
      { sub: 'Power System Protection', code: 'EE503PC', fac: 'Dr. S. Ranganath' },
      { sub: 'Professional Elective - I', code: 'PE-I', fac: 'Mr. P. Ravi Teja' },
      { sub: 'Open Elective - I', code: 'OE-I', fac: 'Dr. S. Ranganath' },
    ],
    {
      1: { sub: 'Power Electronics Lab', code: 'EE504PC', fac: 'Mr. P. Ravi Teja' },
      3: { sub: 'Microprocessors Lab', code: 'EE505PC', fac: 'Dr. S. Ranganath' },
      4: { sub: 'PCB Design / FPGA Fundamentals', code: 'EE506SD', fac: 'Mr. P. Ravi Teja' },
    },
    {
      5: { 5: { sub: 'Indian Knowledge System', code: 'VA500HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemICivil(): SlotDraft[] {
  return makeWeek(
    'Civil-201',
    [
      { sub: 'Reinforced Concrete Design', code: 'CV501PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Soil Mechanics', code: 'CV502PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Environmental Engineering', code: 'CV503PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Professional Elective - I', code: 'PE-I', fac: 'Dr. L. Mahesh' },
      { sub: 'Open Elective - I', code: 'OE-I', fac: 'Dr. L. Mahesh' },
    ],
    {
      1: { sub: 'RCC Design Lab', code: 'CV504PC', fac: 'Dr. L. Mahesh' },
      3: { sub: 'Soil Mechanics Lab', code: 'CV505PC', fac: 'Dr. L. Mahesh' },
      4: { sub: 'Environmental Engineering Lab', code: 'CV506PC', fac: 'Dr. L. Mahesh' },
    },
    {
      5: { 5: { sub: 'Indian Knowledge System', code: 'VA500HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIMech(): SlotDraft[] {
  return makeWeek(
    'Mech-101',
    [
      { sub: 'Machine Design', code: 'ME501PC', fac: 'Mr. K. Suresh' },
      { sub: 'CAD/CAM', code: 'ME502PC', fac: 'Mr. K. Suresh' },
      { sub: 'Automation & Robotics', code: 'ME503PC', fac: 'Mr. K. Suresh' },
      { sub: 'Professional Elective - I', code: 'PE-I', fac: 'Mr. K. Suresh' },
      { sub: 'Open Elective - I', code: 'OE-I', fac: 'Mr. K. Suresh' },
    ],
    {
      1: { sub: 'Machine Design Lab', code: 'ME504PC', fac: 'Mr. K. Suresh' },
      3: { sub: 'CAD/CAM Lab', code: 'ME505PC', fac: 'Mr. K. Suresh' },
      4: { sub: 'IoT Lab', code: 'ME506SD', fac: 'Mr. K. Suresh' },
    },
    {
      5: { 5: { sub: 'Indian Knowledge System', code: 'VA500HS', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

// ============================================================================
//  YEAR III — SEMESTER II (JNTUH R25)
// ============================================================================

function yearIIISemIICSE(): SlotDraft[] {
  return makeWeek(
    'CSE-301',
    [
      { sub: 'Cryptography & Network Security', code: 'CS601PC', fac: 'Mrs. S. Priya' },
      { sub: 'Deep Learning', code: 'CS602PC', fac: 'Dr. R. Kiran' },
      { sub: 'Business Economics & Financial Analysis', code: 'MS603HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - II', code: 'PE-II', fac: 'Dr. A. Ramesh' },
      { sub: 'Open Elective - II', code: 'OE-II', fac: 'Mr. T. Vijay' },
    ],
    {
      1: { sub: 'Cryptography & Network Security Lab', code: 'CS604PC', fac: 'Mrs. S. Priya' },
      2: { sub: 'Deep Learning Lab', code: 'CS605PC', fac: 'Dr. R. Kiran' },
      3: { sub: 'Full Stack Development Lab', code: 'CS606SD', fac: 'Mr. T. Vijay' },
      4: { sub: 'English for Employability Skills Lab', code: 'EN607HS', fac: 'Mr. V. Ravi Kumar' },
      5: { sub: 'Cloud Computing', code: 'CS608SD', fac: 'Dr. Hema Latha' },
    },
    {
      2: { 5: { sub: 'Environmental Science', code: 'VA600ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIIUnitAimlDs(room: string): SlotDraft[] {
  return makeWeek(
    room,
    [
      { sub: 'Natural Language Processing', code: 'AI601PC', fac: 'Dr. R. Kiran' },
      { sub: 'Deep Learning', code: 'AI602PC', fac: 'Dr. R. Kiran' },
      { sub: 'Business Economics & Financial Analysis', code: 'MS603HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - II', code: 'PE-II', fac: 'Dr. R. Kiran' },
      { sub: 'Open Elective - II', code: 'OE-II', fac: 'Dr. Hema Latha' },
    ],
    {
      1: { sub: 'NLP Lab', code: 'AI604PC', fac: 'Dr. R. Kiran' },
      2: { sub: 'Deep Learning Lab', code: 'AI605PC', fac: 'Dr. R. Kiran' },
      3: { sub: 'Chatbots Lab', code: 'AI606PC', fac: 'Dr. Hema Latha' },
      4: { sub: 'Advanced English Communication Skills Lab', code: 'EN607HS', fac: 'Mr. V. Ravi Kumar' },
      5: { sub: 'Prompt Engineering', code: 'AI608SD', fac: 'Dr. Hema Latha' },
    },
    {
      2: { 5: { sub: 'Environmental Science', code: 'VA600ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIICSECSBS(): SlotDraft[] {
  return makeWeek(
    'CSE-CSBS-402',
    [
      { sub: 'Machine Learning', code: 'CB601PC', fac: 'Dr. R. Kiran' },
      { sub: 'Operations Research', code: 'CB602PC', fac: 'Dr. K. Sridevi' },
      { sub: 'Business Economics & Financial Analysis', code: 'MS603HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - II', code: 'PE-II', fac: 'Dr. Hema Latha' },
      { sub: 'Open Elective - II', code: 'OE-II', fac: 'Dr. A. Ramesh' },
    ],
    {
      1: { sub: 'Operations Research Lab', code: 'CB604PC', fac: 'Dr. K. Sridevi' },
      2: { sub: 'Linux Programming Lab', code: 'CB605PC', fac: 'Dr. Hema Latha' },
      3: { sub: 'Machine Learning Lab', code: 'CB606PC', fac: 'Dr. R. Kiran' },
      4: { sub: 'English for Employability Skills Lab', code: 'EN607HS', fac: 'Mr. V. Ravi Kumar' },
      5: { sub: 'Big Data Spark', code: 'CB608SD', fac: 'Dr. Hema Latha' },
    },
    {
      2: { 5: { sub: 'Environmental Science', code: 'VA600ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIIIT(): SlotDraft[] {
  return makeWeek(
    'IT-301',
    [
      { sub: 'Software Engineering', code: 'CI601PC', fac: 'Dr. Hema Latha' },
      { sub: 'Compiler Design', code: 'CI602PC', fac: 'Dr. Hema Latha' },
      { sub: 'Cloud Computing', code: 'CI603PC', fac: 'Dr. Hema Latha' },
      { sub: 'Professional Elective - II', code: 'PE-II', fac: 'Dr. R. Kiran' },
      { sub: 'Open Elective - II', code: 'OE-II', fac: 'Dr. Hema Latha' },
    ],
    {
      1: { sub: 'Software Engineering Lab', code: 'CI604PC', fac: 'Dr. Hema Latha' },
      3: { sub: 'Compiler Design Lab', code: 'CI605PC', fac: 'Dr. Hema Latha' },
      4: { sub: 'Big Data Spark', code: 'CI606SD', fac: 'Dr. Hema Latha' },
      5: { sub: 'English for Employability Skills Lab', code: 'EN607HS', fac: 'Mr. V. Ravi Kumar' },
    },
    {
      2: { 5: { sub: 'Environmental Science', code: 'VA600ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIIECE(): SlotDraft[] {
  return makeWeek(
    'ECE-201',
    [
      { sub: 'Antenna & Wave Propagation', code: 'EC601PC', fac: 'Dr. G. Narsimha' },
      { sub: 'Optical Communication', code: 'EC602PC', fac: 'Mrs. R. Sujatha' },
      { sub: 'Business Economics & Financial Analysis', code: 'MS603HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - II', code: 'PE-II', fac: 'Dr. G. Narsimha' },
      { sub: 'Open Elective - II', code: 'OE-II', fac: 'Mrs. R. Sujatha' },
    ],
    {
      1: { sub: 'Optical Communication Lab', code: 'EC604PC', fac: 'Mrs. R. Sujatha' },
      3: { sub: 'RF & Microwave Lab', code: 'EC605PC', fac: 'Dr. G. Narsimha' },
      4: { sub: 'IoT Lab', code: 'EC606SD', fac: 'Mrs. R. Sujatha' },
      5: { sub: 'English for Employability Skills Lab', code: 'EN607HS', fac: 'Mr. V. Ravi Kumar' },
    },
    {
      2: { 5: { sub: 'Environmental Science', code: 'VA600ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIIEEEEEE(): SlotDraft[] {
  return makeWeek(
    'EEE-101',
    [
      { sub: 'Power Semiconductor Drives', code: 'EE601PC', fac: 'Mr. P. Ravi Teja' },
      { sub: 'Power System Protection', code: 'EE602PC', fac: 'Dr. S. Ranganath' },
      { sub: 'Business Economics & Financial Analysis', code: 'MS603HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - II', code: 'PE-II', fac: 'Mr. P. Ravi Teja' },
      { sub: 'Open Elective - II', code: 'OE-II', fac: 'Dr. S. Ranganath' },
    ],
    {
      1: { sub: 'Drives Lab', code: 'EE604PC', fac: 'Mr. P. Ravi Teja' },
      3: { sub: 'Power System Protection Lab', code: 'EE605PC', fac: 'Dr. S. Ranganath' },
      4: { sub: 'Linux Programming Lab', code: 'EE606SD', fac: 'Mr. P. Ravi Teja' },
      5: { sub: 'English for Employability Skills Lab', code: 'EN607HS', fac: 'Mr. V. Ravi Kumar' },
    },
    {
      2: { 5: { sub: 'Environmental Science', code: 'VA600ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIICivil(): SlotDraft[] {
  return makeWeek(
    'Civil-201',
    [
      { sub: 'Design of Steel Structures', code: 'CV601PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Estimation & Costing', code: 'CV602PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Business Economics & Financial Analysis', code: 'MS603HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - II', code: 'PE-II', fac: 'Dr. L. Mahesh' },
      { sub: 'Open Elective - II', code: 'OE-II', fac: 'Dr. L. Mahesh' },
    ],
    {
      1: { sub: 'Estimation & Costing Lab', code: 'CV604PC', fac: 'Dr. L. Mahesh' },
      3: { sub: 'GIS & Remote Sensing Lab', code: 'CV605SD', fac: 'Dr. L. Mahesh' },
      4: { sub: 'English for Employability Skills Lab', code: 'EN607HS', fac: 'Mr. V. Ravi Kumar' },
    },
    {
      2: { 5: { sub: 'Environmental Science', code: 'VA600ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIIISemIIMech(): SlotDraft[] {
  return makeWeek(
    'Mech-101',
    [
      { sub: 'Refrigeration & Air Conditioning', code: 'ME601PC', fac: 'Mr. K. Suresh' },
      { sub: 'Finite Element Analysis', code: 'ME602PC', fac: 'Mr. K. Suresh' },
      { sub: 'Business Economics & Financial Analysis', code: 'MS603HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - II', code: 'PE-II', fac: 'Mr. K. Suresh' },
      { sub: 'Open Elective - II', code: 'OE-II', fac: 'Mr. K. Suresh' },
    ],
    {
      1: { sub: 'RAC Lab', code: 'ME604PC', fac: 'Mr. K. Suresh' },
      3: { sub: 'FEA Lab', code: 'ME605PC', fac: 'Mr. K. Suresh' },
      4: { sub: 'Data Visualization', code: 'ME606SD', fac: 'Mr. K. Suresh' },
      5: { sub: 'English for Employability Skills Lab', code: 'EN607HS', fac: 'Mr. V. Ravi Kumar' },
    },
    {
      2: { 5: { sub: 'Environmental Science', code: 'VA600ES', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

// ============================================================================
//  YEAR IV — SEMESTER I (JNTUH R25)
// ============================================================================

function yearIVSemICSE(): SlotDraft[] {
  return makeWeek(
    'CSE-301',
    [
      { sub: 'Natural Language Processing', code: 'CS701PC', fac: 'Dr. R. Kiran' },
      { sub: 'Cyber Security', code: 'CS702PC', fac: 'Mrs. S. Priya' },
      { sub: 'Fundamentals of Management', code: 'MS703HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - III', code: 'PE-III', fac: 'Dr. A. Ramesh' },
      { sub: 'Professional Elective - IV', code: 'PE-IV', fac: 'Mr. T. Vijay' },
    ],
    {
      1: { sub: 'NLP Lab', code: 'CS704PC', fac: 'Dr. R. Kiran' },
      3: { sub: 'Cyber Security Lab', code: 'CS705PC', fac: 'Mrs. S. Priya' },
      4: { sub: 'Industry Oriented Mini Project/Internship', code: 'CS706PC', fac: 'Dr. A. Ramesh' },
    },
    {
      5: { 5: { sub: 'Open Elective - III', code: 'OE-III', fac: 'Mrs. S. Priya' } },
    }
  )
}

function yearIVSemIUnitAimlDs(room: string): SlotDraft[] {
  return makeWeek(
    room,
    [
      { sub: 'Reinforcement Learning', code: 'AI701PC', fac: 'Dr. R. Kiran' },
      { sub: 'Generative AI', code: 'AI702PC', fac: 'Dr. R. Kiran' },
      { sub: 'Fundamentals of Management', code: 'MS703HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - III', code: 'PE-III', fac: 'Dr. R. Kiran' },
      { sub: 'Professional Elective - IV', code: 'PE-IV', fac: 'Dr. Hema Latha' },
    ],
    {
      1: { sub: 'Reinforcement Learning Lab', code: 'AI704PC', fac: 'Dr. R. Kiran' },
      3: { sub: 'Generative AI Lab', code: 'AI705PC', fac: 'Dr. R. Kiran' },
      4: { sub: 'Industry Oriented Mini Project/Internship', code: 'AI706PC', fac: 'Dr. Hema Latha' },
    },
    {
      5: { 5: { sub: 'Open Elective - III', code: 'OE-III', fac: 'Dr. Hema Latha' } },
    }
  )
}

function yearIVSemICSECSBS(): SlotDraft[] {
  return makeWeek(
    'CSE-CSBS-402',
    [
      { sub: 'DevOps', code: 'CB701PC', fac: 'Mrs. S. Priya' },
      { sub: 'Cloud Computing', code: 'CB702PC', fac: 'Dr. Hema Latha' },
      { sub: 'Fundamentals of Management', code: 'MS703HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - III', code: 'PE-III', fac: 'Dr. R. Kiran' },
      { sub: 'Professional Elective - IV', code: 'PE-IV', fac: 'Dr. Hema Latha' },
    ],
    {
      1: { sub: 'Cloud Computing Lab', code: 'CB704PC', fac: 'Dr. Hema Latha' },
      3: { sub: 'DevOps Lab', code: 'CB705PC', fac: 'Mrs. S. Priya' },
      4: { sub: 'Industry Oriented Mini Project/Internship', code: 'CB706PC', fac: 'Dr. Hema Latha' },
    },
    {
      5: { 5: { sub: 'Open Elective - III', code: 'OE-III', fac: 'Mrs. N. Lavanya' } },
    }
  )
}

function yearIVSemIIT(): SlotDraft[] {
  return makeWeek(
    'IT-301',
    [
      { sub: 'Information Security', code: 'CI701PC', fac: 'Dr. Hema Latha' },
      { sub: 'Deep Learning', code: 'CI702PC', fac: 'Dr. R. Kiran' },
      { sub: 'Fundamentals of Management', code: 'MS703HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - III', code: 'PE-III', fac: 'Dr. Hema Latha' },
      { sub: 'Professional Elective - IV', code: 'PE-IV', fac: 'Dr. R. Kiran' },
    ],
    {
      1: { sub: 'Information Security Lab', code: 'CI704PC', fac: 'Dr. Hema Latha' },
      3: { sub: 'Deep Learning Lab', code: 'CI705PC', fac: 'Dr. R. Kiran' },
      4: { sub: 'Industry Oriented Mini Project/Internship', code: 'CI706PC', fac: 'Dr. Hema Latha' },
    },
    {
      5: { 5: { sub: 'Open Elective - III', code: 'OE-III', fac: 'Dr. R. Kiran' } },
    }
  )
}

function yearIVSemIECE(): SlotDraft[] {
  return makeWeek(
    'ECE-201',
    [
      { sub: 'Wireless Communication', code: 'EC701PC', fac: 'Dr. G. Narsimha' },
      { sub: 'Neural Networks & Deep Learning', code: 'EC702PC', fac: 'Dr. R. Kiran' },
      { sub: 'Fundamentals of Management', code: 'MS703HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - III', code: 'PE-III', fac: 'Mrs. R. Sujatha' },
      { sub: 'Professional Elective - IV', code: 'PE-IV', fac: 'Dr. G. Narsimha' },
    ],
    {
      1: { sub: 'Wireless Communication Lab', code: 'EC704PC', fac: 'Dr. G. Narsimha' },
      3: { sub: 'NLP/Deep Learning Lab', code: 'EC705PC', fac: 'Dr. R. Kiran' },
      4: { sub: 'Industry Oriented Mini Project/Internship', code: 'EC706PC', fac: 'Mrs. R. Sujatha' },
    },
    {
      5: { 5: { sub: 'Open Elective - III', code: 'OE-III', fac: 'Mrs. R. Sujatha' } },
    }
  )
}

function yearIVSemIEEEEEE(): SlotDraft[] {
  return makeWeek(
    'EEE-101',
    [
      { sub: 'Smart Metering & Communication Protocols', code: 'EE701PC', fac: 'Dr. S. Ranganath' },
      { sub: 'EV Charging Infrastructure', code: 'EE702PC', fac: 'Mr. P. Ravi Teja' },
      { sub: 'Fundamentals of Management', code: 'MS703HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - III', code: 'PE-III', fac: 'Dr. S. Ranganath' },
      { sub: 'Professional Elective - IV', code: 'PE-IV', fac: 'Mr. P. Ravi Teja' },
    ],
    {
      1: { sub: 'Smart Grid Lab', code: 'EE704PC', fac: 'Dr. S. Ranganath' },
      3: { sub: 'EV Lab', code: 'EE705PC', fac: 'Mr. P. Ravi Teja' },
      4: { sub: 'Industry Oriented Mini Project/Internship', code: 'EE706PC', fac: 'Dr. S. Ranganath' },
    },
    {
      5: { 5: { sub: 'Open Elective - III', code: 'OE-III', fac: 'Mr. P. Ravi Teja' } },
    }
  )
}

function yearIVSemICivil(): SlotDraft[] {
  return makeWeek(
    'Civil-201',
    [
      { sub: 'Infrastructure Development', code: 'CV701PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Construction Management', code: 'CV702PC', fac: 'Dr. L. Mahesh' },
      { sub: 'Fundamentals of Management', code: 'MS703HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - III', code: 'PE-III', fac: 'Dr. L. Mahesh' },
      { sub: 'Professional Elective - IV', code: 'PE-IV', fac: 'Dr. L. Mahesh' },
    ],
    {
      1: { sub: 'Infrastructure Lab', code: 'CV704PC', fac: 'Dr. L. Mahesh' },
      3: { sub: 'Construction Management Lab', code: 'CV705PC', fac: 'Dr. L. Mahesh' },
      4: { sub: 'Industry Oriented Mini Project/Internship', code: 'CV706PC', fac: 'Dr. L. Mahesh' },
    },
    {
      5: { 5: { sub: 'Open Elective - III', code: 'OE-III', fac: 'Dr. L. Mahesh' } },
    }
  )
}

function yearIVSemIMech(): SlotDraft[] {
  return makeWeek(
    'Mech-101',
    [
      { sub: 'Industrial Engineering', code: 'ME701PC', fac: 'Mr. K. Suresh' },
      { sub: 'Composite Materials', code: 'ME702PC', fac: 'Mr. K. Suresh' },
      { sub: 'Fundamentals of Management', code: 'MS703HS', fac: 'Mrs. N. Lavanya' },
      { sub: 'Professional Elective - III', code: 'PE-III', fac: 'Mr. K. Suresh' },
      { sub: 'Professional Elective - IV', code: 'PE-IV', fac: 'Mr. K. Suresh' },
    ],
    {
      1: { sub: 'Industrial Engineering Lab', code: 'ME704PC', fac: 'Mr. K. Suresh' },
      3: { sub: 'Composite Materials Lab', code: 'ME705PC', fac: 'Mr. K. Suresh' },
      4: { sub: 'Industry Oriented Mini Project/Internship', code: 'ME706PC', fac: 'Mr. K. Suresh' },
    },
    {
      5: { 5: { sub: 'Open Elective - III', code: 'OE-III', fac: 'Mr. K. Suresh' } },
    }
  )
}

// ============================================================================
//  YEAR IV — SEMESTER II (PROJECT WORK + ELECTIVES, JNTUH R25)
// ============================================================================

function projectSemester(room: string, pwCode: string, pwFac: string, peVFac: string, peVIFac: string): SlotDraft[] {
  const pw: Sub = { sub: 'Project Work', code: pwCode, fac: pwFac }
  const peV: Sub = { sub: 'Professional Elective - V', code: 'PE-V', fac: peVFac }
  const peVI: Sub = { sub: 'Professional Elective - VI', code: 'PE-VI', fac: peVIFac }
  return makeWeek(room, [pw, peV, pw, peVI, pw], { 1: pw, 3: pw })
}

function yearIVSemIICSE(): SlotDraft[] {
  return projectSemester('CSE-301', 'CS801PC', 'Dr. A. Ramesh', 'Dr. A. Ramesh', 'Mr. T. Vijay')
}

function yearIVSemIICSEAIML(): SlotDraft[] {
  return projectSemester('CSE-AIML-401', 'AI801PC', 'Dr. R. Kiran', 'Dr. R. Kiran', 'Dr. Hema Latha')
}

function yearIVSemIICSEDS(): SlotDraft[] {
  return projectSemester('CSE-DS-403', 'AI801PC', 'Dr. R. Kiran', 'Dr. R. Kiran', 'Dr. Hema Latha')
}

function yearIVSemIICSECSBS(): SlotDraft[] {
  return projectSemester('CSE-CSBS-402', 'CB801PC', 'Dr. Hema Latha', 'Dr. Hema Latha', 'Mrs. N. Lavanya')
}

function yearIVSemIIIT(): SlotDraft[] {
  return projectSemester('IT-301', 'CI801PC', 'Dr. Hema Latha', 'Dr. Hema Latha', 'Dr. R. Kiran')
}

function yearIVSemIIECE(): SlotDraft[] {
  return projectSemester('ECE-201', 'EC801PC', 'Dr. G. Narsimha', 'Dr. G. Narsimha', 'Mrs. R. Sujatha')
}

function yearIVSemIIEEEEEE(): SlotDraft[] {
  return projectSemester('EEE-101', 'EE801PC', 'Dr. S. Ranganath', 'Dr. S. Ranganath', 'Mr. P. Ravi Teja')
}

function yearIVSemIICivil(): SlotDraft[] {
  return projectSemester('Civil-201', 'CV801PC', 'Dr. L. Mahesh', 'Dr. L. Mahesh', 'Dr. L. Mahesh')
}

function yearIVSemIIMech(): SlotDraft[] {
  return projectSemester('Mech-101', 'ME801PC', 'Mr. K. Suresh', 'Mr. K. Suresh', 'Mr. K. Suresh')
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
        case 'CSE-AIML': return yearIISemIUnitAimlDs('CSE-AIML-401')
        case 'CSE-CSBS': return yearIISemICSECSBS()
        case 'CSE-DS': return yearIISemIUnitAimlDs('CSE-DS-403')
        case 'IT': return yearIISemIIT()
        case 'ECE': return yearIISemIECE()
        case 'EEE': return yearIISemIEEEEEE()
        case 'Civil': return yearIISemICivil()
        case 'Mechanical': return yearIISemIMech()
      }
    }
    switch (br) {
      case 'CSE': return yearIISemIIUnitCseDs('CSE-301')
      case 'CSE-AIML': return yearIISemIICSEAIML()
      case 'CSE-CSBS': return yearIISemIICSECSBS()
      case 'CSE-DS': return yearIISemIIUnitCseDs('CSE-DS-403')
      case 'IT': return yearIISemIIIT()
      case 'ECE': return yearIISemIIECE()
      case 'EEE': return yearIISemIIEEEEEE()
      case 'Civil': return yearIISemIICivil()
      case 'Mechanical': return yearIISemIIMech()
    }
  }

  // Year III
  if (yi === 3) {
    if (si === 1) {
      switch (br) {
        case 'CSE': return yearIIISemICSE()
        case 'CSE-AIML': return yearIIISemIUnitAimlDs('CSE-AIML-401')
        case 'CSE-CSBS': return yearIIISemICSECSBS()
        case 'CSE-DS': return yearIIISemIUnitAimlDs('CSE-DS-403')
        case 'IT': return yearIIISemIIT()
        case 'ECE': return yearIIISemIECE()
        case 'EEE': return yearIIISemIEEEEEE()
        case 'Civil': return yearIIISemICivil()
        case 'Mechanical': return yearIIISemIMech()
      }
    }
    switch (br) {
      case 'CSE': return yearIIISemIICSE()
      case 'CSE-AIML': return yearIIISemIIUnitAimlDs('CSE-AIML-401')
      case 'CSE-CSBS': return yearIIISemIICSECSBS()
      case 'CSE-DS': return yearIIISemIIUnitAimlDs('CSE-DS-403')
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
      case 'CSE-AIML': return yearIVSemIUnitAimlDs('CSE-AIML-401')
      case 'CSE-CSBS': return yearIVSemICSECSBS()
      case 'CSE-DS': return yearIVSemIUnitAimlDs('CSE-DS-403')
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