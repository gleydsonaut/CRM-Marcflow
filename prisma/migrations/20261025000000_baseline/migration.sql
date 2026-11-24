-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPERADMIN', 'OWNER', 'STAFF') NOT NULL DEFAULT 'OWNER',
    `apiKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_apiKey_key`(`apiKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DISCONNECTED',
    `qr` TEXT NULL,
    `config` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contact` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `jid` VARCHAR(191) NOT NULL,
    `lid` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `notify` VARCHAR(191) NULL,
    `verifiedName` VARCHAR(191) NULL,
    `remoteJidAlt` VARCHAR(191) NULL,
    `profilePic` TEXT NULL,
    `data` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `studentId` VARCHAR(191) NULL,

    INDEX `Contact_studentId_idx`(`studentId`),
    UNIQUE INDEX `Contact_sessionId_jid_key`(`sessionId`, `jid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmPipeline` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmPipeline_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmStage` (
    `id` VARCHAR(191) NOT NULL,
    `pipelineId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#25D366',
    `position` INTEGER NOT NULL,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `terminalStatus` ENUM('OPEN', 'WON', 'LOST') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmStage_pipelineId_idx`(`pipelineId`),
    UNIQUE INDEX `CrmStage_pipelineId_position_key`(`pipelineId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmDeal` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `pipelineId` VARCHAR(191) NOT NULL,
    `stageId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NULL,
    `contactJid` VARCHAR(191) NULL,
    `conversationId` VARCHAR(191) NULL,
    `productId` VARCHAR(191) NULL,
    `assigneeId` VARCHAR(191) NULL,
    `leadSource` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `valueCents` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BRL',
    `status` ENUM('OPEN', 'WON', 'LOST') NOT NULL DEFAULT 'OPEN',
    `expectedCloseAt` DATETIME(3) NULL,
    `wonAt` DATETIME(3) NULL,
    `lostAt` DATETIME(3) NULL,
    `lostReason` TEXT NULL,
    `notes` TEXT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmDeal_sessionId_status_idx`(`sessionId`, `status`),
    INDEX `CrmDeal_pipelineId_stageId_position_idx`(`pipelineId`, `stageId`, `position`),
    INDEX `CrmDeal_contactId_idx`(`contactId`),
    INDEX `CrmDeal_assigneeId_idx`(`assigneeId`),
    INDEX `CrmDeal_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `initials` VARCHAR(191) NULL,
    `avatarColor` VARCHAR(191) NULL DEFAULT '#2563EB',
    `title` VARCHAR(191) NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserPermission` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `module` ENUM('DASHBOARD', 'INBOX', 'CONTACTS', 'CRM', 'STUDENTS', 'AI', 'REPORTS', 'AUTOMATION', 'BROADCAST', 'SESSIONS', 'SETTINGS', 'USERS', 'INTEGRATIONS') NOT NULL,
    `action` ENUM('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserPermission_userId_idx`(`userId`),
    UNIQUE INDEX `UserPermission_userId_module_action_key`(`userId`, `module`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceQueue` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#25D366',
    `isAiQueue` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceQueue_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `ServiceQueue_sessionId_name_key`(`sessionId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QueueMembership` (
    `id` VARCHAR(191) NOT NULL,
    `queueId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QueueMembership_userId_idx`(`userId`),
    UNIQUE INDEX `QueueMembership_queueId_userId_key`(`queueId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmConversation` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NULL,
    `chatJid` VARCHAR(191) NOT NULL,
    `queueId` VARCHAR(191) NULL,
    `assigneeId` VARCHAR(191) NULL,
    `status` ENUM('NEW', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED') NOT NULL DEFAULT 'NEW',
    `leadSource` VARCHAR(191) NULL,
    `profile` TEXT NULL,
    `aiEnabled` BOOLEAN NOT NULL DEFAULT false,
    `aiSummary` TEXT NULL,
    `lastActivityAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CrmConversation_contactId_key`(`contactId`),
    INDEX `CrmConversation_sessionId_status_idx`(`sessionId`, `status`),
    INDEX `CrmConversation_queueId_status_idx`(`queueId`, `status`),
    INDEX `CrmConversation_assigneeId_status_idx`(`assigneeId`, `status`),
    UNIQUE INDEX `CrmConversation_sessionId_chatJid_key`(`sessionId`, `chatJid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConversationNote` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ConversationNote_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConversationTransfer` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `fromQueueId` VARCHAR(191) NULL,
    `toQueueId` VARCHAR(191) NULL,
    `fromAssigneeId` VARCHAR(191) NULL,
    `toAssigneeId` VARCHAR(191) NULL,
    `transferredById` VARCHAR(191) NOT NULL,
    `reason` TEXT NULL,
    `summary` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConversationTransfer_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `provider` ENUM('HOTMART', 'HUBLA', 'EDUZZ', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
    `externalId` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `priceCents` INTEGER NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BRL',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Product_sessionId_isActive_idx`(`sessionId`, `isActive`),
    UNIQUE INDEX `Product_sessionId_provider_externalId_key`(`sessionId`, `provider`, `externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Student` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DELINQUENT', 'CANCELED', 'REFUNDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Student_email_idx`(`email`),
    INDEX `Student_phone_idx`(`phone`),
    INDEX `Student_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Purchase` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `provider` ENUM('HOTMART', 'HUBLA', 'EDUZZ', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
    `externalCode` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PAID', 'ACTIVE', 'OVERDUE', 'CANCELED', 'REFUNDED', 'CHARGEBACK') NOT NULL DEFAULT 'PENDING',
    `grossCents` INTEGER NOT NULL DEFAULT 0,
    `feeCents` INTEGER NOT NULL DEFAULT 0,
    `netCents` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BRL',
    `paymentMethod` VARCHAR(191) NULL,
    `planName` VARCHAR(191) NULL,
    `installments` INTEGER NULL,
    `installmentPaid` INTEGER NULL,
    `purchasedAt` DATETIME(3) NULL,
    `lastChargedAt` DATETIME(3) NULL,
    `renewsAt` DATETIME(3) NULL,
    `details` TEXT NULL,
    `externalPayload` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Purchase_studentId_status_idx`(`studentId`, `status`),
    INDEX `Purchase_productId_idx`(`productId`),
    INDEX `Purchase_provider_purchasedAt_idx`(`provider`, `purchasedAt`),
    UNIQUE INDEX `Purchase_provider_externalCode_key`(`provider`, `externalCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiAgent` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `queueId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `instructions` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AiAgent_sessionId_isActive_idx`(`sessionId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiHandoff` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `targetQueueId` VARCHAR(191) NULL,
    `targetUserId` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `summary` TEXT NULL,
    `outcome` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiHandoff_agentId_createdAt_idx`(`agentId`, `createdAt`),
    INDEX `AiHandoff_conversationId_idx`(`conversationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiReviewItem` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `detail` TEXT NOT NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,

    INDEX `AiReviewItem_agentId_status_idx`(`agentId`, `status`),
    INDEX `AiReviewItem_sessionId_createdAt_idx`(`sessionId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IntegrationConnection` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `provider` ENUM('HOTMART', 'HUBLA', 'EDUZZ') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `credentialsEncrypted` TEXT NULL,
    `webhookSecretEncrypted` TEXT NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `IntegrationConnection_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `IntegrationConnection_provider_name_key`(`provider`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IntegrationEvent` (
    `id` VARCHAR(191) NOT NULL,
    `connectionId` VARCHAR(191) NOT NULL,
    `externalEventId` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'RECEIVED',
    `error` TEXT NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `IntegrationEvent_connectionId_status_createdAt_idx`(`connectionId`, `status`, `createdAt`),
    UNIQUE INDEX `IntegrationEvent_connectionId_externalEventId_key`(`connectionId`, `externalEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `remoteJid` VARCHAR(191) NOT NULL,
    `senderJid` VARCHAR(191) NULL,
    `fromMe` BOOLEAN NOT NULL,
    `keyId` VARCHAR(191) NOT NULL,
    `pushName` VARCHAR(191) NULL,
    `type` ENUM('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACT') NOT NULL DEFAULT 'TEXT',
    `content` TEXT NULL,
    `mediaUrl` TEXT NULL,
    `status` ENUM('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `quoteId` VARCHAR(191) NULL,
    `contactId` VARCHAR(191) NULL,

    INDEX `Message_sessionId_remoteJid_idx`(`sessionId`, `remoteJid`),
    INDEX `Message_sessionId_remoteJid_timestamp_idx`(`sessionId`, `remoteJid`, `timestamp`),
    UNIQUE INDEX `Message_sessionId_keyId_key`(`sessionId`, `keyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Group` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `jid` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `ownerJid` VARCHAR(191) NULL,
    `participants` JSON NULL,
    `creation` DATETIME(3) NULL,
    `restrict` BOOLEAN NULL,
    `announce` BOOLEAN NULL,
    `metadata` JSON NULL,
    `inviteCode` VARCHAR(191) NULL,
    `isCommunity` BOOLEAN NOT NULL DEFAULT false,
    `linkedParentJid` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Group_sessionId_jid_key`(`sessionId`, `jid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutoReply` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `matchType` VARCHAR(191) NOT NULL,
    `response` TEXT NULL,
    `isMedia` BOOLEAN NOT NULL DEFAULT false,
    `mediaUrl` VARCHAR(191) NULL,
    `mediaType` VARCHAR(191) NULL,
    `triggerType` VARCHAR(191) NOT NULL DEFAULT 'ALL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Story` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `jid` VARCHAR(191) NOT NULL,
    `content` TEXT NULL,
    `mediaUrl` TEXT NULL,
    `type` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `viewed` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduledMessage` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `jid` VARCHAR(191) NOT NULL,
    `content` TEXT NULL,
    `mediaUrl` VARCHAR(191) NULL,
    `mediaType` VARCHAR(191) NULL,
    `sendAt` DATETIME(3) NOT NULL,
    `cronExpression` VARCHAR(191) NULL,
    `recurrenceRule` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthState` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,

    UNIQUE INDEX `AuthState_sessionId_key_key`(`sessionId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Webhook` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `secret` VARCHAR(191) NULL,
    `events` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookLog` (
    `id` VARCHAR(191) NOT NULL,
    `webhookId` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `requestUrl` TEXT NOT NULL,
    `requestHeaders` JSON NULL,
    `requestBody` JSON NULL,
    `responseStatusCode` INTEGER NULL,
    `responseBody` TEXT NULL,
    `responseTimeMs` INTEGER NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WebhookLog_webhookId_idx`(`webhookId`),
    INDEX `WebhookLog_webhookId_createdAt_idx`(`webhookId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BotConfig` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `botName` VARCHAR(191) NOT NULL DEFAULT 'MarcFlow Bot',
    `botMode` ENUM('ALL', 'OWNER', 'SPECIFIC', 'BLACKLIST') NOT NULL DEFAULT 'OWNER',
    `botAllowedJids` JSON NULL,
    `botBlockedJids` JSON NULL,
    `autoReplyMode` ENUM('ALL', 'OWNER', 'SPECIFIC', 'BLACKLIST') NOT NULL DEFAULT 'ALL',
    `autoReplyAllowedJids` JSON NULL,
    `autoReplyBlockedJids` JSON NULL,
    `enableSticker` BOOLEAN NOT NULL DEFAULT true,
    `enableVideoSticker` BOOLEAN NOT NULL DEFAULT true,
    `maxStickerDuration` INTEGER NOT NULL DEFAULT 10,
    `enablePing` BOOLEAN NOT NULL DEFAULT true,
    `enableUptime` BOOLEAN NOT NULL DEFAULT true,
    `removeBgApiKey` VARCHAR(191) NULL,
    `prefix` VARCHAR(191) NOT NULL DEFAULT '#',
    `antiSpamEnabled` BOOLEAN NOT NULL DEFAULT false,
    `spamLimit` INTEGER NOT NULL DEFAULT 5,
    `spamInterval` INTEGER NOT NULL DEFAULT 10,
    `spamDelayMin` INTEGER NOT NULL DEFAULT 1000,
    `spamDelayMax` INTEGER NOT NULL DEFAULT 3000,
    `welcomeMessage` TEXT NULL,
    `autoRead` BOOLEAN NOT NULL DEFAULT false,
    `alwaysOnline` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BotConfig_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemConfig` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `appName` VARCHAR(191) NOT NULL DEFAULT 'MarcFlow',
    `logoUrl` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/Sao_Paulo',
    `enableRegistration` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Label` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` INTEGER NOT NULL DEFAULT 0,
    `colorHex` VARCHAR(191) NOT NULL DEFAULT '#FF0000',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Label_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `Label_sessionId_name_key`(`sessionId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatLabel` (
    `id` VARCHAR(191) NOT NULL,
    `labelId` VARCHAR(191) NOT NULL,
    `chatJid` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatLabel_chatJid_idx`(`chatJid`),
    INDEX `ChatLabel_labelId_idx`(`labelId`),
    UNIQUE INDEX `ChatLabel_labelId_chatJid_key`(`labelId`, `chatJid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'INFO',
    `read` BOOLEAN NOT NULL DEFAULT false,
    `href` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessionAccess` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SessionAccess_userId_idx`(`userId`),
    INDEX `SessionAccess_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `SessionAccess_sessionId_userId_key`(`sessionId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BroadcastLog` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `total` INTEGER NOT NULL,
    `sent` INTEGER NOT NULL DEFAULT 0,
    `failed` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'running',
    `delay` INTEGER NOT NULL DEFAULT 2000,
    `name` VARCHAR(191) NULL,
    `mediaAssetId` VARCHAR(191) NULL,
    `pauseOnFailure` BOOLEAN NOT NULL DEFAULT false,
    `skipOptedOut` BOOLEAN NOT NULL DEFAULT true,
    `scheduledAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `BroadcastLog_sessionId_idx`(`sessionId`),
    INDEX `BroadcastLog_sessionId_startedAt_idx`(`sessionId`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BroadcastRecipient` (
    `id` VARCHAR(191) NOT NULL,
    `broadcastLogId` VARCHAR(191) NOT NULL,
    `jid` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `error` TEXT NULL,
    `sentAt` DATETIME(3) NULL,

    INDEX `BroadcastRecipient_broadcastLogId_idx`(`broadcastLogId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Flow` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED') NOT NULL DEFAULT 'DRAFT',
    `draftGraph` JSON NOT NULL,
    `draftRevision` INTEGER NOT NULL DEFAULT 0,
    `publishedGraph` JSON NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Flow_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlowTrigger` (
    `id` VARCHAR(191) NOT NULL,
    `flowId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NULL,
    `matchType` VARCHAR(191) NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,

    INDEX `FlowTrigger_flowId_idx`(`flowId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlowRun` (
    `id` VARCHAR(191) NOT NULL,
    `flowId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `contactJid` VARCHAR(191) NOT NULL,
    `status` ENUM('RUNNING', 'WAITING_INPUT', 'WAITING_DELAY', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'RUNNING',
    `graph` JSON NOT NULL,
    `isTest` BOOLEAN NOT NULL DEFAULT false,
    `currentNodeId` VARCHAR(191) NULL,
    `wait` JSON NULL,
    `resumeAt` DATETIME(3) NULL,
    `stepCount` INTEGER NOT NULL DEFAULT 0,
    `lastKeyId` VARCHAR(191) NULL,
    `error` TEXT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FlowRun_sessionId_contactJid_status_idx`(`sessionId`, `contactJid`, `status`),
    INDEX `FlowRun_status_resumeAt_idx`(`status`, `resumeAt`),
    INDEX `FlowRun_flowId_startedAt_idx`(`flowId`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlowRunLog` (
    `id` VARCHAR(191) NOT NULL,
    `runId` VARCHAR(191) NOT NULL,
    `nodeId` VARCHAR(191) NULL,
    `event` VARCHAR(191) NOT NULL,
    `detail` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FlowRunLog_runId_createdAt_idx`(`runId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlowNodeStat` (
    `flowId` VARCHAR(191) NOT NULL,
    `nodeId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`flowId`, `nodeId`, `key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FieldDefinition` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FieldDefinition_sessionId_scope_key_key`(`sessionId`, `scope`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BotVariable` (
    `sessionId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`sessionId`, `key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlowAsset` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `mime` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FlowAsset_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactFlowData` (
    `sessionId` VARCHAR(191) NOT NULL,
    `contactJid` VARCHAR(191) NOT NULL,
    `fields` JSON NULL,
    `pausedUntil` DATETIME(3) NULL,
    `autoReplyOffUntil` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`sessionId`, `contactJid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatState` (
    `sessionId` VARCHAR(191) NOT NULL,
    `jid` VARCHAR(191) NOT NULL,
    `unreadCount` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`sessionId`, `jid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuickReply` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `actions` JSON NOT NULL,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `QuickReply_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuickReplyCategory` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#25D366',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `QuickReplyCategory_sessionId_name_key`(`sessionId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupCategory` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nameKey` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#10B981',
    `icon` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GroupCategory_sessionId_nameKey_key`(`sessionId`, `nameKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupCategoryLink` (
    `sessionId` VARCHAR(191) NOT NULL,
    `groupJid` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GroupCategoryLink_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`sessionId`, `groupJid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BroadcastDraft` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `message` TEXT NOT NULL,
    `recipients` JSON NOT NULL,
    `mediaAssetId` VARCHAR(191) NULL,
    `intervalMs` INTEGER NOT NULL DEFAULT 10000,
    `pauseOnFailure` BOOLEAN NOT NULL DEFAULT false,
    `skipOptedOut` BOOLEAN NOT NULL DEFAULT true,
    `scheduledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BroadcastDraft_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BroadcastOptOut` (
    `sessionId` VARCHAR(191) NOT NULL,
    `jid` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`sessionId`, `jid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArchiveJob` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `accountJid` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'running',
    `phase` VARCHAR(191) NOT NULL DEFAULT 'scan',
    `includeMedia` BOOLEAN NOT NULL DEFAULT false,
    `chatJids` JSON NULL,
    `cursor` JSON NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ArchiveJob_sessionId_createdAt_idx`(`sessionId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArchiveChat` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `jid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `isGroup` BOOLEAN NOT NULL DEFAULT false,
    `folder` VARCHAR(191) NOT NULL,
    `backfillDone` BOOLEAN NOT NULL DEFAULT false,
    `backfillNote` TEXT NULL,
    `backfillError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ArchiveChat_sessionId_backfillDone_idx`(`sessionId`, `backfillDone`),
    UNIQUE INDEX `ArchiveChat_sessionId_jid_key`(`sessionId`, `jid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArchiveMessage` (
    `id` VARCHAR(191) NOT NULL,
    `chatId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `keyId` VARCHAR(191) NOT NULL,
    `fromMe` BOOLEAN NOT NULL,
    `senderJid` VARCHAR(191) NULL,
    `senderName` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'TEXT',
    `text` LONGTEXT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `quotedId` VARCHAR(191) NULL,
    `raw` LONGTEXT NULL,
    `mediaState` VARCHAR(191) NOT NULL DEFAULT 'none',
    `mediaFile` VARCHAR(191) NULL,
    `mediaMime` VARCHAR(191) NULL,
    `mediaSize` INTEGER NULL,
    `mediaError` TEXT NULL,

    INDEX `ArchiveMessage_chatId_timestamp_id_idx`(`chatId`, `timestamp`, `id`),
    INDEX `ArchiveMessage_sessionId_mediaState_idx`(`sessionId`, `mediaState`),
    UNIQUE INDEX `ArchiveMessage_sessionId_keyId_key`(`sessionId`, `keyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmPipeline` ADD CONSTRAINT `CrmPipeline_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmStage` ADD CONSTRAINT `CrmStage_pipelineId_fkey` FOREIGN KEY (`pipelineId`) REFERENCES `CrmPipeline`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmDeal` ADD CONSTRAINT `CrmDeal_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmDeal` ADD CONSTRAINT `CrmDeal_pipelineId_fkey` FOREIGN KEY (`pipelineId`) REFERENCES `CrmPipeline`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmDeal` ADD CONSTRAINT `CrmDeal_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `CrmStage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmDeal` ADD CONSTRAINT `CrmDeal_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmDeal` ADD CONSTRAINT `CrmDeal_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `CrmConversation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmDeal` ADD CONSTRAINT `CrmDeal_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmDeal` ADD CONSTRAINT `CrmDeal_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceQueue` ADD CONSTRAINT `ServiceQueue_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QueueMembership` ADD CONSTRAINT `QueueMembership_queueId_fkey` FOREIGN KEY (`queueId`) REFERENCES `ServiceQueue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QueueMembership` ADD CONSTRAINT `QueueMembership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmConversation` ADD CONSTRAINT `CrmConversation_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmConversation` ADD CONSTRAINT `CrmConversation_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmConversation` ADD CONSTRAINT `CrmConversation_queueId_fkey` FOREIGN KEY (`queueId`) REFERENCES `ServiceQueue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmConversation` ADD CONSTRAINT `CrmConversation_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationNote` ADD CONSTRAINT `ConversationNote_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `CrmConversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationNote` ADD CONSTRAINT `ConversationNote_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationTransfer` ADD CONSTRAINT `ConversationTransfer_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `CrmConversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationTransfer` ADD CONSTRAINT `ConversationTransfer_transferredById_fkey` FOREIGN KEY (`transferredById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAgent` ADD CONSTRAINT `AiAgent_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAgent` ADD CONSTRAINT `AiAgent_queueId_fkey` FOREIGN KEY (`queueId`) REFERENCES `ServiceQueue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiHandoff` ADD CONSTRAINT `AiHandoff_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AiAgent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiHandoff` ADD CONSTRAINT `AiHandoff_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `CrmConversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IntegrationConnection` ADD CONSTRAINT `IntegrationConnection_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IntegrationConnection` ADD CONSTRAINT `IntegrationConnection_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IntegrationEvent` ADD CONSTRAINT `IntegrationEvent_connectionId_fkey` FOREIGN KEY (`connectionId`) REFERENCES `IntegrationConnection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Group` ADD CONSTRAINT `Group_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoReply` ADD CONSTRAINT `AutoReply_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Story` ADD CONSTRAINT `Story_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduledMessage` ADD CONSTRAINT `ScheduledMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Webhook` ADD CONSTRAINT `Webhook_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Webhook` ADD CONSTRAINT `Webhook_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebhookLog` ADD CONSTRAINT `WebhookLog_webhookId_fkey` FOREIGN KEY (`webhookId`) REFERENCES `Webhook`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BotConfig` ADD CONSTRAINT `BotConfig_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatLabel` ADD CONSTRAINT `ChatLabel_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `Label`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionAccess` ADD CONSTRAINT `SessionAccess_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionAccess` ADD CONSTRAINT `SessionAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BroadcastRecipient` ADD CONSTRAINT `BroadcastRecipient_broadcastLogId_fkey` FOREIGN KEY (`broadcastLogId`) REFERENCES `BroadcastLog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Flow` ADD CONSTRAINT `Flow_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FlowTrigger` ADD CONSTRAINT `FlowTrigger_flowId_fkey` FOREIGN KEY (`flowId`) REFERENCES `Flow`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FlowRun` ADD CONSTRAINT `FlowRun_flowId_fkey` FOREIGN KEY (`flowId`) REFERENCES `Flow`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FlowRunLog` ADD CONSTRAINT `FlowRunLog_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `FlowRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuickReply` ADD CONSTRAINT `QuickReply_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `QuickReplyCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupCategoryLink` ADD CONSTRAINT `GroupCategoryLink_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `GroupCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArchiveChat` ADD CONSTRAINT `ArchiveChat_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArchiveMessage` ADD CONSTRAINT `ArchiveMessage_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `ArchiveChat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
