import axiosClient from "./AxiosClient.js";

export const getMyCartApi = (axiosPrivate, accessToken) => {
  const client = axiosPrivate || axiosClient;
  return client
    .get("/cart", {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
    .then((res) => res.data);
};

export const addCartItemApi = (axiosPrivate, courseId, accessToken) => {
  const client = axiosPrivate || axiosClient;
  return client
    .post(
      "/cart",
      { courseId },
      {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      },
    )
    .then((res) => res.data);
};

export const mergeCartApi = (axiosPrivate, courseIds, accessToken) => {
  const client = axiosPrivate || axiosClient;
  return client
    .post(
      "/cart/merge",
      { courseIds },
      {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      },
    )
    .then((res) => res.data);
};

export const removeCartItemApi = (axiosPrivate, courseId, accessToken) => {
  const client = axiosPrivate || axiosClient;
  return client.delete(`/cart/${courseId}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
};
