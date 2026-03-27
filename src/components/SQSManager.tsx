import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Card, Table, Button, Input, message, Modal, Space, Tag, Form } from 'antd';
import { SendOutlined, DeleteOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ministackSQSService as sqsService } from '../services/ministackServices';

const { TextArea } = Input;

interface SQSMessage {
  MessageId?: string;
  ReceiptHandle?: string;
  Body?: string;
  Attributes?: any;
}

const SQSManager: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const routeQueueName = params.queueName;
  
  // Estado inicial baseado em route params (prioridade) ou query params
  const initialSelectedQueue = routeQueueName || searchParams.get('queue') || '';
  
  const [queues, setQueues] = useState<string[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string>(initialSelectedQueue);
  const [messages, setMessages] = useState<SQSMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newQueueName, setNewQueueName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isQueueModalVisible, setIsQueueModalVisible] = useState(false);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);

  useEffect(() => {
    loadQueues();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pollingActive && selectedQueue) {
      interval = setInterval(() => {
        loadMessages(selectedQueue);
      }, 5000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pollingActive, selectedQueue]);

  // Atualizar query params quando o estado muda
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (selectedQueue) {
      params.set('queue', selectedQueue);
    } else {
      params.delete('queue');
    }
    
    // Atualizar apenas se houver mudanças
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedQueue, searchParams, setSearchParams]);

  // Carregar queue selecionada da URL se existir
  useEffect(() => {
    if (initialSelectedQueue && queues.includes(initialSelectedQueue)) {
      setSelectedQueue(initialSelectedQueue);
      loadMessages(initialSelectedQueue);
    }
  }, [queues, initialSelectedQueue]);

  const loadQueues = async () => {
    try {
      setLoading(true);
      const queueUrls = await sqsService.listQueues();
      setQueues(queueUrls);
    } catch (error) {
      message.error('Erro ao carregar filas');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (queueUrl: string) => {
    try {
      const messageList = await sqsService.receiveMessages(queueUrl);
      setMessages(messageList);
      setSelectedQueue(queueUrl);
    } catch (error) {
      message.error('Erro ao carregar mensagens');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedQueue) {
      message.error('Selecione uma fila primeiro');
      return;
    }

    if (!newMessage.trim()) {
      message.error('Digite uma mensagem');
      return;
    }

    try {
      await sqsService.sendMessage(selectedQueue, newMessage);
      message.success('Mensagem enviada com sucesso');
      setNewMessage('');
      setIsMessageModalVisible(false);
      loadMessages(selectedQueue);
    } catch (error) {
      message.error('Erro ao enviar mensagem');
    }
  };

  const handleDeleteMessage = async (receiptHandle: string) => {
    try {
      await sqsService.deleteMessage(selectedQueue, receiptHandle);
      message.success('Mensagem deletada com sucesso');
      loadMessages(selectedQueue);
    } catch (error) {
      message.error('Erro ao deletar mensagem');
    }
  };

  const handleCreateQueue = async () => {
    if (!newQueueName) {
      message.error('Digite um nome para a fila');
      return;
    }

    try {
      const queueUrl = await sqsService.createQueue(newQueueName);
      message.success('Fila criada com sucesso');
      setNewQueueName('');
      setIsQueueModalVisible(false);
      loadQueues();
      if (queueUrl) {
        loadMessages(queueUrl);
      }
    } catch (error) {
      message.error('Erro ao criar fila');
    }
  };

  const handleDeleteQueue = async (queueUrl: string) => {
    try {
      await sqsService.deleteQueue(queueUrl);
      message.success('Fila deletada com sucesso');
      if (selectedQueue === queueUrl) {
        setSelectedQueue('');
        setMessages([]);
        setPollingActive(false);
      }
      loadQueues();
    } catch (error) {
      message.error('Erro ao deletar fila');
    }
  };

  const togglePolling = () => {
    setPollingActive(!pollingActive);
  };

  const queueColumns = [
    {
      title: 'URL da Fila',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <div style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {url}
        </div>
      ),
    },
    {
      title: 'Nome da Fila',
      key: 'name',
      render: (_: any, record: { url: string }) => {
        const parts = record.url.split('/');
        return parts[parts.length - 1];
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: { url: string }) => (
        <Space size={4}>
          <Button
            type="primary"
            size="small"
            onClick={() => loadMessages(record.url)}
            style={{ fontSize: 11, padding: '0 8px', height: 22 }}
          >
            Abrir
          </Button>
          <Button
            danger
            size="small"
            onClick={() => handleDeleteQueue(record.url)}
            style={{ fontSize: 11, padding: '0 8px', height: 22 }}
          >
            Deletar
          </Button>
        </Space>
      ),
    },
  ];

  const messageColumns = [
    {
      title: 'ID da Mensagem',
      dataIndex: 'MessageId',
      key: 'MessageId',
    },
    {
      title: 'Corpo da Mensagem',
      dataIndex: 'Body',
      key: 'Body',
      render: (body: string) => (
        <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {body}
        </div>
      ),
    },
    {
      title: 'Receipt Handle',
      dataIndex: 'ReceiptHandle',
      key: 'ReceiptHandle',
      render: (handle: string) => (
        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {handle?.substring(0, 50)}...
        </div>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 140,
      align: 'center' as const,
      render: (_: any, record: SQSMessage) => (
        <Space size={4}>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              Modal.info({
                title: 'Detalhes da Mensagem',
                width: 600,
                content: (
                  <div>
                    <p><strong>ID:</strong> {record.MessageId}</p>
                    <p><strong>Body:</strong> {record.Body}</p>
                    <p><strong>Receipt Handle:</strong> {record.ReceiptHandle}</p>
                    {record.Attributes && (
                      <p><strong>Attributes:</strong> {JSON.stringify(record.Attributes)}</p>
                    )}
                  </div>
                ),
              });
            }}
            style={{ padding: '0 6px', height: 22, width: 32 }}
          />
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteMessage(record.ReceiptHandle!)}
            style={{ padding: '0 6px', height: 22, width: 32 }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Gerenciador SQS"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsQueueModalVisible(true)}
            >
              Criar Fila
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadQueues}
            >
              Atualizar
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <h3>Filas SQS</h3>
            <Table
              columns={queueColumns}
              dataSource={queues.map(url => ({ url, key: url }))}
              rowKey="url"
              loading={loading}
              pagination={false}
              size="small"
            />
        </div>

        {selectedQueue && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>
                Mensagens na Fila: <Tag color="green">{selectedQueue.split('/').pop()}</Tag>
                <Tag color={pollingActive ? "green" : "red"} style={{ marginLeft: 8 }}>
                  Polling: {pollingActive ? 'Ativo' : 'Inativo'}
                </Tag>
              </h3>
              <Space>
                <Button
                  type={pollingActive ? "default" : "primary"}
                  onClick={togglePolling}
                >
                  {pollingActive ? 'Parar Polling' : 'Iniciar Polling'}
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => setIsMessageModalVisible(true)}
                >
                  Enviar Mensagem
                </Button>
                <Button
                  onClick={() => loadMessages(selectedQueue)}
                  icon={<ReloadOutlined />}
                >
                  Atualizar
                </Button>
              </Space>
            </div>
            <Table
              columns={messageColumns}
              dataSource={messages}
              rowKey="MessageId"
              loading={loading}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </div>
        )}
      </Card>

      <Modal
        title="Criar Nova Fila"
        open={isQueueModalVisible}
        onOk={handleCreateQueue}
        onCancel={() => setIsQueueModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Nome da Fila">
            <Input
              placeholder="Nome da fila"
              value={newQueueName}
              onChange={(e) => setNewQueueName(e.target.value)}
              onPressEnter={handleCreateQueue}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Enviar Mensagem"
        open={isMessageModalVisible}
        onOk={handleSendMessage}
        onCancel={() => setIsMessageModalVisible(false)}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Fila Destino">
            <Input value={selectedQueue} disabled />
          </Form.Item>
          <Form.Item label="Mensagem">
            <TextArea
              rows={6}
              placeholder="Digite sua mensagem aqui..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SQSManager;