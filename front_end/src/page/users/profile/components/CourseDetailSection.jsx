import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CourseAbout from "./CourseAbout.jsx";
import CourseCurriculum from "./CourseCurriculum.jsx";
import CourseDetailHero from "./CourseDetailHero.jsx";
import CourseDetailSidebar from "./CourseDetailSidebar.jsx";
import CourseDetailTabs from "./CourseDetailTabs.jsx";
import CourseInstructor from "./CourseInstructor.jsx";
import CourseReviews from "./CourseReviews.jsx";

import {getCourseCurriculumApi, getCourseReviewsApi,} from "../../../../api/courses/EnrollmentApi.js";
import {
  getCertificateForCourseApi,
  getCertificateDownloadUrlApi,
} from "../../../../api/courses/CertificateApi.js";

import { useAuth } from "../../../../hook/UseAuth.jsx";
import { useAxiosPrivate } from "../../../../hook/useAxiosPrivate.js";




const CourseDetailSection = ({ course, onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("curriculum");
  const axiosPrivate = useAxiosPrivate();
  const { accessToken } = useAuth();

  const [curriculum, setCurriculum] = useState(null);
  const [loadingCurriculum, setLoadingCurriculum] = useState(true);
  const courseDetail = useMemo(() => buildCourseDetail(course), [course]);


  const [reviewsData, setReviewsData] = useState(null);
  const [certificate, setCertificate] = useState(null);

  const renderTabContent = () => {
    if (activeTab === "about") {
      return <CourseAbout course={courseDetail} />;
    }

    if (activeTab === "instructor") {
      return <CourseInstructor instructor={courseDetail.instructor} />;
    }

    if (activeTab === "reviews") {
      return <CourseReviews
          course={courseDetail}
          reviewsData={reviewsData}
      />;
    }

    if (loadingCurriculum) {
      return <p>{t("profile.learningDetail.loadingCurriculum")}</p>;
    }

    if (!curriculum) {
      return <p>{t("profile.learningDetail.noCurriculum")}</p>;
    }

    return <CourseCurriculum course={curriculum} />;
  };
  useEffect(() => {
    if (!course?.courseId) return;

    const fetchCurriculum = async () => {
      try {
        setLoadingCurriculum(true);

        const data = await getCourseCurriculumApi(
            axiosPrivate,
            course.courseId,
            accessToken
        );

        setCurriculum(data);
      } catch (err) {
        console.error("Failed to load curriculum", err);
      } finally {
        setLoadingCurriculum(false);
      }
    };

    fetchCurriculum();
  },
      [course, axiosPrivate, accessToken]);
  useEffect(() => {
    if (!course?.courseId) return;

    const fetchReviews = async () => {
      try {
        const data = await getCourseReviewsApi(
            axiosPrivate,
            course.courseId,
            accessToken
        );

        console.log("Reviews:", data);

        setReviewsData(data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchReviews();
  }, [course, axiosPrivate, accessToken]);

  useEffect(() => {
    if (!course?.courseId || course.progress !== 100) return;

    const fetchCertificate = async () => {
      try {
        const data = await getCertificateForCourseApi(
            axiosPrivate,
            course.courseId,
            accessToken
        );
        setCertificate(data);
      } catch (err) {
        console.error("Failed to load certificate", err);
      }
    };

    fetchCertificate();
  }, [course, axiosPrivate, accessToken]);

  const handleDownloadCertificate = async () => {
    if (!certificate?.id) return;
    try {
      const { downloadUrl } = await getCertificateDownloadUrlApi(
          axiosPrivate,
          certificate.id,
          accessToken
      );
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to get certificate download URL", err);
    }
  };

  return (
    <div className="learning-detail-page">
      <div className="learning-detail-main">
        <CourseDetailHero course={courseDetail} onBack={onBack} />
        <CourseDetailTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          reviews={courseDetail.reviews}
        />
        {renderTabContent()}
      </div>

      <CourseDetailSidebar
        course={courseDetail}
        certificate={certificate}
        onDownloadCertificate={handleDownloadCertificate}
      />
    </div>
  );
};

export default CourseDetailSection;
