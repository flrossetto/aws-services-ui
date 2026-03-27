import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Card, Table, Button, Input, Upload, message, Modal, Space, Tag, Breadcrumb } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined, FolderAddOutlined, FolderOutlined, FileOutlined } from '@ant-design/icons';
import { ministackS3Service } from '../services/ministackServices';

interface S3Object {
  Key?: string;
  LastModified?: Date;
  Size?: number;
  StorageClass?: string;
}

interface FolderItem {
  name: string;
  type: 'folder' | 'file';
  key: string;
  size?: number;
  lastModified?: Date;
}

const S3Manager: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const routeBucketName = params.bucketName;
  const routePath = params['*'] || '';
  
  // Estado inicial baseado em route params (prioridade) ou query params
  const initialSelectedBucket = routeBucketName || searchParams.get('bucket') || '';
  const initialCurrentPath = routePath || searchParams.get('path') || '';
  
  const [buckets, setBuckets] = useState<any[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>(initialSelectedBucket);
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(initialCurrentPath);
  const [folderItems, setFolderItems] = useState<FolderItem[]>([]);

  useEffect(() => {
    loadBuckets();
  }, []);

  useEffect(() => {
    if (selectedBucket) {
      loadObjects(selectedBucket);
    }
  }, [selectedBucket]);

  // Atualizar query params quando o estado muda
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (selectedBucket) {
      params.set('bucket', selectedBucket);
    } else {
      params.delete('bucket');
    }
    
    if (currentPath) {
      params.set('path', currentPath);
    } else {
      params.delete('path');
    }
    
    // Atualizar apenas se houver mudanças
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedBucket, currentPath, searchParams, setSearchParams]);

  // Carregar bucket selecionado da URL se existir
  useEffect(() => {
    if (initialSelectedBucket) {
      // Verificar se o bucket existe na lista
      const bucketExists = buckets.some(bucket => bucket.Name === initialSelectedBucket);
      if (bucketExists) {
        setSelectedBucket(initialSelectedBucket);
      }
    }
  }, [buckets, initialSelectedBucket]);

  const loadBuckets = async () => {
    try {
      setLoading(true);
      const bucketList = await ministackS3Service.listBuckets();
      setBuckets(bucketList);
    } catch (error) {
      message.error('Erro ao carregar buckets');
    } finally {
      setLoading(false);
    }
  };

  const loadObjects = async (bucketName: string) => {
    try {
      setLoading(true);
      const objectList = await ministackS3Service.listObjects(bucketName);
      setObjects(objectList);
      setSelectedBucket(bucketName);
    } catch (error) {
      message.error('Erro ao carregar objetos');
    } finally {
      setLoading(false);
    }
  };

  const buildFolderItems = useCallback(() => {
    const items: FolderItem[] = [];
    const seenFolders = new Set<string>();
    const seenFiles = new Set<string>();

    objects.forEach((obj) => {
      if (!obj.Key) return;

      // Se estamos em um path específico, filtrar apenas os objetos desse path
      if (currentPath) {
        if (!obj.Key.startsWith(currentPath + '/') && obj.Key !== currentPath) {
          return;
        }
      }

      // Remover o currentPath do início da chave
      const relativeKey = currentPath 
        ? obj.Key.substring(currentPath.length + (obj.Key === currentPath ? 0 : 1))
        : obj.Key;

      // Se for o próprio diretório atual, ignorar
      if (relativeKey === '') return;

      // Verificar se é uma pasta (tem / no nome após o prefixo)
      const hasSlash = relativeKey.includes('/');
      
      if (hasSlash) {
        // É uma pasta: pegar o primeiro nível
        const folderName = relativeKey.split('/')[0];
        const folderKey = currentPath ? `${currentPath}/${folderName}` : folderName;
        
        if (!seenFolders.has(folderKey)) {
          seenFolders.add(folderKey);
          items.push({
            name: folderName,
            type: 'folder',
            key: folderKey,
          });
        }
      } else {
        // É um arquivo
        const fileKey = currentPath ? `${currentPath}/${relativeKey}` : relativeKey;
        
        if (!seenFiles.has(fileKey)) {
          seenFiles.add(fileKey);
          items.push({
            name: relativeKey,
            type: 'file',
            key: fileKey,
            size: obj.Size,
            lastModified: obj.LastModified,
          });
        }
      }
    });

    // Ordenar: pastas primeiro, depois arquivos
    items.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    setFolderItems(items);
  }, [objects, currentPath]);

  // Reconstruir itens de pasta quando objetos ou caminho mudam
  useEffect(() => {
    if (objects.length > 0) {
      buildFolderItems();
    } else {
      setFolderItems([]);
    }
  }, [objects, currentPath, buildFolderItems]);

  const handleUpload = async (file: File) => {
    if (!selectedBucket) {
      message.error('Selecione um bucket primeiro');
      return false;
    }

    // Se houver um path atual, adicionar ao nome do arquivo
    const key = currentPath ? `${currentPath}/${file.name}` : file.name;

    try {
      await ministackS3Service.uploadObject(selectedBucket, key, file);
      message.success('Arquivo enviado com sucesso');
      loadObjects(selectedBucket);
      return false;
    } catch (error) {
      message.error('Erro ao enviar arquivo');
      return false;
    }
  };

  const handleDownload = async (key: string) => {
    try {
      const data = await ministackS3Service.downloadObject(selectedBucket, key);
      
      if (data && typeof data === 'object') {
        const responseBody = data as any;
        
        if (responseBody.transformToWebStream) {
          const stream = responseBody.transformToWebStream();
          const reader = stream.getReader();
          const chunks: Uint8Array[] = [];
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          
          const blob = new Blob(chunks);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = key.split('/').pop() || key;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else if (responseBody instanceof Blob) {
          const url = window.URL.createObjectURL(responseBody);
          const a = document.createElement('a');
          a.href = url;
          a.download = key.split('/').pop() || key;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
      
      message.success('Download iniciado');
    } catch (error) {
      message.error('Erro ao baixar arquivo');
    }
  };

  const handleDeleteObject = async (key: string) => {
    try {
      await ministackS3Service.deleteObject(selectedBucket, key);
      message.success('Objeto deletado com sucesso');
      loadObjects(selectedBucket);
    } catch (error) {
      message.error('Erro ao deletar objeto');
    }
  };

  const handleCreateBucket = async () => {
    if (!newBucketName) {
      message.error('Digite um nome para o bucket');
      return;
    }

    try {
      await ministackS3Service.createBucket(newBucketName);
      message.success('Bucket criado com sucesso');
      setNewBucketName('');
      setIsModalVisible(false);
      loadBuckets();
    } catch (error) {
      message.error('Erro ao criar bucket');
    }
  };

  const handleDeleteBucket = async (bucketName: string) => {
    try {
      await ministackS3Service.deleteBucket(bucketName);
      message.success('Bucket deletado com sucesso');
      if (selectedBucket === bucketName) {
        setSelectedBucket('');
        setObjects([]);
        setFolderItems([]);
        setCurrentPath('');
      }
      loadBuckets();
    } catch (error) {
      message.error('Erro ao deletar bucket');
    }
  };

  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
  };

  const navigateUp = () => {
    if (!currentPath) return;
    
    const parts = currentPath.split('/');
    parts.pop();
    const newPath = parts.join('/');
    setCurrentPath(newPath);
  };

  const getBreadcrumbItems = () => {
    const items = [
      {
        title: <Button type="link" onClick={() => {
          setCurrentPath('');
        }} style={{ padding: 0 }}>
          {selectedBucket}
        </Button>,
      },
    ];

    if (currentPath) {
      const parts = currentPath.split('/');
      let accumulatedPath = '';
      
      parts.forEach((part, index) => {
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
        items.push({
          title: <Button 
            type="link" 
            onClick={() => navigateToFolder(accumulatedPath)} 
            style={{ padding: 0 }}
          >
            {part}
          </Button>,
        });
      });
    }

    return items;
  };

  const bucketColumns = [
    {
      title: 'Nome do Bucket',
      dataIndex: 'Name',
      key: 'Name',
    },
    {
      title: 'Data de Criação',
      dataIndex: 'CreationDate',
      key: 'CreationDate',
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setCurrentPath('');
              loadObjects(record.Name);
            }}
            style={{ fontSize: 11, padding: '0 8px', height: 22 }}
          >
            Abrir
          </Button>
          <Button
            danger
            size="small"
            onClick={() => handleDeleteBucket(record.Name)}
            style={{ fontSize: 11, padding: '0 8px', height: 22 }}
          >
            Deletar
          </Button>
        </Space>
      ),
    },
  ];

  const folderColumns = [
    {
      title: 'Nome',
      key: 'name',
      render: (_: any, record: FolderItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {record.type === 'folder' ? <FolderOutlined /> : <FileOutlined />}
          <span>{record.name}</span>
        </div>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'folder' ? 'blue' : 'green'}>
          {type === 'folder' ? 'Pasta' : 'Arquivo'}
        </Tag>
      ),
    },
    {
      title: 'Tamanho',
      key: 'size',
      render: (_: any, record: FolderItem) => (
        record.type === 'file' 
          ? `${(record.size || 0 / 1024).toFixed(1)} KB`
          : '-'
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 140,
      align: 'center' as const,
      render: (_: any, record: FolderItem) => (
        <Space size={4}>
          {record.type === 'folder' ? (
            <Button
              type="primary"
              size="small"
              onClick={() => navigateToFolder(record.key)}
              style={{ fontSize: 11, padding: '0 8px', height: 22 }}
            >
              Abrir
            </Button>
          ) : (
            <>
              <Button
                type="primary"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(record.key)}
                style={{ padding: '0 6px', height: 22, width: 32 }}
              />
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteObject(record.key)}
                style={{ padding: '0 6px', height: 22, width: 32 }}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Gerenciador S3"
        extra={
          <Button
            type="primary"
            icon={<FolderAddOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Criar Bucket
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <h3>Buckets</h3>
          <Table
            columns={bucketColumns}
            dataSource={buckets}
            rowKey="Name"
            loading={loading}
            pagination={false}
            size="small"
          />
        </div>

        {selectedBucket && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: 8 }}>
                  Conteúdo do Bucket: <Tag color="blue">{selectedBucket}</Tag>
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Breadcrumb items={getBreadcrumbItems()} />
                  {currentPath && (
                    <Button size="small" onClick={navigateUp}>
                      Voltar
                    </Button>
                  )}
                </div>
              </div>
              <Upload
                beforeUpload={handleUpload}
                showUploadList={false}
              >
                <Button type="primary" icon={<UploadOutlined />}>
                  Upload de Arquivo
                </Button>
              </Upload>
            </div>

            {folderItems.length > 0 ? (
              <Table
                columns={folderColumns}
                dataSource={folderItems}
                rowKey="key"
                loading={loading}
                pagination={false}
                size="small"
                onRow={(record) => ({
                  onClick: () => {
                    if (record.type === 'folder') {
                      navigateToFolder(record.key);
                    }
                  },
                  style: { cursor: record.type === 'folder' ? 'pointer' : 'default' }
                })}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, background: '#fafafa', borderRadius: 6 }}>
                <p style={{ color: '#999' }}>Nenhum arquivo ou pasta encontrado</p>
                <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                  Use o botão "Upload de Arquivo" para adicionar arquivos
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal
        title="Criar Novo Bucket"
        open={isModalVisible}
        onOk={handleCreateBucket}
        onCancel={() => setIsModalVisible(false)}
      >
        <Input
          placeholder="Nome do bucket"
          value={newBucketName}
          onChange={(e) => setNewBucketName(e.target.value)}
          onPressEnter={handleCreateBucket}
        />
      </Modal>
    </div>
  );
};

export default S3Manager;