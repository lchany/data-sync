const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const sourceConnection = mysql.createConnection(config.source);
const targetConnection = mysql.createConnection(config.target);

app.get('/api/databases', (req, res) => {
  sourceConnection.query('SHOW DATABASES', (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const databases = results
      .map(row => row.Database)
      .filter(db => !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(db));
    res.json(databases);
  });
});

app.get('/api/tables/:database', (req, res) => {
  const database = req.params.database;
  sourceConnection.query(`SHOW TABLES FROM \`${database}\``, (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const tables = results.map(row => Object.values(row)[0]);
    res.json(tables);
  });
});

app.post('/api/sync', (req, res) => {
  const { database, table } = req.body;
  
  if (!database || !table) {
    return res.status(400).json({ error: '缺少数据库或表名' });
  }

  const fullTableName = `\`${database}\`.\`${table}\``;
  
  sourceConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``, (error) => {
    if (error) {
      console.error('创建目标数据库失败:', error);
    }
  });

  sourceConnection.query(`SHOW CREATE TABLE ${fullTableName}`, (error, results) => {
    if (error) {
      return res.status(500).json({ error: `获取表结构失败: ${error.message}` });
    }

    const createTableSQL = results[0]['Create Table'];
    
    targetConnection.query(`USE \`${database}\``, (error) => {
      if (error) {
        return res.status(500).json({ error: `切换数据库失败: ${error.message}` });
      }

      targetConnection.query(`DROP TABLE IF EXISTS \`${table}\``, (error) => {
        if (error) {
          return res.status(500).json({ error: `删除旧表失败: ${error.message}` });
        }

        targetConnection.query(createTableSQL, (error) => {
          if (error) {
            return res.status(500).json({ error: `创建表结构失败: ${error.message}` });
          }

          sourceConnection.query(`SELECT * FROM ${fullTableName}`, (error, results) => {
            if (error) {
              return res.status(500).json({ error: `查询源数据失败: ${error.message}` });
            }

            if (results.length === 0) {
              return res.json({ message: '表同步完成（空表）', count: 0 });
            }

            const columns = Object.keys(results[0]);
            const placeholders = columns.map(() => '?').join(', ');
            const insertSQL = `INSERT INTO \`${table}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;

            let insertCount = 0;
            const insertPromises = results.map(row => {
              return new Promise((resolve, reject) => {
                const values = columns.map(col => row[col]);
                targetConnection.query(insertSQL, values, (error) => {
                  if (error) {
                    reject(error);
                  } else {
                    insertCount++;
                    resolve();
                  }
                });
              });
            });

            Promise.all(insertPromises)
              .then(() => {
                res.json({ message: '表同步完成', count: insertCount });
              })
              .catch((error) => {
                res.status(500).json({ error: `插入数据失败: ${error.message}` });
              });
          });
        });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`MySQL同步工具运行在 http://localhost:${port}`);
});