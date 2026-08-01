import { useEffect, useState } from "react";
import { getAdminInstructorsApi } from "../../../api/admin/InstructorApi.js";
import { useAxiosPrivate } from "../../../hook/UseAxiosPrivate.js";
import InstructorStatistics from "./statistics/InstructorStatistics";
import InstructorFilters from "./filters/InstructorFilters";
import InstructorTable from "./instructorTable/InstructorTable";
import "./InstructorManagement.css";
import { useTranslation } from "react-i18next";

const InstructorManagement = () => {
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
        <InstructorStatistics
          instructors={instructors}
          isLoading={isLoading}
          error={error}
        />
        <InstructorFilters
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

export default InstructorManagement;
