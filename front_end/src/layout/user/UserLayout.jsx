import { Outlet } from "react-router-dom";
import Footer from "../../component/footer/Footer.jsx";
import Header from "../../component/header/user_header/Header.jsx";


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
