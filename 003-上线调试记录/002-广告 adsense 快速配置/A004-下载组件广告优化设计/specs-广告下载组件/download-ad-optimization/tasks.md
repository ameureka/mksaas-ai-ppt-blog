# Implementation Plan

## Phase 1: 基础设施和配置

- [x] 1. 添加广告奖励配置
  - [x] 1.1 在 src/types/index.ts 添加 AdRewardConfig 类型定义
    - 定义 enable, creditsPerWatch, watchDuration, minWatchDuration, tokenExpireMinutes, dailyLimitPerUser, dailyLimitPerIP 字段
    - _Requirements: 8.1, 8.2_
  - [x] 1.2 在 src/config/website.tsx 添加 adReward 配置
    - 添加默认配置值：creditsPerWatch=5, watchDuration=30, minWatchDuration=25, tokenExpireMinutes=5, dailyLimitPerUser=10, dailyLimitPerIP=20
    - _Requirements: 8.1, 8.2, 8.3_

## Phase 2: 核心服务层实现

- [x] 2. 实现频率限制服务
  - [x] 2.1 创建 src/lib/ad-watch/rate-limiter.ts
    - 实现 checkUserLimit 函数：查询用户今日完成的广告观看次数
    - 实现 checkIPLimit 函数：查询 IP 今日完成的广告观看次数
    - 实现 getUserWatchCount 和 getIPWatchCount 辅助函数
    - _Requirements: 1.3, 1.4, 5.1, 5.2_
  - [x] 2.2 编写频率限制属性测试
    - **Property 2: Rate Limiting Enforces Daily Limits**
    - **Validates: Requirements 1.3, 1.4, 5.1, 5.2**

- [x] 3. 实现令牌服务
  - [x] 3.1 创建 src/lib/ad-watch/token-service.ts
    - 实现 generateWatchToken：生成唯一令牌，创建 pending 状态记录
    - 实现 validateWatchToken：验证令牌存在、状态、过期时间
    - 实现 completeWatch：验证时间间隔，更新状态为 completed，生成 downloadToken
    - 实现 validateDownloadToken 和 consumeDownloadToken
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.4, 2.5, 5.3, 5.4_
  - [x] 3.2 编写令牌生成属性测试
    - **Property 1: Watch Token Generation Produces Unique Pending Records**
    - **Validates: Requirements 1.1, 1.2, 1.5**
  - [x] 3.3 编写时间验证属性测试
    - **Property 3: Time Validation Enforces Minimum Watch Duration**
    - **Validates: Requirements 2.2, 5.3**
  - [x] 3.4 编写令牌生命周期属性测试
    - **Property 4: Token Lifecycle State Transitions**
    - **Validates: Requirements 2.1, 2.4, 2.5, 5.4**

- [x] 4. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Server Actions 实现

- [x] 5. 实现广告观看 Actions
  - [x] 5.1 创建 src/actions/ad/types.ts
    - 定义 StartWatchRequest, StartWatchResponse, CompleteWatchRequest, CompleteWatchResponse 类型
    - 定义 AdWatchError 枚举
    - _Requirements: 1.1, 2.3_
  - [x] 5.2 创建 src/actions/ad/start-watch.ts
    - 实现 startAdWatchAction：检查频率限制，生成 watchToken
    - 使用 safe-action 包装
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 5.3 创建 src/actions/ad/complete-watch.ts
    - 实现 completeAdWatchAction：验证令牌，发放积分，生成 downloadToken
    - 调用 Credit System 发放 AD_REWARD 类型积分
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 5.4 编写积分奖励属性测试
    - **Property 5: Credit Award Creates Correct Transaction**
    - **Validates: Requirements 2.3, 2.6, 7.1, 7.2**

## Phase 4: API 路由实现

- [x] 6. 实现广告 API 路由
  - [x] 6.1 创建 src/app/api/ad/start-watch/route.ts
    - POST 处理：获取用户 session 和 IP，调用 startAdWatchAction
    - 返回 watchToken 和配置信息
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 6.2 创建 src/app/api/ad/complete-watch/route.ts
    - POST 处理：验证请求体，调用 completeAdWatchAction
    - 返回 downloadToken 和积分信息
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 7. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: 下载系统集成

- [x] 8. 实现下载状态查询
  - [x] 8.1 创建 src/actions/ppt/download-status.ts
    - 实现 getDownloadStatusAction：查询用户下载历史和积分余额
    - 返回 hasDownloadedBefore, isFirstDownloadAvailable, creditBalance
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 8.2 创建 src/app/api/ppts/[id]/download-status/route.ts
    - GET 处理：调用 getDownloadStatusAction
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 8.3 编写下载状态属性测试
    - **Property 9: Download Status Reflects History**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 9. 修改下载 API 支持多种方式
  - [x] 9.1 修改 src/app/api/ppts/[id]/download/route.ts
    - 添加 method 参数解析：firstFree, credits, ad
    - 实现 firstFree 验证：检查下载历史
    - 实现 credits 验证：检查余额并扣除积分
    - 实现 ad 验证：验证并消费 downloadToken
    - 记录下载历史到 user_download_history
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 9.2 编写下载方式验证属性测试
    - **Property 6: Download Method Validation**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  - [x] 9.3 编写下载历史记录属性测试
    - **Property 7: Download History Recording**
    - **Validates: Requirements 3.4**
  - [x] 9.4 编写积分扣除属性测试
    - **Property 8: Credit Deduction Creates Correct Transaction**
    - **Validates: Requirements 3.5, 7.4**

- [x] 10. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: 前端集成

- [x] 11. 修改下载弹窗组件
  - [x] 11.1 修改 src/components/ppt/download/download-modal.tsx
    - 添加 watchToken, downloadToken 状态
    - 实现 fetchDownloadStatus：调用 /api/ppts/{id}/download-status
    - 替换 mock 数据为真实 API 调用
    - _Requirements: 4.1, 6.1_
  - [x] 11.2 实现广告观看流程
    - 实现 handleStartAdWatch：调用 /api/ad/start-watch
    - 修改倒计时逻辑：使用后端返回的 duration
    - 实现 handleAdComplete：调用 /api/ad/complete-watch
    - 显示积分奖励信息
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 11.3 实现下载方式处理
    - 修改 handleGenerateLink：传递 method 和 downloadToken
    - 处理不同下载方式的响应
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 11.4 添加配置控制
    - 根据 websiteConfig.adReward.enable 控制广告选项显示
    - _Requirements: 8.3_

## Phase 7: 测试数据生成器和集成测试

- [x] 12. 创建测试工具
  - [x] 12.1 创建 src/test/generators/ad-watch.ts
    - 实现 userIdArb, pptIdArb, ipAddressArb 生成器
    - 实现 watchTokenArb, adWatchRecordArb 生成器
    - 实现 downloadMethodArb 生成器
  - [x] 12.2 编写配置属性测试
    - **Property 10: Configuration Values Are Respected**
    - **Validates: Requirements 8.1, 8.2**

- [x] 13. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
