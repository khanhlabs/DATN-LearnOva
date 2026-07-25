export const COURSE_DETAIL_TABS = [
  { id: "curriculum", label: "Course Content" },
  { id: "about", label: "About" },
  { id: "instructor", label: "Instructor" },
  { id: "reviews", label: "Reviews" },
];

export const DEFAULT_COURSE_DETAIL = {
  category: "Frontend",
  title: "React.js From Beginner to Advanced",
  instructor: {
    name: "John Nguyen",
    role: "Frontend Engineer & Mentor",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=160&h=160",
    bio: "He focuses on teaching React through practical projects: understanding why code is written a certain way, learning to build clean components, and confidently integrating APIs into real-world applications.",
    stats: [
      "8 Years of Experience",
      "32 Courses",
      "18.4k Students",
      "4.9/5 Teaching Rating",
    ],
  },
  rating: 4.8,
  reviews: "1.2k",
  students: "12.5k",
  duration: "12h 45m",
  level: "Beginner to Advanced",
  updatedAt: "05/2024",
  progress: 0,
  lessonsDone: 0,
  lessonsTotal: 48,
  chaptersTotal: 8,
  summary:
    "This course helps you build a solid React foundation, understand data flow within components, and create frontend interfaces that can seamlessly connect to real backend systems.",
  tags: ["Frontend", "React.js", "UI/UX"],
  about: [
    "You'll start by building small UI components and gradually combine them into complete pages using props, state, and hooks.",
    "Lessons are structured progressively, with concise examples, hands-on exercises, and chapter summaries to help reinforce learning.",
    "By the end of the course, you'll complete a mini course-management project featuring forms, lists, filters, routing, and mock API data handling.",
  ],
  outcomes: [
    "Build clear, maintainable, and reusable React components.",
    "Manage state, props, effects, and forms in common real-world scenarios.",
    "Create responsive layouts using HTML/CSS within React applications.",
    "Prepare and structure data effectively for future backend API integration.",
  ],
  reviewsList: [
    {
      name: "Michael Hoang",
      score: 5,
      text: "The pacing is just right. The component examples helped me clearly understand how to break down complex interfaces.",
    },
    {
      name: "Anna Lan",
      score: 4.8,
      text: "The instructor explains concepts clearly, and the end-of-chapter exercises are perfect for practicing state and props.",
    },
    {
      name: "Kevin Tuan",
      score: 4.7,
      text: "I really liked how the course connects UI layouts with real data instead of teaching isolated theory.",
    },
  ],
  curriculum: [
    {
      id: 1,
      title: "Introduction to React.js",
      completedLessons: 3,
      totalLessons: 3,
      percent: 100,
      expanded: true,
      lessons: [
        { title: "What is React.js?", duration: "08:15", completed: true },
        { title: "Environment Setup", duration: "12:30", completed: true },
        { title: "JSX and Rendering", duration: "15:45", completed: true },
      ],
    },
    {
      id: 2,
      title: "React Components",
      completedLessons: 1,
      totalLessons: 3,
      percent: 35,
      lessons: [
        {
          title: "Functional Components",
          duration: "18:20",
          completed: true,
        },
        {
          title: "Props and Data Flow",
          duration: "14:10",
          completed: false,
        },
        {
          title: "Component Reusability",
          duration: "16:35",
          completed: false,
        },
      ],
    },
    {
      id: 3,
      title: "State and Props",
      completedLessons: 0,
      totalLessons: 3,
      percent: 0,
      lessons: [],
    },
    {
      id: 4,
      title: "Event Handling",
      completedLessons: 0,
      totalLessons: 4,
      percent: 0,
      lessons: [],
    },
    {
      id: 5,
      title: "Advanced State Management",
      completedLessons: 0,
      totalLessons: 6,
      percent: 0,
      lessons: [],
    },
    {
      id: 6,
      title: "React Router",
      completedLessons: 0,
      totalLessons: 4,
      percent: 0,
      lessons: [],
    },
    {
      id: 7,
      title: "Fetching Data & APIs",
      completedLessons: 0,
      totalLessons: 4,
      percent: 0,
      lessons: [],
    },
    {
      id: 8,
      title: "Real-World Project",
      completedLessons: 0,
      totalLessons: 3,
      percent: 0,
      lessons: [],
    },
  ],
};

export const buildCourseDetail = (course = {}) => ({
  ...DEFAULT_COURSE_DETAIL,
  ...course,

  title: course.title || DEFAULT_COURSE_DETAIL.title,
  progress: course.progress || DEFAULT_COURSE_DETAIL.progress,
  lessonsDone: course.lessonsDone || DEFAULT_COURSE_DETAIL.lessonsDone,
  lessonsTotal: course.lessonsTotal || DEFAULT_COURSE_DETAIL.lessonsTotal,
  rating: course.rating || DEFAULT_COURSE_DETAIL.rating,
  reviews: course.reviews || DEFAULT_COURSE_DETAIL.reviews,
  students: course.students ?? 0,
  duration: course.duration || DEFAULT_COURSE_DETAIL.duration,
  updatedAt: course.updatedAt || DEFAULT_COURSE_DETAIL.updatedAt,
  level: course.level || DEFAULT_COURSE_DETAIL.level,
  image: course.image || DEFAULT_COURSE_DETAIL.image,
  summary: course.summary || DEFAULT_COURSE_DETAIL.summary,
  category: course.category || DEFAULT_COURSE_DETAIL.category,
  tags: course.tags?.length ? course.tags : DEFAULT_COURSE_DETAIL.tags,
  about: course.about?.length ? course.about : DEFAULT_COURSE_DETAIL.about,
  outcomes: course.outcomes?.length
    ? course.outcomes
    : DEFAULT_COURSE_DETAIL.outcomes,

  instructor: {
    ...DEFAULT_COURSE_DETAIL.instructor,
    ...course.instructor,
    description:
      course.instructor?.description || DEFAULT_COURSE_DETAIL.instructor.bio,
    bio: course.instructor?.description || DEFAULT_COURSE_DETAIL.instructor.bio,
    stats: course.instructor?.stats?.length
      ? course.instructor.stats
      : DEFAULT_COURSE_DETAIL.instructor.stats,
  },
});