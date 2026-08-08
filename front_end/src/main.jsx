import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import App from "./route/AppRoutes.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";
import AxiosInterceptor from "./component/interceptor/AxiosInterceptor.jsx";
import "./i18n/i18n.js";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <AxiosInterceptor>
                <App/>
            </AxiosInterceptor>
        </AuthProvider>
        <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} closeOnClick pauseOnHover />
    </StrictMode>,
)
