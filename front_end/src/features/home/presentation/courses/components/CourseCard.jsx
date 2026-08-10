import { BiCart } from "react-icons/bi";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../../../../shared/hooks/useAuth";
import { addCourseToCart } from "../../../../../shared/utils/cartStorage";
import "./CourseCard";

const CourseCard = ({ course }) => {
  const { isAuthenticated, accessToken, loading: authLoading } = useAuth();

  if (!course) return null;

  const handleAddToCart = async () => {
    if (authLoading) return;

    try {
      const result = await addCourseToCart(
        {
          courseId: course.id,
          title: course.title,
          teacher: course.teacher,
          price: course.price,
          image: course.image,
        },
        { isAuthenticated, accessToken },
      );

      if (result.alreadyInCart) {
        toast.info("Already in cart.");
        return;
      }

      toast.success("Added to cart.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add to cart.");
    }
  };

  return (
    <article className="course-card">
      <Link to={`/learnova/user/courses-detail/${course.id}`}>
        <img
          src={course.image}
          alt={course.title}
          className="course-card__image"
        />
      </Link>

      <div className="course-card__body">
        <Link
          to={`/learnova/user/courses-detail/${course.id}`}
          className="course-title"
        >
          <h3>{course.title}</h3>
        </Link>

        <p className="course-card__teacher">{course.teacher}</p>

        <div className="course-card__rating">
          <strong>{course.rating}</strong>
          <span>★</span>
          <small>({course.reviews})</small>
        </div>

        <div className="course-card__footer">
          <div>
            <p className="course-card__price">{course.price}</p>
          </div>

          <button className="course-card__cart" type="button" onClick={handleAddToCart}>
            <BiCart />
          </button>
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
