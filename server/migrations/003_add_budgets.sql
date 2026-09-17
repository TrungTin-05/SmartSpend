IF OBJECT_ID(N'dbo.budgets', N'U') IS NULL
BEGIN
  CREATE TABLE [budgets] (
    [id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_budgets] PRIMARY KEY,
    [userId] INT NOT NULL,
    [categoryId] INT NOT NULL,
    [month] INT NOT NULL,
    [year] INT NOT NULL,
    [amount] INT NOT NULL,
    [createdAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_budgets_createdAt] DEFAULT SYSDATETIMEOFFSET(),
    [updatedAt] DATETIMEOFFSET NOT NULL CONSTRAINT [DF_budgets_updatedAt] DEFAULT SYSDATETIMEOFFSET()
  );
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_budgets_users_userId'
)
BEGIN
  ALTER TABLE [budgets]
    ADD CONSTRAINT [FK_budgets_users_userId]
    FOREIGN KEY ([userId]) REFERENCES [users] ([id]);
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_budgets_categories_categoryId'
)
BEGIN
  ALTER TABLE [budgets]
    ADD CONSTRAINT [FK_budgets_categories_categoryId]
    FOREIGN KEY ([categoryId]) REFERENCES [categories] ([id]);
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'UX_budgets_user_category_month_year'
    AND object_id = OBJECT_ID(N'dbo.budgets')
)
BEGIN
  CREATE UNIQUE INDEX [UX_budgets_user_category_month_year]
    ON [budgets] ([userId], [categoryId], [month], [year]);
END;
