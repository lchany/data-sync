package com.example.datasync.dto;

import lombok.Data;

@Data
public class SyncRequest {
    private String database;
    private String table;
}