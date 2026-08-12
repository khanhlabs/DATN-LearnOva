import { writeFileSync } from "node:fs";
import { Diagram } from "../skills/.claude/skills/drawio-ai-kit/src/builder.mjs";
import { group, box, phantom, renderTree } from "../skills/.claude/skills/drawio-ai-kit/src/layout-engine.mjs";

const d = new Diagram("network");

const tbl = (id, title, ...fields) => box(id, `<b>${title}</b><hr>${fields.join("<br>")}`, { 
    w: 180, h: 40 + fields.length * 20, 
    fill: "#ffffff", stroke: "#000000", fontColor: "#000000",
    align: "left", verticalAlign: "top", html: 1 
});

// Row 1: Users & Auth
const t_user = tbl("user", "User", "user_id bigint (PK)");
const t_role = tbl("role", "Role", "role_id bigint (PK)");
const t_userRole = tbl("userRole", "UserRole", "user_id bigint (FK)", "role_id bigint (FK)");
const t_userAuth = tbl("userAuth", "UserAuthProvider", "provider_id bigint (PK)", "user_id bigint (FK)");
const t_verify = tbl("verify", "VerificationToken", "token_id bigint (PK)", "user_id bigint (FK)");

// Row 2: Instructor & Activity
const t_instProf = tbl("instProf", "InstructorProfile", "user_id bigint (PK/FK)");
const t_instFollow = tbl("instFollow", "InstructorFollow", "user_id bigint (FK)", "instructor_id bigint (FK)");
const t_teacherApp = tbl("teacherApp", "TeacherApplication", "application_id bigint (PK)", "user_id bigint (FK)");
const t_audit = tbl("audit", "AuditLog", "audit_log_id bigint (PK)", "user_id bigint (FK)");
const t_notif = tbl("notif", "Notification", "notification_id bigint (PK)", "user_id bigint (FK)");

// Row 3: Course 1
const t_course = tbl("course", "Course", "course_id bigint (PK)", "user_id bigint (FK)");
const t_category = tbl("category", "Category", "category_id bigint (PK)", "parent_id bigint (FK)");
const t_courseCat = tbl("courseCat", "CourseCategory", "course_id bigint (FK)", "category_id bigint (FK)");
const t_tag = tbl("tag", "Tag", "tag_id bigint (PK)");
const t_courseTag = tbl("courseTag", "CourseTag", "course_id bigint (FK)", "tag_id bigint (FK)");

// Row 4: Course 2
const t_section = tbl("section", "Section", "section_id bigint (PK)", "course_id bigint (FK)");
const t_lesson = tbl("lesson", "Lesson", "lesson_id bigint (PK)", "section_id bigint (FK)");
const t_lessonSrc = tbl("lessonSrc", "LessonSource", "source_id bigint (PK)", "lesson_id bigint (FK)");
const t_announcement = tbl("announcement", "CourseAnnouncement", "announcement_id bigint (PK)", "course_id bigint (FK)");

// Row 5: Quiz
const t_quiz = tbl("quiz", "Quiz", "quiz_id bigint (PK)", "lesson_id bigint (FK)");
const t_quizQ = tbl("quizQ", "QuizQuestion", "question_id bigint (PK)", "quiz_id bigint (FK)");
const t_quizOpt = tbl("quizOpt", "QuizOption", "option_id bigint (PK)", "question_id bigint (FK)");
const t_quizAtt = tbl("quizAtt", "QuizAttempt", "attempt_id bigint (PK)", "quiz_id bigint (FK)", "user_id bigint (FK)");
const t_quizAns = tbl("quizAns", "QuizAnswer", "answer_id bigint (PK)", "attempt_id bigint (FK)", "question_id bigint (FK)");

// Row 6: Learning & Engagement
const t_enroll = tbl("enroll", "Enrollment", "enrollment_id bigint (PK)", "user_id bigint (FK)", "course_id bigint (FK)");
const t_progress = tbl("progress", "LessonProgress", "progress_id bigint (PK)", "user_id bigint (FK)", "lesson_id bigint (FK)");
const t_cert = tbl("cert", "Certificate", "certificate_id bigint (PK)", "user_id bigint (FK)", "course_id bigint (FK)");
const t_summary = tbl("summary", "LessonSummary", "summary_id bigint (PK)", "lesson_id bigint (FK)");
const t_review = tbl("review", "Review", "review_id bigint (PK)", "user_id bigint (FK)", "course_id bigint (FK)");
const t_qa = tbl("qa", "LessonQA", "qa_id bigint (PK)", "user_id bigint (FK)", "lesson_id bigint (FK)");

// Row 7: Commerce 1
const t_cart = tbl("cart", "Cart", "cart_id bigint (PK)", "user_id bigint (FK)", "course_id bigint (FK)");
const t_order = tbl("order", "Order", "order_id bigint (PK)", "user_id bigint (FK)");
const t_orderItem = tbl("orderItem", "OrderItem", "order_item_id bigint (PK)", "order_id bigint (FK)", "course_id bigint (FK)");
const t_payment = tbl("payment", "Payment", "payment_id bigint (PK)", "order_id bigint (FK)");
const t_wishlist = tbl("wishlist", "Wishlist", "wishlist_id bigint (PK)", "user_id bigint (FK)", "course_id bigint (FK)");

// Row 8: Promotions & Reports
const t_voucher = tbl("voucher", "Voucher", "voucher_id bigint (PK)");
const t_promo = tbl("promo", "Promotion", "promotion_id bigint (PK)");
const t_promoCourse = tbl("promoCourse", "PromotionCourse", "promotion_id bigint (FK)", "course_id bigint (FK)");
const t_repCat = tbl("repCat", "ReportCategory", "report_category_id bigint (PK)");
const t_report = tbl("report", "Report", "report_id bigint (PK)", "user_id bigint (FK)", "course_id bigint (FK)", "report_category_id bigint (FK)");


const gapH = 80;
const r1 = phantom("row1", "", { dir: "row", gap: gapH, align: "top" }, [t_user, t_role, t_userRole, t_userAuth, t_verify, t_instProf]);
const r2 = phantom("row2", "", { dir: "row", gap: gapH, align: "top" }, [t_instFollow, t_teacherApp, t_audit, t_notif, t_course, t_category]);
const r3 = phantom("row3", "", { dir: "row", gap: gapH, align: "top" }, [t_courseCat, t_tag, t_courseTag, t_section, t_lesson, t_lessonSrc]);
const r4 = phantom("row4", "", { dir: "row", gap: gapH, align: "top" }, [t_announcement, t_quiz, t_quizQ, t_quizOpt, t_quizAtt, t_quizAns]);
const r5 = phantom("row5", "", { dir: "row", gap: gapH, align: "top" }, [t_enroll, t_progress, t_cert, t_summary, t_review, t_qa]);
const r6 = phantom("row6", "", { dir: "row", gap: gapH, align: "top" }, [t_cart, t_order, t_orderItem, t_payment, t_wishlist]);
const r7 = phantom("row7", "", { dir: "row", gap: gapH, align: "top" }, [t_voucher, t_promo, t_promoCourse, t_report, t_repCat]);

const topLevel = phantom("root", "", { dir: "col", gap: 100, pad: 60, align: "center" }, [
    r1, r2, r3, r4, r5, r6, r7
]);

renderTree(d, topLevel);

// Links (FK -> PK)
const fk = (from, to) => d.link(from, to, "", { stroke: "#333333", startArrow: "none", endArrow: "classic", strokeWidth: 1.5 });

// User relations
fk("userRole", "user"); fk("userRole", "role");
fk("userAuth", "user"); fk("verify", "user");
fk("instProf", "user"); 
fk("instFollow", "user"); fk("instFollow", "user"); // simplified
fk("teacherApp", "user");
fk("audit", "user"); fk("notif", "user");
fk("course", "user"); // instructor
fk("enroll", "user"); fk("progress", "user"); fk("cert", "user");
fk("review", "user"); fk("qa", "user"); fk("report", "user");
fk("cart", "user"); fk("order", "user"); fk("wishlist", "user");
fk("quizAtt", "user");

// Course relations
fk("courseCat", "course"); fk("courseCat", "category");
fk("category", "category"); // parent_id
fk("courseTag", "course"); fk("courseTag", "tag");
fk("section", "course");
fk("announcement", "course");
fk("enroll", "course"); fk("cert", "course");
fk("review", "course"); fk("report", "course");
fk("cart", "course"); fk("orderItem", "course"); fk("wishlist", "course");
fk("promoCourse", "course"); fk("promoCourse", "promo");

// Lesson relations
fk("lesson", "section");
fk("lessonSrc", "lesson");
fk("progress", "lesson");
fk("summary", "lesson");
fk("qa", "lesson");
fk("quiz", "lesson");

// Commerce relations
fk("orderItem", "order");
fk("payment", "order");

// Quiz relations
fk("quizQ", "quiz");
fk("quizOpt", "quizQ");
fk("quizAtt", "quiz");
fk("quizAns", "quizAtt"); fk("quizAns", "quizQ"); fk("quizAns", "quizOpt");

// Report relations
fk("report", "repCat");

writeFileSync("d:/CODING/DATN/DATN-LearnOva/diagram/database_diagram.drawio", d.mxfile("LearnOva Database ER Diagram"));
console.log("Generated database_diagram.drawio successfully.");
