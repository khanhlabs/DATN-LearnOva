import { ShieldCheck, Award, BookOpen, Flame, Star, User } from "lucide-react";

export const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200",
];

export const DEFAULT_PROFILE = {
  fullName: "Michael Nguyen",
  email: "michael.nguyen@gmail.com",
  phone: "+84 90 123 4567",
  address: "District 1, Ho Chi Minh City",
  bio: "I am a young graphic designer passionate about learning UI/UX and chat-bot.",
  goal: "Fullstack Developer & UI/UX Designer",
  avatar: PRESET_AVATARS[0],
};

export const DEFAULT_ACTIVITIES = [
  {
    id: 1,
    type: "course",
    text: 'Started Chapter 3 of the "Professional Graphic Design" course',
    date: "Today, 10:15 AM",
  },
  {
    id: 2,
    type: "achievement",
    text: 'Earned the "Dedicated Learner" Gold Badge',
    date: "Yesterday, 6:30 PM",
  },
  {
    id: 3,
    type: "quiz",
    text: "Completed Chapter 1 quiz with a perfect score",
    date: "3 days ago",
  },
  {
    id: 4,
    type: "streak",
    text: "Reached a 15-day learning streak.",
    date: "4 days ago",
  },
  {
    id: 5,
    type: "login",
    text: "Logged into the LearnOva online learning platform",
    date: "1 week ago",
  },
];

export const sidebarItems = [
  { id: "profile", label: "Profile", icon: User, path: "/learnova/user/profile" },
  { id: "courses", label: "My Courses", icon: BookOpen, path: "/learnova/user/profile/courses" },
  { id: "favorites", label: "Favorite Courses", icon: Star, path: "/learnova/user/profile/favorites" },
  { id: "security", label: "Security", icon: ShieldCheck, path: "/learnova/user/profile/security" },
];

export const DEFAULT_ENROLLED_COURSES = [
  {
    title: "React.js From Beginner to Advanced",
    instructor: "John Nguyen",
    progress: 65,
    lessonsDone: 32,
    lessonsTotal: 48,
    remaining: "5h 30m remaining",
    rating: 4.8,
    reviews: "1.2k",
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=900",
  },
  {
    title: "Advanced JavaScript for Developers",
    instructor: "Henry Tran",
    progress: 40,
    lessonsDone: 16,
    lessonsTotal: 40,
    remaining: "3h 15m remaining",
    rating: 4.7,
    reviews: "856",
    image:
      "https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=900",
  },
  {
    title: "Node.js & Express.js Backend Development",
    instructor: "Chris Le",
    progress: 20,
    lessonsDone: 8,
    lessonsTotal: 40,
    remaining: "6h 45m remaining",
    rating: 4.9,
    reviews: "732",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=900",
  },
  {
    title: "SQL From Beginner to Advanced",
    instructor: "David Pham",
    progress: 10,
    lessonsDone: 4,
    lessonsTotal: 36,
    remaining: "4h 20m remaining",
    rating: 4.6,
    reviews: "512",
    image:
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=900",
  },
];

export const FAVORITE_COURSE_TABS = [
  { id: "all", label: "All" },
  { id: "purchased", label: "Not Purchased" },
  { id: "unpurchased", label: "Purchased" },
];

export const FAVORITE_COURSE_STATUS = {
  purchased: "purchased",
  unpurchased: "unpurchased",
};

export const DEFAULT_UNPURCHASED_FAVORITE_COURSES = [
  {
    title: "Practical UI/UX Design for Digital Products",
    instructor: "Emily Do",
    progress: 0,
    lessonsDone: 0,
    lessonsTotal: 42,
    remaining: "12h 10m",
    rating: 4.8,
    reviews: "964",
    purchaseStatus: FAVORITE_COURSE_STATUS.unpurchased,
    image:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&q=80&w=900",
  },
  {
    title: "Python Data Analysis for Beginners",
    instructor: "Alex Vu",
    progress: 0,
    lessonsDone: 0,
    lessonsTotal: 38,
    remaining: "10h 45m",
    rating: 4.7,
    reviews: "688",
    purchaseStatus: FAVORITE_COURSE_STATUS.unpurchased,
    image:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=900",
  },
];

export const mapFavoriteCourse = (
  course,
  purchaseStatus = FAVORITE_COURSE_STATUS.purchased,
) => ({
  ...course,
  purchaseStatus: course.purchaseStatus || purchaseStatus,
  progress: course.progress || 0,
  lessonsDone: course.lessonsDone || 0,
  lessonsTotal: course.lessonsTotal || 0,
  remaining: course.remaining || "Not started yet",
  rating: course.rating || 4.8,
  reviews: course.reviews || "0",
});

export const buildFavoriteCourses = (favoriteCourses = []) => {
  const purchasedFavorites =
    favoriteCourses.length > 0 ? favoriteCourses : DEFAULT_ENROLLED_COURSES;

  return [
    ...purchasedFavorites.map((course) =>
      mapFavoriteCourse(course, FAVORITE_COURSE_STATUS.purchased),
    ),
    ...DEFAULT_UNPURCHASED_FAVORITE_COURSES.map((course) =>
      mapFavoriteCourse(course, FAVORITE_COURSE_STATUS.unpurchased),
    ),
  ];
};

export const buildAchievements = (stats, profileData, purchasedCourses) => [
  {
    id: "stellar",
    title: "Outstanding Learner",
    description: "Accumulate more than 30 hours of inspiring learning time.",
    icon: Award,
    threshold: stats.totalStudyHours >= 30,
    detail: `${stats.totalStudyHours.toFixed(1)}/30 Hours`,
  },
  {
    id: "streak",
    title: "Discipline Warrior",
    description: "Maintain a learning streak of more than 10 days.",
    icon: Flame,
    threshold: stats.streakDays >= 10,
    detail: `${stats.streakDays}/10 Days`,
  },
  {
    id: "investor",
    title: "Future Builder",
    description:
      "Invest in your education and own at least one professional course.",
    icon: Star,
    threshold: purchasedCourses.length >= 1,
    detail: `${purchasedCourses.length}/1 Course`,
  },
  {
    id: "contributor",
    title: "Proud Storyteller",
    description: "Write an inspiring personal introduction in your profile.",
    icon: User,
    threshold: profileData.bio && profileData.bio.length > 20,
    detail: "Completed",
  },
];
