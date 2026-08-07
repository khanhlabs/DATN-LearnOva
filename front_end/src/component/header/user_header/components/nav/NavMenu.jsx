import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HeaderSearch from "../search/HeaderSearch.jsx";

const NavMenu = () => {
    const { t } = useTranslation();

    const leftNav = [
        { key: "header.home", path: "/learnova/home" },
        { key: "header.courses", path: "/learnova/courses" },
    ];

    const rightNav = [
        { key: "header.instructors", path: "/learnova/intructors" },
        { key: "header.aboutUs", path: "/learnova/about" },
    ];

    return (
        <nav className="nav-menu">
            <ul className="nav-list">

                {leftNav.map((item, index) => (
                    <li key={index}>
                        <NavLink
                            to={item.path}
                            end
                            className={({ isActive }) =>
                                `nav-menu-link ${isActive ? "nav-menu-link-active" : ""}`
                            }
                        >
                            {t(item.key)}
                        </NavLink>
                    </li>
                ))}

                <li className="nav-search-item">
                    <HeaderSearch variant="guest" />
                </li>

                {rightNav.map((item, index) => (
                    <li key={index}>
                        <NavLink
                            to={item.path}
                            end
                            className={({ isActive }) =>
                                `nav-menu-link ${isActive ? "nav-menu-link-active" : ""}`
                            }
                        >
                            {t(item.key)}
                        </NavLink>
                    </li>
                ))}

            </ul>
        </nav>
    );
};

export default NavMenu;
