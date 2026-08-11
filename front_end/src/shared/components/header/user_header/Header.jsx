import {useAuth} from "../../../hooks/useAuth";
import LoggedInHeader from "./logged_in/LoggedInHeader";
import UnloggedInHeader from "./not_logged_in/NotLoggedIn";


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