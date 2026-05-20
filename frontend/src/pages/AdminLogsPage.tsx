import React, { useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiLock,
  FiMapPin,
  FiMonitor,
  FiRefreshCw,
  FiShield,
  FiUnlock,
  FiUser,
  FiUsers,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import AdminSidebar from "../components/admin/AdminSidebar";
import { api } from "../api/api";

const SIDEBAR_WIDTH = 240;
const PERMANENT_BLOCK_SECONDS = 315360000;

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
type IpModalMode = "block" | "unblock";

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

  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [ipModalMode, setIpModalMode] = useState<IpModalMode>("block");
  const [ipAddress, setIpAddress] = useState("");
  const [blockSeconds, setBlockSeconds] = useState(3600);
  const [reason, setReason] = useState("");
  const [modalError, setModalError] = useState("");
  const [processingIp, setProcessingIp] = useState(false);
  const [permanentConfirmed, setPermanentConfirmed] = useState(false);

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

  const openIpModal = (mode: IpModalMode, presetIp?: string | null) => {
    setIpModalMode(mode);
    setIpAddress(presetIp || "");
    setBlockSeconds(3600);
    setReason(
      mode === "block"
        ? "Ручная блокировка IP-адреса через журнал ИБ"
        : "Ручная разблокировка IP-адреса через журнал ИБ"
    );
    setModalError("");
    setPermanentConfirmed(false);
    setIsIpModalOpen(true);
  };

  const closeIpModal = () => {
    if (processingIp) return;

    setIsIpModalOpen(false);
    setIpAddress("");
    setBlockSeconds(3600);
    setReason("");
    setModalError("");
    setPermanentConfirmed(false);
  };

  const handleIpSubmit = async () => {
    if (!user?.id) {
      setModalError("Не удалось определить администратора");
      return;
    }

    if (!ipAddress.trim()) {
      setModalError("Введите IP-адрес");
      return;
    }

    const cleanIpAddress = ipAddress.trim();
    const isPermanentBlock = blockSeconds === PERMANENT_BLOCK_SECONDS;

    if (ipModalMode === "block" && isPermanentBlock && !permanentConfirmed) {
      setModalError("Подтвердите постоянную блокировку IP-адреса");
      return;
    }

    try {
      setProcessingIp(true);
      setModalError("");

      if (ipModalMode === "block") {
        await api.post("/admin/ip-blocks/block", {
          ip_address: cleanIpAddress,
          admin_user_id: user.id,
          block_seconds: blockSeconds,
          reason:
            reason.trim() ||
            (isPermanentBlock
              ? "Постоянная ручная блокировка IP-адреса"
              : "Ручная блокировка IP-адреса"),
        });
      } else {
        await api.post("/admin/ip-blocks/unblock", {
          ip_address: cleanIpAddress,
          admin_user_id: user.id,
          reason: reason.trim() || "Ручная разблокировка IP-адреса",
        });
      }

      await loadLogs();
      closeIpModal();
    } catch {
      setModalError(
        ipModalMode === "block"
          ? "Не удалось заблокировать IP-адрес"
          : "Не удалось разблокировать IP-адрес"
      );
    } finally {
      setProcessingIp(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (activeFilter === "ALL") return logs;
    return logs.filter((log) => log.log_type === activeFilter);
  }, [logs, activeFilter]);

  const securityIncidentIps = useMemo(() => {
    const ips = logs
      .filter((log) => log.log_type === "SECURITY_INCIDENT" && log.ip_address)
      .map((log) => log.ip_address as string);

    return Array.from(new Set(ips)).slice(0, 5);
  }, [logs]);

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("ru-RU");
  };

  const getTypeLabel = (type: string, action?: string) => {
    if (action === "BLOCKED") return "Блокировка входа";
    if (action === "IP_BLOCKED") return "Блокировка IP";
    if (action === "IP_UNBLOCKED") return "Разблокировка IP";
    if (type === "AUTH") return "Вход/регистрация";
    if (type === "ADMIN_USER") return "[Admin] Пользователи";
    if (type === "SECURITY_INCIDENT") return "Инцидент ИБ";
    return type;
  };

  const getActionLabel = (action: string) => {
    if (action === "SUCCESS") return "Успешный вход";
    if (action === "FAILED") return "Ошибка входа";
    if (action === "FORBIDDEN") return "Запрещено";
    if (action === "BLOCKED") return "IP заблокирован системой";
    if (action === "IP_BLOCKED") return "IP заблокирован администратором";
    if (action === "IP_UNBLOCKED") return "IP разблокирован администратором";
    if (action === "USER_CREATED") return "Создание пользователя";
    if (action === "USER_UPDATED") return "Редактирование пользователя";
    if (action === "USER_DELETED") return "Удаление пользователя";
    if (action === "BRUTE_FORCE" || action === "BRUTE_FORCE_ATTEMPT") {
      return "Brute Force атака";
    }

    return action;
  };

  const getLogIcon = (log: UnifiedLog) => {
    if (log.log_type === "SECURITY_INCIDENT") return FiAlertTriangle;
    if (log.log_type === "ADMIN_USER") return FiUsers;
    if (log.action === "SUCCESS") return FiCheckCircle;
    if (
      log.action === "FAILED" ||
      log.action === "FORBIDDEN" ||
      log.action === "BLOCKED" ||
      log.action === "IP_BLOCKED" ||
      log.action === "BRUTE_FORCE" ||
      log.action === "BRUTE_FORCE_ATTEMPT"
    ) {
      return FiXCircle;
    }

    return FiActivity;
  };

  const isPermanentBlock = blockSeconds === PERMANENT_BLOCK_SECONDS;

  return (
    <Page>
      <AdminSidebar user={user} onLogout={handleLogout} />

      <Content>
        <ContentInner>
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
                    logs.filter((log) => log.log_type === "SECURITY_INCIDENT")
                      .length
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

            {activeFilter === "SECURITY_INCIDENT" && (
              <SecurityTools>
                <SecurityToolsLeft>
                  <SecurityToolsIcon>
                    <Icon icon={FiShield} />
                  </SecurityToolsIcon>

                  <div>
                    <SecurityToolsTitle>
                      Управление IP-адресами
                    </SecurityToolsTitle>

                    <SecurityToolsText>
                      Здесь можно вручную заблокировать или разблокировать
                      IP-адрес. Все действия сохраняются в audit_logs.
                    </SecurityToolsText>

                    {securityIncidentIps.length > 0 && (
                      <IpSuggestions>
                        {securityIncidentIps.map((ip) => (
                          <IpSuggestionButton
                            key={ip}
                            onClick={() => openIpModal("block", ip)}
                          >
                            {ip}
                          </IpSuggestionButton>
                        ))}
                      </IpSuggestions>
                    )}
                  </div>
                </SecurityToolsLeft>

                <SecurityToolsActions>
                  <SecurityToolsButton onClick={() => openIpModal("block")}>
                    <Icon icon={FiLock} size={15} />
                    Заблокировать IP
                  </SecurityToolsButton>

                  <UnblockToolsButton onClick={() => openIpModal("unblock")}>
                    <Icon icon={FiUnlock} size={15} />
                    Разблокировать IP
                  </UnblockToolsButton>
                </SecurityToolsActions>
              </SecurityTools>
            )}

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
                            {getTypeLabel(log.log_type, log.action)}
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

                        <td>
                          <IpText>{log.ip_address || "-"}</IpText>
                        </td>

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
        </ContentInner>
      </Content>

      {isIpModalOpen && (
        <ModalOverlay onMouseDown={closeIpModal}>
          <ModalCard onMouseDown={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <ModalTitle>
                  {ipModalMode === "block"
                    ? "Заблокировать IP-адрес"
                    : "Разблокировать IP-адрес"}
                </ModalTitle>

                <ModalSubtitle>
                  {ipModalMode === "block"
                    ? "IP будет заблокирован на выбранный срок, а действие администратора попадёт в audit_logs."
                    : "IP будет разблокирован, а действие администратора попадёт в audit_logs."}
                </ModalSubtitle>
              </div>

              <CloseButton onClick={closeIpModal}>
                <Icon icon={FiX} size={20} />
              </CloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>IP-адрес</Label>
              <Input
                value={ipAddress}
                onChange={(event) => setIpAddress(event.target.value)}
                placeholder="Например: 127.0.0.1"
              />
            </FormGroup>

            {ipModalMode === "block" && (
              <FormGroup>
                <Label>Время блокировки</Label>

                <Select
                  value={blockSeconds}
                  onChange={(event) => {
                    setBlockSeconds(Number(event.target.value));
                    setPermanentConfirmed(false);
                    setModalError("");
                  }}
                >
                  <option value={900}>15 минут</option>
                  <option value={1800}>30 минут</option>
                  <option value={3600}>1 час</option>
                  <option value={10800}>3 часа</option>
                  <option value={86400}>24 часа</option>
                  <option value={PERMANENT_BLOCK_SECONDS}>Навсегда</option>
                </Select>
              </FormGroup>
            )}

            {ipModalMode === "block" && isPermanentBlock && (
              <WarningBox>
                <WarningHeader>
                  <Icon icon={FiAlertTriangle} size={18} />
                  Постоянная блокировка
                </WarningHeader>

                <WarningText>
                  IP-адрес будет заблокирован навсегда, пока администратор
                  вручную не выполнит разблокировку.
                </WarningText>

                <CheckboxLabel>
                  <input
                    type="checkbox"
                    checked={permanentConfirmed}
                    onChange={(event) =>
                      setPermanentConfirmed(event.target.checked)
                    }
                  />
                  Я понимаю последствия и подтверждаю постоянную блокировку.
                </CheckboxLabel>
              </WarningBox>
            )}

            <FormGroup>
              <Label>Причина</Label>

              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  ipModalMode === "block"
                    ? "Например: подозрительная активность или brute-force атака"
                    : "Например: IP проверен, блокировка снята администратором"
                }
              />
            </FormGroup>

            {modalError && <ModalError>{modalError}</ModalError>}

            <ModalActions>
              <CancelButton onClick={closeIpModal} disabled={processingIp}>
                Отмена
              </CancelButton>

              <ConfirmButton
                danger={ipModalMode === "block"}
                onClick={handleIpSubmit}
                disabled={processingIp}
              >
                {processingIp
                  ? "Выполняем..."
                  : ipModalMode === "block"
                  ? "Заблокировать"
                  : "Разблокировать"}
              </ConfirmButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Page>
  );
}

export default AdminLogsPage;

const Page = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  overflow-x: hidden;
`;

const Content = styled.main`
  margin-left: ${SIDEBAR_WIDTH}px;
  width: calc(100vw - ${SIDEBAR_WIDTH}px);
  min-height: 100vh;
  padding: 40px;
  overflow-x: hidden;
`;

const ContentInner = styled.div`
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 28px;
`;

const HeaderLeft = styled.div`
  min-width: 0;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 38px;
  font-weight: 900;
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
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
`;

const StatsGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 26px;
`;

const StatCard = styled.div`
  min-width: 0;
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #e4e7ec;
  box-shadow: 0 12px 28px rgba(16, 24, 40, 0.04);
  display: flex;
  align-items: center;
  gap: 16px;

  span {
    display: block;
    color: #667085;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  strong {
    display: block;
    margin-top: 4px;
    font-size: 30px;
    font-weight: 900;
    color: #101828;
  }
`;

const StatIcon = styled.div<{ success?: boolean; danger?: boolean }>`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  flex-shrink: 0;
  background: ${({ success, danger }) =>
    success ? "#ecfdf3" : danger ? "#fef3f2" : "#eff6ff"};
  color: ${({ success, danger }) =>
    success ? "#027a48" : danger ? "#b42318" : "#2563eb"};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 100%;
  overflow: hidden;
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
    font-weight: 900;
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
  font-weight: 900;
  cursor: pointer;
`;

const SecurityTools = styled.div`
  margin-bottom: 22px;
  padding: 18px;
  border-radius: 20px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
`;

const SecurityToolsLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
`;

const SecurityToolsIcon = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: #ffedd5;
  color: #c2410c;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const SecurityToolsTitle = styled.div`
  font-size: 16px;
  font-weight: 900;
  color: #9a3412;
`;

const SecurityToolsText = styled.div`
  margin-top: 4px;
  font-size: 13px;
  color: #9a3412;
  line-height: 1.5;
`;

const SecurityToolsActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
`;

const SecurityToolsButton = styled.button`
  border: none;
  border-radius: 14px;
  background: #dc2626;
  color: #ffffff;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const UnblockToolsButton = styled.button`
  border: none;
  border-radius: 14px;
  background: #2563eb;
  color: #ffffff;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const IpSuggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const IpSuggestionButton = styled.button`
  border: 1px solid #fdba74;
  background: #ffffff;
  color: #c2410c;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
`;

const TableWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 16px;
`;

const Table = styled.table`
  min-width: 1320px;
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

const TypeBadge = styled.div<{ type: string; action?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;

  color: ${({ type, action }) => {
    if (action === "BLOCKED" || action === "IP_BLOCKED") return "#c4320a";
    if (action === "IP_UNBLOCKED") return "#175cd3";
    if (
      action === "FAILED" ||
      action === "FORBIDDEN" ||
      action === "BRUTE_FORCE" ||
      action === "BRUTE_FORCE_ATTEMPT" ||
      type === "SECURITY_INCIDENT"
    ) {
      return "#b42318";
    }
    if (type === "ADMIN_USER") return "#6941c6";
    return "#027a48";
  }};

  background: ${({ type, action }) => {
    if (action === "BLOCKED" || action === "IP_BLOCKED") return "#fff4ed";
    if (action === "IP_UNBLOCKED") return "#eff8ff";
    if (
      action === "FAILED" ||
      action === "FORBIDDEN" ||
      action === "BRUTE_FORCE" ||
      action === "BRUTE_FORCE_ATTEMPT" ||
      type === "SECURITY_INCIDENT"
    ) {
      return "#fef3f2";
    }
    if (type === "ADMIN_USER") return "#f4f3ff";
    return "#ecfdf3";
  }};
`;

const ActionText = styled.div<{ action?: string }>`
  font-weight: 900;
  white-space: nowrap;

  color: ${({ action }) => {
    if (action === "BLOCKED" || action === "IP_BLOCKED") return "#c4320a";
    if (action === "IP_UNBLOCKED") return "#175cd3";
    if (
      action === "FAILED" ||
      action === "FORBIDDEN" ||
      action === "BRUTE_FORCE" ||
      action === "BRUTE_FORCE_ATTEMPT"
    ) {
      return "#b42318";
    }
    if (action === "SUCCESS") return "#027a48";
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
  font-weight: 900;
  text-transform: uppercase;
`;

const CellWithIcon = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 230px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const IpText = styled.span`
  font-weight: 800;
  color: #101828;
  white-space: nowrap;
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
  font-weight: 800;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(16, 24, 40, 0.55);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const ModalCard = styled.div`
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 24px 70px rgba(16, 24, 40, 0.25);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: #101828;
`;

const ModalSubtitle = styled.p`
  margin: 8px 0 0;
  color: #667085;
  font-size: 14px;
  line-height: 1.5;
`;

const CloseButton = styled.button`
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 12px;
  background: #f2f4f7;
  color: #475467;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 7px;
  color: #344054;
  font-size: 13px;
  font-weight: 900;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #d0d5dd;
  border-radius: 14px;
  padding: 13px 14px;
  font-size: 14px;
  outline: none;
`;

const Select = styled.select`
  width: 100%;
  border: 1px solid #d0d5dd;
  border-radius: 14px;
  padding: 13px 14px;
  font-size: 14px;
  background: #ffffff;
  outline: none;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 90px;
  resize: vertical;
  border: 1px solid #d0d5dd;
  border-radius: 14px;
  padding: 13px 14px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
`;

const WarningBox = styled.div`
  margin-bottom: 16px;
  padding: 14px;
  border-radius: 16px;
  background: #fff4ed;
  border: 1px solid #fed7aa;
`;

const WarningHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c2410c;
  font-size: 14px;
  font-weight: 900;
`;

const WarningText = styled.p`
  margin: 8px 0 12px;
  color: #9a3412;
  font-size: 13px;
  line-height: 1.5;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #7c2d12;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;

  input {
    margin-top: 2px;
  }
`;

const ModalError = styled.div`
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fef3f2;
  color: #b42318;
  font-size: 13px;
  font-weight: 900;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
`;

const CancelButton = styled.button`
  border: none;
  border-radius: 14px;
  background: #f2f4f7;
  color: #344054;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
`;

const ConfirmButton = styled.button<{ danger?: boolean }>`
  border: none;
  border-radius: 14px;
  background: ${({ danger }) => (danger ? "#dc2626" : "#2563eb")};
  color: #ffffff;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;