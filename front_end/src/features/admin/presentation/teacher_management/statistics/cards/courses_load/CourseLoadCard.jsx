import { BookOpen } from "lucide-react";
import "./CourseLoadCard.css";

const CourseLoadCard = ({ title, value }) => {
  return (
    <article className="instructorStatCard instructorStatCard--green">
      <div
        className="instructorStatIconWrap instructorStatIconWrap--green"
        aria-hidden="true"
      >
        <BookOpen size={22} />
      </div>

      <div className="instructorStatContent">
        <p className="instructorStatTitle">{title}</p>
        <p className="instructorStatValue">{value}</p>
      </div>
    </article>
  );
};

export default CourseLoadCard;
