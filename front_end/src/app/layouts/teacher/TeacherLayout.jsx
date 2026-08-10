import { Outlet } from "react-router-dom";
import TeacherHeader from "../../../shared/components/header/teacher_header/TeacherHeader";
import TeacherSidebar from "../../../shared/components/sidebar/sidebar_teacher/TeacherSidebar";
import "./TeacherLayout";

const TeacherLayout = () => {
  return (
    <div className="teacher-shell">
      <TeacherSidebar />

      <div className="teacher-workspace">
        <TeacherHeader />

        <main className="teacher-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
