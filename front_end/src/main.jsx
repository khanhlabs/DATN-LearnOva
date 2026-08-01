import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import App from "./route/AppRoutes.jsx";
import {AuthProvider} from "./context/AuthContext.jsx";
import AxiosInterceptorSetup from "./component/AxiosInterceptorSetup.jsx";
import "./i18n/i18n.js";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <AxiosInterceptorSetup>
                <App/>
            </AxiosInterceptorSetup>
        </AuthProvider>
        <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} closeOnClick pauseOnHover />
    </StrictMode>,
)
