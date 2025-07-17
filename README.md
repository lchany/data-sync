# MySQL数据同步工具

基于Spring Boot + React的MySQL数据同步工具，支持通过Web界面查看数据库表并进行同步操作。

## 技术栈

- **后端**: Spring Boot 2.7.14, Java 11, MySQL Connector
- **前端**: React 18, Ant Design 5, Axios

## 功能特性

- 查看源MySQL数据库的所有库和表
- 点击按钮同步整个表的数据到目标数据库
- 实时显示同步状态和结果
- 友好的Web界面操作

## 项目结构

```
data-sync/
├── src/                    # Spring Boot后端源码
│   └── main/
│       ├── java/          # Java源码
│       └── resources/     # 配置文件
├── frontend/              # React前端项目
│   ├── src/              # 前端源码
│   └── public/           # 静态资源
├── pom.xml               # Maven配置
└── README.md
```

## 快速开始

### 1. 配置数据库连接

修改 `src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    source:
      jdbc-url: jdbc:mysql://源数据库IP:3306?useSSL=false
      username: 用户名
      password: 密码
    target:
      jdbc-url: jdbc:mysql://目标数据库IP:3306?useSSL=false
      username: 用户名
      password: 密码
```

### 2. 启动后端服务

```bash
# 安装依赖并编译
mvn clean install

# 启动Spring Boot应用
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 3. 启动前端服务

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端服务将在 `http://localhost:3000` 启动

## API接口

- `GET /api/databases` - 获取所有数据库列表
- `GET /api/tables/{database}` - 获取指定数据库的表列表
- `POST /api/sync` - 同步指定表的数据

## 注意事项

- 同步操作会**完全覆盖**目标表的数据
- 确保目标数据库有足够的权限进行创建库、表和插入数据操作
- 大表同步可能需要较长时间，请耐心等待
- 建议在非生产环境测试后再用于生产环境

## 开发说明

### 后端开发

- 主要业务逻辑在 `DataSyncService` 类中
- 使用 `JdbcTemplate` 进行数据库操作
- 支持双数据源配置

### 前端开发

- 使用 React Hooks 进行状态管理
- 使用 Ant Design 组件库
- 通过 proxy 配置实现开发环境的API代理