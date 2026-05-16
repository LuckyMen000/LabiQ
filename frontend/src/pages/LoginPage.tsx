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
  FiShield,
  FiUser,
} from "react-icons/fi";

import { loginUser } from "../api/authApi";

const getErrorMessage = (err: any): string => {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(", ");
  }

  return "Не удалось выполнить вход";
};

const LoginPage = () => {
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const EyeIcon = showPassword ? FiEyeOff : FiEye;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const data = await loginUser({
        username_or_email: usernameOrEmail.trim(),
        password,
      });

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remember_me");
      }

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
        <title>Вход | LabIQ</title>
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
              <InfoTitle>Добро пожаловать!</InfoTitle>

              <InfoText>
                Войдите в систему, чтобы продолжить работу с лабораторными
                процессами.
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
              <Title>Вход в систему</Title>
              <Description>Используйте логин или email и пароль</Description>
            </FormHeader>

            <Form onSubmit={handleSubmit}>
              <FieldGroup>
                <Label htmlFor="username_or_email">Логин или email</Label>

                <InputWrapper>
                  <InputIcon>{createElement(FiUser as any)}</InputIcon>

                  <Input
                    id="username_or_email"
                    type="text"
                    placeholder="Введите логин или email"
                    value={usernameOrEmail}
                    onChange={(event) =>
                      setUsernameOrEmail(event.target.value)
                    }
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
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
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

              <Row>
                <CheckboxLabel>
                  <Checkbox
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  Запомнить меня
                </CheckboxLabel>

                <ForgotButton type="button">Забыли пароль?</ForgotButton>
              </Row>

              {error && <ErrorText>{error}</ErrorText>}

              <SubmitButton type="submit" disabled={isLoading}>
                {isLoading ? <Loader /> : "Войти"}
                {!isLoading && createElement(FiArrowRight as any)}
              </SubmitButton>
            </Form>

            <FooterText>
              Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </FooterText>
          </FormSide>
        </AuthCard>

        <Copyright>© 2026 LabIQ. Все права защищены.</Copyright>
      </Page>
    </>
  );
};

export default LoginPage;

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
  max-width: 1080px;
  min-height: 620px;
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
  margin-bottom: 34px;
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
  gap: 20px;
`;

const FieldGroup = styled.div`
  display: grid;
  gap: 9px;
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
  height: 56px;
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

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;

  @media (max-width: 420px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
`;

const CheckboxLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--color-muted);
  font-size: var(--font-size-sm);
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
`;

const ForgotButton = styled.button`
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 800;

  &:hover {
    color: var(--color-primary-hover);
  }
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
  margin: 30px 0 0;
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