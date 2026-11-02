/*
  KPI hedef öneri raporları — bağımsız kurulum (docs/REPORTS.md "Başka bir Tiger kurulumu")

  KPI uygulaması olmadan, herhangi bir Logo Tiger kurulumunda dbo.report_<KPI kodu>
  view'larını ve dbo.show_report prosedürünü kurar. Migration değildir.

  KULLANIM
    1. Aşağıdaki "AYARLAR" bölümüne Tiger veritabanının adını, firma ve dönem numarasını yazın.
    2. SSMS'te F5 (hangi veritabanı seçili olduğu önemli değildir).
    3. Mesajlar sekmesinde "Kurulum tamam" yazmalıdır. Hata olursa tek bir "KURULUM DURDU"
       mesajı çıkar ve hiçbir şey değişmez (her şey tek transaction içindedir).

    Raporlar varsayılan olarak Tiger veritabanının içine kurulur. Logo tablolarına yalnız
    SELECT gider; veritabanına yalnız view, synonym ve bir prosedür eklenir. Dosya istenildiği
    kadar yeniden çalıştırılabilir (yeni dönem, ortak kasa değişikliği…).

    Sonra:
        SELECT * FROM dbo.report_STORE_SALES ORDER BY SUBE_NR, PARA_BIRIMI;
        EXEC dbo.show_report N'EMPLOYEE_SALES';      -- ay sütunları gerçek ay adıyla

  KURULAN RAPORLAR (14)
    report_STORE_SALES, report_EMPLOYEE_SALES                     ciro (TMT ve USD satırı)
    report_STORE_RECEIPTS, report_EMPLOYEE_RECEIPTS               fiş sayısı
    report_STORE_CUSTOMERS, report_EMPLOYEE_CUSTOMERS             müşteri sayısı
    report_STORE_NEW_CUSTOMERS, report_EMPLOYEE_NEW_CUSTOMERS     yeni müşteri
    report_STORE_RETURNING_CUSTOMERS, report_EMPLOYEE_RETURNING_CUSTOMERS   eski müşteri
    report_STORE_PRODUCT_VARIETY, report_EMPLOYEE_PRODUCT_VARIETY ürün çeşitliliği
    report_STORE_GROUP_SALES, report_EMPLOYEE_GROUP_SALES         malzeme grubu cirosu
  Yardımcılar: item_groups, item_group_coverage (grupsuz satış payı), show_report.

  KURULMAYANLAR
    report_STORE_CONVERSION ve report_STORE_VISITOR_COUNT: günlük ziyaretçi sayısı
    KPI uygulamasında girilir, Tiger'da yoktur.

  GEREKSİNİMLER
    - SQL Server 2017 veya üzeri. Veritabanının compatibility level'ı önemli değildir.
    - Kuran hesabın o veritabanında view/synonym/prosedür oluşturma yetkisi olmalı.

  Ölçüm kuralları ve öneri formülü KPI_DB'dekilerle aynıdır (docs/TIGER_DATA.md,
  docs/REPORTS.md).
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- =========================================================================================
-- AYARLAR
-- =========================================================================================
DECLARE @TigerDb sysname = N'TIGER';                -- Logo Tiger veritabanının adı
DECLARE @FirmNr int = 1;                            -- firma no: 3 → LG_003_…
DECLARE @PeriodNrs nvarchar(100) = N'1';            -- dönem no: 1 → LG_003_01_… ; birden çok dönem: N'1,2'
DECLARE @SharedCustomerCodes nvarchar(4000) = N'';  -- ortak kasa cari kodları (CLCARD.CODE), virgülle; yoksa N''
DECLARE @ReportDb sysname = NULL;                   -- NULL: raporlar Tiger veritabanının içine kurulur.
                                                    -- Ayrı bir veritabanı istenirse adı (aynı sunucuda, önceden açılmış).
-- =========================================================================================

-- Dönemler: Logo yeni mali dönemde yeni tablolar açar (LG_003_02_…). Önceki dönemin
-- müşterileri yeniden "yeni müşteri" sayılmasın diye bütün dönemler birlikte verilir.
-- Ortak kasa: herkese satış yapılan genel cari; hiçbir müşteri raporuna girmez. Aday bulmak
-- için dosyanın sonundaki sorguya bakın.

DECLARE @step nvarchar(128);
DECLARE @message nvarchar(2048);
DECLARE @sql nvarchar(max);

BEGIN TRY
  -- 1) Kontroller
  SET @step = N'Kontroller';
  SET @ReportDb = ISNULL(NULLIF(LTRIM(RTRIM(@ReportDb)), N''), @TigerDb);

  IF CAST(SERVERPROPERTY(N'ProductMajorVersion') AS int) < 14
    THROW 50000, N'SQL Server 2017 veya üzeri gerekir.', 1;

  IF DB_ID(@TigerDb) IS NULL
  BEGIN
    SET @message = CONCAT(
      N'Tiger veritabanı bulunamadı: ', REPLACE(ISNULL(QUOTENAME(@TigerDb), N'NULL'), N'%', N'%%'),
      N'. @TigerDb bu SQL Server''daki Tiger veritabanının adı olmalı.'
    );
    THROW 50000, @message, 1;
  END;

  IF DB_ID(@ReportDb) IS NULL
  BEGIN
    SET @message = CONCAT(
      N'Rapor veritabanı bulunamadı: ', REPLACE(QUOTENAME(@ReportDb), N'%', N'%%'),
      N'. Önce açın ya da @ReportDb''yi NULL bırakın.'
    );
    THROW 50000, @message, 1;
  END;

  IF DB_ID(@ReportDb) <= 4
    THROW 50000, N'Raporlar sistem veritabanına (master, model, msdb, tempdb) kurulmaz.', 1;

  IF @FirmNr IS NULL OR @FirmNr NOT BETWEEN 1 AND 999
    THROW 50000, N'@FirmNr 1 ile 999 arasında bir tam sayı olmalı.', 1;

  -- Comma-separated settings are split by hand: STRING_SPLIT needs compatibility level 130,
  -- Logo databases usually run lower.
  DECLARE @list nvarchar(4000);
  DECLARE @item nvarchar(4000);
  DECLARE @comma int;
  DECLARE @periods TABLE ([nr] int NULL);
  DECLARE @codes TABLE ([code] nvarchar(4000) NOT NULL);

  SET @list = ISNULL(@PeriodNrs, N'') + N',';
  WHILE @list <> N''
  BEGIN
    SET @comma = CHARINDEX(N',', @list);
    SET @item = LTRIM(RTRIM(LEFT(@list, @comma - 1)));
    SET @list = STUFF(@list, 1, @comma, N'');

    IF @item <> N''
      INSERT INTO @periods ([nr]) VALUES (TRY_CAST(@item AS int));
  END;

  IF NOT EXISTS (SELECT 1 FROM @periods)
    OR EXISTS (SELECT 1 FROM @periods WHERE [nr] IS NULL OR [nr] NOT BETWEEN 1 AND 99)
    THROW 50000, N'@PeriodNrs 1 ile 99 arasındaki dönem numaralarıdır, virgülle ayrılır: N''1'' ya da N''1,2''.', 1;

  SET @list = ISNULL(@SharedCustomerCodes, N'') + N',';
  WHILE @list <> N''
  BEGIN
    SET @comma = CHARINDEX(N',', @list);
    SET @item = LTRIM(RTRIM(LEFT(@list, @comma - 1)));
    SET @list = STUFF(@list, 1, @comma, N'');

    IF @item <> N'' AND NOT EXISTS (SELECT 1 FROM @codes WHERE [code] = @item)
      INSERT INTO @codes ([code]) VALUES (@item);
  END;

  IF EXISTS (SELECT 1 FROM @codes WHERE LEN([code]) > 17)
    THROW 50000, N'@SharedCustomerCodes: bir cari kodu en fazla 17 karakterdir (CLCARD.CODE).', 1;

  DECLARE @codeList nvarchar(4000);

  SELECT @codeList = CONCAT(@codeList + N',', [code]) FROM @codes;

  -- Every Tiger table the views read must exist and be readable.
  DECLARE @tiger nvarchar(258) = QUOTENAME(@TigerDb);
  DECLARE @firm nvarchar(3) = RIGHT(N'00' + CAST(@FirmNr AS nvarchar(3)), 3);
  DECLARE @tables TABLE ([name] sysname NOT NULL);

  INSERT INTO @tables ([name])
  VALUES (N'L_CAPIDIV'), (N'LG_SLSMAN'), (N'LG_' + @firm + N'_CLCARD'), (N'LG_' + @firm + N'_ITEMS');

  INSERT INTO @tables ([name])
  SELECT DISTINCT N'LG_' + @firm + N'_' + RIGHT(N'0' + CAST(p.[nr] AS nvarchar(2)), 2) + N'_' + t.[suffix]
  FROM @periods p
  CROSS JOIN (VALUES (N'INVOICE'), (N'STLINE')) t([suffix]);

  DECLARE @missing nvarchar(max);

  SELECT @missing = CONCAT(@missing + N', ', t.[name])
  FROM @tables t
  WHERE OBJECT_ID(@tiger + N'.[dbo].' + QUOTENAME(t.[name]), N'U') IS NULL;

  IF @missing IS NOT NULL
  BEGIN
    SET @message = CONCAT(
      N'Tiger''da bulunamayan ya da okunamayan tablolar: ', REPLACE(@missing, N'%', N'%%'),
      N'. @TigerDb, @FirmNr, @PeriodNrs ve Tiger okuma yetkisini kontrol edin.'
    );
    THROW 50000, @message, 1;
  END;

  -- 2) Nesneler. Hepsi rapor veritabanında, tek transaction içinde kurulur.
  -- Inside the Tiger database the Logo tables are named without the database, so a restore
  -- under another name keeps working; from a separate database they need it.
  DECLARE @exec nvarchar(300) = QUOTENAME(@ReportDb) + N'.sys.sp_executesql';
  DECLARE @db nvarchar(262) = CASE WHEN DB_ID(@ReportDb) = DB_ID(@TigerDb) THEN N'' ELSE @tiger + N'.' END;

  BEGIN TRANSACTION;

  -- dbo.tiger_invoice and dbo.tiger_stline: every period's tables in one view (ADR-054). Each
  -- period numbers its rows from 1, so the invoice key is period × 2^32 + LOGICALREF.
  DECLARE @invoices nvarchar(max) = N'';
  DECLARE @lines nvarchar(max) = N'';
  DECLARE @periodList nvarchar(400) = N'';
  DECLARE @period nvarchar(2);
  DECLARE @prefix nvarchar(20);
  DECLARE @nr int = (SELECT MIN([nr]) FROM @periods);

  WHILE @nr IS NOT NULL
  BEGIN
    SET @period = CAST(@nr AS nvarchar(2));
    SET @prefix = N'LG_' + @firm + N'_' + RIGHT(N'0' + @period, 2) + N'_';

    SET @invoices += CASE WHEN @invoices = N'' THEN N'' ELSE N'
UNION ALL' END + N'
SELECT
  CAST(' + @period + N' AS int) AS [PERIOD_NR],
  CAST(4294967296 AS bigint) * ' + @period + N' + i.[LOGICALREF] AS [LOGICALREF],
  i.[TRCODE], i.[CANCELLED], i.[DATE_], i.[TIME_], i.[BRANCH], i.[SALESMANREF],
  i.[CLIENTREF], i.[NETTOTAL], i.[TOTALVAT], i.[REPORTNET]
FROM ' + @db + N'[dbo].' + QUOTENAME(@prefix + N'INVOICE') + N' i';

    SET @lines += CASE WHEN @lines = N'' THEN N'' ELSE N'
UNION ALL' END + N'
SELECT
  CAST(' + @period + N' AS int) AS [PERIOD_NR],
  CAST(4294967296 AS bigint) * ' + @period + N' + l.[INVOICEREF] AS [INVOICEREF],
  l.[LINETYPE], l.[STOCKREF], l.[LINENET]
FROM ' + @db + N'[dbo].' + QUOTENAME(@prefix + N'STLINE') + N' l';

    SET @periodList += CASE WHEN @periodList = N'' THEN N'' ELSE N',' END + @period;
    SET @nr = (SELECT MIN([nr]) FROM @periods WHERE [nr] > @nr);
  END;

  -- A view cannot take a synonym's name while the synonym exists.
  SET @step = N'tiger_invoice';
  EXEC @exec N'DROP SYNONYM IF EXISTS [dbo].[tiger_invoice]';
  SET @sql = N'CREATE OR ALTER VIEW [dbo].[tiger_invoice]
AS
-- Sales invoices of every configured Logo period (ADR-054); LOGICALREF is period-keyed.' + @invoices;
  EXEC @exec @sql;

  SET @step = N'tiger_stline';
  EXEC @exec N'DROP SYNONYM IF EXISTS [dbo].[tiger_stline]';
  SET @sql = N'CREATE OR ALTER VIEW [dbo].[tiger_stline]
AS
-- Invoice lines of every configured Logo period (ADR-054); INVOICEREF is period-keyed.' + @lines;
  EXEC @exec @sql;

  -- Customer and item cards of the firm.
  SET @step = N'tiger_clcard';
  EXEC @exec N'DROP SYNONYM IF EXISTS [dbo].[tiger_clcard]';
  SET @sql = N'CREATE SYNONYM [dbo].[tiger_clcard] FOR ' + @db + N'[dbo].' + QUOTENAME(N'LG_' + @firm + N'_CLCARD');
  EXEC @exec @sql;

  SET @step = N'tiger_items';
  EXEC @exec N'DROP SYNONYM IF EXISTS [dbo].[tiger_items]';
  SET @sql = N'CREATE SYNONYM [dbo].[tiger_items] FOR ' + @db + N'[dbo].' + QUOTENAME(N'LG_' + @firm + N'_ITEMS');
  EXEC @exec @sql;

  -- Stores (branches) and salespeople of every firm; the reports keep the configured firm's.
  SET @step = N'stores';
  SET @sql = N'CREATE OR ALTER VIEW [dbo].[stores]
AS
SELECT
  [LOGICALREF] AS [id],
  [FIRMNR] AS [firm_nr],
  [NR] AS [nr],
  [NAME] AS [name],
  [STREET] AS [street],
  [DOORNR] AS [door_nr],
  [DISTRICT] AS [district],
  [CITY] AS [city],
  [COUNTRY] AS [country],
  [ZIPCODE] AS [zip_code],
  [PHONE] AS [phone]
FROM ' + @db + N'[dbo].[L_CAPIDIV]';
  EXEC @exec @sql;

  SET @step = N'erp_employees';
  SET @sql = N'CREATE OR ALTER VIEW [dbo].[erp_employees]
AS
SELECT
  [LOGICALREF] AS [id],
  [FIRMNR] AS [firm_nr],
  [CODE] AS [code],
  [DEFINITION_] AS [name],
  [TELNUMBER] AS [phone_number],
  [SPECODE] AS [specode],
  CAST(CASE WHEN [ACTIVE] = 0 THEN 1 ELSE 0 END AS bit) AS [is_active]
FROM ' + @db + N'[dbo].[LG_SLSMAN]';
  EXEC @exec @sql;

  SET @step = N'kpi_report_settings';
  SET @sql = N'CREATE OR ALTER VIEW [dbo].[kpi_report_settings]
AS
-- The settings this script was run with (docs/sql/kpi-report-views.sql).
SELECT
  CAST(' + CAST(@FirmNr AS nvarchar(3)) + N' AS int) AS [firm_nr],
  CAST(N''' + REPLACE(ISNULL(@codeList, N''), N'''', N'''''') + N''' AS nvarchar(4000)) AS [shared_customer_codes],
  CAST(N''' + @periodList + N''' AS nvarchar(400)) AS [period_nrs],
  CAST(N''' + REPLACE(@TigerDb, N'''', N'''''') + N''' AS nvarchar(128)) AS [tiger_database]';
  EXEC @exec @sql;

  -- =======================================================================================
  -- Ölçümler (migration 1799703500000; KPI_DB'deki view'larla aynı, yalnız STRING_SPLIT yerine CHARINDEX)
  -- =======================================================================================

  SET @step = N'kpi_report_documents';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[kpi_report_documents]
AS
-- Sales (TRCODE 7) and sales returns (TRCODE 2) of the configured firm and period, with
-- the signs and customer flags the KPI measures need (docs/TIGER_DATA.md).
WITH [documents] AS (
  SELECT
    i.[LOGICALREF] AS [invoice_ref],
    i.[TRCODE] AS [trcode],
    CAST(i.[DATE_] AS date) AS [sale_date],
    i.[TIME_] AS [sale_time],
    DATEFROMPARTS(YEAR(i.[DATE_]), MONTH(i.[DATE_]), 1) AS [month_start],
    i.[BRANCH] AS [store_nr],
    NULLIF(i.[SALESMANREF], 0) AS [salesman_ref],
    CASE
      WHEN i.[TRCODE] = 7
        AND i.[CLIENTREF] > 0
        AND NOT EXISTS (
          SELECT 1
          FROM [dbo].[tiger_clcard] c
          CROSS JOIN [dbo].[kpi_report_settings] s
          WHERE c.[LOGICALREF] = i.[CLIENTREF]
            AND s.[shared_customer_codes] <> N''''
            -- CHARINDEX instead of STRING_SPLIT, which needs compatibility level 130.
            AND CHARINDEX(
              N'','' + RTRIM(CAST(c.[CODE] AS nvarchar(17))) COLLATE DATABASE_DEFAULT + N'','',
              N'','' + s.[shared_customer_codes] + N'',''
            ) > 0
        )
      THEN i.[CLIENTREF]
    END AS [customer_ref],
    CASE i.[TRCODE] WHEN 7 THEN 1 ELSE -1 END AS [receipts],
    CAST(
      CASE i.[TRCODE] WHEN 7 THEN 1 ELSE -1 END * (i.[NETTOTAL] - i.[TOTALVAT])
      AS decimal(19, 4)
    ) AS [sales_tmt],
    CAST(CASE i.[TRCODE] WHEN 7 THEN 1 ELSE -1 END * i.[REPORTNET] AS decimal(19, 4)) AS [sales_usd]
  FROM [dbo].[tiger_invoice] i
  WHERE i.[CANCELLED] = 0 AND i.[TRCODE] IN (2, 7)
)
SELECT
  d.[invoice_ref],
  d.[trcode],
  d.[sale_date],
  d.[month_start],
  d.[store_nr],
  d.[salesman_ref],
  d.[customer_ref],
  d.[receipts],
  d.[sales_tmt],
  d.[sales_usd],
  CAST(
    CASE
      WHEN d.[customer_ref] IS NOT NULL
        AND ROW_NUMBER() OVER (
          PARTITION BY d.[customer_ref]
          ORDER BY d.[sale_date], d.[sale_time], d.[invoice_ref]
        ) = 1
      THEN 1 ELSE 0
    END AS bit
  ) AS [is_first_purchase],
  CAST(
    CASE
      WHEN d.[customer_ref] IS NOT NULL
        AND d.[sale_date] > MIN(d.[sale_date]) OVER (PARTITION BY d.[customer_ref])
      THEN 1 ELSE 0
    END AS bit
  ) AS [is_returning_visit]
FROM [documents] d';
  EXEC @exec @sql;

  SET @step = N'kpi_report_monthly';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[kpi_report_monthly]
AS
-- One row per KPI, store or salesperson, currency and month of the 12 complete months
-- before the current month. month_offset 12 is the oldest month, 1 is last month. Months
-- without a sales or return document have no row.
WITH [report_period] AS (
  SELECT DATEADD(MONTH, -12, p.[current_month]) AS [first_month], p.[current_month]
  FROM (SELECT DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) AS [current_month]) p
),
[documents] AS (
  SELECT
    d.[invoice_ref],
    d.[trcode],
    d.[month_start],
    d.[store_nr],
    d.[salesman_ref],
    d.[customer_ref],
    d.[receipts],
    d.[sales_tmt],
    d.[sales_usd],
    d.[is_first_purchase],
    d.[is_returning_visit],
    DATEDIFF(MONTH, d.[month_start], p.[current_month]) AS [month_offset]
  FROM [dbo].[kpi_report_documents] d
  CROSS JOIN [report_period] p
  WHERE d.[sale_date] >= p.[first_month] AND d.[sale_date] < p.[current_month]
),
[store_documents] AS (
  SELECT
    d.[store_nr] AS [entity_ref],
    d.[month_offset],
    d.[month_start],
    SUM(d.[sales_tmt]) AS [sales_tmt],
    SUM(d.[sales_usd]) AS [sales_usd],
    SUM(d.[receipts]) AS [receipts],
    COUNT(DISTINCT d.[customer_ref]) AS [customers],
    COUNT(DISTINCT CASE WHEN d.[is_first_purchase] = 1 THEN d.[customer_ref] END) AS [new_customers],
    COUNT(DISTINCT CASE WHEN d.[is_returning_visit] = 1 THEN d.[customer_ref] END) AS [returning_customers]
  FROM [documents] d
  GROUP BY d.[store_nr], d.[month_offset], d.[month_start]
),
[store_variety] AS (
  SELECT d.[store_nr] AS [entity_ref], d.[month_offset], COUNT(DISTINCT l.[STOCKREF]) AS [product_variety]
  FROM [documents] d
  JOIN [dbo].[tiger_stline] l ON l.[INVOICEREF] = d.[invoice_ref]
  WHERE d.[trcode] = 7 AND l.[LINETYPE] = 0
  GROUP BY d.[store_nr], d.[month_offset]
),
[store_months] AS (
  SELECT
    a.[entity_ref],
    a.[month_offset],
    a.[month_start],
    a.[sales_tmt],
    a.[sales_usd],
    a.[receipts],
    a.[customers],
    a.[new_customers],
    a.[returning_customers],
    ISNULL(v.[product_variety], 0) AS [product_variety]
  FROM [store_documents] a
  LEFT JOIN [store_variety] v
    ON v.[entity_ref] = a.[entity_ref] AND v.[month_offset] = a.[month_offset]
),
[employee_documents] AS (
  SELECT
    d.[salesman_ref] AS [entity_ref],
    d.[month_offset],
    d.[month_start],
    SUM(d.[sales_tmt]) AS [sales_tmt],
    SUM(d.[sales_usd]) AS [sales_usd],
    SUM(d.[receipts]) AS [receipts],
    COUNT(DISTINCT d.[customer_ref]) AS [customers],
    COUNT(DISTINCT CASE WHEN d.[is_first_purchase] = 1 THEN d.[customer_ref] END) AS [new_customers],
    COUNT(DISTINCT CASE WHEN d.[is_returning_visit] = 1 THEN d.[customer_ref] END) AS [returning_customers]
  FROM [documents] d
  WHERE d.[salesman_ref] IS NOT NULL
  GROUP BY d.[salesman_ref], d.[month_offset], d.[month_start]
),
[employee_variety] AS (
  SELECT d.[salesman_ref] AS [entity_ref], d.[month_offset], COUNT(DISTINCT l.[STOCKREF]) AS [product_variety]
  FROM [documents] d
  JOIN [dbo].[tiger_stline] l ON l.[INVOICEREF] = d.[invoice_ref]
  WHERE d.[salesman_ref] IS NOT NULL AND d.[trcode] = 7 AND l.[LINETYPE] = 0
  GROUP BY d.[salesman_ref], d.[month_offset]
),
[employee_months] AS (
  SELECT
    a.[entity_ref],
    a.[month_offset],
    a.[month_start],
    a.[sales_tmt],
    a.[sales_usd],
    a.[receipts],
    a.[customers],
    a.[new_customers],
    a.[returning_customers],
    ISNULL(v.[product_variety], 0) AS [product_variety]
  FROM [employee_documents] a
  LEFT JOIN [employee_variety] v
    ON v.[entity_ref] = a.[entity_ref] AND v.[month_offset] = a.[month_offset]
)
    SELECT
      CAST(N''STORE_SALES'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(N''TMT'' AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[sales_tmt] AS decimal(19, 4)) AS [value]
    FROM [store_months] m
UNION ALL
    SELECT
      CAST(N''STORE_SALES'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(N''USD'' AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[sales_usd] AS decimal(19, 4)) AS [value]
    FROM [store_months] m
UNION ALL
    SELECT
      CAST(N''STORE_RECEIPTS'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(NULL AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[receipts] AS decimal(19, 4)) AS [value]
    FROM [store_months] m
UNION ALL
    SELECT
      CAST(N''STORE_CUSTOMERS'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(NULL AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[customers] AS decimal(19, 4)) AS [value]
    FROM [store_months] m
UNION ALL
    SELECT
      CAST(N''STORE_NEW_CUSTOMERS'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(NULL AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[new_customers] AS decimal(19, 4)) AS [value]
    FROM [store_months] m
UNION ALL
    SELECT
      CAST(N''STORE_RETURNING_CUSTOMERS'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(NULL AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[returning_customers] AS decimal(19, 4)) AS [value]
    FROM [store_months] m
UNION ALL
    SELECT
      CAST(N''STORE_PRODUCT_VARIETY'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(NULL AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[product_variety] AS decimal(19, 4)) AS [value]
    FROM [store_months] m
UNION ALL
    SELECT
      CAST(N''EMPLOYEE_SALES'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(N''TMT'' AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[sales_tmt] AS decimal(19, 4)) AS [value]
    FROM [employee_months] m
UNION ALL
    SELECT
      CAST(N''EMPLOYEE_SALES'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(N''USD'' AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[sales_usd] AS decimal(19, 4)) AS [value]
    FROM [employee_months] m
UNION ALL
    SELECT
      CAST(N''EMPLOYEE_RECEIPTS'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(NULL AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[receipts] AS decimal(19, 4)) AS [value]
    FROM [employee_months] m
UNION ALL
    SELECT
      CAST(N''EMPLOYEE_CUSTOMERS'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(NULL AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[customers] AS decimal(19, 4)) AS [value]
    FROM [employee_months] m
UNION ALL
    SELECT
      CAST(N''EMPLOYEE_NEW_CUSTOMERS'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(NULL AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[new_customers] AS decimal(19, 4)) AS [value]
    FROM [employee_months] m
UNION ALL
    SELECT
      CAST(N''EMPLOYEE_RETURNING_CUSTOMERS'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(NULL AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[returning_customers] AS decimal(19, 4)) AS [value]
    FROM [employee_months] m
UNION ALL
    SELECT
      CAST(N''EMPLOYEE_PRODUCT_VARIETY'' AS nvarchar(64)) AS [kpi_code],
      CAST(m.[entity_ref] AS int) AS [entity_ref],
      CAST(NULL AS nvarchar(3)) AS [currency],
      m.[month_offset],
      m.[month_start],
      CAST(m.[product_variety] AS decimal(19, 4)) AS [value]
    FROM [employee_months] m';
  EXEC @exec @sql;

  -- =======================================================================================
  -- İstatistik ve öneri formülü (docs/REPORTS.md "Öneri hesabı")
  -- =======================================================================================

  SET @step = N'kpi_report_summary';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[kpi_report_summary]
AS
-- The 12 months side by side with statistics and target suggestions (docs/REPORTS.md):
--   base_value            = the higher of the average and the last 3 months'' average
--   achievable_max_target = the higher of the best quarter of the months'' average
--                           (best 3 of 12, best 2 of 6, the best of up to 4) and base_value
--   recommended_target    = halfway between base_value and achievable_max_target
WITH [ranked] AS (
  SELECT
    m.[kpi_code],
    m.[entity_ref],
    m.[currency],
    m.[month_offset],
    m.[value],
    ROW_NUMBER() OVER (
      PARTITION BY m.[kpi_code], m.[entity_ref], m.[currency]
      ORDER BY m.[value] DESC
    ) AS [value_rank],
    COUNT(*) OVER (PARTITION BY m.[kpi_code], m.[entity_ref], m.[currency]) AS [month_count]
  FROM [dbo].[kpi_report_monthly] m
),
[totals] AS (
  SELECT
    r.[kpi_code],
    r.[entity_ref],
    r.[currency],
    MAX(CASE WHEN r.[month_offset] = 12 THEN r.[value] END) AS [value_m12],
    MAX(CASE WHEN r.[month_offset] = 11 THEN r.[value] END) AS [value_m11],
    MAX(CASE WHEN r.[month_offset] = 10 THEN r.[value] END) AS [value_m10],
    MAX(CASE WHEN r.[month_offset] = 9 THEN r.[value] END) AS [value_m9],
    MAX(CASE WHEN r.[month_offset] = 8 THEN r.[value] END) AS [value_m8],
    MAX(CASE WHEN r.[month_offset] = 7 THEN r.[value] END) AS [value_m7],
    MAX(CASE WHEN r.[month_offset] = 6 THEN r.[value] END) AS [value_m6],
    MAX(CASE WHEN r.[month_offset] = 5 THEN r.[value] END) AS [value_m5],
    MAX(CASE WHEN r.[month_offset] = 4 THEN r.[value] END) AS [value_m4],
    MAX(CASE WHEN r.[month_offset] = 3 THEN r.[value] END) AS [value_m3],
    MAX(CASE WHEN r.[month_offset] = 2 THEN r.[value] END) AS [value_m2],
    MAX(CASE WHEN r.[month_offset] = 1 THEN r.[value] END) AS [value_m1],
    COUNT(*) AS [month_count],
    AVG(r.[value]) AS [average_value],
    AVG(CASE WHEN r.[month_offset] <= 3 THEN r.[value] END) AS [last3_average],
    MIN(r.[value]) AS [min_value],
    MAX(r.[value]) AS [max_value],
    AVG(CASE WHEN r.[value_rank] <= CEILING(r.[month_count] / 4.0) THEN r.[value] END)
      AS [top_quarter_average]
  FROM [ranked] r
  GROUP BY r.[kpi_code], r.[entity_ref], r.[currency]
),
[based] AS (
  SELECT
    t.*,
    CASE WHEN t.[last3_average] > t.[average_value] THEN t.[last3_average] ELSE t.[average_value] END
      AS [base_value]
  FROM [totals] t
),
[targets] AS (
  SELECT
    b.*,
    CASE
      WHEN b.[top_quarter_average] > b.[base_value] THEN b.[top_quarter_average]
      ELSE b.[base_value]
    END AS [achievable_max_target]
  FROM [based] b
)
SELECT
  t.[kpi_code],
  t.[entity_ref],
  t.[currency],
  t.[value_m12],
  t.[value_m11],
  t.[value_m10],
  t.[value_m9],
  t.[value_m8],
  t.[value_m7],
  t.[value_m6],
  t.[value_m5],
  t.[value_m4],
  t.[value_m3],
  t.[value_m2],
  t.[value_m1],
  t.[month_count],
  t.[average_value],
  t.[last3_average],
  t.[min_value],
  t.[max_value],
  t.[top_quarter_average],
  t.[base_value],
  t.[achievable_max_target],
  (t.[base_value] + t.[achievable_max_target]) / 2 AS [recommended_target]
FROM [targets] t';
  EXEC @exec @sql;

  -- =======================================================================================
  -- Rapor view'ları ve show_report
  -- =======================================================================================

  SET @step = N'report_STORE_SALES';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_STORE_SALES]
AS
SELECT
  CAST(s.[nr] AS int) AS [SUBE_NR],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(61)) AS [SUBE_ADI],
  c.[currency] AS [PARA_BIRIMI],
  CAST(r.[value_m12] AS decimal(19, 2)) AS [-12_AY_CIRO],
  CAST(r.[value_m11] AS decimal(19, 2)) AS [-11_AY_CIRO],
  CAST(r.[value_m10] AS decimal(19, 2)) AS [-10_AY_CIRO],
  CAST(r.[value_m9] AS decimal(19, 2)) AS [-9_AY_CIRO],
  CAST(r.[value_m8] AS decimal(19, 2)) AS [-8_AY_CIRO],
  CAST(r.[value_m7] AS decimal(19, 2)) AS [-7_AY_CIRO],
  CAST(r.[value_m6] AS decimal(19, 2)) AS [-6_AY_CIRO],
  CAST(r.[value_m5] AS decimal(19, 2)) AS [-5_AY_CIRO],
  CAST(r.[value_m4] AS decimal(19, 2)) AS [-4_AY_CIRO],
  CAST(r.[value_m3] AS decimal(19, 2)) AS [-3_AY_CIRO],
  CAST(r.[value_m2] AS decimal(19, 2)) AS [-2_AY_CIRO],
  CAST(r.[value_m1] AS decimal(19, 2)) AS [-1_AY_CIRO],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS decimal(19, 2)) AS [EN_DUSUK],
  CAST(r.[max_value] AS decimal(19, 2)) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS decimal(19, 0)) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS decimal(19, 0)) AS [ONERILEN_HEDEF]
FROM [dbo].[stores] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
CROSS JOIN (VALUES (N''TMT''), (N''USD'')) c([currency])
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''STORE_SALES''
  AND r.[entity_ref] = s.[nr]
  AND r.[currency] = c.[currency]';
  EXEC @exec @sql;

  SET @step = N'report_EMPLOYEE_SALES';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_EMPLOYEE_SALES]
AS
SELECT
  CAST(LTRIM(RTRIM(s.[code])) AS nvarchar(25)) AS [SATIS_ELEMANI_KODU],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(51)) AS [SATIS_ELEMANI_ADI],
  s.[is_active] AS [AKTIF],
  c.[currency] AS [PARA_BIRIMI],
  CAST(r.[value_m12] AS decimal(19, 2)) AS [-12_AY_CIRO],
  CAST(r.[value_m11] AS decimal(19, 2)) AS [-11_AY_CIRO],
  CAST(r.[value_m10] AS decimal(19, 2)) AS [-10_AY_CIRO],
  CAST(r.[value_m9] AS decimal(19, 2)) AS [-9_AY_CIRO],
  CAST(r.[value_m8] AS decimal(19, 2)) AS [-8_AY_CIRO],
  CAST(r.[value_m7] AS decimal(19, 2)) AS [-7_AY_CIRO],
  CAST(r.[value_m6] AS decimal(19, 2)) AS [-6_AY_CIRO],
  CAST(r.[value_m5] AS decimal(19, 2)) AS [-5_AY_CIRO],
  CAST(r.[value_m4] AS decimal(19, 2)) AS [-4_AY_CIRO],
  CAST(r.[value_m3] AS decimal(19, 2)) AS [-3_AY_CIRO],
  CAST(r.[value_m2] AS decimal(19, 2)) AS [-2_AY_CIRO],
  CAST(r.[value_m1] AS decimal(19, 2)) AS [-1_AY_CIRO],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS decimal(19, 2)) AS [EN_DUSUK],
  CAST(r.[max_value] AS decimal(19, 2)) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS decimal(19, 0)) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS decimal(19, 0)) AS [ONERILEN_HEDEF]
FROM [dbo].[erp_employees] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
CROSS JOIN (VALUES (N''TMT''), (N''USD'')) c([currency])
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''EMPLOYEE_SALES''
  AND r.[entity_ref] = s.[id]
  AND r.[currency] = c.[currency]';
  EXEC @exec @sql;

  SET @step = N'report_STORE_RECEIPTS';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_STORE_RECEIPTS]
AS
SELECT
  CAST(s.[nr] AS int) AS [SUBE_NR],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(61)) AS [SUBE_ADI],
  CAST(r.[value_m12] AS int) AS [-12_AY_FIS],
  CAST(r.[value_m11] AS int) AS [-11_AY_FIS],
  CAST(r.[value_m10] AS int) AS [-10_AY_FIS],
  CAST(r.[value_m9] AS int) AS [-9_AY_FIS],
  CAST(r.[value_m8] AS int) AS [-8_AY_FIS],
  CAST(r.[value_m7] AS int) AS [-7_AY_FIS],
  CAST(r.[value_m6] AS int) AS [-6_AY_FIS],
  CAST(r.[value_m5] AS int) AS [-5_AY_FIS],
  CAST(r.[value_m4] AS int) AS [-4_AY_FIS],
  CAST(r.[value_m3] AS int) AS [-3_AY_FIS],
  CAST(r.[value_m2] AS int) AS [-2_AY_FIS],
  CAST(r.[value_m1] AS int) AS [-1_AY_FIS],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS int) AS [EN_DUSUK],
  CAST(r.[max_value] AS int) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS int) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS int) AS [ONERILEN_HEDEF]
FROM [dbo].[stores] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''STORE_RECEIPTS''
  AND r.[entity_ref] = s.[nr]';
  EXEC @exec @sql;

  SET @step = N'report_EMPLOYEE_RECEIPTS';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_EMPLOYEE_RECEIPTS]
AS
SELECT
  CAST(LTRIM(RTRIM(s.[code])) AS nvarchar(25)) AS [SATIS_ELEMANI_KODU],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(51)) AS [SATIS_ELEMANI_ADI],
  s.[is_active] AS [AKTIF],
  CAST(r.[value_m12] AS int) AS [-12_AY_FIS],
  CAST(r.[value_m11] AS int) AS [-11_AY_FIS],
  CAST(r.[value_m10] AS int) AS [-10_AY_FIS],
  CAST(r.[value_m9] AS int) AS [-9_AY_FIS],
  CAST(r.[value_m8] AS int) AS [-8_AY_FIS],
  CAST(r.[value_m7] AS int) AS [-7_AY_FIS],
  CAST(r.[value_m6] AS int) AS [-6_AY_FIS],
  CAST(r.[value_m5] AS int) AS [-5_AY_FIS],
  CAST(r.[value_m4] AS int) AS [-4_AY_FIS],
  CAST(r.[value_m3] AS int) AS [-3_AY_FIS],
  CAST(r.[value_m2] AS int) AS [-2_AY_FIS],
  CAST(r.[value_m1] AS int) AS [-1_AY_FIS],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS int) AS [EN_DUSUK],
  CAST(r.[max_value] AS int) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS int) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS int) AS [ONERILEN_HEDEF]
FROM [dbo].[erp_employees] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''EMPLOYEE_RECEIPTS''
  AND r.[entity_ref] = s.[id]';
  EXEC @exec @sql;

  SET @step = N'report_STORE_CUSTOMERS';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_STORE_CUSTOMERS]
AS
SELECT
  CAST(s.[nr] AS int) AS [SUBE_NR],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(61)) AS [SUBE_ADI],
  CAST(r.[value_m12] AS int) AS [-12_AY_MUSTERI],
  CAST(r.[value_m11] AS int) AS [-11_AY_MUSTERI],
  CAST(r.[value_m10] AS int) AS [-10_AY_MUSTERI],
  CAST(r.[value_m9] AS int) AS [-9_AY_MUSTERI],
  CAST(r.[value_m8] AS int) AS [-8_AY_MUSTERI],
  CAST(r.[value_m7] AS int) AS [-7_AY_MUSTERI],
  CAST(r.[value_m6] AS int) AS [-6_AY_MUSTERI],
  CAST(r.[value_m5] AS int) AS [-5_AY_MUSTERI],
  CAST(r.[value_m4] AS int) AS [-4_AY_MUSTERI],
  CAST(r.[value_m3] AS int) AS [-3_AY_MUSTERI],
  CAST(r.[value_m2] AS int) AS [-2_AY_MUSTERI],
  CAST(r.[value_m1] AS int) AS [-1_AY_MUSTERI],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS int) AS [EN_DUSUK],
  CAST(r.[max_value] AS int) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS int) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS int) AS [ONERILEN_HEDEF]
FROM [dbo].[stores] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''STORE_CUSTOMERS''
  AND r.[entity_ref] = s.[nr]';
  EXEC @exec @sql;

  SET @step = N'report_EMPLOYEE_CUSTOMERS';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_EMPLOYEE_CUSTOMERS]
AS
SELECT
  CAST(LTRIM(RTRIM(s.[code])) AS nvarchar(25)) AS [SATIS_ELEMANI_KODU],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(51)) AS [SATIS_ELEMANI_ADI],
  s.[is_active] AS [AKTIF],
  CAST(r.[value_m12] AS int) AS [-12_AY_MUSTERI],
  CAST(r.[value_m11] AS int) AS [-11_AY_MUSTERI],
  CAST(r.[value_m10] AS int) AS [-10_AY_MUSTERI],
  CAST(r.[value_m9] AS int) AS [-9_AY_MUSTERI],
  CAST(r.[value_m8] AS int) AS [-8_AY_MUSTERI],
  CAST(r.[value_m7] AS int) AS [-7_AY_MUSTERI],
  CAST(r.[value_m6] AS int) AS [-6_AY_MUSTERI],
  CAST(r.[value_m5] AS int) AS [-5_AY_MUSTERI],
  CAST(r.[value_m4] AS int) AS [-4_AY_MUSTERI],
  CAST(r.[value_m3] AS int) AS [-3_AY_MUSTERI],
  CAST(r.[value_m2] AS int) AS [-2_AY_MUSTERI],
  CAST(r.[value_m1] AS int) AS [-1_AY_MUSTERI],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS int) AS [EN_DUSUK],
  CAST(r.[max_value] AS int) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS int) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS int) AS [ONERILEN_HEDEF]
FROM [dbo].[erp_employees] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''EMPLOYEE_CUSTOMERS''
  AND r.[entity_ref] = s.[id]';
  EXEC @exec @sql;

  SET @step = N'report_STORE_NEW_CUSTOMERS';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_STORE_NEW_CUSTOMERS]
AS
SELECT
  CAST(s.[nr] AS int) AS [SUBE_NR],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(61)) AS [SUBE_ADI],
  CAST(r.[value_m12] AS int) AS [-12_AY_YENI_MUSTERI],
  CAST(r.[value_m11] AS int) AS [-11_AY_YENI_MUSTERI],
  CAST(r.[value_m10] AS int) AS [-10_AY_YENI_MUSTERI],
  CAST(r.[value_m9] AS int) AS [-9_AY_YENI_MUSTERI],
  CAST(r.[value_m8] AS int) AS [-8_AY_YENI_MUSTERI],
  CAST(r.[value_m7] AS int) AS [-7_AY_YENI_MUSTERI],
  CAST(r.[value_m6] AS int) AS [-6_AY_YENI_MUSTERI],
  CAST(r.[value_m5] AS int) AS [-5_AY_YENI_MUSTERI],
  CAST(r.[value_m4] AS int) AS [-4_AY_YENI_MUSTERI],
  CAST(r.[value_m3] AS int) AS [-3_AY_YENI_MUSTERI],
  CAST(r.[value_m2] AS int) AS [-2_AY_YENI_MUSTERI],
  CAST(r.[value_m1] AS int) AS [-1_AY_YENI_MUSTERI],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS int) AS [EN_DUSUK],
  CAST(r.[max_value] AS int) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS int) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS int) AS [ONERILEN_HEDEF]
FROM [dbo].[stores] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''STORE_NEW_CUSTOMERS''
  AND r.[entity_ref] = s.[nr]';
  EXEC @exec @sql;

  SET @step = N'report_EMPLOYEE_NEW_CUSTOMERS';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_EMPLOYEE_NEW_CUSTOMERS]
AS
SELECT
  CAST(LTRIM(RTRIM(s.[code])) AS nvarchar(25)) AS [SATIS_ELEMANI_KODU],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(51)) AS [SATIS_ELEMANI_ADI],
  s.[is_active] AS [AKTIF],
  CAST(r.[value_m12] AS int) AS [-12_AY_YENI_MUSTERI],
  CAST(r.[value_m11] AS int) AS [-11_AY_YENI_MUSTERI],
  CAST(r.[value_m10] AS int) AS [-10_AY_YENI_MUSTERI],
  CAST(r.[value_m9] AS int) AS [-9_AY_YENI_MUSTERI],
  CAST(r.[value_m8] AS int) AS [-8_AY_YENI_MUSTERI],
  CAST(r.[value_m7] AS int) AS [-7_AY_YENI_MUSTERI],
  CAST(r.[value_m6] AS int) AS [-6_AY_YENI_MUSTERI],
  CAST(r.[value_m5] AS int) AS [-5_AY_YENI_MUSTERI],
  CAST(r.[value_m4] AS int) AS [-4_AY_YENI_MUSTERI],
  CAST(r.[value_m3] AS int) AS [-3_AY_YENI_MUSTERI],
  CAST(r.[value_m2] AS int) AS [-2_AY_YENI_MUSTERI],
  CAST(r.[value_m1] AS int) AS [-1_AY_YENI_MUSTERI],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS int) AS [EN_DUSUK],
  CAST(r.[max_value] AS int) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS int) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS int) AS [ONERILEN_HEDEF]
FROM [dbo].[erp_employees] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''EMPLOYEE_NEW_CUSTOMERS''
  AND r.[entity_ref] = s.[id]';
  EXEC @exec @sql;

  SET @step = N'report_STORE_RETURNING_CUSTOMERS';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_STORE_RETURNING_CUSTOMERS]
AS
SELECT
  CAST(s.[nr] AS int) AS [SUBE_NR],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(61)) AS [SUBE_ADI],
  CAST(r.[value_m12] AS int) AS [-12_AY_ESKI_MUSTERI],
  CAST(r.[value_m11] AS int) AS [-11_AY_ESKI_MUSTERI],
  CAST(r.[value_m10] AS int) AS [-10_AY_ESKI_MUSTERI],
  CAST(r.[value_m9] AS int) AS [-9_AY_ESKI_MUSTERI],
  CAST(r.[value_m8] AS int) AS [-8_AY_ESKI_MUSTERI],
  CAST(r.[value_m7] AS int) AS [-7_AY_ESKI_MUSTERI],
  CAST(r.[value_m6] AS int) AS [-6_AY_ESKI_MUSTERI],
  CAST(r.[value_m5] AS int) AS [-5_AY_ESKI_MUSTERI],
  CAST(r.[value_m4] AS int) AS [-4_AY_ESKI_MUSTERI],
  CAST(r.[value_m3] AS int) AS [-3_AY_ESKI_MUSTERI],
  CAST(r.[value_m2] AS int) AS [-2_AY_ESKI_MUSTERI],
  CAST(r.[value_m1] AS int) AS [-1_AY_ESKI_MUSTERI],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS int) AS [EN_DUSUK],
  CAST(r.[max_value] AS int) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS int) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS int) AS [ONERILEN_HEDEF]
FROM [dbo].[stores] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''STORE_RETURNING_CUSTOMERS''
  AND r.[entity_ref] = s.[nr]';
  EXEC @exec @sql;

  SET @step = N'report_EMPLOYEE_RETURNING_CUSTOMERS';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_EMPLOYEE_RETURNING_CUSTOMERS]
AS
SELECT
  CAST(LTRIM(RTRIM(s.[code])) AS nvarchar(25)) AS [SATIS_ELEMANI_KODU],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(51)) AS [SATIS_ELEMANI_ADI],
  s.[is_active] AS [AKTIF],
  CAST(r.[value_m12] AS int) AS [-12_AY_ESKI_MUSTERI],
  CAST(r.[value_m11] AS int) AS [-11_AY_ESKI_MUSTERI],
  CAST(r.[value_m10] AS int) AS [-10_AY_ESKI_MUSTERI],
  CAST(r.[value_m9] AS int) AS [-9_AY_ESKI_MUSTERI],
  CAST(r.[value_m8] AS int) AS [-8_AY_ESKI_MUSTERI],
  CAST(r.[value_m7] AS int) AS [-7_AY_ESKI_MUSTERI],
  CAST(r.[value_m6] AS int) AS [-6_AY_ESKI_MUSTERI],
  CAST(r.[value_m5] AS int) AS [-5_AY_ESKI_MUSTERI],
  CAST(r.[value_m4] AS int) AS [-4_AY_ESKI_MUSTERI],
  CAST(r.[value_m3] AS int) AS [-3_AY_ESKI_MUSTERI],
  CAST(r.[value_m2] AS int) AS [-2_AY_ESKI_MUSTERI],
  CAST(r.[value_m1] AS int) AS [-1_AY_ESKI_MUSTERI],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS int) AS [EN_DUSUK],
  CAST(r.[max_value] AS int) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS int) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS int) AS [ONERILEN_HEDEF]
FROM [dbo].[erp_employees] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''EMPLOYEE_RETURNING_CUSTOMERS''
  AND r.[entity_ref] = s.[id]';
  EXEC @exec @sql;

  SET @step = N'report_STORE_PRODUCT_VARIETY';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_STORE_PRODUCT_VARIETY]
AS
SELECT
  CAST(s.[nr] AS int) AS [SUBE_NR],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(61)) AS [SUBE_ADI],
  CAST(r.[value_m12] AS int) AS [-12_AY_CESIT],
  CAST(r.[value_m11] AS int) AS [-11_AY_CESIT],
  CAST(r.[value_m10] AS int) AS [-10_AY_CESIT],
  CAST(r.[value_m9] AS int) AS [-9_AY_CESIT],
  CAST(r.[value_m8] AS int) AS [-8_AY_CESIT],
  CAST(r.[value_m7] AS int) AS [-7_AY_CESIT],
  CAST(r.[value_m6] AS int) AS [-6_AY_CESIT],
  CAST(r.[value_m5] AS int) AS [-5_AY_CESIT],
  CAST(r.[value_m4] AS int) AS [-4_AY_CESIT],
  CAST(r.[value_m3] AS int) AS [-3_AY_CESIT],
  CAST(r.[value_m2] AS int) AS [-2_AY_CESIT],
  CAST(r.[value_m1] AS int) AS [-1_AY_CESIT],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS int) AS [EN_DUSUK],
  CAST(r.[max_value] AS int) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS int) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS int) AS [ONERILEN_HEDEF]
FROM [dbo].[stores] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''STORE_PRODUCT_VARIETY''
  AND r.[entity_ref] = s.[nr]';
  EXEC @exec @sql;

  SET @step = N'report_EMPLOYEE_PRODUCT_VARIETY';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_EMPLOYEE_PRODUCT_VARIETY]
AS
SELECT
  CAST(LTRIM(RTRIM(s.[code])) AS nvarchar(25)) AS [SATIS_ELEMANI_KODU],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(51)) AS [SATIS_ELEMANI_ADI],
  s.[is_active] AS [AKTIF],
  CAST(r.[value_m12] AS int) AS [-12_AY_CESIT],
  CAST(r.[value_m11] AS int) AS [-11_AY_CESIT],
  CAST(r.[value_m10] AS int) AS [-10_AY_CESIT],
  CAST(r.[value_m9] AS int) AS [-9_AY_CESIT],
  CAST(r.[value_m8] AS int) AS [-8_AY_CESIT],
  CAST(r.[value_m7] AS int) AS [-7_AY_CESIT],
  CAST(r.[value_m6] AS int) AS [-6_AY_CESIT],
  CAST(r.[value_m5] AS int) AS [-5_AY_CESIT],
  CAST(r.[value_m4] AS int) AS [-4_AY_CESIT],
  CAST(r.[value_m3] AS int) AS [-3_AY_CESIT],
  CAST(r.[value_m2] AS int) AS [-2_AY_CESIT],
  CAST(r.[value_m1] AS int) AS [-1_AY_CESIT],
  ISNULL(r.[month_count], 0) AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS int) AS [EN_DUSUK],
  CAST(r.[max_value] AS int) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS int) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS int) AS [ONERILEN_HEDEF]
FROM [dbo].[erp_employees] s
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
LEFT JOIN [dbo].[kpi_report_summary] r
  ON r.[kpi_code] = N''EMPLOYEE_PRODUCT_VARIETY''
  AND r.[entity_ref] = s.[id]';
  EXEC @exec @sql;

  SET @step = N'show_report';
  SET @sql = N'
CREATE OR ALTER PROCEDURE [dbo].[show_report]
  @code nvarchar(64)
AS
-- EXEC dbo.show_report N''STORE_SALES'': the report with month names in the month columns,
-- -12_AY_CIRO -> 09_2025_CIRO. The view name is looked up, never built from the input.
BEGIN
  SET NOCOUNT ON;
  DECLARE @view_id int = (
    SELECT v.[object_id]
    FROM sys.views v
    WHERE v.[schema_id] = SCHEMA_ID(N''dbo'') AND v.[name] = N''report_'' + @code
  );
  IF @view_id IS NULL
  BEGIN
    -- THROW formats its message printf-style, so a % in the input must be doubled.
    DECLARE @message nvarchar(2048) = CONCAT(
      N''Unknown report "'', REPLACE(@code, N''%'', N''%%''),
      N''". Use the KPI code of a dbo.report_<code> view, e.g. STORE_SALES.''
    );
    THROW 50001, @message, 1;
  END;
  DECLARE @current_month date = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
  -- Rows are ordered by the columns before the first month column (store or salesperson).
  DECLARE @first_month_column int = (
    SELECT MIN(c.[column_id])
    FROM sys.columns c
    WHERE c.[object_id] = @view_id AND c.[name] LIKE N''-%[_]AY[_]%''
  );
  DECLARE @columns nvarchar(max);
  DECLARE @order nvarchar(max);
  SELECT
    @columns = STRING_AGG(
      CAST(
        CASE
          WHEN o.[month_offset] IS NULL THEN QUOTENAME(c.[name])
          ELSE QUOTENAME(c.[name]) + N'' AS '' + QUOTENAME(
            RIGHT(N''0'' + CAST(MONTH(m.[month]) AS nvarchar(2)), 2)
            + N''_'' + CAST(YEAR(m.[month]) AS nvarchar(4))
            + SUBSTRING(c.[name], CHARINDEX(N''_AY_'', c.[name]) + 3, 128)
          )
        END AS nvarchar(max)
      ),
      N'', ''
    ) WITHIN GROUP (ORDER BY c.[column_id]),
    @order = STRING_AGG(
      CASE WHEN c.[column_id] < @first_month_column THEN CAST(QUOTENAME(c.[name]) AS nvarchar(max)) END,
      N'', ''
    ) WITHIN GROUP (ORDER BY c.[column_id])
  FROM sys.columns c
  CROSS APPLY (
    SELECT CASE
      WHEN c.[name] LIKE N''-%[_]AY[_]%''
      THEN TRY_CAST(SUBSTRING(c.[name], 2, CHARINDEX(N''_'', c.[name]) - 2) AS int)
    END AS [month_offset]
  ) o
  CROSS APPLY (SELECT DATEADD(MONTH, -o.[month_offset], @current_month) AS [month]) m
  WHERE c.[object_id] = @view_id;
  DECLARE @sql nvarchar(max) =
    N''SELECT '' + @columns + N'' FROM [dbo].'' + QUOTENAME(OBJECT_NAME(@view_id))
    + ISNULL(N'' ORDER BY '' + @order, N'''') + N'';'';
  EXEC sys.sp_executesql @sql;
END';
  EXEC @exec @sql;

  -- =======================================================================================
  -- Malzeme grubu raporları (migration 1799704000000, ADR-045)
  -- =======================================================================================

  SET @step = N'item_groups';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[item_groups]
AS
-- Item groups for the KPI target form: the non-empty STGRPCODE values of the configured
-- firm''s item cards. Logo has no master table for them (ADR-045).
SELECT g.[code], COUNT(*) AS [item_count]
FROM (
  SELECT NULLIF(UPPER(LTRIM(RTRIM(CAST(it.[STGRPCODE] AS nvarchar(25))))), N'''') COLLATE DATABASE_DEFAULT AS [code]
  FROM [dbo].[tiger_items] it
) g
WHERE g.[code] IS NOT NULL
GROUP BY g.[code]';
  EXEC @exec @sql;

  SET @step = N'kpi_report_group_lines';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[kpi_report_group_lines]
AS
-- Sales (TRCODE 7) and returns (TRCODE 2) per material line. The invoice''s revenue, as
-- dbo.kpi_report_documents measures it (TMT: NETTOTAL - TOTALVAT, USD: REPORTNET), is
-- spread over its material lines by LINENET, so the lines of an invoice add up to the
-- invoice to the cent in both currencies (docs/TIGER_DATA.md, ADR-045). Amounts stay
-- float until they are summed; group_code is NULL for items without a group.
WITH [lines] AS (
  SELECT
    i.[LOGICALREF] AS [invoice_ref],
    CAST(i.[DATE_] AS date) AS [sale_date],
    DATEFROMPARTS(YEAR(i.[DATE_]), MONTH(i.[DATE_]), 1) AS [month_start],
    i.[BRANCH] AS [store_nr],
    NULLIF(i.[SALESMANREF], 0) AS [salesman_ref],
    NULLIF(UPPER(LTRIM(RTRIM(CAST(it.[STGRPCODE] AS nvarchar(25))))), N'''') COLLATE DATABASE_DEFAULT AS [group_code],
    CASE i.[TRCODE] WHEN 7 THEN 1 ELSE -1 END AS [sign],
    i.[NETTOTAL] - i.[TOTALVAT] AS [invoice_tmt],
    i.[REPORTNET] AS [invoice_usd],
    l.[LINENET] AS [line_net],
    SUM(l.[LINENET]) OVER (PARTITION BY i.[LOGICALREF]) AS [invoice_line_net]
  FROM [dbo].[tiger_invoice] i
  JOIN [dbo].[tiger_stline] l ON l.[INVOICEREF] = i.[LOGICALREF] AND l.[LINETYPE] = 0
  LEFT JOIN [dbo].[tiger_items] it ON it.[LOGICALREF] = l.[STOCKREF]
  WHERE i.[CANCELLED] = 0 AND i.[TRCODE] IN (2, 7)
)
SELECT
  [invoice_ref],
  [sale_date],
  [month_start],
  [store_nr],
  [salesman_ref],
  [group_code],
  [sign] * [invoice_tmt] * [line_net] / NULLIF([invoice_line_net], 0) AS [sales_tmt],
  [sign] * [invoice_usd] * [line_net] / NULLIF([invoice_line_net], 0) AS [sales_usd]
FROM [lines]';
  EXEC @exec @sql;

  SET @step = N'kpi_report_group_monthly';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[kpi_report_group_monthly]
AS
-- Group sales per KPI, store or salesperson, group, currency and month of the 12 complete
-- months before the current month, like dbo.kpi_report_monthly. Lines without a group
-- count in no group KPI (ADR-045).
WITH [report_period] AS (
  SELECT DATEADD(MONTH, -12, p.[current_month]) AS [first_month], p.[current_month]
  FROM (SELECT DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) AS [current_month]) p
),
[lines] AS (
  SELECT
    g.[store_nr],
    g.[salesman_ref],
    g.[group_code],
    g.[month_start],
    DATEDIFF(MONTH, g.[month_start], p.[current_month]) AS [month_offset],
    g.[sales_tmt],
    g.[sales_usd]
  FROM [dbo].[kpi_report_group_lines] g
  CROSS JOIN [report_period] p
  WHERE g.[sale_date] >= p.[first_month]
    AND g.[sale_date] < p.[current_month]
    AND g.[group_code] IS NOT NULL
)
    SELECT
      CAST(N''STORE_GROUP_SALES'' AS nvarchar(64)) AS [kpi_code],
      CAST(l.[store_nr] AS int) AS [entity_ref],
      l.[group_code],
      CAST(N''TMT'' AS nvarchar(3)) AS [currency],
      l.[month_offset],
      l.[month_start],
      CAST(SUM(l.[sales_tmt]) AS decimal(19, 4)) AS [value]
    FROM [lines] l
    GROUP BY l.[store_nr], l.[group_code], l.[month_offset], l.[month_start]
    UNION ALL
    SELECT
      CAST(N''STORE_GROUP_SALES'' AS nvarchar(64)) AS [kpi_code],
      CAST(l.[store_nr] AS int) AS [entity_ref],
      l.[group_code],
      CAST(N''USD'' AS nvarchar(3)) AS [currency],
      l.[month_offset],
      l.[month_start],
      CAST(SUM(l.[sales_usd]) AS decimal(19, 4)) AS [value]
    FROM [lines] l
    GROUP BY l.[store_nr], l.[group_code], l.[month_offset], l.[month_start]
    UNION ALL
    SELECT
      CAST(N''EMPLOYEE_GROUP_SALES'' AS nvarchar(64)) AS [kpi_code],
      CAST(l.[salesman_ref] AS int) AS [entity_ref],
      l.[group_code],
      CAST(N''TMT'' AS nvarchar(3)) AS [currency],
      l.[month_offset],
      l.[month_start],
      CAST(SUM(l.[sales_tmt]) AS decimal(19, 4)) AS [value]
    FROM [lines] l
    WHERE l.[salesman_ref] IS NOT NULL
    GROUP BY l.[salesman_ref], l.[group_code], l.[month_offset], l.[month_start]
    UNION ALL
    SELECT
      CAST(N''EMPLOYEE_GROUP_SALES'' AS nvarchar(64)) AS [kpi_code],
      CAST(l.[salesman_ref] AS int) AS [entity_ref],
      l.[group_code],
      CAST(N''USD'' AS nvarchar(3)) AS [currency],
      l.[month_offset],
      l.[month_start],
      CAST(SUM(l.[sales_usd]) AS decimal(19, 4)) AS [value]
    FROM [lines] l
    WHERE l.[salesman_ref] IS NOT NULL
    GROUP BY l.[salesman_ref], l.[group_code], l.[month_offset], l.[month_start]';
  EXEC @exec @sql;

  SET @step = N'kpi_report_group_summary';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[kpi_report_group_summary]
AS
-- dbo.kpi_report_summary with the group as one more key: the same statistics and the
-- same target suggestion formula (docs/REPORTS.md).
WITH [ranked] AS (
  SELECT
    m.[kpi_code],
    m.[entity_ref],
    m.[group_code],
    m.[currency],
    m.[month_offset],
    m.[value],
    ROW_NUMBER() OVER (PARTITION BY m.[kpi_code], m.[entity_ref], m.[group_code], m.[currency] ORDER BY m.[value] DESC) AS [value_rank],
    COUNT(*) OVER (PARTITION BY m.[kpi_code], m.[entity_ref], m.[group_code], m.[currency]) AS [month_count]
  FROM [dbo].[kpi_report_group_monthly] m
),
[totals] AS (
  SELECT
    r.[kpi_code],
    r.[entity_ref],
    r.[group_code],
    r.[currency],
    MAX(CASE WHEN r.[month_offset] = 12 THEN r.[value] END) AS [value_m12],
    MAX(CASE WHEN r.[month_offset] = 11 THEN r.[value] END) AS [value_m11],
    MAX(CASE WHEN r.[month_offset] = 10 THEN r.[value] END) AS [value_m10],
    MAX(CASE WHEN r.[month_offset] = 9 THEN r.[value] END) AS [value_m9],
    MAX(CASE WHEN r.[month_offset] = 8 THEN r.[value] END) AS [value_m8],
    MAX(CASE WHEN r.[month_offset] = 7 THEN r.[value] END) AS [value_m7],
    MAX(CASE WHEN r.[month_offset] = 6 THEN r.[value] END) AS [value_m6],
    MAX(CASE WHEN r.[month_offset] = 5 THEN r.[value] END) AS [value_m5],
    MAX(CASE WHEN r.[month_offset] = 4 THEN r.[value] END) AS [value_m4],
    MAX(CASE WHEN r.[month_offset] = 3 THEN r.[value] END) AS [value_m3],
    MAX(CASE WHEN r.[month_offset] = 2 THEN r.[value] END) AS [value_m2],
    MAX(CASE WHEN r.[month_offset] = 1 THEN r.[value] END) AS [value_m1],
    COUNT(*) AS [month_count],
    AVG(r.[value]) AS [average_value],
    AVG(CASE WHEN r.[month_offset] <= 3 THEN r.[value] END) AS [last3_average],
    MIN(r.[value]) AS [min_value],
    MAX(r.[value]) AS [max_value],
    AVG(CASE WHEN r.[value_rank] <= CEILING(r.[month_count] / 4.0) THEN r.[value] END)
      AS [top_quarter_average]
  FROM [ranked] r
  GROUP BY r.[kpi_code], r.[entity_ref], r.[group_code], r.[currency]
),
[based] AS (
  SELECT
    t.*,
    CASE WHEN t.[last3_average] > t.[average_value] THEN t.[last3_average] ELSE t.[average_value] END
      AS [base_value]
  FROM [totals] t
),
[targets] AS (
  SELECT
    b.*,
    CASE
      WHEN b.[top_quarter_average] > b.[base_value] THEN b.[top_quarter_average]
      ELSE b.[base_value]
    END AS [achievable_max_target]
  FROM [based] b
)
SELECT
  t.[kpi_code],
  t.[entity_ref],
  t.[group_code],
  t.[currency],
  t.[value_m12],
  t.[value_m11],
  t.[value_m10],
  t.[value_m9],
  t.[value_m8],
  t.[value_m7],
  t.[value_m6],
  t.[value_m5],
  t.[value_m4],
  t.[value_m3],
  t.[value_m2],
  t.[value_m1],
  t.[month_count],
  t.[average_value],
  t.[last3_average],
  t.[min_value],
  t.[max_value],
  t.[top_quarter_average],
  t.[base_value],
  t.[achievable_max_target],
  (t.[base_value] + t.[achievable_max_target]) / 2 AS [recommended_target]
FROM [targets] t';
  EXEC @exec @sql;

  SET @step = N'item_group_coverage';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[item_group_coverage]
AS
-- The share of the last 12 complete months'' net sales on items without a group code.
-- Those sales count in no *_GROUP_SALES KPI; schema-check and the target form warn.
WITH [report_period] AS (
  SELECT DATEADD(MONTH, -12, p.[current_month]) AS [first_month], p.[current_month]
  FROM (SELECT DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) AS [current_month]) p
),
[totals] AS (
  SELECT
    SUM(l.[sales_tmt]) AS [total_tmt],
    SUM(CASE WHEN l.[group_code] IS NULL THEN l.[sales_tmt] ELSE 0 END) AS [ungrouped_tmt]
  FROM [dbo].[kpi_report_group_lines] l
  CROSS JOIN [report_period] p
  WHERE l.[sale_date] >= p.[first_month] AND l.[sale_date] < p.[current_month]
)
SELECT
  CAST(t.[total_tmt] AS decimal(19, 2)) AS [total_tmt],
  CAST(t.[ungrouped_tmt] AS decimal(19, 2)) AS [ungrouped_tmt],
  CAST(100.0 * t.[ungrouped_tmt] / NULLIF(t.[total_tmt], 0) AS decimal(5, 2)) AS [ungrouped_share]
FROM [totals] t';
  EXEC @exec @sql;

  SET @step = N'report_STORE_GROUP_SALES';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_STORE_GROUP_SALES]
AS
-- One row per store, item group and currency that sold in the last 12 months;
-- 50 groups times every salesperson would otherwise be mostly empty rows (ADR-045).
SELECT
  CAST(s.[nr] AS int) AS [SUBE_NR],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(61)) AS [SUBE_ADI],
  r.[group_code] AS [MALZEME_GRUBU],
  r.[currency] AS [PARA_BIRIMI],
  CAST(r.[value_m12] AS decimal(19, 2)) AS [-12_AY_CIRO],
  CAST(r.[value_m11] AS decimal(19, 2)) AS [-11_AY_CIRO],
  CAST(r.[value_m10] AS decimal(19, 2)) AS [-10_AY_CIRO],
  CAST(r.[value_m9] AS decimal(19, 2)) AS [-9_AY_CIRO],
  CAST(r.[value_m8] AS decimal(19, 2)) AS [-8_AY_CIRO],
  CAST(r.[value_m7] AS decimal(19, 2)) AS [-7_AY_CIRO],
  CAST(r.[value_m6] AS decimal(19, 2)) AS [-6_AY_CIRO],
  CAST(r.[value_m5] AS decimal(19, 2)) AS [-5_AY_CIRO],
  CAST(r.[value_m4] AS decimal(19, 2)) AS [-4_AY_CIRO],
  CAST(r.[value_m3] AS decimal(19, 2)) AS [-3_AY_CIRO],
  CAST(r.[value_m2] AS decimal(19, 2)) AS [-2_AY_CIRO],
  CAST(r.[value_m1] AS decimal(19, 2)) AS [-1_AY_CIRO],
  r.[month_count] AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS decimal(19, 2)) AS [EN_DUSUK],
  CAST(r.[max_value] AS decimal(19, 2)) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS decimal(19, 0)) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS decimal(19, 0)) AS [ONERILEN_HEDEF]
FROM [dbo].[kpi_report_group_summary] r
JOIN [dbo].[stores] s ON s.[nr] = r.[entity_ref]
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
WHERE r.[kpi_code] = N''STORE_GROUP_SALES''';
  EXEC @exec @sql;

  SET @step = N'report_EMPLOYEE_GROUP_SALES';
  SET @sql = N'
CREATE OR ALTER VIEW [dbo].[report_EMPLOYEE_GROUP_SALES]
AS
-- One row per salesperson, item group and currency that sold in the last 12 months;
-- 50 groups times every salesperson would otherwise be mostly empty rows (ADR-045).
SELECT
  CAST(LTRIM(RTRIM(s.[code])) AS nvarchar(25)) AS [SATIS_ELEMANI_KODU],
  CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(51)) AS [SATIS_ELEMANI_ADI],
  s.[is_active] AS [AKTIF],
  r.[group_code] AS [MALZEME_GRUBU],
  r.[currency] AS [PARA_BIRIMI],
  CAST(r.[value_m12] AS decimal(19, 2)) AS [-12_AY_CIRO],
  CAST(r.[value_m11] AS decimal(19, 2)) AS [-11_AY_CIRO],
  CAST(r.[value_m10] AS decimal(19, 2)) AS [-10_AY_CIRO],
  CAST(r.[value_m9] AS decimal(19, 2)) AS [-9_AY_CIRO],
  CAST(r.[value_m8] AS decimal(19, 2)) AS [-8_AY_CIRO],
  CAST(r.[value_m7] AS decimal(19, 2)) AS [-7_AY_CIRO],
  CAST(r.[value_m6] AS decimal(19, 2)) AS [-6_AY_CIRO],
  CAST(r.[value_m5] AS decimal(19, 2)) AS [-5_AY_CIRO],
  CAST(r.[value_m4] AS decimal(19, 2)) AS [-4_AY_CIRO],
  CAST(r.[value_m3] AS decimal(19, 2)) AS [-3_AY_CIRO],
  CAST(r.[value_m2] AS decimal(19, 2)) AS [-2_AY_CIRO],
  CAST(r.[value_m1] AS decimal(19, 2)) AS [-1_AY_CIRO],
  r.[month_count] AS [AY_SAYISI],
  CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
  CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
  CAST(r.[min_value] AS decimal(19, 2)) AS [EN_DUSUK],
  CAST(r.[max_value] AS decimal(19, 2)) AS [EN_YUKSEK],
  CAST(ROUND(r.[achievable_max_target], 0) AS decimal(19, 0)) AS [ULASILABILIR_MAX_HEDEF],
  CAST(ROUND(r.[recommended_target], 0) AS decimal(19, 0)) AS [ONERILEN_HEDEF]
FROM [dbo].[kpi_report_group_summary] r
JOIN [dbo].[erp_employees] s ON s.[id] = r.[entity_ref]
JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
WHERE r.[kpi_code] = N''EMPLOYEE_GROUP_SALES''';
  EXEC @exec @sql;

  COMMIT TRANSACTION;

  -- 3) Sonuç
  SET @step = N'Sonuç';
  DECLARE @stores int;
  DECLARE @salespeople int;

  SET @sql = N'SELECT
  @stores = (SELECT COUNT(*) FROM [dbo].[stores] s JOIN [dbo].[kpi_report_settings] c ON c.[firm_nr] = s.[firm_nr]),
  @salespeople = (SELECT COUNT(*) FROM [dbo].[erp_employees] e JOIN [dbo].[kpi_report_settings] c ON c.[firm_nr] = e.[firm_nr])';
  EXEC @exec @sql, N'@stores int OUTPUT, @salespeople int OUTPUT', @stores OUTPUT, @salespeople OUTPUT;

  PRINT CONCAT(
    N'Kurulum tamam: ', @ReportDb, N' veritabanına 14 rapor kuruldu · Tiger ', @TigerDb,
    N' · firma ', @FirmNr, N' · dönem ', @periodList, N' · ',
    @stores, N' iş yeri, ', @salespeople, N' satış personeli.'
  );
  PRINT N'Deneyin: EXEC dbo.show_report N''STORE_SALES'';';
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;

  DECLARE @error nvarchar(2048) = CONCAT(@step, N': ', ERROR_MESSAGE());

  RAISERROR(N'KURULUM DURDU, hiçbir şey değişmedi. %s', 16, 1, @error);
END CATCH;

/*
  ORTAK KASA ADAYLARI — kurulumdan sonra çalıştırın. Ortak kasa carisi birçok farklı günde,
  birçok farklı satıcıdan fatura alır; tek bir kişiye benzemez. Kodunu @SharedCustomerCodes'a
  yazıp dosyayı yeniden çalıştırın.

  SELECT TOP (10)
    c.[CODE], c.[DEFINITION_],
    COUNT(*) AS [fatura],
    COUNT(DISTINCT CAST(i.[DATE_] AS date)) AS [gun],
    COUNT(DISTINCT i.[SALESMANREF]) AS [satici]
  FROM dbo.tiger_invoice i
  JOIN dbo.tiger_clcard c ON c.[LOGICALREF] = i.[CLIENTREF]
  WHERE i.[TRCODE] = 7 AND i.[CANCELLED] = 0
  GROUP BY c.[CODE], c.[DEFINITION_]
  ORDER BY [gun] DESC;
*/
