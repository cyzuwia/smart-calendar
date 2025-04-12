# 智能科技日历项目 - 数据库模型设计

## 1. 数据库概述

本项目使用SQLite作为数据库，具有轻量级、零配置、高性能等特点，非常适合部署在低配置VPS上。数据库设计遵循关系型数据库的设计原则，确保数据的完整性和一致性。

## 2. 实体关系图 (ER Diagram)

```
+---------------+       +---------------+       +---------------+
|     用户      |       |     事件      |       |    通知设置   |
+---------------+       +---------------+       +---------------+
| id            |<----->| id            |       | id            |
| username      |       | title         |       | user_id       |
| password      |       | description   |       | type          |
| email         |       | start_time    |       | config        |
| is_admin      |       | end_time      |       | enabled       |
| created_at    |       | all_day       |       | created_at    |
+---------------+       | user_id       |       +---------------+
        |               | created_at    |               ^
        |               +---------------+               |
        |                       ^                       |
        |                       |                       |
        v                       |                       |
+---------------+       +---------------+       +---------------+
|    生日信息    |       |    值日表      |       |    通知记录   |
+---------------+       +---------------+       +---------------+
| id            |       | id            |       | id            |
| name          |       | name          |       | user_id       |
| birth_date    |       | duty_date     |       | event_id      |
| user_id       |       | user_id       |       | type          |
| created_at    |       | created_at    |       | status        |
+---------------+       +---------------+       | sent_at       |
                                                +---------------+
```

## 3. 数据表设计

### 3.1 用户表 (users)

存储系统用户信息，包括管理员和普通用户。

| 字段名      | 数据类型      | 约束                | 说明                     |
|------------|--------------|---------------------|--------------------------|
| id         | INTEGER      | PRIMARY KEY         | 用户ID，自增主键          |
| username   | TEXT         | NOT NULL, UNIQUE    | 用户名，唯一              |
| password   | TEXT         | NOT NULL            | 密码（加密存储）          |
| email      | TEXT         | UNIQUE              | 电子邮箱，可用于通知      |
| is_admin   | INTEGER      | DEFAULT 0           | 是否为管理员，0否1是      |
| created_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | 创建时间            |

### 3.2 事件表 (events)

存储用户创建的日历事件。

| 字段名      | 数据类型      | 约束                | 说明                     |
|------------|--------------|---------------------|--------------------------|
| id         | INTEGER      | PRIMARY KEY         | 事件ID，自增主键          |
| title      | TEXT         | NOT NULL            | 事件标题                  |
| description| TEXT         |                     | 事件描述                  |
| start_time | TIMESTAMP    | NOT NULL            | 开始时间                  |
| end_time   | TIMESTAMP    |                     | 结束时间                  |
| all_day    | INTEGER      | DEFAULT 0           | 是否全天事件，0否1是      |
| user_id    | INTEGER      | FOREIGN KEY         | 创建用户ID                |
| created_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | 创建时间            |

### 3.3 生日表 (birthdays)

存储生日信息，用于生日提醒功能。

| 字段名      | 数据类型      | 约束                | 说明                     |
|------------|--------------|---------------------|--------------------------|
| id         | INTEGER      | PRIMARY KEY         | 记录ID，自增主键          |
| name       | TEXT         | NOT NULL            | 姓名                      |
| birth_date | DATE         | NOT NULL            | 出生日期                  |
| user_id    | INTEGER      | FOREIGN KEY         | 关联用户ID                |
| created_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | 创建时间            |

### 3.4 值日表 (duty_roster)

存储值日安排信息。

| 字段名      | 数据类型      | 约束                | 说明                     |
|------------|--------------|---------------------|--------------------------|
| id         | INTEGER      | PRIMARY KEY         | 记录ID，自增主键          |
| name       | TEXT         | NOT NULL            | 值日人姓名                |
| duty_date  | DATE         | NOT NULL            | 值日日期                  |
| user_id    | INTEGER      | FOREIGN KEY         | 关联用户ID                |
| created_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | 创建时间            |

### 3.5 通知设置表 (notification_settings)

存储用户的通知偏好设置。

| 字段名      | 数据类型      | 约束                | 说明                     |
|------------|--------------|---------------------|--------------------------|
| id         | INTEGER      | PRIMARY KEY         | 设置ID，自增主键          |
| user_id    | INTEGER      | NOT NULL, FOREIGN KEY | 用户ID                 |
| type       | TEXT         | NOT NULL            | 通知类型(wxpusher/email/telegram) |
| config     | TEXT         | NOT NULL            | 配置信息(JSON格式)        |
| enabled    | INTEGER      | DEFAULT 1           | 是否启用，0否1是          |
| created_at | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | 创建时间            |

### 3.6 通知记录表 (notification_logs)

记录已发送的通知信息。

| 字段名      | 数据类型      | 约束                | 说明                     |
|------------|--------------|---------------------|--------------------------|
| id         | INTEGER      | PRIMARY KEY         | 记录ID，自增主键          |
| user_id    | INTEGER      | FOREIGN KEY         | 用户ID                   |
| event_id   | INTEGER      | FOREIGN KEY         | 关联事件ID                |
| type       | TEXT         | NOT NULL            | 通知类型                  |
| status     | TEXT         | NOT NULL            | 发送状态(success/failed)  |
| sent_at    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | 发送时间            |

## 4. 索引设计

为提高查询性能，在以下字段上创建索引：

1. users表：username, email
2. events表：user_id, start_time
3. birthdays表：user_id, birth_date
4. duty_roster表：duty_date
5. notification_settings表：user_id, type
6. notification_logs表：user_id, event_id

## 5. 数据关系

1. 用户(users)与事件(events)：一对多关系，一个用户可以创建多个事件
2. 用户(users)与生日信息(birthdays)：一对多关系，一个用户可以添加多个生日信息
3. 用户(users)与值日表(duty_roster)：一对多关系，一个用户可以关联多个值日安排
4. 用户(users)与通知设置(notification_settings)：一对多关系，一个用户可以有多种通知设置
5. 事件(events)与通知记录(notification_logs)：一对多关系，一个事件可以有多条通知记录

## 6. 数据迁移与备份策略

1. **初始化脚本**：提供数据库初始化脚本，自动创建表结构和必要的索引
2. **数据迁移**：提供数据迁移工具，支持版本升级时的数据结构变更
3. **自动备份**：实现定时自动备份功能，确保数据安全
4. **恢复机制**：提供简单的数据恢复机制，便于在数据损坏时快速恢复
