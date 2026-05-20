import React from "react";
import styled from "@emotion/styled";
import AdminSidebar from "./AdminSidebar";

const SIDEBAR_WIDTH = 240;

type User = {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
};

type AdminLayoutProps = {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
};

function AdminLayout({ user, onLogout, children }: AdminLayoutProps) {
  return (
    <Page>
      <AdminSidebar user={user} onLogout={onLogout} />

      <Content>
        <ContentInner>{children}</ContentInner>
      </Content>
    </Page>
  );
}

export default AdminLayout;

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