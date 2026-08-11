package com.example.back_end.assessment.application;
import com.example.back_end.ai.application.AiServiceClient;
import com.example.back_end.media.infrastructure.storage.S3Service;

import com.example.back_end.assessment.adapter.in.web.dto.SubmitQuizRequest;
import com.example.back_end.assessment.adapter.in.web.dto.QuizOptionResponse;
import com.example.back_end.assessment.adapter.in.web.dto.QuizQuestionResponse;
import com.example.back_end.assessment.adapter.in.web.dto.QuizResponse;
import com.example.back_end.assessment.adapter.in.web.dto.QuizResultResponse;
import com.example.back_end.assessment.domain.Quiz;
import com.example.back_end.assessment.domain.QuizAnswer;
import com.example.back_end.assessment.domain.QuizAttempt;
import com.example.back_end.assessment.domain.QuizOption;
import com.example.back_end.assessment.domain.QuizQuestion;
import com.example.back_end.auth.domain.User;
import com.example.back_end.course.domain.Lesson;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.course.infrastructure.persistence.LessonRepository;
import com.example.back_end.assessment.infrastructure.persistence.QuizAttemptRepository;
import com.example.back_end.assessment.infrastructure.persistence.QuizRepository;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizService {

    private final QuizRepository quizRepo;
    private final LessonRepository lessonRepo;
    private final UserRepository userRepo;
    private final QuizAttemptRepository attemptRepo;
    private final S3Service s3Service;
    private final AiServiceClient aiServiceClient;

    public QuizResponse getQuiz(Long lessonId) {
        Quiz quiz = quizRepo.findByLessonId(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("No quiz yet for lesson " + lessonId));
        return toResponse(quiz);
    }

    @Transactional
    public QuizResponse generateQuiz(Long lessonId) {
        Lesson lesson = lessonRepo.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));

        var existing = quizRepo.findByLessonId(lessonId);
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        if (lesson.getVideoKey() == null) {
            throw new BusinessException("This lesson has no video uploaded yet.");
        }

        byte[] videoBytes = s3Service.readObjectBytes(lesson.getVideoKey());
        List<AiServiceClient.AiQuizQuestion> aiQuestions = aiServiceClient.generateQuiz(
                videoBytes,
                lesson.getVideoOriginalFilename() != null ? lesson.getVideoOriginalFilename() : "lesson.mp4",
                lesson.getVideoContentType()
        );

        Instant now = Instant.now();
        Quiz quiz = new Quiz();
        quiz.setLesson(lesson);
        quiz.setCreatedAt(now);
        quiz.setUpdatedAt(now);

        int qOrder = 0;
        for (AiServiceClient.AiQuizQuestion aiQuestion : aiQuestions) {
            QuizQuestion question = new QuizQuestion();
            question.setQuiz(quiz);
            question.setQuestionText(aiQuestion.question());
            question.setOrderIndex(qOrder++);

            int oOrder = 0;
            for (String optionText : aiQuestion.options()) {
                QuizOption option = new QuizOption();
                option.setQuestion(question);
                option.setOptionText(optionText);
                option.setOrderIndex(oOrder);
                option.setIsCorrect(oOrder == aiQuestion.correctIndex());
                question.getOptions().add(option);
                oOrder++;
            }
            quiz.getQuestions().add(question);
        }

        quiz = quizRepo.save(quiz);
        return toResponse(quiz);
    }

    @Transactional
    public QuizResultResponse submitQuiz(Long lessonId, Long userId, SubmitQuizRequest request) {
        Quiz quiz = quizRepo.findByLessonId(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("No quiz yet for lesson " + lessonId));
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Map<Long, SubmitQuizRequest.QuizAnswerRequest> answersByQuestion = request.answers().stream()
                .collect(Collectors.toMap(SubmitQuizRequest.QuizAnswerRequest::questionId, a -> a, (a, b) -> a));

        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz);
        attempt.setUser(user);
        attempt.setCreatedAt(Instant.now());

        List<QuizResultResponse.QuizAnswerResult> results = new ArrayList<>();
        int score = 0;

        List<QuizQuestion> questions = quiz.getQuestions().stream()
                .sorted(Comparator.comparingInt(QuizQuestion::getOrderIndex))
                .toList();

        for (QuizQuestion question : questions) {
            SubmitQuizRequest.QuizAnswerRequest answer = answersByQuestion.get(question.getId());
            QuizOption selectedOption = null;
            QuizOption correctOption = question.getOptions().stream()
                    .filter(QuizOption::getIsCorrect)
                    .findFirst()
                    .orElse(null);

            if (answer != null && answer.selectedOptionId() != null) {
                selectedOption = question.getOptions().stream()
                        .filter(o -> o.getId().equals(answer.selectedOptionId()))
                        .findFirst()
                        .orElseThrow(() -> new BusinessException("Invalid option for question " + question.getId()));
            }

            boolean correct = selectedOption != null && selectedOption.getIsCorrect();
            if (correct) {
                score++;
            }

            QuizAnswer quizAnswer = new QuizAnswer();
            quizAnswer.setAttempt(attempt);
            quizAnswer.setQuestion(question);
            quizAnswer.setSelectedOption(selectedOption);
            quizAnswer.setIsCorrect(correct);
            attempt.getAnswers().add(quizAnswer);

            results.add(new QuizResultResponse.QuizAnswerResult(
                    question.getId(),
                    selectedOption != null ? selectedOption.getId() : null,
                    correctOption != null ? correctOption.getId() : null,
                    correct
            ));
        }

        attempt.setScore(score);
        attempt.setTotalQuestions(questions.size());
        attempt = attemptRepo.save(attempt);

        return new QuizResultResponse(attempt.getId(), score, questions.size(), results);
    }

    private QuizResponse toResponse(Quiz quiz) {
        List<QuizQuestionResponse> questions = quiz.getQuestions().stream()
                .sorted(Comparator.comparingInt(QuizQuestion::getOrderIndex))
                .map(q -> new QuizQuestionResponse(
                        q.getId(),
                        q.getQuestionText(),
                        q.getOptions().stream()
                                .sorted(Comparator.comparingInt(QuizOption::getOrderIndex))
                                .map(o -> new QuizOptionResponse(o.getId(), o.getOptionText()))
                                .toList()
                ))
                .toList();

        return new QuizResponse(quiz.getId(), quiz.getLesson().getId(), questions);
    }
}
