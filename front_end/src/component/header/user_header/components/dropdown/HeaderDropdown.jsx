const HeaderDropdown = ({ children, className = "", align = "left" }) => {
  return (
    <div className={`user-logged-dropdown user-logged-dropdown--${align} ${className}`}>
      {children}
    </div>
  );
};

export default HeaderDropdown;
