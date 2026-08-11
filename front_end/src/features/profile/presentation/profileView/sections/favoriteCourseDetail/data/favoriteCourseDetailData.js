export const FAVORITE_DETAIL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "curriculum", label: "Course Content" },
  { id: "instructor", label: "Instructor" },
  { id: "reviews", label: "Reviews" },
  // { id: "qa", label: "Chat" },
];

export const DEFAULT_FAVORITE_DETAIL = {
  category: "Web Development",
  title: "React.js From Beginner to Advanced",
  instructor: {
    name: "John Nguyen",
    role: "Senior Frontend Developer",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=160&h=160",
    bio: "The instructor focuses on practical learning: understanding component thinking, writing clear code, and connecting data to real interfaces.",
    stats: [
      { icon: "Clock", label: "8 years of experience" },
      { icon: "BookOpen", label: "32 courses" },
      { icon: "Users", label: "18.4k students" },
      { icon: "Star", label: "4.9 instructor rating" },
    ],
  },
  rating: 4.8,
  reviews: "1.2k",
  students: "12.5k",
  progressText: "32 / 48 lessons",
  remaining: "5h 30m remaining",
  duration: "8h 30m",
  level: "All Levels",
  language: "English",
  topic: "Yes",
  exercise: "Yes",
  certificate: "Yes",
  updatedAt: "15/05/2024",
  lessonsTotal: 48,
  price: "$299.00",
  originalPrice: "$499.00",
  summary:
    "This course helps you master React.js from beginner to advanced concepts, including hooks, context, routing, state management, and real project delivery.",
  outcomes: [
    "Understand React.js and how it works",
    "Use React Router to build multi-page applications",
    "Build React apps with Hooks and Functional Components",
    "Manage advanced state with Context API and Redux",
    "Handle state and side effects effectively",
    "Deliver real projects and optimize performance",
  ],
  about: [
    "The introduction is designed to be easy to follow: you start with component structure, then move through props, state, hooks, and how to organize a real screen.",
    "The course goes beyond theory. Each chapter includes small examples so you can practice reading data, splitting layouts, and handling interface state.",
    "After the course, you can build a complete React page and prepare a clean structure for API integration when the backend is ready.",
  ],
  curriculum: [
    {
      id: 1,
      title: "Introduction to React",
      meta: "4 / 4 lessons - 30 minutes",
      open: true,
      lessons: [
        { number: "1.1", title: "What is React?", type: "Video", duration: "05:30", done: true },
        { number: "1.2", title: "Environment Setup", type: "Video", duration: "08:15", done: true },
        { number: "1.3", title: "JSX and Rendering", type: "Video", duration: "10:45", done: true },
        { number: "1.4", title: "Exercise: Create Your First App", type: "Exercise", duration: "05:30", done: false },
      ],
    },
    { id: 2, title: "Components & Props", meta: "6 lessons - 1h 10m", open: false, lessons: [] },
    { id: 3, title: "State & Events", meta: "6 lessons - 1h 20m", open: false, lessons: [] },
  ],
  reviewsList: [
    {
      name: "Michael Hoang",
      score: 5,
      text: "The course is clear, and the examples helped me quickly understand how to split components and handle state.",
    },
    {
      name: "Anna Le",
      score: 4.8,
      text: "The instructor explains things clearly, and the content feels much more practical than other beginner courses I have taken.",
    },
    {
      name: "Kevin Tran",
      score: 4.7,
      text: "I like the end-of-chapter exercises because I can check my understanding right away.",
    },
  ],
  questions: [
    {
      title: "Is this course enough to build a personal project?",
      answer: "Yes. You will have the foundation to build pages, split components, handle state, and prepare API integration.",
    },
    {
      title: "Can a JavaScript beginner follow this course?",
      answer: "Yes, if you already know basic variables, functions, arrays, and objects. The React sections are explained step by step.",
    },
  ],
};

const COURSE_TITLE_TRANSLATIONS = {
  "React.js Từ Cơ Bản Đến Nâng Cao": "React.js From Beginner to Advanced",
  "JavaScript Nâng Cao Cho Lập Trình Viên": "Advanced JavaScript for Developers",
  "Node.js & Express.js Xây Dựng Backend": "Build Backends with Node.js & Express.js",
  "SQL Cơ Bản Đến Nâng Cao": "SQL From Beginner to Advanced",
  "UI/UX Design Thực Chiến Cho Sản Phẩm Số": "Practical UI/UX Design for Digital Products",
  "Python Data Analysis Cho Người Mới": "Python Data Analysis for Beginners",
};

const INSTRUCTOR_NAME_TRANSLATIONS = {
  "Nguyễn Văn A": "John Nguyen",
  "Trần Hoàng B": "Henry Tran",
  "Lê Thanh C": "Chris Le",
  "Phạm Minh D": "David Pham",
  "Đỗ Hà My": "Mia Do",
  "Vũ Quốc Huy": "Harry Vu",
};

const formatRemainingText = (remaining) => {
  if (!remaining) return DEFAULT_FAVORITE_DETAIL.remaining;
  if (/remaining/i.test(remaining)) return remaining;

  return `${remaining.replace(/^Còn\s*/i, "")} remaining`;
};

export const buildFavoriteCourseDetail = (course = {}) => ({
  ...DEFAULT_FAVORITE_DETAIL,
  ...course,
  title:
    COURSE_TITLE_TRANSLATIONS[course.title] ||
    course.title ||
    DEFAULT_FAVORITE_DETAIL.title,
  image: course.image || DEFAULT_FAVORITE_DETAIL.image,
  rating: course.rating || DEFAULT_FAVORITE_DETAIL.rating,
  reviews: course.reviews || DEFAULT_FAVORITE_DETAIL.reviews,
  lessonsTotal: course.lessonsTotal || DEFAULT_FAVORITE_DETAIL.lessonsTotal,
  progressText:
    course.lessonsDone && course.lessonsTotal
      ? `${course.lessonsDone} / ${course.lessonsTotal} lessons`
      : DEFAULT_FAVORITE_DETAIL.progressText,
  remaining: formatRemainingText(course.remaining),
  instructor: {
    ...DEFAULT_FAVORITE_DETAIL.instructor,
    ...course.instructor,
  },
});
