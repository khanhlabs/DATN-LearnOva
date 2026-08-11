import React, { useEffect, useState } from "react";
import "../../css/CourseCard.css";
import { toast } from "react-toastify";
import { useAuth } from "../../../../../../shared/hooks/useAuth";
import { addCourseToCart } from "../../../../../../shared/utils/cartStorage";
import { Heart } from "lucide-react";

function formatUsd(value) {
  const amount = Number(value) || 0;
  const body = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/\.?0+$/, "");
  return `$${body}`;
}

function CourseCard({ course }) {
  const { isAuthenticated, accessToken, loading: authLoading } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites =
      JSON.parse(localStorage.getItem("favoriteCourses")) || [];
    setIsFavorite(favorites.includes(course.id));
  }, [course.id]);

  const handleAddToCart = async () => {
    if (authLoading) return;

    try {
      const result = await addCourseToCart(
        {
          courseId: course.id,
          title: course.title,
          teacher: course.author,
          price: Number(course.price || 0),
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

  const handleFavorite = () => {
    const favorites =
      JSON.parse(localStorage.getItem("favoriteCourses")) || [];

    if (favorites.includes(course.id)) {
      const newFavorites = favorites.filter((id) => id !== course.id);
      localStorage.setItem("favoriteCourses", JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(course.id);
      localStorage.setItem("favoriteCourses", JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  return (
    <div className="course-card-course">
      <div className="course-card-img">
        <img src={course.image} alt={course.title} />
        {course.tag && <span className="course-tag">{course.tag}</span>}
        <button
          type="button"
          className={`course-favorite-btn ${isFavorite ? "is-active" : ""}`}
          onClick={handleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="course-card-body">
        <div className="course-category">{course.category}</div>
        <h3 className="course-title">{course.title}</h3>
        <div className="course-author">{course.author}</div>

        <div className="course-rating">
          <span>⭐ {course.rating}</span>
          <span>({course.reviews})</span>
        </div>

        <div className="course-card-bottom">
          <span className="course-price">{formatUsd(course.price)}</span>
          <button
            className="add-to-cart"
            title="Add to cart"
            type="button"
            onClick={handleAddToCart}
          >
            🛒
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;
