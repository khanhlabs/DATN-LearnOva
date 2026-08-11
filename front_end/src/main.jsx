import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import App from "./app/routes/AppRoutes";
import {AuthProvider} from "./app/providers/AuthContext";
import AxiosInterceptor from "./app/interceptors/AxiosInterceptor";
import "./app/i18n/i18n";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <AxiosInterceptor>
                <App/>
            </AxiosInterceptor>
        </AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover={false} newestOnTop limit={3} />
    </StrictMode>,
)
