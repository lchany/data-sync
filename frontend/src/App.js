import React, { useState, useEffect } from 'react';
import { Layout, Typography, message } from 'antd';
import axios from 'axios';
import DatabaseList from './components/DatabaseList';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const [databases, setDatabases] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    try {
      setLoading(true);
      const dbResponse = await axios.get('/api/databases');
      const databaseNames = dbResponse.data;
      
      const dbWithTables = {};
      for (const db of databaseNames) {
        try {
          const tableResponse = await axios.get(`/api/tables/${db}`);
          dbWithTables[db] = tableResponse.data;
        } catch (error) {
          console.error(`获取数据库 ${db} 的表失败:`, error);
          dbWithTables[db] = [];
        }
      }
      
      setDatabases(dbWithTables);
    } catch (error) {
      message.error('获取数据库列表失败');
      console.error('获取数据库失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (database, table) => {
    try {
      const response = await axios.post('/api/sync', { database, table });
      if (response.data.success) {
        message.success(`同步成功！共同步 ${response.data.recordCount} 条记录`);
      } else {
        message.error(response.data.error || '同步失败');
      }
    } catch (error) {
      message.error('同步请求失败');
      console.error('同步失败:', error);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#1890ff', padding: '0 24px' }}>
        <Title level={2} style={{ color: 'white', margin: '14px 0' }}>
          MySQL 数据同步工具
        </Title>
      </Header>
      <Content style={{ padding: '24px' }}>
        <DatabaseList 
          databases={databases} 
          loading={loading}
          onSync={handleSync}
          onRefresh={loadDatabases}
        />
      </Content>
    </Layout>
  );
}

export default App;