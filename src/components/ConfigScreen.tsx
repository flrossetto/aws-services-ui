import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Space } from 'antd';
import { CloudServerOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface ConfigScreenProps {
  onConfigured: () => void;
}

const ConfigScreen: React.FC<ConfigScreenProps> = ({ onConfigured }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Verificar se já tem configuração salva
  useEffect(() => {
    const savedEndpoint = localStorage.getItem('aws_endpoint');
    const savedRegion = localStorage.getItem('aws_region');
    
    if (savedEndpoint && savedRegion) {
      // Já configurado, redirecionar para serviços
      onConfigured();
    } else {
      // Preencher com valores padrão
      form.setFieldsValue({
        endpoint: savedEndpoint || 'http://localhost:4566',
        region: savedRegion || 'us-east-1',
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy'
      });
    }
  }, [form, onConfigured]);

  const handleSubmit = (values: any) => {
    setLoading(true);
    
    // Salvar no localStorage
    localStorage.setItem('aws_endpoint', values.endpoint);
    localStorage.setItem('aws_region', values.region);
    localStorage.setItem('aws_access_key_id', values.accessKeyId);
    localStorage.setItem('aws_secret_access_key', values.secretAccessKey);
    
    // Aguardar um pouco para mostrar feedback
    setTimeout(() => {
      setLoading(false);
      onConfigured();
      navigate('/services');
    }, 500);
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '40px 20px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <Card 
        title={
          <Space>
            <CloudServerOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>Configuração AWS</Title>
          </Space>
        }
        bordered={false}
        style={{ 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px'
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            label="Endpoint AWS"
            name="endpoint"
            rules={[
              { required: true, message: 'Por favor, informe o endpoint' },
              { 
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  
                  // Validação mais flexível para URLs
                  // Aceita: http://localhost:4566, http://192.168.1.1:4566
                  // Aceita com ou sem protocolo (adiciona http:// se não tiver)
                  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+|localhost)(:\d+)?(\/.*)?$/;
                  
                  if (urlPattern.test(value)) {
                    return Promise.resolve();
                  }
                  
                  return Promise.reject(new Error('Informe um endpoint válido (ex: localhost:4566, 192.168.1.1:4566)'));
                }
              }
            ]}
            extra="Ex: localhost:4566, 192.168.1.1:4566 ..."
            normalize={(value) => {
              if (!value) return value;
              
              // Adiciona http:// se não tiver protocolo
              if (!value.startsWith('http://') && !value.startsWith('https://')) {
                return `http://${value}`;
              }
              return value;
            }}
          >
            <Input 
              placeholder="localhost:4566" 
              size="large"
              prefix={<CloudServerOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            label="Região AWS"
            name="region"
            rules={[{ required: true, message: 'Por favor, informe a região' }]}
            extra="Ex: us-east-1"
          >
            <Input placeholder="us-east-1" size="large" />
          </Form.Item>
          
          <Form.Item
            label="Access Key ID"
            name="accessKeyId"
            rules={[{ required: true, message: 'Por favor, informe o Access Key ID' }]}
            extra="Para emuladores: dummy"
          >
            <Input.Password placeholder="dummy" size="large" />
          </Form.Item>
          
          <Form.Item
            label="Secret Access Key"
            name="secretAccessKey"
            rules={[{ required: true, message: 'Por favor, informe o Secret Access Key' }]}
            extra="Para emuladores: dummy"
          >
            <Input.Password placeholder="dummy" size="large" />
          </Form.Item>
          
          <div style={{ textAlign: 'right', marginTop: '24px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<CheckCircleOutlined />}
              size="large"
            >
              Salvar e Continuar
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ConfigScreen;