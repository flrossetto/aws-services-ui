import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Layout, Menu, theme, Typography, Space } from "antd";
import {
  CloudOutlined,
  DatabaseOutlined,
  MessageOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import S3Manager from "./components/S3Manager";
import SQSManager from "./components/SQSManager";
import DynamoDBManager from "./components/DynamoDBManager";
import ConfigScreen from "./components/ConfigScreen";
import { checkAWSConnection } from "./utils/corsProxy";
import { hasAwsConfig, clearAwsConfig } from "./config/awsConfig";
import "./App.css";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const AppContent: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected"
  >("connected");
  const [isConfigured, setIsConfigured] = useState(hasAwsConfig());
  const navigate = useNavigate();
  const location = useLocation();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const services = [
    {
      key: "s3",
      path: "/s3",
      icon: <CloudOutlined />,
      label: "S3 Storage",
      component: <S3Manager />,
    },
    {
      key: "sqs",
      path: "/sqs",
      icon: <MessageOutlined />,
      label: "SQS Queues",
      component: <SQSManager />,
    },
    {
      key: "dynamodb",
      path: "/dynamodb",
      icon: <DatabaseOutlined />,
      label: "DynamoDB",
      component: <DynamoDBManager />,
    },
  ];

  const checkConnection = useCallback(async () => {
    try {
      // Usar verificação resiliente que lida com CORS
      const isConnected = await checkAWSConnection();
      setConnectionStatus(isConnected ? "connected" : "disconnected");
    } catch (error) {
      // Silenciosamente marca como desconectado
      setConnectionStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    // Verificar conexão periodicamente (a cada 30 segundos)
    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  // Determinar a chave selecionada com base na rota atual
  const selectedKey =
    services.find((service) => location.pathname.startsWith(service.path))
      ?.key || "s3";

  const handleConfigured = () => {
    setIsConfigured(true);
    checkConnection(); // Verificar conexão após configuração
  };

  const handleLogout = () => {
    clearAwsConfig();
    setIsConfigured(false);
    navigate('/');
  };

  const getStatusIcon = () => {
    return connectionStatus === "connected" ? (
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "#52c41a",
        }}
      />
    ) : (
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "#ff4d4f",
        }}
      />
    );
  };

  const getStatusText = () => {
    return connectionStatus === "connected" ? "Conectado" : "Desconectado";
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const service = services.find((s) => s.key === key);
    if (service) {
      navigate(service.path);
    }
  };

  // Se não estiver configurado, mostrar tela de configuração
  if (!isConfigured) {
    return <ConfigScreen onConfigured={handleConfigured} />;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ padding: 16, textAlign: "center" }}>
          <Title level={4} style={{ color: "white", margin: 0 }}>
            {collapsed ? "AWS" : "AWS Services"}
          </Title>
          <div style={{ marginTop: 8 }}>
            <Space size={4} align="center">
              {getStatusIcon()}
              {!collapsed && (
                <Text style={{ color: "white", fontSize: 12 }}>
                  {getStatusText()}
                </Text>
              )}
            </Space>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={services.map((service) => ({
              key: service.key,
              icon: service.icon,
              label: service.label,
            }))}
            onClick={handleMenuClick}
            style={{ flex: 1 }}
          />
          <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Menu
              theme="dark"
              mode="inline"
              items={[{
                key: 'reconfigure',
                icon: <SettingOutlined />,
                label: collapsed ? 'Reconfig' : 'Reconfigurar',
              }]}
              onClick={() => handleLogout()}
              style={{ background: 'transparent', border: 'none' }}
            />
          </div>
        </div>
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/s3" replace />} />
            {services.map((service) => (
              <Route
                key={service.key}
                path={`${service.path}/*`}
                element={service.component}
              />
            ))}
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
