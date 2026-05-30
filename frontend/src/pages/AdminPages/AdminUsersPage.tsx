import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import {
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUser,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";

import AdminSidebar from "../../components/admin/AdminSidebar";
import { api } from "../../api/api";

const SIDEBAR_WIDTH = 240;

type User = {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
};

type AdminUsersPageProps = {
  user: User | null;
  onLogout: () => void;
};

type UserForm = {
  full_name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  is_active: boolean;
};

type IconProps = {
  icon: unknown;
  size?: number;
};

function Icon({ icon, size = 18 }: IconProps) {
  const Component = icon as React.ComponentType<{ size?: number }>;
  return React.createElement(Component, { size });
}

const initialForm: UserForm = {
  full_name: "",
  email: "",
  username: "",
  password: "",
  role: "Лаборант",
  is_active: true,
};

function AdminUsersPage({ user, onLogout }: AdminUsersPageProps) {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(initialForm);
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<User[]>("/admin/users");
      setUsers(response.data);
    } catch {
      setError("Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (selectedUser: User) => {
    setEditingUser(selectedUser);
    setForm({
      full_name: selectedUser.full_name,
      email: selectedUser.email,
      username: selectedUser.username,
      password: "",
      role: selectedUser.role,
      is_active: selectedUser.is_active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingUser(null);
    setForm(initialForm);
  };

  const handleChange = (
    field: keyof UserForm,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      if (editingUser) {
        const payload: Partial<UserForm> = {
          full_name: form.full_name,
          email: form.email,
          username: form.username,
          role: form.role,
          is_active: form.is_active,
        };

        if (form.password.trim()) {
          payload.password = form.password;
        }

        await api.put(`/admin/users/${editingUser.id}`, payload);
      } else {
        await api.post("/admin/users", form);
      }

      closeModal();
      await loadUsers();
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Не удалось сохранить пользователя";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (selectedUser: User) => {
    const confirmed = window.confirm(
      `Удалить пользователя "${selectedUser.full_name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await api.delete(`/admin/users/${selectedUser.id}`);
      await loadUsers();
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Не удалось удалить пользователя";

      setError(message);
    }
  };

  const filteredUsers = users.filter((item) => {
    const query = search.toLowerCase();

    return (
      item.full_name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.username.toLowerCase().includes(query) ||
      item.role.toLowerCase().includes(query)
    );
  });

  const activeCount = users.filter((item) => item.is_active).length;
  const inactiveCount = users.filter((item) => !item.is_active).length;

  return (
    <Page>
      <AdminSidebar user={user} onLogout={handleLogout} />

      <Content>
        <Header>
          <HeaderLeft>
            <Title>Пользователи</Title>
            <Subtitle>
              Создание, редактирование, удаление и управление ролями
            </Subtitle>
          </HeaderLeft>

          <HeaderActions>
            <RefreshButton onClick={loadUsers}>
              <Icon icon={FiRefreshCw} />
              Обновить
            </RefreshButton>

            <CreateButton onClick={openCreateModal}>
              <Icon icon={FiPlus} />
              Создать пользователя
            </CreateButton>
          </HeaderActions>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatIcon>
              <Icon icon={FiUser} />
            </StatIcon>

            <div>
              <span>Всего пользователей</span>
              <strong>{users.length}</strong>
            </div>
          </StatCard>

          <StatCard>
            <StatIcon success>
              <Icon icon={FiUserCheck} />
            </StatIcon>

            <div>
              <span>Активные</span>
              <strong>{activeCount}</strong>
            </div>
          </StatCard>

          <StatCard>
            <StatIcon danger>
              <Icon icon={FiUserX} />
            </StatIcon>

            <div>
              <span>Неактивные</span>
              <strong>{inactiveCount}</strong>
            </div>
          </StatCard>
        </StatsGrid>

        <Panel>
          <PanelHeader>
            <div>
              <h3>Список пользователей</h3>
              <p>Все зарегистрированные аккаунты LabIQ</p>
            </div>

            <SearchBox>
              <Icon icon={FiSearch} size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по имени, email, username или роли"
              />
            </SearchBox>
          </PanelHeader>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {loading && <StateMessage>Загрузка пользователей...</StateMessage>}

          {!loading && filteredUsers.length === 0 && (
            <StateMessage>Пользователи не найдены</StateMessage>
          )}

          {!loading && filteredUsers.length > 0 && (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Пользователь</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Роль</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>

                      <td>
                        <UserCell>
                          <Avatar>{item.full_name.charAt(0)}</Avatar>
                          <strong>{item.full_name}</strong>
                        </UserCell>
                      </td>

                      <td>{item.email}</td>
                      <td>{item.username}</td>

                      <td>
                        <RoleBadge>{item.role}</RoleBadge>
                      </td>

                      <td>
                        <StatusBadge active={item.is_active}>
                          {item.is_active ? "Активен" : "Отключён"}
                        </StatusBadge>
                      </td>

                      <td>
                        <ActionsCell>
                          <IconButton onClick={() => openEditModal(item)}>
                            <Icon icon={FiEdit2} size={16} />
                          </IconButton>

                          <DangerIconButton
                            onClick={() => handleDelete(item)}
                            disabled={item.id === user?.id}
                            title={
                              item.id === user?.id
                                ? "Нельзя удалить самого себя"
                                : "Удалить"
                            }
                          >
                            <Icon icon={FiTrash2} size={16} />
                          </DangerIconButton>
                        </ActionsCell>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </Panel>
      </Content>

      {modalOpen && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <div>
                <h3>
                  {editingUser
                    ? "Редактировать пользователя"
                    : "Создать пользователя"}
                </h3>

                <p>
                  {editingUser
                    ? "Измените данные аккаунта"
                    : "Заполните данные нового пользователя"}
                </p>
              </div>

              <CloseButton onClick={closeModal}>
                <Icon icon={FiX} />
              </CloseButton>
            </ModalHeader>

            <FormGrid>
              <Field>
                <label>ФИО</label>
                <input
                  value={form.full_name}
                  onChange={(event) =>
                    handleChange("full_name", event.target.value)
                  }
                  placeholder="Введите ФИО"
                />
              </Field>

              <Field>
                <label>Email</label>
                <input
                  value={form.email}
                  onChange={(event) =>
                    handleChange("email", event.target.value)
                  }
                  placeholder="user@example.com"
                />
              </Field>

              <Field>
                <label>Username</label>
                <input
                  value={form.username}
                  onChange={(event) =>
                    handleChange("username", event.target.value)
                  }
                  placeholder="username"
                />
              </Field>

              <Field>
                <label>
                  {editingUser
                    ? "Новый пароль, если нужно"
                    : "Пароль"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    handleChange("password", event.target.value)
                  }
                  placeholder="Минимум 6 символов"
                />
              </Field>

              <Field>
                <label>Роль</label>
                <select
                  value={form.role}
                  onChange={(event) =>
                    handleChange("role", event.target.value)
                  }
                >
                  <option value="Лаборант">Лаборант</option>
                  <option value="Старший лаборант">Старший лаборант</option>
                  <option value="Руководитель лаборатории">
                    Руководитель лаборатории
                  </option>
                  <option value="Администратор">Администратор</option>
                </select>
              </Field>

              <CheckboxField>
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    handleChange("is_active", event.target.checked)
                  }
                />

                <label htmlFor="is_active">Пользователь активен</label>
              </CheckboxField>
            </FormGrid>

            <ModalFooter>
              <CancelButton onClick={closeModal}>
                Отмена
              </CancelButton>

              <SaveButton onClick={handleSave} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </SaveButton>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
    </Page>
  );
}

export default AdminUsersPage;

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

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const RefreshButton = styled.button`
  border: none;
  border-radius: 14px;
  background: #ffffff;
  color: #344054;
  padding: 13px 18px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  border: 1px solid #e4e7ec;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const CreateButton = styled.button`
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
  grid-template-columns: repeat(3, minmax(220px, 1fr));
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
  display: flex;
  justify-content: space-between;
  gap: 20px;
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

const SearchBox = styled.div`
  width: 360px;
  height: 44px;
  border: 1px solid #e4e7ec;
  border-radius: 14px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #667085;
  background: #ffffff;

  input {
    border: none;
    outline: none;
    flex: 1;
    font-size: 14px;
    color: #101828;
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

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  strong {
    font-size: 14px;
  }
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
`;

const RoleBadge = styled.span`
  display: inline-flex;
  padding: 7px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
`;

const StatusBadge = styled.span<{ active: boolean }>`
  display: inline-flex;
  padding: 7px 10px;
  border-radius: 999px;
  background: ${({ active }) => (active ? "#ecfdf3" : "#fef3f2")};
  color: ${({ active }) => (active ? "#027a48" : "#b42318")};
  font-size: 12px;
  font-weight: 800;
`;

const ActionsCell = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: #eff6ff;
  color: #2563eb;
  cursor: pointer;
`;

const DangerIconButton = styled(IconButton)`
  background: #fef3f2;
  color: #b42318;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const StateMessage = styled.div`
  padding: 28px;
  text-align: center;
  color: #667085;
`;

const ErrorMessage = styled.div`
  margin-bottom: 18px;
  padding: 16px;
  border-radius: 14px;
  background: #fef3f2;
  color: #b42318;
  font-weight: 700;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(16, 24, 40, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 100;
`;

const Modal = styled.div`
  width: 620px;
  max-width: 100%;
  background: #ffffff;
  border-radius: 26px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(16, 24, 40, 0.22);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 20px;
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

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: #f2f4f7;
  color: #475467;
  cursor: pointer;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 13px;
    font-weight: 800;
    color: #344054;
  }

  input,
  select {
    height: 44px;
    border: 1px solid #d0d5dd;
    border-radius: 14px;
    padding: 0 14px;
    outline: none;
    font-size: 14px;
    color: #101828;
    background: #ffffff;
  }

  input:focus,
  select:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
`;

const CheckboxField = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;

  input {
    width: 18px;
    height: 18px;
  }

  label {
    font-size: 14px;
    font-weight: 700;
    color: #344054;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 26px;
`;

const CancelButton = styled.button`
  border: none;
  border-radius: 14px;
  background: #f2f4f7;
  color: #344054;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
`;

const SaveButton = styled.button`
  border: none;
  border-radius: 14px;
  background: #2563eb;
  color: #ffffff;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;