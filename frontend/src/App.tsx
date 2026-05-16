import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { api } from "./api/api";
import "./assets/styles/root.css";

interface HealthResponse {
  status: string;
  project: string;
  backend: string;
  database: string;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<HealthResponse>("/api/health")
      .then((response) => {
        setHealth(response.data);
      })
      .catch(() => {
        setError("Не удалось подключиться к backend");
      });
  }, []);

  return (
    <Page>
      <Card>
        <Badge>LabTech / Decision Support System</Badge>

        <Title>LabIQ</Title>

        <Description>
          Интеллектуальная система поддержки принятия решений в лабораторной
          диагностике.
        </Description>

        <StatusBox>
          <StatusTitle>Статус системы</StatusTitle>

          {health && (
            <>
              <StatusItem>
                <span>Backend:</span>
                <strong>{health.backend}</strong>
              </StatusItem>

              <StatusItem>
                <span>Database:</span>
                <Success>{health.database}</Success>
              </StatusItem>

              <StatusItem>
                <span>Status:</span>
                <Success>{health.status}</Success>
              </StatusItem>
            </>
          )}

          {error && <ErrorText>{error}</ErrorText>}
        </StatusBox>
      </Card>
    </Page>
  );
}

export default App;

const Page = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
`;

const Card = styled.section`
  width: 100%;
  max-width: 620px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 42px;
`;

const Badge = styled.div`
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: #eff6ff;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
`;

const Title = styled.h1`
  margin: 24px 0 12px;
  font-size: 48px;
  line-height: 1;
`;

const Description = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 18px;
  line-height: 1.6;
`;

const StatusBox = styled.div`
  margin-top: 32px;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  padding: 20px;
`;

const StatusTitle = styled.h2`
  margin: 0 0 16px;
  font-size: 18px;
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 16px;

  span {
    color: var(--color-muted);
  }
`;

const Success = styled.strong`
  color: var(--color-success);
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--color-danger);
  font-weight: 600;
`;