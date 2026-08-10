import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const axiosClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,   // sends the HttpOnly accessToken cookie automatically on every request
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosClient;
