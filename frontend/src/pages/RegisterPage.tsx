import { FormEvent, createElement, useState } from "react";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
} from "react-icons/fi";

import { registerUser } from "../api/authApi";

const getErrorMessage = (err: any): string => {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(", ");
  }

  return "Не удалось выполнить регистрацию";
};

const RegisterPage = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const EyeIcon = showPassword ? FiEyeOff : FiEye;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!agree) {
      setError("Необходимо согласиться с условиями использования");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const data = await registerUser({
        full_name: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        password,
      });

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/");
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Регистрация | LabIQ</title>
      </Helmet>

      <Page>
        <OrbOne />
        <OrbTwo />
        <GridPattern />

        <AuthCard>
          <BrandMobile>
            <BrandIcon>{createElement(FiActivity as any)}</BrandIcon>
            <span>LabIQ</span>
          </BrandMobile>

          <InfoSide>
            <Brand>
              <BrandIcon>{createElement(FiActivity as any)}</BrandIcon>
              <span>LabIQ</span>
            </Brand>

            <InfoContent>
              <InfoTitle>Создайте аккаунт</InfoTitle>

              <InfoText>
                Зарегистрируйтесь, чтобы получить доступ к системе управления
                лабораторией.
              </InfoText>

              <FeatureList>
                <FeatureItem>
                  <FeatureIcon>{createElement(FiActivity as any)}</FeatureIcon>
                  <FeatureContent>
                    <FeatureTitle>Управление задачами</FeatureTitle>
                    <FeatureDescription>
                      Контролируйте все лабораторные задачи в одном месте
                    </FeatureDescription>
                  </FeatureContent>
                </FeatureItem>

                <FeatureItem>
                  <FeatureIcon>{createElement(FiBarChart2 as any)}</FeatureIcon>
                  <FeatureContent>
                    <FeatureTitle>Аналитика и отчёты</FeatureTitle>
                    <FeatureDescription>
                      Получайте точные данные и аналитику в реальном времени
                    </FeatureDescription>
                  </FeatureContent>
                </FeatureItem>

                <FeatureItem>
                  <FeatureIcon>{createElement(FiShield as any)}</FeatureIcon>
                  <FeatureContent>
                    <FeatureTitle>Безопасность и контроль</FeatureTitle>
                    <FeatureDescription>
                      Ваши данные защищены современными технологиями
                    </FeatureDescription>
                  </FeatureContent>
                </FeatureItem>
              </FeatureList>
            </InfoContent>

            <TrustText>
              {createElement(FiShield as any)}
              <span>Надёжно. Удобно. Эффективно.</span>
            </TrustText>
          </InfoSide>

          <Divider />

          <FormSide>
            <FormHeader>
              <Title>Регистрация</Title>
              <Description>Заполните данные для создания аккаунта</Description>
            </FormHeader>

            <Form onSubmit={handleSubmit}>
              <FieldGroup>
                <Label htmlFor="full_name">ФИО</Label>

                <InputWrapper>
                  <InputIcon>{createElement(FiUser as any)}</InputIcon>

                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Введите ваше ФИО"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                  />
                </InputWrapper>
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="email">Email</Label>

                <InputWrapper>
                  <InputIcon>{createElement(FiMail as any)}</InputIcon>

                  <Input
                    id="email"
                    type="email"
                    placeholder="Введите email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </InputWrapper>
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="username">Логин</Label>

                <InputWrapper>
                  <InputIcon>{createElement(FiUser as any)}</InputIcon>

                  <Input
                    id="username"
                    type="text"
                    placeholder="Введите логин"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </InputWrapper>
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="password">Пароль</Label>

                <InputWrapper>
                  <InputIcon>{createElement(FiLock as any)}</InputIcon>

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Создайте пароль"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    maxLength={72}
                  />

                  <PasswordToggle
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Скрыть пароль" : "Показать пароль"
                    }
                  >
                    {createElement(EyeIcon as any)}
                  </PasswordToggle>
                </InputWrapper>
              </FieldGroup>

              <AgreementLabel>
                <Checkbox
                  type="checkbox"
                  checked={agree}
                  onChange={(event) => setAgree(event.target.checked)}
                />

                <span>
                  Я согласен с{" "}
                  <PolicyButton type="button">
                    условиями использования
                  </PolicyButton>{" "}
                  и{" "}
                  <PolicyButton type="button">
                    политикой конфиденциальности
                  </PolicyButton>
                </span>
              </AgreementLabel>

              {error && <ErrorText>{error}</ErrorText>}

              <SubmitButton type="submit" disabled={isLoading}>
                {isLoading ? <Loader /> : "Зарегистрироваться"}
                {!isLoading && createElement(FiArrowRight as any)}
              </SubmitButton>
            </Form>

            <FooterText>
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </FooterText>
          </FormSide>
        </AuthCard>

        <Copyright>© 2026 LabIQ. Все права защищены.</Copyright>
      </Page>
    </>
  );
};

export default RegisterPage;

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(18px, -18px, 0) scale(1.05);
  }
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Page = styled.main`
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  padding: 48px 24px 34px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--gradient-bg);
  color: var(--color-text);

  @media (max-width: 768px) {
    padding: 22px 14px;
  }
`;

const OrbOne = styled.div`
  position: absolute;
  top: -140px;
  left: -120px;
  width: 360px;
  height: 360px;
  border-radius: 999px;
  background: var(--color-primary-light);
  filter: blur(28px);
  opacity: 0.9;
  animation: ${float} 8s ease-in-out infinite;
`;

const OrbTwo = styled.div`
  position: absolute;
  right: -160px;
  bottom: 40px;
  width: 420px;
  height: 420px;
  border-radius: 999px;
  background: var(--color-bg-secondary);
  filter: blur(34px);
  opacity: 0.95;
  animation: ${float} 9s ease-in-out infinite reverse;
`;

const GridPattern = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.34;
  background-image:
    linear-gradient(var(--color-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(circle at center, black, transparent 72%);
`;

const AuthCard = styled.section`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1120px;
  min-height: 660px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  padding: 58px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(18px);
  animation: ${fadeUp} 0.65s ease both;

  @media (max-width: 1024px) {
    max-width: 720px;
    min-height: auto;
    grid-template-columns: 1fr;
    padding: 42px;
  }

  @media (max-width: 768px) {
    padding: 28px 20px;
    border-radius: var(--radius-lg);
  }
`;

const BrandMobile = styled.div`
  display: none;

  @media (max-width: 1024px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 0 auto 28px;
    font-size: var(--font-size-lg);
    font-weight: 900;
    color: var(--color-text);
  }
`;

const InfoSide = styled.aside`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 54px;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const Brand = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: var(--font-size-lg);
  font-weight: 900;
  color: var(--color-text);
`;

const BrandIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 26px;
`;

const InfoContent = styled.div`
  margin-top: 70px;
`;

const InfoTitle = styled.h1`
  margin: 0 0 18px;
  font-size: 32px;
  line-height: 1.15;
  letter-spacing: -0.8px;
  color: var(--color-text);
`;

const InfoText = styled.p`
  max-width: 360px;
  margin: 0;
  color: var(--color-muted);
  font-size: var(--font-size-sm);
  line-height: 1.8;
`;

const FeatureList = styled.div`
  display: grid;
  gap: 24px;
  margin-top: 58px;
`;

const FeatureItem = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-start;
`;

const FeatureIcon = styled.div`
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 18px;
`;

const FeatureContent = styled.div`
  min-width: 0;
`;

const FeatureTitle = styled.div`
  margin-bottom: 4px;
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: var(--color-text);
`;

const FeatureDescription = styled.div`
  max-width: 280px;
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: var(--color-muted);
`;

const TrustText = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-muted);
  font-size: var(--font-size-sm);

  svg {
    color: var(--color-primary);
  }
`;

const Divider = styled.div`
  width: 1px;
  min-height: 100%;
  background: var(--color-border);

  @media (max-width: 1024px) {
    display: none;
  }
`;

const FormSide = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 54px;

  @media (max-width: 1024px) {
    padding-left: 0;
  }
`;

const FormHeader = styled.div`
  margin-bottom: 28px;
`;

const Title = styled.h2`
  margin: 0 0 12px;
  color: var(--color-text);
  font-size: 30px;
  line-height: 1.15;
  letter-spacing: -0.7px;

  @media (max-width: 768px) {
    text-align: center;
    font-size: 26px;
  }
`;

const Description = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: var(--font-size-sm);
  line-height: 1.7;

  @media (max-width: 768px) {
    text-align: center;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 16px;
`;

const FieldGroup = styled.div`
  display: grid;
  gap: 8px;
`;

const Label = styled.label`
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: var(--color-text);
`;

const InputWrapper = styled.div`
  position: relative;

  &:focus-within span {
    color: var(--color-primary);
  }
`;

const InputIcon = styled.span`
  position: absolute;
  top: 50%;
  left: 18px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  color: var(--color-muted);
  font-size: 18px;
  pointer-events: none;
  transition: color var(--transition-fast);
`;

const Input = styled.input`
  width: 100%;
  height: 54px;
  padding: 0 54px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  outline: none;
  background: var(--color-surface-solid);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);

  &::placeholder {
    color: var(--color-placeholder);
  }

  &:focus {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-focus);
    transform: translateY(-1px);
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  top: 50%;
  right: 14px;
  z-index: 3;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  transform: translateY(-50%);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  font-size: 18px;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);

  &:hover {
    background: var(--color-primary-light);
    color: var(--color-primary);
  }

  &:active {
    transform: translateY(-50%) scale(0.94);
  }
`;

const AgreementLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--color-muted);
  font-size: var(--font-size-sm);
  line-height: 1.5;
`;

const PolicyButton = styled.button`
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: inherit;
  font-weight: 800;
  text-decoration: underline;

  &:hover {
    color: var(--color-primary-hover);
  }
`;

const Checkbox = styled.input`
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--color-primary);
`;

const ErrorText = styled.div`
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: rgba(220, 38, 38, 0.08);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  font-weight: 700;
`;

const SubmitButton = styled.button`
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--gradient-primary);
  color: var(--color-surface-solid);
  font-size: var(--font-size-md);
  font-weight: 900;
  box-shadow: var(--shadow-hover);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    opacity var(--transition-fast);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 22px 58px rgba(37, 99, 235, 0.24);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.72;
  }
`;

const Loader = styled.span`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.45);
  border-top-color: var(--color-surface-solid);
  border-radius: 999px;
  animation: ${spin} 0.8s linear infinite;
`;

const FooterText = styled.p`
  margin: 26px 0 0;
  text-align: center;
  color: var(--color-muted);
  font-size: var(--font-size-sm);

  a {
    color: var(--color-primary);
    font-weight: 900;

    &:hover {
      color: var(--color-primary-hover);
    }
  }
`;

const Copyright = styled.div`
  position: relative;
  z-index: 1;
  margin-top: 26px;
  color: var(--color-muted);
  font-size: var(--font-size-sm);
`;