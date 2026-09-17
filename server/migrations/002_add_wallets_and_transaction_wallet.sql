IF OBJECT_ID(N'dbo.wallets', N'U') IS NULL
BEGIN
  CREATE TABLE [wallets] (
    [id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_wallets] PRIMARY KEY,
    [userId] INT NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [type] NVARCHAR(30) NOT NULL CONSTRAINT [DF_wallets_type] DEFAULT N'other',
    [initialBalance] INT NOT NULL CONSTRAINT [DF_wallets_initialBalance] DEFAULT 0,
    [createdAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_wallets_createdAt] DEFAULT SYSDATETIMEOFFSET(),
    [updatedAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_wallets_updatedAt] DEFAULT SYSDATETIMEOFFSET()
  );
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.foreign_keys
  WHERE name = N'FK_wallets_users_userId'
)
BEGIN
  ALTER TABLE [wallets]
    ADD CONSTRAINT [FK_wallets_users_userId]
    FOREIGN KEY ([userId]) REFERENCES [users] ([id]);
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'UX_wallets_userId_name'
    AND object_id = OBJECT_ID(N'dbo.wallets')
)
BEGIN
  CREATE UNIQUE INDEX [UX_wallets_userId_name]
    ON [wallets] ([userId], [name]);
END;

IF COL_LENGTH('dbo.transactions', 'walletId') IS NULL
BEGIN
  ALTER TABLE [transactions] ADD [walletId] INT NULL;
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.foreign_keys
  WHERE name = N'FK_transactions_wallets_walletId'
)
BEGIN
  ALTER TABLE [transactions]
    ADD CONSTRAINT [FK_transactions_wallets_walletId]
    FOREIGN KEY ([walletId]) REFERENCES [wallets] ([id]);
END;

INSERT INTO [wallets] ([userId], [name], [type], [initialBalance])
SELECT [u].[id], N'Tài khoản mặc định', N'other', 0
FROM [users] AS [u]
WHERE NOT EXISTS (
  SELECT 1
  FROM [wallets] AS [w]
  WHERE [w].[userId] = [u].[id]
);

UPDATE [t]
SET [walletId] = [w].[id]
FROM [transactions] AS [t]
INNER JOIN [users] AS [u] ON [u].[id] = [t].[userId]
INNER JOIN [wallets] AS [w]
  ON [w].[userId] = [u].[id]
  AND [w].[name] = N'Tài khoản mặc định'
WHERE [t].[walletId] IS NULL;
