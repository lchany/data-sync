package com.example.datasync.service;

import com.example.datasync.dto.SyncResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataSyncService {

    @Qualifier("sourceJdbcTemplate")
    private final JdbcTemplate sourceJdbcTemplate;

    @Qualifier("targetJdbcTemplate")
    private final JdbcTemplate targetJdbcTemplate;

    private static final List<String> SYSTEM_DATABASES = Arrays.asList(
            "information_schema", "performance_schema", "mysql", "sys"
    );

    public List<String> getDatabases() {
        String sql = "SHOW DATABASES";
        List<String> databases = sourceJdbcTemplate.queryForList(sql, String.class);
        return databases.stream()
                .filter(db -> !SYSTEM_DATABASES.contains(db))
                .collect(Collectors.toList());
    }

    public List<String> getTables(String database) {
        String sql = "SHOW TABLES FROM `" + database + "`";
        return sourceJdbcTemplate.queryForList(sql, String.class);
    }

    @Transactional
    public SyncResponse syncTable(String database, String table) {
        try {
            log.info("开始同步表: {}.{}", database, table);
            
            // 1. 创建目标数据库（如果不存在）
            createDatabaseIfNotExists(database);
            
            // 2. 获取源表结构
            String createTableSql = getCreateTableStatement(database, table);
            
            // 3. 在目标数据库创建表
            targetJdbcTemplate.execute("USE `" + database + "`");
            targetJdbcTemplate.execute("DROP TABLE IF EXISTS `" + table + "`");
            targetJdbcTemplate.execute(createTableSql);
            
            // 4. 复制数据
            int recordCount = copyTableData(database, table);
            
            log.info("表同步完成: {}.{}, 共同步 {} 条记录", database, table, recordCount);
            
            return SyncResponse.builder()
                    .success(true)
                    .message("表同步完成")
                    .recordCount(recordCount)
                    .build();
                    
        } catch (Exception e) {
            log.error("同步表失败: {}.{}", database, table, e);
            return SyncResponse.builder()
                    .success(false)
                    .error("同步失败: " + e.getMessage())
                    .build();
        }
    }

    private void createDatabaseIfNotExists(String database) {
        String sql = "CREATE DATABASE IF NOT EXISTS `" + database + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        targetJdbcTemplate.execute(sql);
    }

    private String getCreateTableStatement(String database, String table) {
        String sql = "SHOW CREATE TABLE `" + database + "`.`" + table + "`";
        Map<String, Object> result = sourceJdbcTemplate.queryForMap(sql);
        return (String) result.get("Create Table");
    }

    private int copyTableData(String database, String table) {
        // 查询源表数据
        String selectSql = "SELECT * FROM `" + database + "`.`" + table + "`";
        List<Map<String, Object>> rows = sourceJdbcTemplate.queryForList(selectSql);
        
        if (rows.isEmpty()) {
            return 0;
        }
        
        // 获取列名
        Set<String> columns = rows.get(0).keySet();
        String columnNames = columns.stream()
                .map(col -> "`" + col + "`")
                .collect(Collectors.joining(", "));
        
        // 构建插入SQL
        String placeholders = columns.stream()
                .map(col -> "?")
                .collect(Collectors.joining(", "));
        
        String insertSql = String.format("INSERT INTO `%s`.`%s` (%s) VALUES (%s)",
                database, table, columnNames, placeholders);
        
        // 批量插入数据
        List<Object[]> batchArgs = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Object[] values = columns.stream()
                    .map(row::get)
                    .toArray();
            batchArgs.add(values);
        }
        
        targetJdbcTemplate.batchUpdate(insertSql, batchArgs);
        
        return rows.size();
    }
}