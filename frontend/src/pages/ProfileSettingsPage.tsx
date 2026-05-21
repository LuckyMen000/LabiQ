import { ChangeEvent, FormEvent, useRef, useState } from "react";
import styled from "@emotion/styled";
import { Helmet } from "react-helmet-async";
import Header from "../components/Header";
import {
  FiAtSign,
  FiEdit2,
  FiLock,
  FiMail,
  FiSave,
  FiTrash2,
  FiUpload,
  FiUser,
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

const ProfileSettingsPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const savedUser = localStorage.getItem("user");
  const parsedUser: User | null = savedUser ? JSON.parse(savedUser) : null;

  const [user, setUser] = useState<User | null>(parsedUser);

  const [fullName, setFullName] = useState(parsedUser?.full_name || "");
  const [email, setEmail] = useState(parsedUser?.email || "");
  const [username, setUsername] = useState(parsedUser?.username || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [avatarMessage, setAvatarMessage] = useState("");

  const token = localStorage.getItem("access_token");

  const avatarSrc = user?.avatar_url ? `${API_URL}${user.avatar_url}` : null;

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const updateLocalUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      setProfileMessage("Ошибка авторизации. Войдите в систему заново.");
      return;
    }

    try {
      setProfileLoading(true);
      setProfileMessage("");

      const response = await fetch(`${API_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Ошибка обновления профиля");
      }

      updateLocalUser(data);
      setProfileMessage("Данные профиля успешно обновлены");
    } catch (error) {
      setProfileMessage(
        error instanceof Error ? error.message : "Ошибка обновления профиля"
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      setPasswordMessage("Ошибка авторизации. Войдите в систему заново.");
      return;
    }

    if (newPassword !== repeatPassword) {
      setPasswordMessage("Новый пароль и повтор пароля не совпадают");
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMessage("");

      const response = await fetch(`${API_URL}/users/me/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Ошибка смены пароля");
      }

      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");

      setPasswordMessage(data.message || "Пароль успешно обновлен");
    } catch (error) {
      setPasswordMessage(
        error instanceof Error ? error.message : "Ошибка смены пароля"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChooseAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleUploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!token) {
      setAvatarMessage("Ошибка авторизации. Войдите в систему заново.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setAvatarLoading(true);
      setAvatarMessage("");

      const response = await fetch(`${API_URL}/users/me/avatar`, {
        method: user?.avatar_url ? "PUT" : "POST",
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
      setAvatarMessage("Аватарка успешно обновлена");
    } catch (error) {
      setAvatarMessage(
        error instanceof Error ? error.message : "Ошибка загрузки аватарки"
      );
    } finally {
      setAvatarLoading(false);
      event.target.value = "";
    }
  };

  const handleDeleteAvatar = async () => {
    if (!token) {
      setAvatarMessage("Ошибка авторизации. Войдите в систему заново.");
      return;
    }

    try {
      setAvatarLoading(true);
      setAvatarMessage("");

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
      setAvatarMessage("Аватарка удалена");
    } catch (error) {
      setAvatarMessage(
        error instanceof Error ? error.message : "Ошибка удаления аватарки"
      );
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <Page>
      <Helmet>
        <title>Настройки профиля | LabIQ</title>
      </Helmet>

      <Header />

      <Main>
        <TitleBlock>
          <h1>Настройки профиля</h1>
          <p>
            Редактирование персональных данных, пароля и аватарки пользователя.
          </p>
        </TitleBlock>

        <SettingsGrid>
          <LeftColumn>
            <Card>
              <CardHeader>
                <IconBox>
                  <FiUser />
                </IconBox>

                <div>
                  <h2>Персональные данные</h2>
                  <p>ФИО, email и логин пользователя.</p>
                </div>
              </CardHeader>

              <Form onSubmit={handleProfileSubmit}>
                <FieldGroup>
                  <Label>ФИО</Label>
                  <InputWrapper>
                    <FiUser />
                    <Input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Введите ФИО"
                    />
                  </InputWrapper>
                </FieldGroup>

                <FieldGroup>
                  <Label>Email</Label>
                  <InputWrapper>
                    <FiMail />
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Введите email"
                    />
                  </InputWrapper>
                </FieldGroup>

                <FieldGroup>
                  <Label>Логин</Label>
                  <InputWrapper>
                    <FiAtSign />
                    <Input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Введите логин"
                    />
                  </InputWrapper>
                </FieldGroup>

                {profileMessage && <Message>{profileMessage}</Message>}

                <PrimaryButton type="submit" disabled={profileLoading}>
                  <FiSave />
                  {profileLoading ? "Сохранение..." : "Сохранить изменения"}
                </PrimaryButton>
              </Form>
            </Card>

            <Card>
              <CardHeader>
                <IconBox>
                  <FiLock />
                </IconBox>

                <div>
                  <h2>Смена пароля</h2>
                  <p>Обновление пароля текущего аккаунта.</p>
                </div>
              </CardHeader>

              <Form onSubmit={handlePasswordSubmit}>
                <FieldGroup>
                  <Label>Текущий пароль</Label>
                  <InputWrapper>
                    <FiLock />
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      placeholder="Введите текущий пароль"
                    />
                  </InputWrapper>
                </FieldGroup>

                <FieldGroup>
                  <Label>Новый пароль</Label>
                  <InputWrapper>
                    <FiLock />
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Введите новый пароль"
                    />
                  </InputWrapper>
                </FieldGroup>

                <FieldGroup>
                  <Label>Повторите новый пароль</Label>
                  <InputWrapper>
                    <FiLock />
                    <Input
                      type="password"
                      value={repeatPassword}
                      onChange={(event) =>
                        setRepeatPassword(event.target.value)
                      }
                      placeholder="Повторите новый пароль"
                    />
                  </InputWrapper>
                </FieldGroup>

                {passwordMessage && <Message>{passwordMessage}</Message>}

                <PrimaryButton type="submit" disabled={passwordLoading}>
                  <FiSave />
                  {passwordLoading ? "Сохранение..." : "Обновить пароль"}
                </PrimaryButton>
              </Form>
            </Card>
          </LeftColumn>

          <RightColumn>
            <Card>
              <CardHeader>
                <IconBox>
                  <FiUpload />
                </IconBox>

                <div>
                  <h2>Аватарка</h2>
                  <p>Фотография профиля пользователя.</p>
                </div>
              </CardHeader>

              <AvatarBlock>
                <Avatar>
                  {avatarSrc ? (
                    <AvatarImage src={avatarSrc} alt="User avatar" />
                  ) : (
                    initials
                  )}
                </Avatar>

                <AvatarName>{user?.full_name || "Пользователь"}</AvatarName>
                <AvatarEmail>{user?.email || "Email не указан"}</AvatarEmail>

                <AvatarActions>
                  <SecondaryButton
                    type="button"
                    onClick={handleChooseAvatar}
                    disabled={avatarLoading}
                  >
                    {user?.avatar_url ? <FiEdit2 /> : <FiUpload />}
                    {user?.avatar_url ? "Изменить" : "Загрузить"}
                  </SecondaryButton>

                  {user?.avatar_url && (
                    <DangerButton
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={avatarLoading}
                    >
                      <FiTrash2 />
                      Удалить
                    </DangerButton>
                  )}
                </AvatarActions>

                <HiddenInput
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleUploadAvatar}
                />

                {avatarMessage && <Message>{avatarMessage}</Message>}
              </AvatarBlock>
            </Card>
          </RightColumn>
        </SettingsGrid>
      </Main>
    </Page>
  );
};

export default ProfileSettingsPage;

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

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 0.9fr;
  gap: 22px;
  align-items: start;
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const Card = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  padding: 26px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
`;

const CardHeader = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    margin: 0 0 4px;
    font-size: 20px;
    color: #111827;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #64748b;
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 700;
  color: #111827;
`;

const InputWrapper = styled.div`
  height: 52px;
  border: 1px solid #dbe3ef;
  border-radius: 16px;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  color: #64748b;

  &:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
  }
`;

const Input = styled.input`
  width: 100%;
  border: none;
  outline: none;
  font-size: 15px;
  color: #111827;
  background: transparent;

  &::placeholder {
    color: #94a3b8;
  }
`;

const PrimaryButton = styled.button`
  height: 52px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: #ffffff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  height: 42px;
  border: none;
  border-radius: 14px;
  background: #eff6ff;
  color: #2563eb;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(SecondaryButton)`
  background: #fee2e2;
  color: #dc2626;
`;

const Message = styled.div`
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
`;

const AvatarBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Avatar = styled.div`
  width: 132px;
  height: 132px;
  border-radius: 34px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  font-weight: 800;
  overflow: hidden;
  margin-bottom: 16px;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarName = styled.h3`
  margin: 0 0 6px;
  font-size: 20px;
  color: #111827;
`;

const AvatarEmail = styled.p`
  margin: 0 0 18px;
  font-size: 14px;
  color: #64748b;
`;

const AvatarActions = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
`;

const HiddenInput = styled.input`
  display: none;
`;