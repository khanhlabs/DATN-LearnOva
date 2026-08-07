import {useAuth} from "../../../hook/useAuth.jsx";
import LoggedInHeader from "./logged_in/LoggedInHeader.jsx";
import UnloggedInHeader from "./not_logged_in/NotLoggedIn.jsx";


const Header = () => {
  const {isAuthenticated, loading} = useAuth();
  if(loading){
      return null;
  }
  return (
      <>
            {isAuthenticated ? <LoggedInHeader /> : <UnloggedInHeader />}
      </>

  );
}

export default Header;