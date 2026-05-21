import styled from "@emotion/styled";
import Header from "../components/Header";
import {
  FiActivity,
  FiClipboard,
  FiDatabase,
  FiFileText,
  FiLock,
  FiUsers,
} from "react-icons/fi";
import { Helmet } from "react-helmet-async";

const MainPage = () => {
  return (
    <Page>
        <Helmet>
            <title>Главная страница | LabIQ</title>
        </Helmet>
      <Header />

      <Main>
        <Hero>
          <HeroContent>
            <Badge>Информационная система лаборатории</Badge>
            <Title>Добро пожаловать в LabIQ</Title>
            <Description>
              Система для управления лабораторными процессами, заявками,
              результатами анализов, пользователями и безопасностью доступа.
            </Description>
          </HeroContent>
        </Hero>

        <Section>
          <SectionTitle>Основные разделы</SectionTitle>

          <CardsGrid>
            <Card>
              <CardIcon>
                <FiClipboard />
              </CardIcon>
              <CardTitle>Заявки</CardTitle>
              <CardText>
                Создание, обработка и контроль заявок на лабораторные
                исследования.
              </CardText>
            </Card>

            <Card>
              <CardIcon>
                <FiActivity />
              </CardIcon>
              <CardTitle>Лабораторный workflow</CardTitle>
              <CardText>
                Отслеживание этапов выполнения анализа от регистрации до
                результата.
              </CardText>
            </Card>

            <Card>
              <CardIcon>
                <FiFileText />
              </CardIcon>
              <CardTitle>Результаты</CardTitle>
              <CardText>
                Формирование, проверка и хранение результатов лабораторных
                исследований.
              </CardText>
            </Card>

            <Card>
              <CardIcon>
                <FiUsers />
              </CardIcon>
              <CardTitle>Пользователи</CardTitle>
              <CardText>
                Управление ролями: регистратор, лаборант и администратор
                системы.
              </CardText>
            </Card>

            <Card>
              <CardIcon>
                <FiLock />
              </CardIcon>
              <CardTitle>Безопасность</CardTitle>
              <CardText>
                Контроль авторизации, ограничение попыток входа и аудит
                действий.
              </CardText>
            </Card>

            <Card>
              <CardIcon>
                <FiDatabase />
              </CardIcon>
              <CardTitle>Данные</CardTitle>
              <CardText>
                Централизованное хранение информации о пациентах, заявках и
                анализах.
              </CardText>
            </Card>
          </CardsGrid>
        </Section>
      </Main>
    </Page>
  );
};

export default MainPage;

const Page = styled.div`
  min-height: 100vh;
  background: #f6f8fb;
`;

const Main = styled.main`
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 24px 56px;
`;

const Hero = styled.section`
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  border-radius: 28px;
  padding: 56px;
  color: #ffffff;
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.18);
`;

const HeroContent = styled.div`
  max-width: 720px;
`;

const Badge = styled.div`
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 18px;
`;

const Title = styled.h1`
  font-size: 44px;
  line-height: 1.1;
  margin: 0 0 18px;
`;

const Description = styled.p`
  font-size: 18px;
  line-height: 1.6;
  margin: 0;
  color: #dbeafe;
`;

const Section = styled.section`
  margin-top: 34px;
`;

const SectionTitle = styled.h2`
  font-size: 26px;
  margin: 0 0 20px;
  color: #111827;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  padding: 24px;
  min-height: 190px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 18px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  margin: 0 0 10px;
  color: #111827;
`;

const CardText = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #6b7280;
  margin: 0;
`;