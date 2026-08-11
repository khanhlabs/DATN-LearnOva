import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Megaphone, Send } from "lucide-react";
import { getMyCourses } from "../../../infrastructure/api/teacher/CoursesApi";
import { getMyAnnouncements, createAnnouncement } from "../../../infrastructure/api/teacher/AnnouncementApi";
import "./AnnouncementsPage.css";

const PAGE_SIZE = 10;
const emptyForm = { courseId: "", title: "", content: "" };

const AnnouncementsPage = () => {
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [formValues, setFormValues] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshHistory = async (targetPage) => {
    try {
      setIsLoadingHistory(true);
      const data = await getMyAnnouncements(targetPage, PAGE_SIZE);
      setAnnouncements(data.content || []);
      setTotalPages(data.totalPages || 0);
      setPage(data.number || 0);
    } catch {
      toast.error("Failed to load announcement history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    getMyCourses()
      .then(setCourses)
      .catch(() => toast.error("Failed to load courses."));

    getMyAnnouncements(0, PAGE_SIZE)
      .then((data) => {
        setAnnouncements(data.content || []);
        setTotalPages(data.totalPages || 0);
        setPage(data.number || 0);
      })
      .catch(() => toast.error("Failed to load announcement history."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formValues.courseId || !formValues.title.trim() || !formValues.content.trim()) {
      toast.error("Please fill in course, title, and content.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAnnouncement({
        courseId: Number(formValues.courseId),
        title: formValues.title.trim(),
        content: formValues.content.trim(),
      });
      setFormValues(emptyForm);
      toast.success(`Announcement sent to ${result.recipientCount} student(s).`);
      await refreshHistory(0);
    } catch {
      toast.error("Failed to send announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="teacher-page teacher-announcements-page">
        <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
          Loading announcements...
        </div>
      </section>
    );
  }

  return (
    <section className="teacher-page teacher-announcements-page">
      <form className="teacher-announcement-form" onSubmit={handleSubmit}>
        <h2>
          <Megaphone size={18} /> New announcement
        </h2>

        <label>
          Course
          <select name="courseId" value={formValues.courseId} onChange={handleChange}>
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.courseId} value={course.courseId}>
                {course.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          Title
          <input
            type="text"
            name="title"
            value={formValues.title}
            onChange={handleChange}
            placeholder="e.g. New lecture added this week"
            maxLength={255}
          />
        </label>

        <label>
          Content
          <textarea
            name="content"
            value={formValues.content}
            onChange={handleChange}
            placeholder="Write what you want your students to know..."
            rows={4}
            maxLength={2000}
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          <Send size={16} /> {isSubmitting ? "Sending..." : "Send announcement"}
        </button>
      </form>

      <div className="teacher-announcement-history">
        <h3>History</h3>
        {isLoadingHistory ? (
          <div className="teacher-announcement-empty">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="teacher-announcement-empty">You haven't posted any announcements yet.</div>
        ) : (
          announcements.map((a) => (
            <article key={a.id} className="teacher-announcement-item">
              <header>
                <span className="teacher-announcement-course">{a.courseTitle}</span>
                <span className="teacher-announcement-date">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </header>
              <strong>{a.title}</strong>
              <p>{a.content}</p>
              <span className="teacher-announcement-recipients">
                Sent to {a.recipientCount} student(s)
              </span>
            </article>
          ))
        )}

        {totalPages > 1 && (
          <div className="teacher-announcement-pagination">
            <button
              type="button"
              disabled={page === 0 || isLoadingHistory}
              onClick={() => refreshHistory(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages || isLoadingHistory}
              onClick={() => refreshHistory(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AnnouncementsPage;
