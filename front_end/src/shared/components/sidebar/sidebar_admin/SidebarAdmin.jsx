import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  CircleDollarSign,
  ClipboardCheck,
  Flag,
  GraduationCap,
  LayoutDashboard,
  UserPlus,
  Tag,
  Tags,
  Ticket,
  Users,
} from "lucide-react";
import logoText from "../../../../assets/logo/LogoText.png";
import "../sidebar_teacher/TeacherSidebar";
import "./SidebarAdmin.css";

const adminNavSections = [
  {
    title: "Main",
    items: [
      {
        id: "dashboard",
        label: "Overview",
        icon: LayoutDashboard,
        path: "/learnova/admin",
        end: true,
      },
      {
        id: "users",
        label: "Users",
        icon: Users,
        path: "/learnova/admin/users",
      },
      {
        id: "teachers",
        label: "Instructors",
        icon: GraduationCap,
        path: "/learnova/admin/teachers",
      },
      {
        id: "courses",
        label: "Courses",
        icon: BookOpen,
        path: "/learnova/admin/courses",
      },
      {
        id: "course-approval",
        label: "Course Approval",
        icon: ClipboardCheck,
        path: "/learnova/admin/course-approval",
      },
      {
        id: "teacher-applications",
        label: "Instructor Applications",
        icon: UserPlus,
        path: "/learnova/admin/teacher-applications",
      },
      {
        id: "categories",
        label: "Categories",
        icon: Tags,
        path: "/learnova/admin/categories",
      },
      {
        id: "tags",
        label: "Tags",
        icon: Tag,
        path: "/learnova/admin/tags",
      },
    ],
  },
  {
    title: "Business",
    items: [
      {
        id: "revenue",
        label: "Revenue",
        icon: CircleDollarSign,
        path: "/learnova/admin/revenue",
      },
      {
        id: "vouchers",
        label: "Vouchers",
        icon: Ticket,
        path: "/learnova/admin/vouchers",
      },
    ],
  },
  {
    title: "Moderation",
    items: [
      {
        id: "violation-reports",
        label: "Violation Reports",
        icon: Flag,
        path: "/learnova/admin/violation-reports",
      },
    ],
  },
];

const adminTranslationKey = (value) =>
  value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

const SidebarAdmin = ({
  navSections = adminNavSections,
}) => {
  const { t } = useTranslation();
  const translatedSections = navSections.map((section) => ({
    ...section,
    title: t(`admin.${section.title.toLowerCase()}`),
    items: section.items.map((item) => ({
      ...item,
      label: t(`admin.${adminTranslationKey(item.id)}`),
    })),
  }));
  const getNavLinkClassName = ({ isActive }) =>
    `teacher-nav__link ${isActive ? "teacher-nav__link--active" : ""}`;

  return (
    <aside className="teacher-sidebar adminSidebar" aria-label="Admin dashboard navigation">
      <div className="teacher-brand">
        <div>
          <img src={logoText} alt="LearnOva" />
        </div>
      </div>

      <nav className="teacher-nav" aria-label="Sidebar navigation">
        {translatedSections.map((section) => (
          <div className="teacher-nav__section" key={section.title}>
            <p className="teacher-nav__subtitle">{section.title}</p>
            {section.items.map((item) => {
              if (!item?.icon || !item?.path) return null;

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.end === true}
                  className={getNavLinkClassName}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarAdmin;
