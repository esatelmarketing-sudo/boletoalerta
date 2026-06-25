-- CreateTable
CREATE TABLE `empresas` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `plano` ENUM('FREE', 'BASICO', 'PRO') NOT NULL DEFAULT 'FREE',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `empresas_cnpj_key`(`cnpj`),
    UNIQUE INDEX `empresas_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracoes_wpp` (
    `id` VARCHAR(191) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `evolutionApiUrl` VARCHAR(191) NOT NULL,
    `evolutionApiKey` VARCHAR(191) NOT NULL,
    `instanceName` VARCHAR(191) NOT NULL,
    `telefoneFinanceiro` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `configuracoes_wpp_empresaId_key`(`empresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` VARCHAR(191) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cpfCnpj` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `clientes_empresaId_idx`(`empresaId`),
    UNIQUE INDEX `clientes_empresaId_cpfCnpj_key`(`empresaId`, `cpfCnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boletos` (
    `id` VARCHAR(191) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NULL,
    `tipo` ENUM('PAGAR', 'RECEBER') NOT NULL,
    `status` ENUM('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `descricao` VARCHAR(191) NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `dataVencimento` DATETIME(3) NOT NULL,
    `dataPagamento` DATETIME(3) NULL,
    `numeroDocumento` VARCHAR(191) NULL,
    `linhaDigitavel` TEXT NULL,
    `nossoNumero` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `boletos_empresaId_dataVencimento_idx`(`empresaId`, `dataVencimento`),
    INDEX `boletos_empresaId_status_idx`(`empresaId`, `status`),
    INDEX `boletos_clienteId_idx`(`clienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacoes` (
    `id` VARCHAR(191) NOT NULL,
    `boletoId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('LEMBRETE_5_DIAS', 'LEMBRETE_1_DIA', 'VENCIMENTO_HOJE', 'ATRASO') NOT NULL,
    `status` ENUM('PENDENTE', 'ENVIADO', 'FALHOU') NOT NULL DEFAULT 'PENDENTE',
    `telefone` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `tentativas` INTEGER NOT NULL DEFAULT 0,
    `enviadoEm` DATETIME(3) NULL,
    `erro` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    INDEX `notificacoes_boletoId_idx`(`boletoId`),
    INDEX `notificacoes_status_criadoEm_idx`(`status`, `criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `configuracoes_wpp` ADD CONSTRAINT `configuracoes_wpp_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boletos` ADD CONSTRAINT `boletos_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boletos` ADD CONSTRAINT `boletos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_boletoId_fkey` FOREIGN KEY (`boletoId`) REFERENCES `boletos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
