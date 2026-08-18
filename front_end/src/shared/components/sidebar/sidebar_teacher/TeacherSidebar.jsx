import { NavLink } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Gift,
   Home,
  Megaphone,
  MessageCircleQuestion,
  Plus,
  Star,
  Tag,
  User,
  Users,
  WalletCards,
} from "lucide-react";
import LogoText from "../../../../assets/logo/LogoText.png";
import "./TeacherSidebar.css";

const teacherNavSections = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", path: "/learnova/teacher", icon: Home, end: true },
      { label: "Courses", path: "/learnova/teacher/courses", icon: BookOpen },
      { label: "Tags", path: "/learnova/teacher/tags", icon: Tag },
      { label: "Students", path: "/learnova/teacher/students", icon: Users },
      { label: "Reviews", path: "/learnova/teacher/reviews", icon: Star },
      { label: "Q&A", path: "/learnova/teacher/qna", icon: MessageCircleQuestion },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Promotions", path: "/learnova/teacher/promotions", icon: Gift },
      { label: "Announcements", path: "/learnova/teacher/announcements", icon: Megaphone },
      { label: "Revenue", path: "/learnova/teacher/revenue", icon: WalletCards },
      { label: "Analytics", path: "/learnova/teacher/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", path: "/learnova/teacher/profile", icon: User },
    ],
  },
];

const TeacherSidebar = () => {
  return (
    <aside className="teacher-sidebar" aria-label="Teacher dashboard navigation">
      <div className="teacher-brand">
        <div>
          <img src={LogoText} alt="LearnOva" />
        </div>
      </div>

      <nav className="teacher-nav">
        {teacherNavSections.map((section) => (
          <div className="teacher-nav__section" key={section.title}>
            <p className="teacher-nav__subtitle">{section.title}</p>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `teacher-nav__link ${isActive ? "teacher-nav__link--active" : ""}`
                  }
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <NavLink className="teacher-create" to="/learnova/teacher/courses/create">
        <Plus size={20} />
        <span style={{marginBottom: '3px'}}>Create new course</span>
      </NavLink>

    </aside>
  );
};

export default TeacherSidebar;
