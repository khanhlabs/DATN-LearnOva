package com.example.back_end.service;

import com.example.back_end.dto.response.CertificateDownloadResponse;
import com.example.back_end.dto.response.CertificateResponse;
import com.example.back_end.dto.response.CertificateVerifyResponse;
import com.example.back_end.entity.Certificate;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.NotificationType;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.CertificateRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateService {

    private static final DateTimeFormatter ISSUED_DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd MMMM yyyy").withZone(ZoneOffset.UTC);

    private final CertificateRepository certificateRepository;
    private final S3Service s3Service;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Transactional
    public Certificate issueIfAbsent(User user, Course course) {
        return certificateRepository.findByUserIdAndCourseId(user.getId(), course.getId())
                .orElseGet(() -> generateAndSave(user, course));
    }

    private Certificate generateAndSave(User user, Course course) {
        String certificateCode = "LOV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Instant issuedAt = Instant.now();
        byte[] pdfBytes = renderPdf(user, course, certificateCode, issuedAt);

        String fileKey = "certificates/" + certificateCode + ".pdf";
        s3Service.putObject(pdfBytes, fileKey, "application/pdf");

        Certificate certificate = new Certificate();
        certificate.setUser(user);
        certificate.setCourse(course);
        certificate.setCertificateCode(certificateCode);
        certificate.setFileKey(fileKey);
        certificate.setIssuedAt(issuedAt);
        certificateRepository.save(certificate);

        notificationService.create(
                user,
                NotificationType.CERTIFICATE_ISSUED,
                "Certificate ready",
                "Your certificate for \"" + course.getTitle() + "\" is ready to download.",
                "/learnova/user/profile/courses?tab=completed",
                Map.of("courseId", course.getId(), "certificateId", certificate.getId())
        );

        try {
            String emailDownloadUrl = s3Service.generateCloudFrontSignedUrl(fileKey, Duration.ofDays(7));
            emailService.sendCourseCompletionEmail(
                    user.getEmail(), user.getFullName(), course.getTitle(), emailDownloadUrl, certificateCode);
        } catch (Exception e) {
            log.error("Failed to send course completion email for user id={} course id={}", user.getId(), course.getId(), e);
        }

        return certificate;
    }

    private byte[] renderPdf(User user, Course course, String certificateCode, Instant issuedAt) {
        Document document = new Document(PageSize.A4.rotate(), 50, 50, 50, 50);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            PdfContentByte canvas = writer.getDirectContent();
            Rectangle pageSize = document.getPageSize();
            canvas.setColorStroke(new Color(30, 64, 175));
            canvas.setLineWidth(3f);
            canvas.rectangle(24, 24, pageSize.getWidth() - 48, pageSize.getHeight() - 48);
            canvas.stroke();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 30, new Color(30, 64, 175));
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 14, Color.DARK_GRAY);
            Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 26, Color.BLACK);
            Font courseFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 18, Color.BLACK);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 13, Color.DARK_GRAY);
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);

            addCentered(document, "CERTIFICATE OF COMPLETION", titleFont, 60f);
            addCentered(document, "LearnOva", subtitleFont, 10f);
            addCentered(document, "This is to certify that", bodyFont, 40f);
            addCentered(document, user.getFullName(), nameFont, 15f);
            addCentered(document, "has successfully completed the course", bodyFont, 15f);
            addCentered(document, course.getTitle(), courseFont, 15f);
            addCentered(document, "Instructor: " + course.getInstructor().getFullName(), bodyFont, 40f);
            addCentered(document, "Issued on " + ISSUED_DATE_FORMAT.format(issuedAt), bodyFont, 30f);
            addCentered(document, "Certificate ID: " + certificateCode, footerFont, 5f);
            addCentered(document, "Verify at " + frontendBaseUrl + "/learnova/certificate/verify/" + certificateCode, footerFont, 0f);

            document.close();
        } catch (Exception e) {
            throw new BusinessException("Failed to generate certificate PDF: " + e.getMessage());
        }

        return out.toByteArray();
    }

    private void addCentered(Document document, String text, Font font, float spacingBefore) throws com.lowagie.text.DocumentException {
        Paragraph paragraph = new Paragraph(text, font);
        paragraph.setAlignment(Element.ALIGN_CENTER);
        paragraph.setSpacingBefore(spacingBefore);
        document.add(paragraph);
    }

    public CertificateResponse getForCourse(Long userId, Long courseId) {
        Certificate certificate = certificateRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found for this course"));
        return toResponse(certificate);
    }

    public CertificateDownloadResponse getDownloadUrl(Long certificateId, Long userId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found"));
        if (!certificate.getUser().getId().equals(userId)) {
            throw new BusinessException("You cannot access this certificate");
        }
        String url = s3Service.generateCloudFrontSignedUrl(certificate.getFileKey(), Duration.ofMinutes(30));
        return new CertificateDownloadResponse(url);
    }

    public CertificateVerifyResponse verifyByCode(String code) {
        return certificateRepository.findByCertificateCode(code)
                .map(certificate -> new CertificateVerifyResponse(
                        true,
                        certificate.getCertificateCode(),
                        certificate.getUser().getFullName(),
                        certificate.getCourse().getTitle(),
                        certificate.getCourse().getInstructor().getFullName(),
                        certificate.getIssuedAt()
                ))
                .orElseGet(() -> new CertificateVerifyResponse(false, code, null, null, null, null));
    }

    private CertificateResponse toResponse(Certificate certificate) {
        return new CertificateResponse(
                certificate.getId(),
                certificate.getCourse().getId(),
                certificate.getCourse().getTitle(),
                certificate.getCertificateCode(),
                certificate.getIssuedAt()
        );
    }
}
