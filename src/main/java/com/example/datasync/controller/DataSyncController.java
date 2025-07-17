package com.example.datasync.controller;

import com.example.datasync.dto.*;
import com.example.datasync.service.DataSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DataSyncController {

    private final DataSyncService dataSyncService;

    @GetMapping("/databases")
    public List<String> getDatabases() {
        log.info("获取数据库列表");
        return dataSyncService.getDatabases();
    }

    @GetMapping("/tables/{database}")
    public List<String> getTables(@PathVariable String database) {
        log.info("获取数据库 {} 的表列表", database);
        return dataSyncService.getTables(database);
    }

    @PostMapping("/sync")
    public SyncResponse syncTable(@RequestBody SyncRequest request) {
        log.info("同步表: {}.{}", request.getDatabase(), request.getTable());
        return dataSyncService.syncTable(request.getDatabase(), request.getTable());
    }
}