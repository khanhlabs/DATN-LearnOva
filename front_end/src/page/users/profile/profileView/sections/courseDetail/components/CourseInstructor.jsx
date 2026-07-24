import { Award, BookOpen, Star, Users } from "lucide-react";
import defaultAvatar from "../../../../../../../assets/default_avatar.jpg";

const statIcons = [Award, BookOpen, Users, Star];

const CourseInstructor = ({ instructor }) => (
  <section className="learning-content-panel learning-instructor-panel">
    <div className="learning-instructor-profile">
        <img
            src={instructor?.avatar?.trim() ? instructor.avatar : defaultAvatar}
            alt={instructor?.name || "Instructor"}
        />
      <div>
        <h2>{instructor.name}</h2>

        <p>{instructor.bio}</p>
      </div>
    </div>


  </section>
);

export default CourseInstructor;
