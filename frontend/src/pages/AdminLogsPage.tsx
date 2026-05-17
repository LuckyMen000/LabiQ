import React, { useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiMapPin,
  FiMonitor,
  FiRefreshCw,
  FiShield,
  FiUser,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";

import AdminSidebar from "../components/admin/AdminSidebar";
import { api } from "../api/api";

type User = {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
};

type UnifiedLog = {
  id: number;
  source_id: number;
  log_type: "AUTH" | "ADMIN_USER" | "SECURITY_INCIDENT" | string;
  action: string;
  actor: string | null;
  target: string | null;
  ip_address: string | null;
  location: string | null;
  message: string | null;
  severity: string | null;
  status: string | null;
  user_agent: string | null;
  created_at: string;
};

type AdminLogsPageProps = {
  user: User | null;
  onLogout: () => void;
};

type FilterType = "ALL" | "SECURITY_INCIDENT" | "AUTH" | "ADMIN_USER";

type IconProps = {
  icon: unknown;
  size?: number;
};

function Icon({ icon, size = 18 }: IconProps) {
  const Component = icon as React.ComponentType<{ size?: number }>;
  return React.createElement(Component, { size });
}

function AdminLogsPage({ user, onLogout }: AdminLogsPageProps) {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<UnifiedLog[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<UnifiedLog[]>("/admin/logs");
      setLogs(response.data);
    } catch {
      setError("Не удалось загрузить логи системы");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (activeFilter === "ALL") {
      return logs;
    }

    return logs.filter((log) => log.log_type === activeFilter);
  }, [logs, activeFilter]);

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("ru-RU");
  };

  const getTypeLabel = (type: string) => {
    if (type === "AUTH") return "Вход/регистрация";
    if (type === "ADMIN_USER") return "[Admin] Пользователи";
    if (type === "SECURITY_INCIDENT") return "Инцидент ИБ";
    return type;
  };

  const getActionLabel = (action: string) => {
    if (action === "SUCCESS") return "Успешный вход";
    if (action === "FAILED") return "Ошибка входа";
    if (action === "FORBIDDEN") return "Запрещено";
    if (action === "USER_CREATED") return "Создание пользователя";
    if (action === "USER_UPDATED") return "Редактирование пользователя";
    if (action === "USER_DELETED") return "Удаление пользователя";
    if (action === "BRUTE_FORCE") return "Brute Force";
    return action;
  };

  const getLogIcon = (log: UnifiedLog) => {
    if (log.log_type === "SECURITY_INCIDENT") return FiAlertTriangle;
    if (log.log_type === "ADMIN_USER") return FiUsers;
    if (log.action === "SUCCESS") return FiCheckCircle;
    if (
      log.action === "FAILED" ||
      log.action === "FORBIDDEN" ||
      log.action === "BRUTE_FORCE"
    ) {
      return FiXCircle;
    }

    return FiActivity;
  };

  return (
    <Page>
      <AdminSidebar user={user} onLogout={handleLogout} />

      <Content>
        <Header>
          <HeaderLeft>
            <Title>Логи системы</Title>
            <Subtitle>
              Входы, регистрации, действия администратора и инциденты
              информационной безопасности
            </Subtitle>
          </HeaderLeft>

          <RefreshButton onClick={loadLogs}>
            <Icon icon={FiRefreshCw} />
            Обновить
          </RefreshButton>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatIcon>
              <Icon icon={FiFileText} />
            </StatIcon>

            <div>
              <span>Все логи</span>
              <strong>{logs.length}</strong>
            </div>
          </StatCard>

          <StatCard>
            <StatIcon danger>
              <Icon icon={FiAlertTriangle} />
            </StatIcon>

            <div>
              <span>Инциденты ИБ</span>
              <strong>
                {
                  logs.filter(
                    (log) => log.log_type === "SECURITY_INCIDENT"
                  ).length
                }
              </strong>
            </div>
          </StatCard>

          <StatCard>
            <StatIcon success>
              <Icon icon={FiShield} />
            </StatIcon>

            <div>
              <span>Входы и регистрации</span>
              <strong>
                {logs.filter((log) => log.log_type === "AUTH").length}
              </strong>
            </div>
          </StatCard>

          <StatCard>
            <StatIcon>
              <Icon icon={FiUsers} />
            </StatIcon>

            <div>
              <span>[Admin] Пользователи</span>
              <strong>
                {logs.filter((log) => log.log_type === "ADMIN_USER").length}
              </strong>
            </div>
          </StatCard>
        </StatsGrid>

        <Panel>
          <PanelHeader>
            <div>
              <h3>Журнал событий</h3>
              <p>Единая таблица логов системы</p>
            </div>
          </PanelHeader>

          <Tabs>
            <TabButton
              active={activeFilter === "ALL"}
              onClick={() => setActiveFilter("ALL")}
            >
              Все логи
            </TabButton>

            <TabButton
              active={activeFilter === "SECURITY_INCIDENT"}
              onClick={() => setActiveFilter("SECURITY_INCIDENT")}
            >
              Инциденты информационной безопасности
            </TabButton>

            <TabButton
              active={activeFilter === "AUTH"}
              onClick={() => setActiveFilter("AUTH")}
            >
              Входы и регистрации
            </TabButton>

            <TabButton
              active={activeFilter === "ADMIN_USER"}
              onClick={() => setActiveFilter("ADMIN_USER")}
            >
              [Admin] Пользователи
            </TabButton>
          </Tabs>

          {loading && <StateMessage>Загрузка логов...</StateMessage>}

          {!loading && error && <ErrorMessage>{error}</ErrorMessage>}

          {!loading && !error && filteredLogs.length === 0 && (
            <StateMessage>Логи не найдены</StateMessage>
          )}

          {!loading && !error && filteredLogs.length > 0 && (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <th>Тип</th>
                    <th>Действие</th>
                    <th>Инициатор</th>
                    <th>Цель</th>
                    <th>IP</th>
                    <th>Локация</th>
                    <th>Сообщение</th>
                    <th>Дата</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={`${log.log_type}-${log.source_id}`}>
                      <td>
                        <TypeBadge type={log.log_type} action={log.action}>
                          <Icon icon={getLogIcon(log)} size={14} />
                          {getTypeLabel(log.log_type)}
                        </TypeBadge>
                      </td>

                      <td>
                        <ActionText action={log.action}>
                          {getActionLabel(log.action)}
                        </ActionText>

                        {log.severity && <Severity>{log.severity}</Severity>}
                      </td>

                      <td>
                        <CellWithIcon>
                          <Icon icon={FiUser} size={15} />
                          <span>{log.actor || "-"}</span>
                        </CellWithIcon>
                      </td>

                      <td>{log.target || "-"}</td>

                      <td>{log.ip_address || "-"}</td>

                      <td>
                        <CellWithIcon>
                          <Icon icon={FiMapPin} size={15} />
                          <span>{log.location || "-"}</span>
                        </CellWithIcon>
                      </td>

                      <td>
                        <MessageCell title={log.message || ""}>
                          <Icon icon={FiMonitor} size={15} />
                          <span>{log.message || "-"}</span>
                        </MessageCell>
                      </td>

                      <td>{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </Panel>
      </Content>
    </Page>
  );
}

export default AdminLogsPage;

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
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
`;

const HeaderLeft = styled.div``;

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

const RefreshButton = styled.button`
  border: none;
  border-radius: 14px;
  background: #2563eb;
  color: #ffffff;
  padding: 13px 18px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
  align-items: center;
  gap: 16px;

  span {
    color: #667085;
    font-size: 14px;
  }

  strong {
    display: block;
    margin-top: 4px;
    font-size: 30px;
    font-weight: 800;
    color: #101828;
  }
`;

const StatIcon = styled.div<{ success?: boolean; danger?: boolean }>`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: ${({ success, danger }) =>
    success ? "#ecfdf3" : danger ? "#fef3f2" : "#eff6ff"};
  color: ${({ success, danger }) =>
    success ? "#027a48" : danger ? "#b42318" : "#2563eb"};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Panel = styled.div`
  background: #ffffff;
  border-radius: 26px;
  padding: 28px;
  border: 1px solid #e4e7ec;
  box-shadow: 0 12px 28px rgba(16, 24, 40, 0.04);
`;

const PanelHeader = styled.div`
  margin-bottom: 18px;

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

const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 22px;
`;

const TabButton = styled.button<{ active?: boolean }>`
  border: none;
  border-radius: 999px;
  padding: 10px 15px;
  background: ${({ active }) => (active ? "#2563eb" : "#f2f4f7")};
  color: ${({ active }) => (active ? "#ffffff" : "#475467")};
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    background: ${({ active }) => (active ? "#2563eb" : "#e4e7ec")};
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    color: #667085;
    font-size: 13px;
    padding: 14px;
    border-bottom: 1px solid #e4e7ec;
    white-space: nowrap;
  }

  td {
    padding: 16px 14px;
    border-bottom: 1px solid #eef2f6;
    color: #101828;
    font-size: 14px;
    vertical-align: middle;
  }

  tr:hover td {
    background: #f8fafc;
  }
`;

const TypeBadge = styled.div<{
  type: string;
  action?: string;
}>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;

  color: ${({ type, action }) => {
    if (
      action === "FAILED" ||
      action === "FORBIDDEN" ||
      action === "BRUTE_FORCE"
    ) {
      return "#b42318";
    }

    if (type === "SECURITY_INCIDENT") {
      return "#b42318";
    }

    if (type === "ADMIN_USER") {
      return "#6941c6";
    }

    return "#027a48";
  }};

  background: ${({ type, action }) => {
    if (
      action === "FAILED" ||
      action === "FORBIDDEN" ||
      action === "BRUTE_FORCE"
    ) {
      return "#fef3f2";
    }

    if (type === "SECURITY_INCIDENT") {
      return "#fef3f2";
    }

    if (type === "ADMIN_USER") {
      return "#f4f3ff";
    }

    return "#ecfdf3";
  }};
`;

const ActionText = styled.div<{ action?: string }>`
  font-weight: 800;
  white-space: nowrap;

  color: ${({ action }) => {
    if (
      action === "FAILED" ||
      action === "FORBIDDEN" ||
      action === "BRUTE_FORCE"
    ) {
      return "#b42318";
    }

    if (action === "SUCCESS") {
      return "#027a48";
    }

    if (
      action === "USER_CREATED" ||
      action === "USER_UPDATED" ||
      action === "USER_DELETED"
    ) {
      return "#6941c6";
    }

    return "#101828";
  }};
`;

const Severity = styled.div`
  margin-top: 4px;
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 999px;
  background: #fff1f3;
  color: #c01048;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
`;

const CellWithIcon = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 220px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const MessageCell = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 360px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const StateMessage = styled.div`
  padding: 28px;
  text-align: center;
  color: #667085;
`;

const ErrorMessage = styled.div`
  padding: 16px;
  border-radius: 14px;
  background: #fef3f2;
  color: #b42318;
  font-weight: 700;
`;