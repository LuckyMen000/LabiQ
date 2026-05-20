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

  const getInitial = () => {
    if (user?.full_name?.trim()) {
      return user.full_name.trim().charAt(0).toUpperCase();
    }

    if (user?.username?.trim()) {
      return user.username.trim().charAt(0).toUpperCase();
    }

    return "A";
  };

  return (
    <Sidebar>
      <Top>
        <LogoBlock onClick={() => navigate("/admin")}>
          <LogoIcon>
            <Icon icon={FiShield} size={18} />
          </LogoIcon>

          <LogoText>
            <strong>LabIQ</strong>
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

          <NavItem
            active={isActive("/admin/data")}
            onClick={() => navigate("/admin/data")}
          >
            <Icon icon={FiDatabase} />
            <span>Данные</span>
          </NavItem>

          <NavItem
            active={isActive("/admin/reports")}
            onClick={() => navigate("/admin/reports")}
          >
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

          <NavItem
            active={isActive("/admin/settings")}
            onClick={() => navigate("/admin/settings")}
          >
            <Icon icon={FiSettings} />
            <span>Настройки</span>
          </NavItem>
        </Nav>
      </Top>

      <Bottom>
        <UserCard>
          <Avatar>{getInitial()}</Avatar>

          <UserInfo>
            <strong title={user?.full_name || "Администратор"}>
              {user?.full_name || "Администратор"}
            </strong>
            <span>{user?.role || "Администратор"}</span>
          </UserInfo>
        </UserCard>

        <LogoutButton onClick={onLogout}>
          <Icon icon={FiLogOut} />
          <span>Выйти</span>
        </LogoutButton>
      </Bottom>
    </Sidebar>
  );
}

export default AdminSidebar;

const Sidebar = styled.aside`
  position: fixed;
  left: 0;
  top: 0;
  z-index: 50;
  width: 240px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e4e7ec;
  padding: 24px 18px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
  overflow-x: hidden;
`;

const Top = styled.div`
  min-height: 0;
`;

const LogoBlock = styled.button`
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  margin-bottom: 44px;
  text-align: left;
`;

const LogoIcon = styled.div`
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 16px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoText = styled.div`
  min-width: 0;

  strong {
    display: block;
    font-size: 26px;
    font-weight: 900;
    color: #101828;
    line-height: 1;
    letter-spacing: -0.6px;
  }

  span {
    display: block;
    margin-top: 7px;
    font-size: 13px;
    color: #667085;
    line-height: 1.2;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const NavItem = styled.button<{ active?: boolean }>`
  width: 100%;
  min-height: 50px;
  border: none;
  border-radius: 14px;
  background: ${({ active }) => (active ? "#2563eb" : "transparent")};
  color: ${({ active }) => (active ? "#ffffff" : "#344054")};
  padding: 14px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s ease;
  text-align: left;

  svg {
    min-width: 18px;
  }

  span {
    white-space: nowrap;
  }

  &:hover {
    background: ${({ active }) => (active ? "#2563eb" : "#f2f4f7")};
  }
`;

const Bottom = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 6px;
`;

const UserCard = styled.div`
  width: 100%;
  min-height: 76px;
  padding: 16px 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e4e7ec;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 15px;
`;

const UserInfo = styled.div`
  min-width: 0;
  flex: 1;

  strong {
    display: block;
    max-width: 120px;
    font-size: 13px;
    line-height: 1.25;
    font-weight: 900;
    color: #101828;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    display: block;
    margin-top: 6px;
    max-width: 120px;
    font-size: 12px;
    line-height: 1.25;
    color: #667085;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const LogoutButton = styled.button`
  width: 100%;
  min-height: 52px;
  border: none;
  border-radius: 16px;
  background: #fee4e2;
  color: #b42318;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: 0.2s ease;

  svg {
    min-width: 18px;
  }

  &:hover {
    background: #fecdca;
  }
`;