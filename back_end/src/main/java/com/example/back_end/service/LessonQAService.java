package com.example.back_end.service;

import com.example.back_end.dto.request.CreateAnswerRequest;
import com.example.back_end.dto.request.CreateQuestionRequest;
import com.example.back_end.dto.response.AnswerResponse;
import com.example.back_end.dto.response.LessonQAResponse;
import com.example.back_end.dto.response.QuestionResponse;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.Lesson;
import com.example.back_end.entity.LessonQA;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.dto.response.teacher.TeacherQuestionResponse;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.LessonQARepository;
import com.example.back_end.repository.LessonRepository;
import com.example.back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonQAService {

    private final LessonQARepository qaRepo;
    private final LessonRepository lessonRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;
    private final EnrollmentRepository enrollmentRepository;

    private void requireEnrolledOrInstructor(Long userId, Course course) {
        boolean isInstructor = course.getInstructor().getId().equals(userId);
        if (isInstructor) {
            return;
        }
        boolean isEnrolled = enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId());
        if (!isEnrolled) {
            throw new BusinessException("You must be enrolled in this course to ask or answer questions.");
        }
    }

    // =========================
    // 1. GET Q&A COURSE
    // =========================
    public LessonQAResponse getCourseQnA(Long courseId) {

        List<Lesson> lessons = lessonRepo.findBySectionCourseId(courseId);

        if (lessons.isEmpty()) {
            LessonQAResponse empty = new LessonQAResponse();
            empty.setQuestions(new ArrayList<>());
            return empty;
        }

        List<LessonQA> questions = qaRepo.findQuestionsForCourseWithUser(courseId);

        List<Long> questionIds = questions.stream()
                .map(LessonQA::getId)
                .toList();

        List<LessonQA> answers = questionIds.isEmpty()
                ? List.of()
                : qaRepo.findAnswersByParentIdsWithUser(questionIds);

        Map<Long, List<LessonQA>> questionsByLesson = questions.stream()
                .collect(Collectors.groupingBy(q -> q.getLesson().getId()));

        Map<Long, List<LessonQA>> answersByQuestion = answers.stream()
                .collect(Collectors.groupingBy(a -> a.getParent().getId()));

        List<QuestionResponse> allQuestions = new ArrayList<>();

        for (Lesson lesson : lessons) {

            List<LessonQA> lessonQuestions =
                    questionsByLesson.getOrDefault(lesson.getId(), List.of());

            for (LessonQA q : lessonQuestions) {

                QuestionResponse qr = new QuestionResponse();
                qr.setId(q.getId());
                qr.setContent(q.getContent());
                qr.setUserId(q.getUser().getId());
                qr.setUserName(q.getUser().getFullName());
                qr.setCreatedAt(q.getCreatedAt());
                qr.setIsSolved(q.getIsSolved());
                qr.setIsPinned(q.getIsPinned());

                List<AnswerResponse> answerResponses =
                        answersByQuestion.getOrDefault(q.getId(), List.of())
                                .stream()
                                .map(this::toAnswerResponse)
                                .toList();

                qr.setAnswers(answerResponses);
                allQuestions.add(qr);
            }
        }

        LessonQAResponse response = new LessonQAResponse();
        response.setQuestions(allQuestions);
        return response;
    }

    // =========================
    // 2. GET Q&A LESSON
    // =========================
    public LessonQAResponse getLessonQnA(Long lessonId) {

        Lesson lesson = lessonRepo.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));

        List<LessonQA> all = qaRepo.findByLessonIdAndIsDeletedFalse(lessonId);

        List<LessonQA> questions = all.stream()
                .filter(q -> q.getParent() == null)
                .toList();

        Map<Long, List<LessonQA>> replyMap = all.stream()
                .filter(q -> q.getParent() != null)
                .collect(Collectors.groupingBy(q -> q.getParent().getId()));

        List<QuestionResponse> questionResponses = questions.stream()
                .map(question -> {

                    QuestionResponse qr = new QuestionResponse();

                    qr.setId(question.getId());
                    qr.setContent(question.getContent());
                    qr.setUserId(question.getUser().getId());
                    qr.setUserName(question.getUser().getFullName());
                    qr.setCreatedAt(question.getCreatedAt());
                    qr.setIsSolved(question.getIsSolved());
                    qr.setIsPinned(question.getIsPinned());

                    qr.setAnswers(buildReplies(question.getId(), replyMap));

                    return qr;
                })
                .toList();

        LessonQAResponse response = new LessonQAResponse();
        response.setLessonId(lesson.getId());
        response.setLessonTitle(lesson.getTitle());
        response.setQuestions(questionResponses);

        return response;
    }

    // =========================
    // 3. CREATE QUESTION
    // =========================
    @Transactional
    public void createQuestion(Long userId, CreateQuestionRequest req) {

        Lesson lesson = lessonRepo.findById(req.getLessonId())
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        requireEnrolledOrInstructor(userId, lesson.getSection().getCourse());

        Instant now = Instant.now();

        LessonQA q = new LessonQA();
        q.setLesson(lesson);
        q.setUser(user);
        q.setContent(req.getContent());
        q.setParent(null);
        q.setType("QUESTION");
        q.setIsSolved(false);
        q.setIsPinned(false);
        q.setLikeCount(0);
        q.setIsDeleted(false);
        q.setLevel(0);
        q.setRootId(null);
        q.setReplyToUser(null);
        q.setCreatedAt(now);
        q.setUpdatedAt(now);

        qaRepo.save(q);

        Course course = lesson.getSection().getCourse();
        if (!course.getInstructor().getId().equals(user.getId())) {
            notificationService.create(
                    course.getInstructor(),
                    NotificationType.NEW_QUESTION,
                    "New question from a student",
                    user.getFullName() + " asked a question on \"" + lesson.getTitle() + "\".",
                    "/learnova/teacher/qna",
                    Map.of("courseId", course.getId(), "lessonId", lesson.getId(), "questionId", q.getId())
            );
        }
    }

    // =========================
    // 4. CREATE ANSWER
    // =========================
    @Transactional
    public void createAnswer(Long userId, CreateAnswerRequest req) {

        LessonQA parent = qaRepo.findById(req.getParentId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent not found"));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        requireEnrolledOrInstructor(userId, parent.getLesson().getSection().getCourse());

        Instant now = Instant.now();

        LessonQA answer = new LessonQA();

        answer.setLesson(parent.getLesson());
        answer.setUser(user);
        answer.setParent(parent);
        answer.setContent(req.getContent());

        answer.setType("ANSWER");
        answer.setIsSolved(false);
        answer.setIsPinned(false);
        answer.setLikeCount(0);
        answer.setIsDeleted(false);

        answer.setCreatedAt(now);
        answer.setUpdatedAt(now);

        if (parent.getRootId() == null) {
            answer.setRootId(parent.getId());
        } else {
            answer.setRootId(parent.getRootId());
        }

        answer.setLevel(parent.getLevel() + 1);
        answer.setReplyToUser(parent.getUser());

        qaRepo.save(answer);
    }

    private List<AnswerResponse> buildReplies(
            Long parentId,
            Map<Long, List<LessonQA>> replyMap
    ) {

        return replyMap
                .getOrDefault(parentId, List.of())
                .stream()
                .map(reply -> {

                    AnswerResponse ar = toAnswerResponse(reply);

                    ar.setReplies(
                            buildReplies(reply.getId(), replyMap)
                    );

                    return ar;

                })
                .toList();
    }

    private AnswerResponse toAnswerResponse(LessonQA qa) {

        AnswerResponse ar = new AnswerResponse();

        ar.setId(qa.getId());
        ar.setContent(qa.getContent());

        ar.setUserId(qa.getUser().getId());
        ar.setUserName(qa.getUser().getFullName());

        ar.setCreatedAt(qa.getCreatedAt());

        ar.setLikeCount(qa.getLikeCount());

        ar.setParentId(
                qa.getParent() != null
                        ? qa.getParent().getId()
                        : null
        );

        ar.setReplyToUserId(
                qa.getReplyToUser() != null
                        ? qa.getReplyToUser().getId()
                        : null
        );

        ar.setReplyToUserName(
                qa.getReplyToUser() != null
                        ? qa.getReplyToUser().getFullName()
                        : null
        );

        ar.setRootId(qa.getRootId());

        ar.setLevel(qa.getLevel());

        ar.setInstructor(
                qa.getUser().getId().equals(
                        qa.getLesson()
                                .getSection()
                                .getCourse()
                                .getInstructor()
                                .getId()
                )
        );

        ar.setReplies(List.of());

        return ar;
    }

    private boolean isCourseInstructor(Long userId, LessonQA qa) {
        return qa.getLesson().getSection().getCourse().getInstructor().getId().equals(userId);
    }

    @Transactional
    public void deleteAnswer(Long userId, Long answerId) {

        LessonQA answer = qaRepo.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found"));

        if ("QUESTION".equals(answer.getType())) {
            throw new RuntimeException("Cannot delete question.");
        }

        if (!answer.getUser().getId().equals(userId) && !isCourseInstructor(userId, answer)) {
            throw new RuntimeException("You cannot delete this answer.");
        }

        qaRepo.delete(answer);
    }

    @Transactional
    public void deleteQuestion(Long userId, Long questionId) {

        LessonQA question = qaRepo.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        if (!"QUESTION".equals(question.getType())) {
            throw new RuntimeException("Not a question");
        }

        if (!question.getUser().getId().equals(userId) && !isCourseInstructor(userId, question)) {
            throw new RuntimeException("Not allowed");
        }

        List<LessonQA> children = qaRepo.findByRootId(questionId);

        qaRepo.deleteAll(children);

        qaRepo.delete(question);
    }

    @Transactional
    public void setSolved(Long userId, Long questionId, boolean solved) {

        LessonQA question = qaRepo.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        if (!"QUESTION".equals(question.getType())) {
            throw new BusinessException("Not a question");
        }

        if (!question.getUser().getId().equals(userId) && !isCourseInstructor(userId, question)) {
            throw new BusinessException("Not allowed");
        }

        question.setIsSolved(solved);
        question.setUpdatedAt(Instant.now());

        qaRepo.save(question);
    }

    @Transactional
    public void setPinned(Long userId, Long questionId, boolean pinned) {

        LessonQA question = qaRepo.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        if (!"QUESTION".equals(question.getType())) {
            throw new BusinessException("Not a question");
        }

        if (!isCourseInstructor(userId, question)) {
            throw new BusinessException("Only the instructor can pin questions.");
        }

        question.setIsPinned(pinned);
        question.setUpdatedAt(Instant.now());

        qaRepo.save(question);
    }

    @Transactional
    public void updateAnswer(Long userId, Long answerId, CreateAnswerRequest req) {

        LessonQA answer = qaRepo.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer not found"));

        if (!answer.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not allowed");
        }

        answer.setContent(req.getContent());
        answer.setUpdatedAt(Instant.now());

        qaRepo.save(answer);
    }

    @Transactional
    public void updateQuestion(Long userId, Long questionId, CreateQuestionRequest req) {

        LessonQA q = qaRepo.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        if (!q.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not allowed");
        }

        q.setContent(req.getContent());
        q.setUpdatedAt(Instant.now());

        qaRepo.save(q);
    }

    public List<TeacherQuestionResponse> getMyQuestions(String instructorEmail) {

        User instructor = userRepo.findByEmailAndIsDeletedFalse(instructorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<LessonQA> questions = qaRepo.findQuestionsForInstructorWithDetails(instructor.getId());

        List<Long> questionIds = questions.stream().map(LessonQA::getId).toList();

        Map<Long, Long> answerCountByQuestion = questionIds.isEmpty()
                ? Map.of()
                : qaRepo.findAnswersByParentIdsWithUser(questionIds).stream()
                        .collect(Collectors.groupingBy(a -> a.getParent().getId(), Collectors.counting()));

        return questions.stream()
                .map(q -> {
                    Course course = q.getLesson().getSection().getCourse();
                    return new TeacherQuestionResponse(
                            q.getId(),
                            q.getContent(),
                            course.getId(),
                            course.getTitle(),
                            q.getLesson().getId(),
                            q.getLesson().getTitle(),
                            q.getUser().getId(),
                            q.getUser().getFullName(),
                            q.getCreatedAt(),
                            q.getIsSolved(),
                            q.getIsPinned(),
                            answerCountByQuestion.getOrDefault(q.getId(), 0L).intValue()
                    );
                })
                .toList();
    }
}
