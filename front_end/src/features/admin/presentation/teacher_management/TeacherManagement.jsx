import { useEffect, useState } from "react";
import { getAdminInstructorsApi } from "../../infrastructure/api/InstructorApi";
import { useAxiosPrivate } from "../../../../shared/hooks/useAxiosPrivate";
import TeacherStatistics from "./statistics/TeacherStatistics";
import TeacherFilters from "./filters/TeacherFilters";
import InstructorTable from "./table/TeacherTable";
import "./TeacherManagement";
import { useTranslation } from "react-i18next";

const TeacherManagement = () => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const [instructors, setInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadInstructors = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await getAdminInstructorsApi(axiosPrivate);
        if (mounted) {
          setInstructors(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Could not load instructors.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadInstructors();

    return () => {
      mounted = false;
    };
  }, [axiosPrivate]);

  return (
    <section
      className="instructorManagementPage"
      aria-label="Instructor management"
    >
      <div className="instructorManagementContent">
        <TeacherStatistics
          instructors={instructors}
          isLoading={isLoading}
          error={error}
        />
        <TeacherFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <InstructorTable
          instructors={instructors}
          searchTerm={searchTerm}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </section>
  );
};

export default TeacherManagement;
