# Requirements Document

## Introduction

本需求文档定义了 PPT 下载组件广告优化功能的完整需求。该功能旨在将当前的 Mock 广告实现升级为生产级功能，实现广告观看 → 积分奖励 → 下载解锁的完整流程，并添加后端验证和防刷机制保护系统安全。

## Glossary

- **Download_System**: PPT 下载系统，负责处理用户下载 PPT 模板的完整流程
- **Ad_Watch_System**: 广告观看系统，负责管理用户观看广告获取积分的流程
- **Credit_System**: 积分系统，负责管理用户积分的获取、消耗和余额
- **Watch_Token**: 观看令牌，用于验证广告观看开始的一次性令牌
- **Download_Token**: 下载令牌，用于验证广告观看完成后的下载权限
- **Download_Method**: 下载方式，包括 firstFree（首次免费）、credits（积分下载）、ad（广告下载）
- **Rate_Limiter**: 频率限制器，用于防止用户刷取积分的防护机制

## Requirements

### Requirement 1: 广告观看开始验证

**User Story:** As a user, I want to start watching an ad to earn credits, so that I can download PPT templates for free.

#### Acceptance Criteria

1. WHEN a user requests to start watching an ad THEN the Ad_Watch_System SHALL generate a unique Watch_Token and record the start time
2. WHEN the Ad_Watch_System generates a Watch_Token THEN the Ad_Watch_System SHALL store the token with pending status in the ad_watch_record table
3. WHEN a user has exceeded the daily watch limit THEN the Ad_Watch_System SHALL reject the request and return an appropriate error message
4. WHEN the same IP address has exceeded the daily IP limit THEN the Ad_Watch_System SHALL reject the request and return an appropriate error message
5. WHEN a Watch_Token is generated THEN the Ad_Watch_System SHALL set an expiration time of 5 minutes

### Requirement 2: 广告观看完成验证

**User Story:** As a user, I want to complete watching an ad and receive credits, so that I can use them to download PPT templates.

#### Acceptance Criteria

1. WHEN a user submits a Watch_Token to complete watching THEN the Ad_Watch_System SHALL verify the token exists and has pending status
2. WHEN the Ad_Watch_System verifies a Watch_Token THEN the Ad_Watch_System SHALL check that at least 25 seconds have elapsed since the start time
3. WHEN the Watch_Token verification passes THEN the Ad_Watch_System SHALL award credits to the user and generate a Download_Token
4. WHEN the Watch_Token has expired THEN the Ad_Watch_System SHALL reject the request and return a token expired error
5. WHEN the Watch_Token has already been used THEN the Ad_Watch_System SHALL reject the request and return a token already used error
6. WHEN credits are awarded THEN the Credit_System SHALL record the transaction with AD_REWARD type

### Requirement 3: 下载方式验证

**User Story:** As a user, I want to download PPT templates using different methods, so that I can choose the most convenient option.

#### Acceptance Criteria

1. WHEN a user requests download with method 'firstFree' THEN the Download_System SHALL verify the user has not downloaded this PPT before
2. WHEN a user requests download with method 'credits' THEN the Download_System SHALL verify the user has sufficient credit balance
3. WHEN a user requests download with method 'ad' THEN the Download_System SHALL verify the Download_Token is valid and unused
4. WHEN download verification passes THEN the Download_System SHALL record the download in user_download_history table
5. WHEN download with method 'credits' succeeds THEN the Credit_System SHALL deduct the required credits from user balance

### Requirement 4: 用户下载状态查询

**User Story:** As a user, I want to see my download status for a PPT, so that I can know which download options are available to me.

#### Acceptance Criteria

1. WHEN a user opens the download modal THEN the Download_System SHALL query the user's download history for the specific PPT
2. WHEN the user has not downloaded the PPT before THEN the Download_System SHALL indicate first free download is available
3. WHEN the user has downloaded the PPT before THEN the Download_System SHALL disable the first free download option
4. WHEN querying download status THEN the Download_System SHALL return the user's current credit balance

### Requirement 5: 防刷机制

**User Story:** As a system administrator, I want to prevent abuse of the ad reward system, so that the system remains fair and sustainable.

#### Acceptance Criteria

1. WHILE the Rate_Limiter is active THEN the Ad_Watch_System SHALL limit each user to a maximum of 10 completed ad watches per day
2. WHILE the Rate_Limiter is active THEN the Ad_Watch_System SHALL limit each IP address to a maximum of 20 completed ad watches per day
3. WHEN a Watch_Token is submitted THEN the Ad_Watch_System SHALL verify the elapsed time is at least 25 seconds
4. WHEN a Download_Token is used THEN the Download_System SHALL mark it as consumed to prevent reuse

### Requirement 6: 前端广告观看流程

**User Story:** As a user, I want a smooth ad watching experience, so that I can easily earn credits and download templates.

#### Acceptance Criteria

1. WHEN a user selects ad download method and clicks continue THEN the Download_Modal SHALL request a Watch_Token from the backend
2. WHEN the Watch_Token is received THEN the Download_Modal SHALL start a 30-second countdown timer
3. WHEN the countdown reaches zero THEN the Download_Modal SHALL automatically submit the Watch_Token for completion
4. WHEN ad completion is verified THEN the Download_Modal SHALL display the credits earned and enable the download button
5. IF the ad watch fails THEN the Download_Modal SHALL display an appropriate error message and allow retry

### Requirement 7: 积分系统集成

**User Story:** As a user, I want my ad-earned credits to be properly tracked, so that I can use them for future downloads.

#### Acceptance Criteria

1. WHEN credits are awarded for ad watching THEN the Credit_System SHALL add the credits to the user's balance
2. WHEN credits are awarded THEN the Credit_System SHALL create a transaction record with type AD_REWARD
3. WHEN displaying credit balance THEN the Download_Modal SHALL show the user's current available credits
4. WHEN credits are consumed for download THEN the Credit_System SHALL create a transaction record with type USAGE

### Requirement 8: 配置管理

**User Story:** As a system administrator, I want to configure ad reward parameters, so that I can adjust the system behavior without code changes.

#### Acceptance Criteria

1. THE Download_System SHALL read ad reward configuration from websiteConfig
2. THE Ad_Watch_System SHALL use configurable values for credits per watch, watch duration, and daily limits
3. WHEN ad reward is disabled in configuration THEN the Download_Modal SHALL hide the ad download option
