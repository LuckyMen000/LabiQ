import { ChangeEvent, useRef, useState } from "react";
import styled from "@emotion/styled";
import { Helmet } from "react-helmet-async";
import Header from "../components/Header";
import {
  FiUser,
  FiMail,
  FiShield,
  FiCalendar,
  FiHash,
  FiCheckCircle,
  FiUpload,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";

type User = {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
  is_active?: boolean;
  avatar_url?: string | null;
  created_at?: string;
};

const API_URL = "http://localhost:8000";

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "admin":
      return "Администратор";
    case "registrar":
      return "Регистратор";
    case "laboratory_technician":
      return "Лаборант";
    default:
      return role || "Не указана";
  }
};

const ProfilePage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const savedUser = localStorage.getItem("user");
  const parsedUser: User | null = savedUser ? JSON.parse(savedUser) : null;

  const [user, setUser] = useState<User | null>(parsedUser);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const pageTitle = user?.full_name
    ? `Профиль: ${user.full_name} | LabIQ`
    : "Профиль | LabIQ";

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const avatarSrc = user?.avatar_url ? `${API_URL}${user.avatar_url}` : null;

  const updateLocalUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleUploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("Ошибка авторизации. Войдите в систему заново.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/users/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Ошибка загрузки аватарки");
      }

      updateLocalUser(data);
      setMessage("Аватарка успешно обновлена");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleDeleteAvatar = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setMessage("Ошибка авторизации. Войдите в систему заново.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/users/me/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Ошибка удаления аватарки");
      }

      updateLocalUser(data);
      setMessage("Аватарка удалена");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка удаления");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <Header />

      <Main>
        <TitleBlock>
          <h1>Профиль пользователя</h1>
          <p>Основная информация о текущем пользователе системы LabIQ.</p>
        </TitleBlock>

        <ProfileCard>
          <AvatarWrapper>
            <Avatar>
              {avatarSrc ? (
                <AvatarImage src={avatarSrc} alt="User avatar" />
              ) : (
                initials
              )}
            </Avatar>

            <AvatarActions>
              <AvatarButton onClick={handleChooseFile} disabled={loading}>
                {user?.avatar_url ? <FiEdit2 /> : <FiUpload />}
                {user?.avatar_url ? "Изменить" : "Загрузить"}
              </AvatarButton>

              {user?.avatar_url && (
                <AvatarDeleteButton onClick={handleDeleteAvatar} disabled={loading}>
                  <FiTrash2 />
                  Удалить
                </AvatarDeleteButton>
              )}
            </AvatarActions>

            <HiddenInput
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleUploadAvatar}
            />
          </AvatarWrapper>

          <UserInfo>
            <h2>{user?.full_name || "Пользователь"}</h2>
            <p>{user?.email || "Email не указан"}</p>

            {message && <Message>{message}</Message>}
          </UserInfo>

          <StatusBadge active={user?.is_active !== false}>
            <FiCheckCircle />
            {user?.is_active === false ? "Неактивен" : "Активен"}
          </StatusBadge>
        </ProfileCard>

        <InfoGrid>
          <InfoItem>
            <IconBox>
              <FiHash />
            </IconBox>
            <div>
              <span>ID пользователя</span>
              <strong>{user?.id || "—"}</strong>
            </div>
          </InfoItem>

          <InfoItem>
            <IconBox>
              <FiUser />
            </IconBox>
            <div>
              <span>Логин</span>
              <strong>{user?.username || "—"}</strong>
            </div>
          </InfoItem>

          <InfoItem>
            <IconBox>
              <FiMail />
            </IconBox>
            <div>
              <span>Email</span>
              <strong>{user?.email || "—"}</strong>
            </div>
          </InfoItem>

          <InfoItem>
            <IconBox>
              <FiShield />
            </IconBox>
            <div>
              <span>Роль в системе</span>
              <strong>{getRoleLabel(user?.role)}</strong>
            </div>
          </InfoItem>

          <InfoItem>
            <IconBox>
              <FiCalendar />
            </IconBox>
            <div>
              <span>Дата регистрации</span>
              <strong>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("ru-RU")
                  : "—"}
              </strong>
            </div>
          </InfoItem>
        </InfoGrid>
      </Main>
    </Page>
  );
};

export default ProfilePage;

const Page = styled.div`
  min-height: 100vh;
  background: #f6f8fb;
`;

const Main = styled.main`
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 24px 56px;
`;

const TitleBlock = styled.div`
  margin-bottom: 24px;

  h1 {
    margin: 0 0 8px;
    font-size: 32px;
    color: #111827;
  }

  p {
    margin: 0;
    font-size: 15px;
    color: #64748b;
  }
`;

const ProfileCard = styled.section`
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  border-radius: 28px;
  padding: 36px;
  display: flex;
  align-items: center;
  gap: 22px;
  color: #ffffff;
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.18);
  margin-bottom: 24px;
`;

const AvatarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 88px;
  height: 88px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
  overflow: hidden;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarActions = styled.div`
  display: flex;
  gap: 8px;
`;

const AvatarButton = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: rgba(255, 255, 255, 0.24);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AvatarDeleteButton = styled(AvatarButton)`
  background: rgba(239, 68, 68, 0.25);

  &:hover {
    background: rgba(239, 68, 68, 0.35);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const UserInfo = styled.div`
  flex: 1;

  h2 {
    margin: 0 0 8px;
    font-size: 28px;
  }

  p {
    margin: 0;
    color: #dbeafe;
    font-size: 15px;
  }
`;

const Message = styled.div`
  margin-top: 12px;
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 13px;
  font-weight: 500;
`;

const StatusBadge = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ active }) =>
    active ? "rgba(34, 197, 94, 0.18)" : "rgba(239, 68, 68, 0.18)"};
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
`;

const InfoGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
`;

const InfoItem = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);

  span {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    color: #64748b;
  }

  strong {
    font-size: 16px;
    color: #111827;
  }
`;

const IconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;