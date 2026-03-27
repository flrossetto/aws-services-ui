import React, { useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Input,
  message,
  Modal,
  Space,
  Tag,
  Form,
  Select,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  DiffOutlined,
  CheckOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import JsonEditor from "./JsonEditor";
import JsonDiffViewer from "./JsonDiffViewer";
import { ministackDynamoDBService as dynamoDBService } from "../services/ministackServices";

const { Option } = Select;

interface DynamoDBItem {
  [key: string]: any;
}

interface TableInfo {
  TableName?: string;
  ItemCount?: number;
  TableSizeBytes?: number;
  KeySchema?: any[];
}

const DynamoDBManager: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const routeTableName = params.tableName;

  // Estado inicial baseado em route params (prioridade) ou query params
  const initialSelectedTable =
    routeTableName || searchParams.get("table") || "";
  const initialFilterText = searchParams.get("filter") || "";
  const initialSortField = searchParams.get("sortField") || "";
  const initialSortDirection =
    (searchParams.get("sortDirection") as "asc" | "desc") || "asc";

  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] =
    useState<string>(initialSelectedTable);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [items, setItems] = useState<DynamoDBItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [isTableModalVisible, setIsTableModalVisible] = useState(false);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<DynamoDBItem | null>(null);
  const [newItem, setNewItem] = useState<DynamoDBItem>({});
  const [partitionKey, setPartitionKey] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [keyType, setKeyType] = useState("S");
  const [filterText, setFilterText] = useState(initialFilterText);
  const [sortField, setSortField] = useState<string>(initialSortField);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    initialSortDirection,
  );
  const [filteredItems, setFilteredItems] = useState<DynamoDBItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<DynamoDBItem[]>([]);
  const [diffModalVisible, setDiffModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  // Atualizar query params quando o estado muda
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (selectedTable) {
      params.set("table", selectedTable);
    } else {
      params.delete("table");
    }

    if (filterText) {
      params.set("filter", filterText);
    } else {
      params.delete("filter");
    }

    if (sortField) {
      params.set("sortField", sortField);
    } else {
      params.delete("sortField");
    }

    if (sortDirection && sortField) {
      params.set("sortDirection", sortDirection);
    } else {
      params.delete("sortDirection");
    }

    // Atualizar apenas se houver mudanças
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [
    selectedTable,
    filterText,
    sortField,
    sortDirection,
    searchParams,
    setSearchParams,
  ]);

  // Quando abrir modal para novo item, sempre começar em modo edição
  useEffect(() => {
    if (isItemModalVisible && !editingItem) {
      setEditMode(true);
    }
  }, [isItemModalVisible, editingItem]);

  // Quando abrir modal para editar item, começar em modo visualização
  useEffect(() => {
    if (editingItem) {
      setEditMode(false);
    }
  }, [editingItem]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const tableList = await dynamoDBService.listTables();
      setTables(tableList);
    } catch (error) {
      message.error("Erro ao carregar tabelas");
    } finally {
      setLoading(false);
    }
  };

  const loadTableInfo = async (tableName: string) => {
    try {
      const info = await dynamoDBService.describeTable(tableName);
      setTableInfo(info || null);
      setSelectedTable(tableName);
      await loadItems(tableName);
    } catch (error) {
      message.error("Erro ao carregar informações da tabela");
    }
  };

  // Carregar tabela selecionada da URL se existir
  useEffect(() => {
    if (initialSelectedTable && tables.includes(initialSelectedTable)) {
      loadTableInfo(initialSelectedTable);
    }
  }, [tables, initialSelectedTable]);

  const loadItems = async (tableName: string) => {
    try {
      const itemList = await dynamoDBService.scanItems(tableName);
      setItems(itemList);
      setFilteredItems(itemList);
    } catch (error) {
      message.error("Erro ao carregar itens");
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...items];

    // Aplicar filtro
    if (filterText.trim()) {
      const searchText = filterText.toLowerCase();
      result = result.filter((item) => {
        return Object.values(item).some((value) => {
          if (value === undefined || value === null) {
            return false; // Não incluir null/undefined na busca
          }
          const stringValue =
            typeof value === "object"
              ? JSON.stringify(value).toLowerCase()
              : String(value).toLowerCase();
          return stringValue.includes(searchText);
        });
      });
    }

    // Aplicar ordenação
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        // Tratar undefined/null como strings vazias para ordenação
        const aString =
          aValue === undefined || aValue === null
            ? ""
            : typeof aValue === "object"
              ? JSON.stringify(aValue)
              : String(aValue);
        const bString =
          bValue === undefined || bValue === null
            ? ""
            : typeof bValue === "object"
              ? JSON.stringify(bValue)
              : String(bValue);

        const comparison = aString.localeCompare(bString);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    setFilteredItems(result);
  };

  // Aplicar filtros e ordenação quando os parâmetros mudam
  useEffect(() => {
    applyFiltersAndSort();
  }, [items, filterText, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Alternar direção se clicar no mesmo campo
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Novo campo, ordenar ascendente por padrão
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleItemSelection = (item: DynamoDBItem) => {
    const isSelected = selectedItems.some(
      (selected) => JSON.stringify(selected) === JSON.stringify(item),
    );

    if (isSelected) {
      // Remover da seleção
      setSelectedItems(
        selectedItems.filter(
          (selected) => JSON.stringify(selected) !== JSON.stringify(item),
        ),
      );
    } else {
      // Adicionar à seleção (máximo 2 itens)
      if (selectedItems.length < 2) {
        setSelectedItems([...selectedItems, item]);
      } else {
        // Substituir o primeiro item selecionado
        setSelectedItems([selectedItems[1], item]);
      }
    }
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const getItemKey = (item: DynamoDBItem): string => {
    if (tableInfo?.KeySchema) {
      return tableInfo.KeySchema.map(
        (key: any) => item[key.AttributeName],
      ).join("-");
    }
    return JSON.stringify(item);
  };

  const handleCreateTable = async () => {
    if (!newTableName || !partitionKey) {
      message.error("Preencha todos os campos obrigatórios");
      return;
    }

    const keySchema = [
      {
        AttributeName: partitionKey,
        KeyType: "HASH",
      },
    ];

    const attributeDefinitions = [
      {
        AttributeName: partitionKey,
        AttributeType: keyType,
      },
    ];

    if (sortKey) {
      keySchema.push({
        AttributeName: sortKey,
        KeyType: "RANGE",
      });
      attributeDefinitions.push({
        AttributeName: sortKey,
        AttributeType: keyType,
      });
    }

    try {
      await dynamoDBService.createTable(
        newTableName,
        keySchema,
        attributeDefinitions,
      );
      message.success("Tabela criada com sucesso");
      setNewTableName("");
      setPartitionKey("");
      setSortKey("");
      setIsTableModalVisible(false);
      loadTables();
    } catch (error) {
      message.error("Erro ao criar tabela");
    }
  };

  const handleDeleteTable = async (tableName: string) => {
    try {
      await dynamoDBService.deleteTable(tableName);
      message.success("Tabela deletada com sucesso");
      if (selectedTable === tableName) {
        setSelectedTable("");
        setTableInfo(null);
        setItems([]);
      }
      loadTables();
    } catch (error) {
      message.error("Erro ao deletar tabela");
    }
  };

  const handleCreateItem = async () => {
    if (!selectedTable) {
      message.error("Selecione uma tabela primeiro");
      return;
    }

    try {
      await dynamoDBService.putItem(selectedTable, newItem);
      message.success("Item criado com sucesso");
      setNewItem({});
      setIsItemModalVisible(false);
      loadItems(selectedTable);
    } catch (error) {
      message.error("Erro ao criar item");
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedTable || !editingItem) {
      return;
    }

    try {
      const key: Record<string, any> = {};
      if (tableInfo?.KeySchema) {
        tableInfo.KeySchema.forEach((keySchema: any) => {
          key[keySchema.AttributeName] = editingItem[keySchema.AttributeName];
        });
      }

      const updateExpression = `SET ${Object.keys(editingItem)
        .filter((k) => !Object.keys(key).includes(k))
        .map((k) => `${k} = :${k}`)
        .join(", ")}`;

      const expressionAttributeValues: Record<string, any> = {};
      Object.keys(editingItem)
        .filter((k) => !Object.keys(key).includes(k))
        .forEach((k) => {
          expressionAttributeValues[`:${k}`] = editingItem[k];
        });

      await dynamoDBService.updateItem(
        selectedTable,
        key,
        updateExpression,
        expressionAttributeValues,
      );
      message.success("Item atualizado com sucesso");
      setEditingItem(null);
      loadItems(selectedTable);
    } catch (error) {
      message.error("Erro ao atualizar item");
    }
  };

  const handleDeleteItem = async (item: DynamoDBItem) => {
    if (!selectedTable) {
      return;
    }

    try {
      const key: Record<string, any> = {};
      if (tableInfo?.KeySchema) {
        tableInfo.KeySchema.forEach((keySchema: any) => {
          key[keySchema.AttributeName] = item[keySchema.AttributeName];
        });
      }

      await dynamoDBService.deleteItem(selectedTable, key);
      message.success("Item deletado com sucesso");
      loadItems(selectedTable);
    } catch (error) {
      message.error("Erro ao deletar item");
    }
  };

  const tableColumns = [
    {
      title: "Nome da Tabela",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Ações",
      key: "actions",
      width: 120,
      align: "center" as const,
      render: (_: any, record: { name: string }) => (
        <Space size={4}>
          <Button
            type="primary"
            size="small"
            onClick={() => loadTableInfo(record.name)}
            style={{ fontSize: 11, padding: "0 8px", height: 22 }}
          >
            Abrir
          </Button>
          <Button
            danger
            size="small"
            onClick={() => handleDeleteTable(record.name)}
            style={{ fontSize: 11, padding: "0 8px", height: 22 }}
          >
            Deletar
          </Button>
        </Space>
      ),
    },
  ];

  const getColumnInfo = () => {
    if (items.length === 0)
      return { mainKeys: [], additionalKeys: [], totalKeys: 0 };

    const sampleItem = items[0];
    const allKeys = Object.keys(sampleItem);

    // Identificar chaves principais (chaves da tabela + id/sk se não forem chaves)
    const keyAttributes =
      tableInfo?.KeySchema?.map((key: any) => key.AttributeName) || [];

    // Começar com as chaves da tabela
    const mainKeys = keyAttributes.filter((key) => allKeys.includes(key));

    // Adicionar id e sk apenas se não forem chaves da tabela e existirem nos dados
    if (!keyAttributes.includes("id") && allKeys.includes("id")) {
      mainKeys.unshift("id");
    }
    if (!keyAttributes.includes("sk") && allKeys.includes("sk")) {
      mainKeys.push("sk");
    }

    // Remover duplicatas (caso id/sk já sejam chaves da tabela)
    const uniqueMainKeys = Array.from(new Set(mainKeys));

    // Pegar outras colunas (excluindo as principais)
    const otherKeys = allKeys.filter((key) => !uniqueMainKeys.includes(key));
    // Limitar a 5 colunas adicionais
    const additionalKeys = otherKeys.slice(0, 5);

    return {
      mainKeys: uniqueMainKeys,
      additionalKeys,
      totalKeys: allKeys.length,
    };
  };

  const itemColumns = () => {
    if (items.length === 0) return [];

    const { mainKeys, additionalKeys } = getColumnInfo();

    const columns: any[] = [];

    // Adicionar coluna de seleção (antes do ID)
    columns.push({
      title: "Sel.",
      key: "selection",
      width: 50,
      fixed: "left",
      align: "center" as const,
      render: (_: any, record: DynamoDBItem) => {
        const isSelected = selectedItems.some(
          (item) => JSON.stringify(item) === JSON.stringify(record),
        );

        return (
          <Button
            type={isSelected ? "primary" : "default"}
            size="small"
            icon={isSelected ? <CheckOutlined /> : null}
            onClick={() => toggleItemSelection(record)}
            style={{
              padding: 0,
              width: 24,
              height: 24,
              minWidth: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
            }}
            title={
              isSelected ? "Desselecionar para diff" : "Selecionar para diff"
            }
          />
        );
      },
    });

    // Adicionar colunas principais (id, sk, chaves da tabela)
    mainKeys.forEach((key) => {
      columns.push({
        title: (
          <div
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            onClick={() => handleSort(key)}
          >
            <span>{key === "id" ? "ID" : key === "sk" ? "Sort Key" : key}</span>
            {sortField === key && (
              <span style={{ fontSize: 12 }}>
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </div>
        ),
        dataIndex: key,
        key: key,
        render: (value: any) => {
          if (value === undefined || value === null) {
            return (
              <span style={{ color: "#999", fontStyle: "italic" }}>null</span>
            );
          }
          if (typeof value === "object") {
            return JSON.stringify(value);
          }
          return String(value);
        },
        sorter: false, // Desabilitar sorter padrão do Ant Design
      });
    });

    // Adicionar até 5 colunas adicionais com truncamento
    additionalKeys.forEach((key) => {
      columns.push({
        title: (
          <div
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            onClick={() => handleSort(key)}
          >
            <span>{key}</span>
            {sortField === key && (
              <span style={{ fontSize: 12 }}>
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </div>
        ),
        dataIndex: key,
        key: key,
        width: 120,
        render: (value: any) => {
          if (value === undefined || value === null) {
            return (
              <span style={{ color: "#999", fontStyle: "italic" }}>null</span>
            );
          }

          let text = "";
          if (typeof value === "object") {
            text = JSON.stringify(value);
          } else {
            text = String(value);
          }

          // Limitar a 10 caracteres
          if (text.length > 10) {
            return <span title={text}>{text.substring(0, 10)}...</span>;
          }
          return text;
        },
        sorter: false, // Desabilitar sorter padrão do Ant Design
      });
    });

    // Adicionar coluna de ações (largura fixa e compacta)
    columns.push({
      title: "Ações",
      key: "actions",
      width: 140, // Reduzida para botão menor
      fixed: "right",
      align: "center",
      render: (_: any, record: DynamoDBItem) => {
        const totalKeys = Object.keys(record).length;
        const shownKeys = mainKeys.length + additionalKeys.length;
        const hasMoreColumns = totalKeys > shownKeys;

        return (
          <Space size={4}>
            <Button
              type="primary"
              size="small"
              onClick={() => setEditingItem(record)}
              style={{
                fontSize: 11,
                padding: "0 6px",
                height: 22,
                width: 85,
                minWidth: 85,
                maxWidth: 85,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={
                hasMoreColumns
                  ? `${totalKeys - shownKeys} campos ocultos`
                  : "Todos os campos visíveis"
              }
            >
              ver/editar
            </Button>
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteItem(record)}
              style={{ padding: "0 6px", height: 22, width: 32 }}
            />
          </Space>
        );
      },
    });

    return columns;
  };

  return (
    <div>
      <Card
        title="Gerenciador DynamoDB"
        extra={
          <Button
            type="primary"
            icon={<DatabaseOutlined />}
            onClick={() => setIsTableModalVisible(true)}
          >
            Criar Tabela
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <h3>Tabelas</h3>
          <Table
            columns={tableColumns}
            dataSource={tables.map((name) => ({ name, key: name }))}
            rowKey="name"
            loading={loading}
            pagination={false}
            size="small"
          />
        </div>

        {selectedTable && tableInfo && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3>
                    Tabela: <Tag color="purple">{selectedTable}</Tag>
                  </h3>
                  <div style={{ marginTop: 8 }}>
                    <Tag>Itens: {tableInfo.ItemCount || 0}</Tag>
                    <Tag>
                      Tamanho:{" "}
                      {((tableInfo.TableSizeBytes || 0) / 1024 / 1024).toFixed(
                        2,
                      )}{" "}
                      MB
                    </Tag>
                    {tableInfo.KeySchema?.map((key: any) => (
                      <Tag key={key.AttributeName}>
                        {key.KeyType === "HASH" ? "Partition Key" : "Sort Key"}:{" "}
                        {key.AttributeName}
                      </Tag>
                    ))}
                    {items.length > 0 && (
                      <Tag>
                        Colunas:{" "}
                        {getColumnInfo().mainKeys.length +
                          getColumnInfo().additionalKeys.length}{" "}
                        de {getColumnInfo().totalKeys}
                      </Tag>
                    )}
                  </div>
                </div>
                <Space>
                  {selectedItems.length > 0 && (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Tag color="blue">
                        {selectedItems.length} item(s) selecionado(s)
                      </Tag>
                      {selectedItems.length === 2 && (
                        <Button
                          type="primary"
                          icon={<DiffOutlined />}
                          onClick={() => setDiffModalVisible(true)}
                        >
                          Comparar (Diff)
                        </Button>
                      )}
                      <Button size="small" onClick={clearSelection}>
                        Limpar
                      </Button>
                    </div>
                  )}
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsItemModalVisible(true)}
                  >
                    Adicionar Item
                  </Button>
                  <Button onClick={() => loadItems(selectedTable)}>
                    Atualizar
                  </Button>
                </Space>
              </div>

              {/* Controles de Filtro e Ordenação */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "#fafafa",
                  borderRadius: 6,
                  border: "1px solid #f0f0f0",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Input.Search
                    placeholder="Buscar em qualquer campo..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    onSearch={() => applyFiltersAndSort()}
                    allowClear
                    enterButton
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#666" }}>
                    Ordenar por:
                  </span>
                  <Select
                    value={sortField || undefined}
                    onChange={(value) => setSortField(value)}
                    placeholder="Selecionar campo"
                    style={{ width: 150 }}
                    size="small"
                    allowClear
                  >
                    {getColumnInfo()
                      .mainKeys.concat(getColumnInfo().additionalKeys)
                      .map((key) => (
                        <Select.Option key={key} value={key}>
                          {key === "id"
                            ? "ID"
                            : key === "sk"
                              ? "Sort Key"
                              : key}
                        </Select.Option>
                      ))}
                  </Select>

                  {sortField && (
                    <Select
                      value={sortDirection}
                      onChange={(value) => setSortDirection(value)}
                      style={{ width: 100 }}
                      size="small"
                    >
                      <Select.Option value="asc">Ascendente</Select.Option>
                      <Select.Option value="desc">Descendente</Select.Option>
                    </Select>
                  )}

                  {(filterText || sortField) && (
                    <Button
                      size="small"
                      onClick={() => {
                        setFilterText("");
                        setSortField("");
                        setSortDirection("asc");
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </div>

                <div style={{ fontSize: 12, color: "#666" }}>
                  Mostrando {filteredItems.length} de {items.length} itens
                  {filterText && (
                    <span style={{ marginLeft: 8, color: "#1890ff" }}>
                      Filtro: "{filterText}"
                    </span>
                  )}
                  {sortField && (
                    <span style={{ marginLeft: 8, color: "#52c41a" }}>
                      Ordenado por: {sortField} (
                      {sortDirection === "asc" ? "asc" : "desc"})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Table
              columns={itemColumns()}
              dataSource={filteredItems}
              rowKey={(record) => {
                if (tableInfo.KeySchema) {
                  return tableInfo.KeySchema.map(
                    (key: any) => record[key.AttributeName],
                  ).join("-");
                }
                return JSON.stringify(record);
              }}
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} de ${total} itens`,
              }}
              size="small"
              locale={{
                emptyText: filterText
                  ? "Nenhum item encontrado com o filtro atual"
                  : "Nenhum item encontrado",
              }}
            />
          </div>
        )}
      </Card>

      <Modal
        title="Criar Nova Tabela"
        open={isTableModalVisible}
        onOk={handleCreateTable}
        onCancel={() => setIsTableModalVisible(false)}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Nome da Tabela" required>
            <Input
              placeholder="Nome da tabela"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Partition Key (Chave Primária)" required>
            <Input
              placeholder="Nome do atributo"
              value={partitionKey}
              onChange={(e) => setPartitionKey(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Tipo da Chave">
            <Select value={keyType} onChange={setKeyType}>
              <Option value="S">String</Option>
              <Option value="N">Number</Option>
              <Option value="B">Binary</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Sort Key (Chave de Ordenação - Opcional)">
            <Input
              placeholder="Nome do atributo"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingItem ? "Editar Item" : "Novo Item"}
        open={!!editingItem || isItemModalVisible}
        onCancel={() => {
          if (editingItem) {
            setEditingItem(null);
          } else {
            setIsItemModalVisible(false);
            setNewItem({});
          }
        }}
        width={900}
        footer={[
          <Button
            key="copy"
            icon={<CopyOutlined />}
            onClick={() => {
              const jsonToCopy = editingItem
                ? JSON.stringify(editingItem, null, 2)
                : JSON.stringify(newItem, null, 2);
              navigator.clipboard.writeText(jsonToCopy);
              message.success("JSON copiado para a área de transferência!");
            }}
          >
            Copiar
          </Button>,
          <Button
            key="editSave"
            type="primary"
            onClick={() => {
              if (editMode) {
                // Modo edição ativo - salvar
                if (editingItem) {
                  handleUpdateItem();
                } else {
                  handleCreateItem();
                }
              } else {
                // Modo visualização - alternar para edição
                setEditMode(true);
              }
            }}
          >
            {editMode ? "Salvar" : "Editar"}
          </Button>,
          <Button
            key="close"
            onClick={() => {
              if (editingItem) {
                setEditingItem(null);
                setEditMode(false); // Resetar modo ao fechar
              } else {
                setIsItemModalVisible(false);
                setNewItem({});
                setEditMode(true); // Novo item sempre em modo edição
              }
            }}
          >
            Fechar
          </Button>,
        ]}
      >
        <JsonEditor
          value={editingItem || newItem}
          onChange={editingItem ? setEditingItem : setNewItem}
          readOnly={false}
          height="100%"
          editMode={editMode}
          onEditModeChange={setEditMode}
        />
      </Modal>

      {/* Modal de Diff */}
      <Modal
        title="Comparação de Itens (Diff)"
        open={diffModalVisible}
        onCancel={() => setDiffModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDiffModalVisible(false)}>
            Fechar
          </Button>,
        ]}
        width={1200}
        style={{ top: '40px', bottom: '40px' }}
      >
        {selectedItems.length === 2 && (
          <div style={{ height: '600px' }}>
            <JsonDiffViewer
              item1={selectedItems[0]}
              item2={selectedItems[1]}
              item1Key={`Item 1 (${getItemKey(selectedItems[0])})`}
              item2Key={`Item 2 (${getItemKey(selectedItems[1])})`}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DynamoDBManager;
