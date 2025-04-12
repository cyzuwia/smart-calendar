# 智能科技日历项目 - API接口设计

## 1. API概述

本文档定义了智能科技日历项目的RESTful API接口，用于前端与后端的数据交互。API遵循RESTful设计原则，使用HTTP标准方法（GET、POST、PUT、DELETE）进行资源操作，并使用JSON作为数据交换格式。

## 2. 基础信息

- **基础URL**: `/api/v1`
- **认证方式**: JWT (JSON Web Token)
- **响应格式**: JSON
- **状态码**:
  - 200: 成功
  - 201: 创建成功
  - 400: 请求错误
  - 401: 未授权
  - 403: 禁止访问
  - 404: 资源不存在
  - 500: 服务器错误

## 3. 认证接口

### 3.1 用户注册

- **URL**: `/auth/register`
- **方法**: `POST`
- **描述**: 注册新用户
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string",
    "email": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "注册成功",
    "data": {
      "id": "number",
      "username": "string",
      "email": "string",
      "created_at": "string"
    }
  }
  ```

### 3.2 用户登录

- **URL**: `/auth/login`
- **方法**: `POST`
- **描述**: 用户登录获取令牌
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "登录成功",
    "data": {
      "token": "string",
      "user": {
        "id": "number",
        "username": "string",
        "email": "string",
        "is_admin": "boolean"
      }
    }
  }
  ```

### 3.3 刷新令牌

- **URL**: `/auth/refresh`
- **方法**: `POST`
- **描述**: 刷新访问令牌
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "message": "令牌刷新成功",
    "data": {
      "token": "string"
    }
  }
  ```

## 4. 用户接口

### 4.1 获取当前用户信息

- **URL**: `/users/me`
- **方法**: `GET`
- **描述**: 获取当前登录用户信息
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "username": "string",
      "email": "string",
      "is_admin": "boolean",
      "created_at": "string"
    }
  }
  ```

### 4.2 更新用户信息

- **URL**: `/users/me`
- **方法**: `PUT`
- **描述**: 更新当前用户信息
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "用户信息更新成功",
    "data": {
      "id": "number",
      "username": "string",
      "email": "string",
      "updated_at": "string"
    }
  }
  ```

## 5. 事件接口

### 5.1 获取事件列表

- **URL**: `/events`
- **方法**: `GET`
- **描述**: 获取用户的事件列表
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  - `start_date`: 开始日期 (YYYY-MM-DD)
  - `end_date`: 结束日期 (YYYY-MM-DD)
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "title": "string",
        "description": "string",
        "start_time": "string",
        "end_time": "string",
        "all_day": "boolean",
        "created_at": "string"
      }
    ]
  }
  ```

### 5.2 创建事件

- **URL**: `/events`
- **方法**: `POST`
- **描述**: 创建新事件
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "title": "string",
    "description": "string",
    "start_time": "string",
    "end_time": "string",
    "all_day": "boolean"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "事件创建成功",
    "data": {
      "id": "number",
      "title": "string",
      "description": "string",
      "start_time": "string",
      "end_time": "string",
      "all_day": "boolean",
      "created_at": "string"
    }
  }
  ```

### 5.3 获取事件详情

- **URL**: `/events/{id}`
- **方法**: `GET`
- **描述**: 获取特定事件详情
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "title": "string",
      "description": "string",
      "start_time": "string",
      "end_time": "string",
      "all_day": "boolean",
      "created_at": "string"
    }
  }
  ```

### 5.4 更新事件

- **URL**: `/events/{id}`
- **方法**: `PUT`
- **描述**: 更新特定事件
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "title": "string",
    "description": "string",
    "start_time": "string",
    "end_time": "string",
    "all_day": "boolean"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "事件更新成功",
    "data": {
      "id": "number",
      "title": "string",
      "description": "string",
      "start_time": "string",
      "end_time": "string",
      "all_day": "boolean",
      "updated_at": "string"
    }
  }
  ```

### 5.5 删除事件

- **URL**: `/events/{id}`
- **方法**: `DELETE`
- **描述**: 删除特定事件
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "message": "事件删除成功"
  }
  ```

## 6. 生日接口

### 6.1 获取生日列表

- **URL**: `/birthdays`
- **方法**: `GET`
- **描述**: 获取用户添加的生日列表
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "name": "string",
        "birth_date": "string",
        "next_birthday": "string",
        "days_remaining": "number",
        "created_at": "string"
      }
    ]
  }
  ```

### 6.2 添加生日

- **URL**: `/birthdays`
- **方法**: `POST`
- **描述**: 添加新生日信息
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "name": "string",
    "birth_date": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "生日信息添加成功",
    "data": {
      "id": "number",
      "name": "string",
      "birth_date": "string",
      "next_birthday": "string",
      "days_remaining": "number",
      "created_at": "string"
    }
  }
  ```

### 6.3 更新生日信息

- **URL**: `/birthdays/{id}`
- **方法**: `PUT`
- **描述**: 更新生日信息
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "name": "string",
    "birth_date": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "生日信息更新成功",
    "data": {
      "id": "number",
      "name": "string",
      "birth_date": "string",
      "next_birthday": "string",
      "days_remaining": "number",
      "updated_at": "string"
    }
  }
  ```

### 6.4 删除生日信息

- **URL**: `/birthdays/{id}`
- **方法**: `DELETE`
- **描述**: 删除生日信息
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "message": "生日信息删除成功"
  }
  ```

## 7. 值日表接口

### 7.1 获取值日表

- **URL**: `/duty-roster`
- **方法**: `GET`
- **描述**: 获取值日表信息
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  - `start_date`: 开始日期 (YYYY-MM-DD)
  - `end_date`: 结束日期 (YYYY-MM-DD)
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "name": "string",
        "duty_date": "string",
        "created_at": "string"
      }
    ]
  }
  ```

### 7.2 添加值日安排 (仅管理员)

- **URL**: `/duty-roster`
- **方法**: `POST`
- **描述**: 添加值日安排
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "name": "string",
    "duty_date": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "值日安排添加成功",
    "data": {
      "id": "number",
      "name": "string",
      "duty_date": "string",
      "created_at": "string"
    }
  }
  ```

### 7.3 批量添加值日安排 (仅管理员)

- **URL**: `/duty-roster/batch`
- **方法**: `POST`
- **描述**: 批量添加值日安排
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "roster": [
      {
        "name": "string",
        "duty_date": "string"
      }
    ]
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "值日安排批量添加成功",
    "data": {
      "count": "number"
    }
  }
  ```

### 7.4 更新值日安排 (仅管理员)

- **URL**: `/duty-roster/{id}`
- **方法**: `PUT`
- **描述**: 更新值日安排
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "name": "string",
    "duty_date": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "值日安排更新成功",
    "data": {
      "id": "number",
      "name": "string",
      "duty_date": "string",
      "updated_at": "string"
    }
  }
  ```

### 7.5 删除值日安排 (仅管理员)

- **URL**: `/duty-roster/{id}`
- **方法**: `DELETE`
- **描述**: 删除值日安排
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "message": "值日安排删除成功"
  }
  ```

## 8. 通知设置接口

### 8.1 获取通知设置

- **URL**: `/notification-settings`
- **方法**: `GET`
- **描述**: 获取用户的通知设置
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "type": "string",
        "config": "object",
        "enabled": "boolean",
        "created_at": "string"
      }
    ]
  }
  ```

### 8.2 创建/更新通知设置

- **URL**: `/notification-settings`
- **方法**: `POST`
- **描述**: 创建或更新通知设置
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "type": "string",
    "config": "object",
    "enabled": "boolean"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "通知设置保存成功",
    "data": {
      "id": "number",
      "type": "string",
      "config": "object",
      "enabled": "boolean",
      "created_at": "string"
    }
  }
  ```

### 8.3 删除通知设置

- **URL**: `/notification-settings/{id}`
- **方法**: `DELETE`
- **描述**: 删除通知设置
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "message": "通知设置删除成功"
  }
  ```

## 9. 管理员接口

### 9.1 获取所有用户 (仅管理员)

- **URL**: `/admin/users`
- **方法**: `GET`
- **描述**: 获取所有用户信息
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "username": "string",
        "email": "string",
        "is_admin": "boolean",
        "created_at": "string"
      }
    ]
  }
  ```

### 9.2 更新用户信息 (仅管理员)

- **URL**: `/admin/users/{id}`
- **方法**: `PUT`
- **描述**: 更新用户信息
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "email": "string",
    "is_admin": "boolean"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "用户信息更新成功",
    "data": {
      "id": "number",
      "username": "string",
      "email": "string",
      "is_admin": "boolean",
      "updated_at": "string"
    }
  }
  ```

### 9.3 删除用户 (仅管理员)

- **URL**: `/admin/users/{id}`
- **方法**: `DELETE`
- **描述**: 删除用户
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "message": "用户删除成功"
  }
  ```

## 10. 系统信息接口

### 10.1 获取当前时间

- **URL**: `/system/time`
- **方法**: `GET`
- **描述**: 获取服务器当前时间
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "timestamp": "number",
      "iso": "string",
      "timezone": "string"
    }
  }
  ```

### 10.2 获取系统状态 (仅管理员)

- **URL**: `/system/status`
- **方法**: `GET`
- **描述**: 获取系统运行状态
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "uptime": "number",
      "memory_usage": "object",
      "disk_usage": "object",
      "user_count": "number",
      "event_count": "number"
    }
  }
  ```

## 11. 错误响应格式

所有API错误响应遵循以下格式：

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

## 12. API版本控制

API使用URL路径中的版本号进行版本控制，当前版本为v1。未来版本更新时，将创建新的版本路径，如`/api/v2`，以确保向后兼容性。
