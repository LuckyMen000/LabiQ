import React from "react";
import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiBarChart2,
  FiDatabase,
  FiSettings,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import AdminSidebar from "../../components/admin/AdminSidebar";

type User = {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
};

type AdminPageProps = {
  user: User | null;
  onLogout: () => void;
};

type IconProps = {
  icon: unknown;
  size?: number;
};

function Icon({ icon, size = 22 }: IconProps) {
  const Component = icon as React.ComponentType<{ size?: number }>;

  return React.createElement(Component, { size });
}

function AdminPage({ user, onLogout }: AdminPageProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <Page>
      <AdminSidebar user={user} onLogout={handleLogout} />

      <Content>
        <Header>
          <HeaderLeft>
            <Title>Админ-панель</Title>
            <Subtitle>
              Управление пользователями, системой и безопасностью LabIQ
            </Subtitle>
          </HeaderLeft>

          <AdminBadge>
            <Icon icon={FiShield} size={16} />
            <span>{user?.role || "Администратор"}</span>
          </AdminBadge>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatIcon>
              <Icon icon={FiUsers} />
            </StatIcon>

            <StatContent>
              <span>Пользователи</span>
              <strong>1</strong>
              <small>Всего зарегистрировано</small>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon>
              <Icon icon={FiDatabase} />
            </StatIcon>

            <StatContent>
              <span>Записи</span>
              <strong>0</strong>
              <small>Объекты в системе</small>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon>
              <Icon icon={FiActivity} />
            </StatIcon>

            <StatContent>
              <span>Авторизации</span>
              <strong>0</strong>
              <small>Логи входов</small>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon>
              <Icon icon={FiShield} />
            </StatIcon>

            <StatContent>
              <span>Безопасность</span>
              <strong>OK</strong>
              <small>Система активна</small>
            </StatContent>
          </StatCard>
        </StatsGrid>

        <MainGrid>
          <Panel>
            <PanelHeader>
              <h3>Быстрые действия</h3>
              <p>Основные разделы администрирования</p>
            </PanelHeader>

            <ActionGrid>
              <ActionCard>
                <ActionIcon>
                  <Icon icon={FiUsers} />
                </ActionIcon>
                <h4>Пользователи</h4>
                <p>Просмотр, роли и управление аккаунтами</p>
              </ActionCard>

              <ActionCard>
                <ActionIcon>
                  <Icon icon={FiActivity} />
                </ActionIcon>
                <h4>Логи входа</h4>
                <p>История авторизаций и попыток входа</p>
              </ActionCard>

              <ActionCard>
                <ActionIcon>
                  <Icon icon={FiSettings} />
                </ActionIcon>
                <h4>Настройки</h4>
                <p>Системные параметры приложения</p>
              </ActionCard>

              <ActionCard>
                <ActionIcon>
                  <Icon icon={FiBarChart2} />
                </ActionIcon>
                <h4>Отчёты</h4>
                <p>Статистика и аналитика системы</p>
              </ActionCard>
            </ActionGrid>
          </Panel>

          <Panel>
            <PanelHeader>
              <h3>Информация</h3>
              <p>Текущий статус панели администратора</p>
            </PanelHeader>

            <InfoList>
              <InfoItem>
                <span>Текущий пользователь</span>
                <strong>{user?.full_name || "-"}</strong>
              </InfoItem>

              <InfoItem>
                <span>Email</span>
                <strong>{user?.email || "-"}</strong>
              </InfoItem>

              <InfoItem>
                <span>Username</span>
                <strong>{user?.username || "-"}</strong>
              </InfoItem>

              <InfoItem>
                <span>Роль</span>
                <strong>{user?.role || "-"}</strong>
              </InfoItem>

              <InfoItem>
                <span>Статус</span>
                <StatusActive>Активен</StatusActive>
              </InfoItem>
            </InfoList>
          </Panel>
        </MainGrid>
      </Content>
    </Page>
  );
}

export default AdminPage;

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  background: #f8fafc;
`;

const Content = styled.main`
  flex: 1;
  padding: 40px;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 38px;
  font-weight: 800;
  color: #101828;
  letter-spacing: -0.8px;
`;

const Subtitle = styled.p`
  margin: 10px 0 0;
  color: #667085;
  font-size: 16px;
`;

const AdminBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 999px;
  background: #ecfdf3;
  color: #027a48;
  font-weight: 800;
  font-size: 14px;
  border: 1px solid #abefc6;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(190px, 1fr));
  gap: 20px;
  margin-bottom: 26px;
`;

const StatCard = styled.div`
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #e4e7ec;
  box-shadow: 0 12px 28px rgba(16, 24, 40, 0.04);
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const StatIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatContent = styled.div`
  display: flex;
  flex-direction: column;

  span {
    color: #667085;
    font-size: 14px;
  }

  strong {
    margin-top: 4px;
    font-size: 30px;
    font-weight: 800;
    color: #101828;
  }

  small {
    margin-top: 4px;
    color: #98a2b3;
    font-size: 12px;
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 24px;
`;

const Panel = styled.div`
  background: #ffffff;
  border-radius: 26px;
  padding: 28px;
  border: 1px solid #e4e7ec;
  box-shadow: 0 12px 28px rgba(16, 24, 40, 0.04);
`;

const PanelHeader = styled.div`
  margin-bottom: 22px;

  h3 {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    color: #101828;
  }

  p {
    margin: 6px 0 0;
    color: #667085;
    font-size: 14px;
  }
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const ActionCard = styled.button`
  border: 1px solid #e4e7ec;
  border-radius: 20px;
  padding: 22px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  transition: 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #2563eb;
    box-shadow: 0 12px 30px rgba(37, 99, 235, 0.1);
  }

  h4 {
    margin: 16px 0 7px;
    font-size: 17px;
    font-weight: 800;
    color: #101828;
  }

  p {
    margin: 0;
    color: #667085;
    font-size: 14px;
    line-height: 1.5;
  }
`;

const ActionIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 16px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #eef2f6;

  span {
    color: #667085;
    font-size: 14px;
  }

  strong {
    color: #101828;
    font-size: 14px;
    text-align: right;
  }
`;

const StatusActive = styled.strong`
  color: #027a48 !important;
`;