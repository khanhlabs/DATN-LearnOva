import axiosClient from "../client/AxiosClient";

export const getCertificateForCourseApi = async (axiosPrivate, courseId, accessToken) => {
  try {
    const response = await axiosPrivate.get(`/certificates/course/${courseId}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    return response.data;
  } catch (err) {
    if (err?.response?.status === 404) {
      return null;
    }
    throw err;
  }
};

export const getCertificateDownloadUrlApi = async (axiosPrivate, certificateId, accessToken) => {
  const response = await axiosPrivate.get(`/certificates/${certificateId}/download`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  return response.data;
};

export const verifyCertificateApi = async (code) => {
  const response = await axiosClient.get(`/certificates/verify/${code}`);
  return response.data;
};
