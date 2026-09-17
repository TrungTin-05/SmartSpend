IF OBJECT_ID(N'dbo.monthly_budgets', N'U') IS NULL
BEGIN
  CREATE TABLE [monthly_budgets] (
    [id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_monthly_budgets] PRIMARY KEY,
    [userId] INT NOT NULL,
    [month] INT NOT NULL,
    [year] INT NOT NULL,
    [amount] INT NOT NULL,
    [createdAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_monthly_budgets_createdAt] DEFAULT SYSDATETIMEOFFSET(),
    [updatedAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_monthly_budgets_updatedAt] DEFAULT SYSDATETIMEOFFSET()
  );
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_monthly_budgets_users_userId'
)
BEGIN
  ALTER TABLE [monthly_budgets]
    ADD CONSTRAINT [FK_monthly_budgets_users_userId]
    FOREIGN KEY ([userId]) REFERENCES [users] ([id]);
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'UX_monthly_budgets_user_month_year'
    AND object_id = OBJECT_ID(N'dbo.monthly_budgets')
)
BEGIN
  CREATE UNIQUE INDEX [UX_monthly_budgets_user_month_year]
    ON [monthly_budgets] ([userId], [month], [year]);
END;
