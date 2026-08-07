import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { verifyCertificateApi } from "../../api/CertificateApi.js";
import "./VerifyCertificatePage.css";

const VerifyCertificatePage = () => {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    verifyCertificateApi(code)
      .then((data) => {
        if (mounted) setResult(data);
      })
      .catch(() => {
        if (mounted) setError("Could not verify this certificate. Please try again later.");
      });

    return () => {
      mounted = false;
    };
  }, [code]);

  return (
    <div className="verify-certificate-page">
      <div className="verify-certificate-panel">
        <h1>Certificate Verification</h1>

        {error && <p className="verify-status error">{error}</p>}

        {!error && !result && <p>Verifying certificate...</p>}

        {result && result.valid && (
          <div className="verify-status valid">
            <p className="verify-badge">✓ Valid Certificate</p>
            <dl>
              <dt>Student</dt>
              <dd>{result.studentName}</dd>
              <dt>Course</dt>
              <dd>{result.courseTitle}</dd>
              <dt>Instructor</dt>
              <dd>{result.instructorName}</dd>
              <dt>Issued on</dt>
              <dd>{new Date(result.issuedAt).toLocaleDateString()}</dd>
              <dt>Certificate ID</dt>
              <dd>{result.certificateCode}</dd>
            </dl>
          </div>
        )}

        {result && !result.valid && (
          <div className="verify-status invalid">
            <p className="verify-badge">✗ Certificate not found</p>
            <p>No certificate matches code "{code}".</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
