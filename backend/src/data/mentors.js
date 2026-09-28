export const MENTORS = [
  {
    id: 'mentor_01',
    name: 'Sneha Roy',
    email: 'sneha.roy@codeyoung.com',
    role: 'AI & Machine Learning Specialist',
    specialization: 'AI & Machine Learning',
    experience: '6+ years in Applied AI & Python for youth',
    timezone: 'Asia/Kolkata',
    supportedSubjects: ['ai_ml', 'coding_programming'],
    workingHours: { start: 10, end: 16 }, // 10:00 AM to 4:00 PM IST (Morning shift)
    maxDailyClasses: 2,
    avatarBg: '#FFF8E6',
    avatarColor: '#F28C28'
  },
  {
    id: 'mentor_02',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@codeyoung.com',
    role: 'Python & Game Development Coach',
    specialization: 'Coding & Programming',
    experience: '5+ years coaching young coders in Pygame & Scratch',
    timezone: 'Asia/Kolkata',
    supportedSubjects: ['coding_programming', 'game_development'],
    workingHours: { start: 13, end: 20 }, // 1:00 PM to 8:00 PM IST (Afternoon/Evening shift)
    maxDailyClasses: 2,
    avatarBg: '#E6F4F1',
    avatarColor: '#315F61'
  },
  {
    id: 'mentor_03',
    name: 'Priya Nair',
    email: 'priya.nair@codeyoung.com',
    role: 'Senior Web Development & UI Coach',
    specialization: 'Web Development',
    experience: '5+ years in modern JavaScript & web platforms',
    timezone: 'Asia/Kolkata',
    supportedSubjects: ['web_development', 'coding_programming'],
    workingHours: { start: 11, end: 18 }, // 11:00 AM to 6:00 PM IST (Midday shift)
    maxDailyClasses: 2,
    avatarBg: '#E9EEF2',
    avatarColor: '#244E50'
  },
  {
    id: 'mentor_04',
    name: 'Rohan Kulkarni',
    email: 'rohan.kulkarni@codeyoung.com',
    role: 'Robotics & Hardware Logic Specialist',
    specialization: 'Robotics',
    experience: '7+ years in Arduino, IoT & sensor circuits',
    timezone: 'Asia/Kolkata',
    supportedSubjects: ['robotics', 'algorithms_math'],
    workingHours: { start: 10, end: 16 }, // 10:00 AM to 4:00 PM IST (Morning shift)
    maxDailyClasses: 2,
    avatarBg: '#F3EBF9',
    avatarColor: '#6B4C82'
  },
  {
    id: 'mentor_05',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@codeyoung.com',
    role: 'Game Design & Scratch Specialist',
    specialization: 'Game Development',
    experience: '4+ years mentoring 2D game loops & physics',
    timezone: 'Asia/Kolkata',
    supportedSubjects: ['game_development', 'coding_programming'],
    workingHours: { start: 14, end: 20 }, // 2:00 PM to 8:00 PM IST (Evening shift)
    maxDailyClasses: 2,
    avatarBg: '#FDF1E7',
    avatarColor: '#D36B15'
  },
  {
    id: 'mentor_06',
    name: 'Vikram Patel',
    email: 'vikram.patel@codeyoung.com',
    role: 'Interactive Web & Mobile App Mentor',
    specialization: 'Web Development',
    experience: '6+ years in frontend frameworks & responsive design',
    timezone: 'Asia/Kolkata',
    supportedSubjects: ['web_development', 'game_development'],
    workingHours: { start: 10, end: 17 }, // 10:00 AM to 5:00 PM IST (Morning/Midday shift)
    maxDailyClasses: 2,
    avatarBg: '#E8F5E9',
    avatarColor: '#2E7D32'
  },
  {
    id: 'mentor_07',
    name: 'Meera Krishnan',
    email: 'meera.krishnan@codeyoung.com',
    role: 'Algorithms & Olympiad Math Coach',
    specialization: 'Algorithms & Problem Solving',
    experience: '6+ years in algorithmic riddles & competitive logic',
    timezone: 'Asia/Kolkata',
    supportedSubjects: ['algorithms_math', 'coding_programming'],
    workingHours: { start: 12, end: 19 }, // 12:00 PM to 7:00 PM IST (Midday/Evening shift)
    maxDailyClasses: 2,
    avatarBg: '#E1F5FE',
    avatarColor: '#0277BD'
  },
  {
    id: 'mentor_08',
    name: 'Aditya Verma',
    email: 'aditya.verma@codeyoung.com',
    role: 'Python & Data Science Instructor',
    specialization: 'Python & Data Science',
    experience: '5+ years in ML models & predictive logic',
    timezone: 'Asia/Kolkata',
    supportedSubjects: ['ai_ml', 'algorithms_math'],
    workingHours: { start: 13, end: 20 }, // 1:00 PM to 8:00 PM IST (Afternoon/Evening shift)
    maxDailyClasses: 2,
    avatarBg: '#EDE7F6',
    avatarColor: '#512DA8'
  },
  {
    id: 'mentor_09',
    name: 'Kavya Menon',
    email: 'kavya.menon@codeyoung.com',
    role: 'Creative Coding & Robotics Educator',
    specialization: 'Creative Coding',
    experience: '4+ years coaching block coding & robot kits',
    timezone: 'Asia/Kolkata',
    supportedSubjects: ['coding_programming', 'robotics'],
    workingHours: { start: 12, end: 19 }, // 12:00 PM to 7:00 PM IST (Midday/Evening shift)
    maxDailyClasses: 2,
    avatarBg: '#FFF3E0',
    avatarColor: '#E65100'
  },
  {
    id: 'mentor_10',
    name: 'Arjun Rao',
    email: 'arjun.rao@codeyoung.com',
    role: 'Senior Full-Stack & Algorithm Architect',
    specialization: 'Advanced Programming',
    experience: '7+ years coaching high-school & collegiate programmers',
    timezone: 'Asia/Kolkata',
    supportedSubjects: ['coding_programming', 'web_development', 'algorithms_math'],
    workingHours: { start: 15, end: 20 }, // 3:00 PM to 8:00 PM IST (Evening shift)
    maxDailyClasses: 2,
    avatarBg: '#FCE4EC',
    avatarColor: '#C2185B'
  }
];

export const getMentorById = (id) => MENTORS.find(m => m.id === id);
