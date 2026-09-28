export const SUBJECTS = [
  {
    id: 'coding_programming',
    title: 'Coding & Programming',
    badge: 'Popular',
    shortDesc: 'A personalized live coding session where your child learns computational thinking through interactive exercises.',
    suitableFor: 'Ages 6-16 • Beginners to Intermediate',
    duration: '30 minutes',
    highlights: [
      'Live 1:1 instruction with an experienced educator',
      'Build an interactive coding mini-project from scratch',
      'Personalized assessment & future learning roadmap'
    ],
    iconName: 'Code2',
    color: '#315F61'
  },
  {
    id: 'web_development',
    title: 'Web Development',
    badge: 'Hands-on',
    shortDesc: 'Design and code dynamic, responsive web pages using modern HTML, CSS, and JavaScript fundamentals.',
    suitableFor: 'Ages 10-17 • Beginners to Intermediate',
    duration: '30 minutes',
    highlights: [
      'Learn how the web works and create your first webpage',
      'Interactive styling and DOM manipulation exercises',
      'Live preview and instant mentor code review'
    ],
    iconName: 'Globe',
    color: '#244E50'
  },
  {
    id: 'ai_ml',
    title: 'AI & Machine Learning',
    badge: 'Advanced',
    shortDesc: 'Explore how computers perceive the world, recognize patterns, and train smart predictive models.',
    suitableFor: 'Ages 11-18 • Intermediate to Advanced',
    duration: '30 minutes',
    highlights: [
      'Interactive model training in your browser',
      'Demystify artificial intelligence and computer vision',
      'Explore ethical AI and real-world technology applications'
    ],
    iconName: 'Brain',
    color: '#4C7D7D'
  },
  {
    id: 'robotics',
    title: 'Robotics & Hardware Logic',
    badge: 'STEM',
    shortDesc: 'Hands-on virtual microcontroller simulation, circuit design, sensor logic, and smart automation.',
    suitableFor: 'Ages 8-16 • Beginners to Intermediate',
    duration: '30 minutes',
    highlights: [
      'Simulate microcontrollers, sensors, and actuators',
      'Understand binary logic gates and electrical circuits',
      'Program automated smart devices in a virtual lab'
    ],
    iconName: 'Cpu',
    color: '#F28C28'
  },
  {
    id: 'game_development',
    title: 'Game Development',
    badge: 'Creative',
    shortDesc: 'Transform gaming passion into real software skills by creating 2D/3D games with physics and rules.',
    suitableFor: 'Ages 7-16 • All skill levels',
    duration: '30 minutes',
    highlights: [
      'Build a playable mini arcade or platformer game',
      'Learn physics collision, sprites, and scoring loops',
      'Play and test your game in real time with your mentor'
    ],
    iconName: 'Gamepad2',
    color: '#FFC83D'
  },
  {
    id: 'algorithms_math',
    title: 'Algorithms & Math Thinking',
    badge: 'Logic',
    shortDesc: 'Sharpen analytical problem solving, data patterns, math logic, and competitive algorithmic thinking.',
    suitableFor: 'Ages 9-18 • Intermediate to Advanced',
    duration: '30 minutes',
    highlights: [
      'Tackle engaging logic puzzles and algorithmic challenges',
      'Learn systematic problem breakdown techniques',
      'Boost mathematical intuition and competitive aptitude'
    ],
    iconName: 'Binary',
    color: '#163D4A'
  }
];

export const getSubjectById = (id) => SUBJECTS.find(s => s.id === id);
