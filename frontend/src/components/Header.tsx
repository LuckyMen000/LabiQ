import { Link, NavLink, useNavigate } from "react-router-dom";
import styled from "@emotion/styled";
import { FiLogOut, FiUser, FiShield, FiHome, FiSettings } from "react-icons/fi";

const Header = () => {
  const navigate = useNavigate();

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const isAdmin =
    user?.role === "Супер администратор" ||
    user?.role === "Администратор" ||
    user?.role === "admin" ||
    user?.role === "administrator";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("remember_me");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <HeaderWrapper>
      <Container>
        <Logo to="/">
          <LogoIcon>
            <FiShield />
          </LogoIcon>

          <LogoText>
            <strong>LabIQ</strong>
            <span>Laboratory Security System</span>
          </LogoText>
        </Logo>

        <Nav>
          <StyledNavLink to="/">
            <FiHome />
            Главная
          </StyledNavLink>

          <StyledNavLink to="/profile">
            <FiUser />
            Профиль
          </StyledNavLink>

          {isAdmin && (
            <StyledNavLink to="/admin">
              <FiSettings />
              Админка
            </StyledNavLink>
          )}
        </Nav>

        <LogoutButton onClick={handleLogout}>
          <FiLogOut />
          Выйти
        </LogoutButton>
      </Container>
    </HeaderWrapper>
  );
};

export default Header;

const HeaderWrapper = styled.header`
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 50;
`;

const Container = styled.div`
  max-width: 1240px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #111827;
`;

const LogoIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #2563eb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const LogoText = styled.div`
  display: flex;
  flex-direction: column;

  strong {
    font-size: 20px;
    line-height: 1.1;
  }

  span {
    font-size: 12px;
    color: #6b7280;
    margin-top: 3px;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  text-decoration: none;
  color: #4b5563;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }

  &.active {
    background: #eff6ff;
    color: #2563eb;
  }
`;

const LogoutButton = styled.button`
  border: none;
  background: #f9fafb;
  color: #374151;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #fee2e2;
    color: #dc2626;
  }
`;