IF COL_LENGTH('dbo.users', 'resetPasswordTokenHash') IS NULL
BEGIN
  ALTER TABLE [users] ADD [resetPasswordTokenHash] NVARCHAR(64) NULL;
END;

IF COL_LENGTH('dbo.users', 'resetPasswordExpiresAt') IS NULL
BEGIN
  ALTER TABLE [users] ADD [resetPasswordExpiresAt] DATETIMEOFFSET NULL;
END;
