import { ArrowUpRight } from "lucide-react";
import "./StudentEnrollmentCard.css";

const StudentEnrollmentCard = ({ title, value }) => {
  return (
    <article className="instructorStatCard instructorStatCard--gold">
      <div
        className="instructorStatIconWrap instructorStatIconWrap--gold"
        aria-hidden="true"
      >
        <ArrowUpRight size={22} />
      </div>

      <div className="instructorStatContent">
        <p className="instructorStatTitle">{title}</p>
        <p className="instructorStatValue">{value}</p>
      </div>
    </article>
  );
};

export default StudentEnrollmentCard;
