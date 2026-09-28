/**
 * Static, course-specific question banks for the Post-Class Quick Learning Check.
 * Tailored for beginner-friendly, 3-minute post-trial engagement across all 6 courses.
 */

export const COURSE_QUESTION_BANKS = {
  coding_programming: {
    courseId: 'coding_programming',
    courseTitle: 'Coding & Programming',
    description: 'Core concepts covered in introductory coding: variables, loops, logic, functions, and debugging.',
    questions: [
      {
        id: 'cp_q1',
        question: 'What does a variable do in a computer program?',
        options: [
          'It stores a piece of data (such as a score or name) that can change',
          'It turns off the computer screen when not in use',
          'It permanently connects your computer to a database server',
          'It physically speeds up the keyboard typing speed'
        ],
        correctAnswer: 0,
        explanation: 'Variables act like labeled containers that hold data values while your program is running.'
      },
      {
        id: 'cp_q2',
        question: 'What is the main benefit of using a "loop" in your code?',
        options: [
          'It repeats instructions automatically without copying and pasting lines',
          'It automatically fixes spelling errors in user inputs',
          'It prevents the user from clicking the mouse',
          'It deletes unused variables from the computer memory'
        ],
        correctAnswer: 0,
        explanation: 'Loops let programmers execute a set of actions multiple times efficiently.'
      },
      {
        id: 'cp_q3',
        question: 'Which statement best describes an "if-else" conditional?',
        options: [
          'It makes decisions based on whether a condition is true or false',
          'It repeats code forever in an endless cycle',
          'It changes the color of the text editor window',
          'It shuts down the internet connection'
        ],
        correctAnswer: 0,
        explanation: 'Conditionals evaluate conditions (e.g. if score >= 100) to branch code execution.'
      },
      {
        id: 'cp_q4',
        question: 'Why do software developers package code into functions?',
        options: [
          'To organize reusable blocks of logic and avoid repeating code',
          'To make the computer monitor display brighter colors',
          'To prevent anyone else from reading the source code',
          'To download extra internet bandwidth'
        ],
        correctAnswer: 0,
        explanation: 'Functions allow you to write a block of code once and call it anywhere with different inputs.'
      },
      {
        id: 'cp_q5',
        question: 'What does the term "debugging" mean?',
        options: [
          'Finding and resolving mistakes or unintended behavior in your code',
          'Wiping the computer clean of all installed applications',
          'Cleaning dust off the physical computer keyboard',
          'Writing code without testing whether it works'
        ],
        correctAnswer: 0,
        explanation: 'Debugging is the systematic process of finding and fixing errors ("bugs") in programs.'
      }
    ]
  },

  web_development: {
    courseId: 'web_development',
    courseTitle: 'Web Development',
    description: 'Foundations of web pages: HTML structure, CSS styling, and JavaScript interactivity.',
    questions: [
      {
        id: 'wd_q1',
        question: 'What is the primary role of HTML in a website?',
        options: [
          'It provides the structure and content of the webpage',
          'It styles animations, colors, and layout positioning',
          'It stores user passwords securely on a server',
          'It manages the physical Wi-Fi signal to the router'
        ],
        correctAnswer: 0,
        explanation: 'HTML (HyperText Markup Language) defines headings, paragraphs, images, and page structure.'
      },
      {
        id: 'wd_q2',
        question: 'Which web language is used to add colors, fonts, and responsive layouts to a page?',
        options: [
          'CSS (Cascading Style Sheets)',
          'SQL (Structured Query Language)',
          'Python',
          'Assembly Language'
        ],
        correctAnswer: 0,
        explanation: 'CSS is responsible for the visual styling, spacing, typography, and theme of web pages.'
      },
      {
        id: 'wd_q3',
        question: 'How does JavaScript enhance a static webpage?',
        options: [
          'It adds interactive behaviors like button clicks, form validation, and animations',
          'It converts the website into a printed physical newspaper',
          'It replaces the need for a web browser',
          'It automatically designs page logos'
        ],
        correctAnswer: 0,
        explanation: 'JavaScript powers dynamic user interactivity and responsive features on the client side.'
      },
      {
        id: 'wd_q4',
        question: 'Which HTML tag is used to create a clickable hyperlink to another page?',
        options: [
          '<a> (anchor tag)',
          '<link-button>',
          '<navigate>',
          '<jump>'
        ],
        correctAnswer: 0,
        explanation: 'The <a> anchor tag with an href attribute defines hyperlinks connecting web pages.'
      },
      {
        id: 'wd_q5',
        question: 'What happens when a web browser renders a page?',
        options: [
          'It reads HTML, CSS, and JS code to construct and display visual elements',
          'It installs a new operating system onto the computer',
          'It reboots the router to establish a new internet line',
          'It converts the webpage into an audio-only file'
        ],
        correctAnswer: 0,
        explanation: 'Web browsers parse code (DOM and styles) to draw and render visual web pages on screen.'
      }
    ]
  },

  ai_ml: {
    courseId: 'ai_ml',
    courseTitle: 'AI & Machine Learning',
    description: 'Basic machine learning concepts: datasets, pattern recognition, training, and model predictions.',
    questions: [
      {
        id: 'ai_q1',
        question: 'What is a "dataset" in Machine Learning?',
        options: [
          'A collection of historical examples used to train an AI model',
          'A hardware chip inside a graphics card',
          'A programming bug that crashes your application',
          'An internet browser bookmark list'
        ],
        correctAnswer: 0,
        explanation: 'Datasets provide the examples and features from which machine learning models learn patterns.'
      },
      {
        id: 'ai_q2',
        question: 'How does an image recognition AI recognize a cat in a photo?',
        options: [
          'By analyzing pixel patterns such as shapes, edges, and textures learned during training',
          'By reading the filename of the picture',
          'By guessing completely randomly every time',
          'By searching the photographer’s social media account'
        ],
        correctAnswer: 0,
        explanation: 'Computer vision algorithms recognize patterns like whiskers, ears, and contours across pixels.'
      },
      {
        id: 'ai_q3',
        question: 'What is "model training" in Machine Learning?',
        options: [
          'The process where an algorithm adjusts its internal parameters by learning from data',
          'Teaching a computer how to type faster on a keyboard',
          'Downloading the latest version of a word processor',
          'Running a battery test on the laptop'
        ],
        correctAnswer: 0,
        explanation: 'Training is when the model iteratively inspects training data to minimize errors and learn relationships.'
      },
      {
        id: 'ai_q4',
        question: 'What is the difference between traditional programming and machine learning?',
        options: [
          'In traditional coding rules are hand-written; in ML the computer learns patterns from data',
          'Traditional programming only works on mobile phones',
          'Machine learning does not require any computers or processors',
          'Traditional programming has been completely replaced and no longer exists'
        ],
        correctAnswer: 0,
        explanation: 'In traditional programming you code explicit rules; in ML algorithms derive rules from data.'
      },
      {
        id: 'ai_q5',
        question: 'Why is it important to test an AI model with new, unseen data?',
        options: [
          'To ensure the model can generalize and make accurate predictions on real-world inputs',
          'To delete the model’s memory cache',
          'To reduce the size of the computer screen',
          'To prevent the model from connecting to Wi-Fi'
        ],
        correctAnswer: 0,
        explanation: 'Testing on unseen data verifies that the model learned true patterns rather than just memorizing training examples.'
      }
    ]
  },

  robotics: {
    courseId: 'robotics',
    courseTitle: 'Robotics & Hardware Logic',
    description: 'Hardware logic: sensors, microcontrollers, actuators/motors, and smart automation.',
    questions: [
      {
        id: 'rb_q1',
        question: 'What role does a sensor play in a robotic system?',
        options: [
          'It detects information from the physical environment (like light, sound, or distance)',
          'It provides mechanical movement to rotate wheels',
          'It converts electrical power into sound waves exclusively',
          'It stores the robot’s painted metal color'
        ],
        correctAnswer: 0,
        explanation: 'Sensors act like the robot’s senses, gathering input data from the physical world.'
      },
      {
        id: 'rb_q2',
        question: 'What is a microcontroller (such as an Arduino or micro:bit)?',
        options: [
          'A compact computer chip that acts as the "brain" executing the robot’s program',
          'A heavy battery that only provides direct current electricity',
          'A mechanical wheel made of rubber and plastic',
          'A tool used only for welding metal parts'
        ],
        correctAnswer: 0,
        explanation: 'Microcontrollers run programs that read sensor inputs and command actuators to perform tasks.'
      },
      {
        id: 'rb_q3',
        question: 'What is an "actuator" in robotics?',
        options: [
          'A component (such as a motor or servo) that converts electrical signals into physical movement',
          'A sensor that measures room temperature',
          'A display screen showing text numbers',
          'A wire that connects the battery'
        ],
        correctAnswer: 0,
        explanation: 'Actuators are the output mechanisms (motors, pistons, servos) that produce physical motion.'
      },
      {
        id: 'rb_q4',
        question: 'What happens if an electrical circuit is broken or "open"?',
        options: [
          'Current stops flowing and the connected devices switch off',
          'Current flows twice as fast through the air',
          'The battery charges automatically',
          'The microcontroller multiplies its memory'
        ],
        correctAnswer: 0,
        explanation: 'Electricity requires an uninterrupted, closed path to flow and power electronic components.'
      },
      {
        id: 'rb_q5',
        question: 'In an automated smart night-light, how do the sensor and actuator work together?',
        options: [
          'A light sensor detects darkness, prompting the microcontroller to turn on the LED light',
          'The LED light commands the room to become dark',
          'The battery measures the room temperature and sounds an alarm',
          'The motor spins continuously to blow air at the light bulb'
        ],
        correctAnswer: 0,
        explanation: 'Automated systems follow a sense-think-act loop: sensor input triggers programmed output.'
      }
    ]
  },

  game_development: {
    courseId: 'game_development',
    courseTitle: 'Game Development',
    description: 'Game design fundamentals: game loops, sprites, collision detection, and score logic.',
    questions: [
      {
        id: 'gd_q1',
        question: 'What is the "game loop" in video game programming?',
        options: [
          'A continuous loop that processes player input, updates positions, and renders graphics each frame',
          'A circular track where characters walk in a circle',
          'A background music track that plays on repeat',
          'The game credit roll at the end of a match'
        ],
        correctAnswer: 0,
        explanation: 'The game loop runs 30 to 60+ times per second to update and draw each frame of gameplay.'
      },
      {
        id: 'gd_q2',
        question: 'What is a "sprite" in 2D game development?',
        options: [
          'A two-dimensional graphic image or animation representing an object or character',
          'The high score recorded on a leaderboard',
          'The volume control button on the keyboard',
          'A special wire connecting game controllers'
        ],
        correctAnswer: 0,
        explanation: 'Sprites are 2D images representing characters, enemies, obstacles, and items in a game.'
      },
      {
        id: 'gd_q3',
        question: 'What does "collision detection" determine in a game?',
        options: [
          'Whether two game objects (like a player and an obstacle) have touched or overlapped',
          'How fast the internet connection is loading assets',
          'The color of the player’s game avatar outfit',
          'How many players have downloaded the game'
        ],
        correctAnswer: 0,
        explanation: 'Collision detection algorithms check bounding boxes or shapes to trigger game reactions.'
      },
      {
        id: 'gd_q4',
        question: 'How do games respond when a player presses an arrow key or spacebar?',
        options: [
          'An event listener detects the keypress and updates the character’s position or velocity',
          'The game restarts from the beginning immediately',
          'The computer screen rotates 90 degrees',
          'The keyboard sends an email to the game creator'
        ],
        correctAnswer: 0,
        explanation: 'Input events capture keystrokes, mouse clicks, or controller inputs to modify gameplay state.'
      },
      {
        id: 'gd_q5',
        question: 'Why do game developers keep track of player "state" (e.g. Health, Coins, Level)?',
        options: [
          'To determine game rules, victory conditions, and what to render on screen',
          'To increase the physical weight of the computer',
          'To prevent the computer monitor from entering sleep mode',
          'To speed up the internet download speed'
        ],
        correctAnswer: 0,
        explanation: 'State variables define the current condition of the game, allowing rules and scoring to work.'
      }
    ]
  },

  algorithms_math: {
    courseId: 'algorithms_math',
    courseTitle: 'Algorithms & Math Thinking',
    description: 'Algorithmic reasoning: patterns, step-by-step logic, problem breakdown, and optimization.',
    questions: [
      {
        id: 'am_q1',
        question: 'What is an "algorithm"?',
        options: [
          'A clear, step-by-step set of instructions designed to solve a problem or accomplish a task',
          'A complicated mathematical calculation that only supercomputers can solve',
          'A physical metal tool inside computer hardware',
          'A random guessing technique with no rules'
        ],
        correctAnswer: 0,
        explanation: 'An algorithm is any systematic recipe or procedure that produces an outcome step by step.'
      },
      {
        id: 'am_q2',
        question: 'What is the main advantage of recognizing patterns when solving problems?',
        options: [
          'It lets you apply a known solution to new problems instead of starting from scratch',
          'It allows you to bypass the rules of arithmetic',
          'It deletes the need for practicing mathematics',
          'It makes computer screens display in high definition'
        ],
        correctAnswer: 0,
        explanation: 'Pattern recognition enables mathematicians and coders to generalize and reuse strategies.'
      },
      {
        id: 'am_q3',
        question: 'If you want to find a word in a dictionary, why is opening to the middle faster than checking every word from page 1?',
        options: [
          'Because sorted data allows you to eliminate half the remaining pages with each check (binary search)',
          'Because the middle pages are printed in larger letters',
          'Because dictionaries only have definitions in the middle',
          'Because checking every word page by page is impossible'
        ],
        correctAnswer: 0,
        explanation: 'Binary search repeatedly divides sorted search space in half, finding targets logarithmically faster.'
      },
      {
        id: 'am_q4',
        question: 'What is "decomposition" in computational thinking?',
        options: [
          'Breaking a large, complex challenge down into smaller, manageable sub-problems',
          'Allowing computer components to rust and break down over time',
          'Combining unrelated topics into one confusing assignment',
          'Erasing code until no text remains'
        ],
        correctAnswer: 0,
        explanation: 'Decomposition breaks difficult tasks into small, solvable steps that are easier to tackle.'
      },
      {
        id: 'am_q5',
        question: 'What does "algorithm optimization" mean?',
        options: [
          'Making an algorithm run faster or use less memory while still producing correct answers',
          'Making the code longer by adding unnecessary sentences',
          'Changing the answer so that every calculation equals zero',
          'Renaming variables to random letters'
        ],
        correctAnswer: 0,
        explanation: 'Optimization improves efficiency, allowing programs to handle much larger inputs smoothly.'
      }
    ]
  }
};

/**
 * Returns question bank for a course subject ID or title.
 * Falls back to coding_programming if subject ID is unknown.
 */
export function getQuestionsForSubject(subjectIdOrTitle) {
  if (!subjectIdOrTitle) return COURSE_QUESTION_BANKS.coding_programming;

  const key = String(subjectIdOrTitle).toLowerCase().trim();

  if (COURSE_QUESTION_BANKS[key]) {
    return COURSE_QUESTION_BANKS[key];
  }

  if (key.includes('ai') || key.includes('machine')) return COURSE_QUESTION_BANKS.ai_ml;
  if (key.includes('web')) return COURSE_QUESTION_BANKS.web_development;
  if (key.includes('robot')) return COURSE_QUESTION_BANKS.robotics;
  if (key.includes('game')) return COURSE_QUESTION_BANKS.game_development;
  if (key.includes('algorithm') || key.includes('math')) return COURSE_QUESTION_BANKS.algorithms_math;

  return COURSE_QUESTION_BANKS.coding_programming;
}
