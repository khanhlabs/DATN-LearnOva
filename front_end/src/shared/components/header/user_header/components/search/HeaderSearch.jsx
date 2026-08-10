import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { searchCourses } from "../../../../../../features/course/infrastructure/api/SearchApi";

const HeaderSearch = ({ variant = "logged" }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const prefix = variant === "guest" ? "header-search" : "user-logged-search";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (!debouncedTerm) {
      setResults([]);
      return;
    }

    let cancelled = false;
    searchCourses(debouncedTerm)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedTerm]);

  const goToCourse = (courseId) => {
    setIsFocused(false);
    setSearchTerm("");
    navigate(`/learnova/courses/detail/${courseId}`);
  };

  return (
    <form className={prefix} role="search" onSubmit={(e) => e.preventDefault()}>
      <Search size={18} className={`${prefix}-icon`} />
      <input
        type="search"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
        placeholder={t("header.searchCourseInstructorCategory")}
        className={`${prefix}-input`}
        aria-label={t("header.searchCourseInstructorCategory")}
      />

      {isFocused && results.length > 0 && (
        <div className={`${prefix}-suggestions`}>
          {results.map((course) => (
            <button
              key={course.courseId}
              type="button"
              className={`${prefix}-suggestion`}
              onMouseDown={() => goToCourse(course.courseId)}
            >
              <Search size={15} />
              <span
                dangerouslySetInnerHTML={{
                  __html: course.titleHighlight || course.title,
                }}
              />
              <small>{course.categoryName || course.instructorName}</small>
            </button>
          ))}
        </div>
      )}
    </form>
  );
};

export default HeaderSearch;
