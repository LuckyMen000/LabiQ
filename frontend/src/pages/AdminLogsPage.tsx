import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiCheckCircle,
  FiMapPin,
  FiMonitor,
  FiRefreshCw,
  FiShield,
  FiUser,
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

type AuthLog = {
  id: number;
  user_id: number | null;
  ip_address: string | null;
  username_or_email: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  user_agent: string | null;
  status: string;
  message: string | null;
  created_at: string;
};

type AdminLogsPageProps = {
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

function AdminLogsPage({ user, onLogout }: AdminLogsPageProps) {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<AuthLog[]>([]);
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

    const response = await api.get<AuthLog[]>("/admin/logs");      
    setLogs(response.data);
    } catch {
      setError("Не удалось загрузить логи авторизации");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("ru-RU");
  };

  const getStatusLabel = (status: string) => {
    if (status === "SUCCESS") return "Успешно";
    if (status === "FAILED") return "Ошибка";
    if (status === "FORBIDDEN") return "Запрещено";
    return status;
  };

  const getLocation = (log: AuthLog) => {
    return [log.country, log.region, log.city].filter(Boolean).join(", ") || "-";
  };

  return (
    <Page>
      <AdminSidebar user={user} onLogout={handleLogout} />

      <Content>
        <Header>
          <HeaderLeft>
            <Title>Логи входа</Title>
            <Subtitle>
              История авторизаций, ошибок входа и заблокированных попыток
            </Subtitle>
          </HeaderLeft>

          <RefreshButton onClick={loadLogs}>
            <Icon icon={FiRefreshCw} />
            Обновить
          </RefreshButton>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatIcon success>
              <Icon icon={FiCheckCircle} />
            </StatIcon>
            <div>
              <span>Успешные входы</span>
              <strong>{logs.filter((log) => log.status === "SUCCESS").length}</strong>
            </div>
          </StatCard>

          <StatCard>
            <StatIcon danger>
              <Icon icon={FiXCircle} />
            </StatIcon>
            <div>
              <span>Ошибки входа</span>
              <strong>{logs.filter((log) => log.status === "FAILED").length}</strong>
            </div>
          </StatCard>

          <StatCard>
            <StatIcon>
              <Icon icon={FiShield} />
            </StatIcon>
            <div>
              <span>Запрещено</span>
              <strong>{logs.filter((log) => log.status === "FORBIDDEN").length}</strong>
            </div>
          </StatCard>

          <StatCard>
            <StatIcon>
              <Icon icon={FiActivity} />
            </StatIcon>
            <div>
              <span>Всего записей</span>
              <strong>{logs.length}</strong>
            </div>
          </StatCard>
        </StatsGrid>

        <Panel>
          <PanelHeader>
            <div>
              <h3>Журнал авторизации</h3>
              <p>Последние 100 записей</p>
            </div>
          </PanelHeader>

          {loading && <StateMessage>Загрузка логов...</StateMessage>}

          {!loading && error && <ErrorMessage>{error}</ErrorMessage>}

          {!loading && !error && logs.length === 0 && (
            <StateMessage>Логи пока отсутствуют</StateMessage>
          )}

          {!loading && !error && logs.length > 0 && (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <th>Статус</th>
                    <th>Пользователь</th>
                    <th>IP</th>
                    <th>Локация</th>
                    <th>Сообщение</th>
                    <th>Дата</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <StatusBadge status={log.status}>
                          <Icon
                            icon={log.status === "SUCCESS" ? FiCheckCircle : FiXCircle}
                            size={14}
                          />
                          {getStatusLabel(log.status)}
                        </StatusBadge>
                      </td>

                      <td>
                        <CellWithIcon>
                          <Icon icon={FiUser} size={15} />
                          <span>{log.username_or_email || "-"}</span>
                        </CellWithIcon>
                      </td>

                      <td>{log.ip_address || "-"}</td>

                      <td>
                        <CellWithIcon>
                          <Icon icon={FiMapPin} size={15} />
                          <span>{getLocation(log)}</span>
                        </CellWithIcon>
                      </td>

                      <td>
                        <MessageCell>
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

const StatusBadge = styled.div<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: ${({ status }) => (status === "SUCCESS" ? "#027a48" : "#b42318")};
  background: ${({ status }) => (status === "SUCCESS" ? "#ecfdf3" : "#fef3f2")};
`;

const CellWithIcon = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const MessageCell = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 340px;

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