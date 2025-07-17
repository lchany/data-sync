import React, { useState } from 'react';
import { Card, Button, Table, Tag, Space, Spin, Empty, Collapse } from 'antd';
import { SyncOutlined, DatabaseOutlined, ReloadOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

const DatabaseList = ({ databases, loading, onSync, onRefresh }) => {
  const [syncingTables, setSyncingTables] = useState({});

  const handleSync = async (database, table) => {
    const key = `${database}.${table}`;
    setSyncingTables(prev => ({ ...prev, [key]: true }));
    
    try {
      await onSync(database, table);
    } finally {
      setSyncingTables(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <Card>
        <Spin size="large" tip="加载数据库信息...">
          <div style={{ padding: 50 }} />
        </Spin>
      </Card>
    );
  }

  const databaseList = Object.entries(databases);

  if (databaseList.length === 0) {
    return (
      <Card>
        <Empty description="没有找到数据库" />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <DatabaseOutlined />
          <span>数据库列表</span>
        </Space>
      }
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          onClick={onRefresh}
          type="text"
        >
          刷新
        </Button>
      }
    >
      <Collapse defaultActiveKey={databaseList.map(([db]) => db)}>
        {databaseList.map(([database, tables]) => (
          <Panel 
            key={database} 
            header={
              <Space>
                <DatabaseOutlined />
                <strong>{database}</strong>
                <Tag color="blue">{tables.length} 个表</Tag>
              </Space>
            }
          >
            <Table
              dataSource={tables.map(table => ({ 
                key: `${database}.${table}`,
                database,
                table 
              }))}
              columns={[
                {
                  title: '表名',
                  dataIndex: 'table',
                  key: 'table',
                  render: (text) => <strong>{text}</strong>
                },
                {
                  title: '操作',
                  key: 'action',
                  render: (_, record) => {
                    const isSyncing = syncingTables[`${record.database}.${record.table}`];
                    return (
                      <Button
                        type="primary"
                        icon={<SyncOutlined spin={isSyncing} />}
                        onClick={() => handleSync(record.database, record.table)}
                        loading={isSyncing}
                      >
                        同步整表
                      </Button>
                    );
                  }
                }
              ]}
              pagination={false}
              size="small"
            />
          </Panel>
        ))}
      </Collapse>
    </Card>
  );
};

export default DatabaseList;