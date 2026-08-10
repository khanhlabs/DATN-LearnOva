import { Outlet } from "react-router-dom";
import Footer from "../../../shared/components/footer/Footer";
import Header from "../../../shared/components/header/user_header/Header";


const UserLayout = () => {

    return (
        <div>

            <Header/>

            <main>
                <Outlet />
            </main>

            <Footer />
        </div>
    )
}

export default UserLayout;
