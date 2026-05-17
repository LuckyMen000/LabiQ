import React from "react";
import styled from "@emotion/styled";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiBarChart2,
  FiDatabase,
  FiHome,
  FiLogOut,
  FiSettings,
  FiShield,
  FiUsers,
} from "react-icons/fi";

type User = {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
};

type AdminSidebarProps = {
  user: User | null;
  onLogout: () => void;
};

type IconProps = {
  icon: unknown;
  size?: number;
};

function Icon({ icon, size = 18 }: IconProps) {
  const Component = icon as React.ComponentType<{ size?: number }>;
  return React.createElement(Component, { size });
}

function AdminSidebar({ user, onLogout }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar>
      <LogoBlock onClick={() => navigate("/admin")}>
        <LogoIcon>
          <Icon icon={FiShield} />
        </LogoIcon>

        <LogoText>
          <h2>LabIQ</h2>
          <span>Admin Panel</span>
        </LogoText>
      </LogoBlock>

      <Nav>
        <NavItem active={isActive("/admin")} onClick={() => navigate("/admin")}>
          <Icon icon={FiHome} />
          <span>Главная</span>
        </NavItem>

       <NavItem
          active={isActive("/admin/users")}
          onClick={() => navigate("/admin/users")}
           >
          <Icon icon={FiUsers} />
          <span>Пользователи</span>
        </NavItem>

        <NavItem onClick={() => navigate("/admin/data")}>
          <Icon icon={FiDatabase} />
          <span>Данные</span>
        </NavItem>

        <NavItem onClick={() => navigate("/admin/reports")}>
          <Icon icon={FiBarChart2} />
          <span>Отчёты</span>
        </NavItem>

        <NavItem
          active={isActive("/admin/logs")}
          onClick={() => navigate("/admin/logs")}
        >
          <Icon icon={FiActivity} />
          <span>Логи</span>
        </NavItem>

        <NavItem onClick={() => navigate("/admin/settings")}>
          <Icon icon={FiSettings} />
          <span>Настройки</span>
        </NavItem>
      </Nav>

      <SidebarFooter>
        <UserMini>
          <UserAvatar>{user?.full_name?.charAt(0) || "A"}</UserAvatar>

          <UserInfo>
            <strong>{user?.full_name || "Администратор"}</strong>
            <span>{user?.role || "Администратор"}</span>
          </UserInfo>
        </UserMini>

        <LogoutButton onClick={onLogout}>
          <Icon icon={FiLogOut} />
          <span>Выйти</span>
        </LogoutButton>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AdminSidebar;

const Sidebar = styled.aside`
  width: 280px;
  min-height: 100vh;
  background: #ffffff;
  color: #101828;
  display: flex;
  flex-direction: column;
  padding: 24px 20px;
  border-right: 1px solid #e4e7ec;
`;

const LogoBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 36px;
  cursor: pointer;
`;

const LogoIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoText = styled.div`
  h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    color: #101828;
    letter-spacing: -0.5px;
  }

  span {
    color: #667085;
    font-size: 13px;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NavItem = styled.button<{ active?: boolean }>`
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 14px 16px;
  background: ${({ active }) => (active ? "#2563eb" : "transparent")};
  color: ${({ active }) => (active ? "#ffffff" : "#475467")};
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    background: ${({ active }) => (active ? "#2563eb" : "#f2f4f7")};
    color: ${({ active }) => (active ? "#ffffff" : "#101828")};
  }
`;

const SidebarFooter = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const UserMini = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e4e7ec;
`;

const UserAvatar = styled.div`
  min-width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  strong {
    font-size: 14px;
    line-height: 1.25;
    color: #101828;
  }

  span {
    margin-top: 2px;
    color: #667085;
    font-size: 12px;
  }
`;

const LogoutButton = styled.button`
  border: none;
  border-radius: 14px;
  padding: 14px 16px;
  background: #fee4e2;
  color: #b42318;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;