import type { VisitorCountImportRowErrorCode } from '../types/api';

export type Locale = 'tr' | 'en' | 'ru' | 'tk';

export const SUPPORTED_LOCALES: Locale[] = ['tr', 'en', 'ru', 'tk'];

export const LOCALE_LABELS: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  ru: 'Русский',
  tk: 'Türkmen',
};

interface TranslationShape {
  common: {
    showPassword: string;
    hidePassword: string;
    close: string;
    closeDialog: string;
    breadcrumb: string;
    cancel: string;
    confirm: string;
    confirmTitle: string;
    apply: string;
    clear: string;
    home: string;
    bulkActions: string;
    selectedCount: string;
    clearSelection: string;
    selectAll: string;
    selectItem: string;
  };
  login: {
    brand: string;
    title: string;
    subtitle: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    passwordLabel: string;
    submit: string;
    submitting: string;
    errorInvalidCredentials: string;
    errorGeneric: string;
    sessionExpired: string;
    rememberMe: string;
    forgotPassword: string;
    forgotPasswordHelp: string;
  };
  appShell: {
    logout: string;
    language: string;
    openMenu: string;
    closeMenu: string;
    navEmployees: string;
    navLeaderboard: string;
    navMyKpi: string;
    navKpiPlans: string;
    navVisitorCounts: string;
    navStoreDashboard: string;
    navKpiTemplates: string;
    navSettings: string;
    navSessions: string;
  };
  employees: {
    title: string;
    loading: string;
    errorLoading: string;
    empty: string;
    managerBadge: string;
    inactiveBadge: string;
    addEmployee: string;
    statusColumn: string;
    searchPlaceholder: string;
    noSearchResults: string;
    filters: string;
    resultCount: string;
    filtersActiveCount: string;
    filterStatusAll: string;
    filterOnlyActive: string;
    filterOnlyInactive: string;
    filterManagers: string;
    filterErpLinked: string;
    filterWithAvatar: string;
    filterStore: string;
    filterStoreAll: string;
    sortLabel: string;
    sortFirstnameAsc: string;
    sortFirstnameDesc: string;
    sortLastname: string;
    sortUsername: string;
    sortNewest: string;
    sortOldest: string;
    columnLastname: string;
    columnUsername: string;
    columnPhone: string;
    columnActions: string;
    openCard: string;
    editEmployee: string;
    activeBadge: string;
    bulkActivate: string;
    bulkDeactivate: string;
    bulkDeactivateConfirm: string;
    bulkActivated: string;
    bulkDeactivated: string;
    bulkError: string;
    selfSelectHint: string;
  };
  settings: {
    profilePhoto: string;
    changePhoto: string;
    cropPhoto: string;
    cropHint: string;
    zoom: string;
    cropSave: string;
    photoError: string;
    photoReadError: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    passwordMismatch: string;
    passwordTooShort: string;
    currentPasswordIncorrect: string;
    passwordChangeError: string;
    passwordUpdated: string;
    submitPassword: string;
    saving: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
  };
  sessions: {
    title: string;
    loading: string;
    errorLoading: string;
    empty: string;
    currentDevice: string;
    lastSeen: string;
    signedInAt: string;
    expiresAt: string;
    ipAddress: string;
    unknownDevice: string;
    revoke: string;
    revoking: string;
    logoutAll: string;
    logoutAllConfirm: string;
    revokeConfirm: string;
    rememberMeBadge: string;
    shortSessionBadge: string;
    expiryHint: string;
    revokeError: string;
    logoutAllError: string;
  };
  employeeCard: {
    title: string;
    email: string;
    erpCode: string;
    noErpLink: string;
    scanHint: string;
    noQrHint: string;
    viewPhoto: string;
    managerRole: string;
    employeeRole: string;
    open: string;
    loading: string;
    errorLoading: string;
    jobTitle: string;
    defaultStore: string;
  };
  employeeForm: {
    tabDetails: string;
    tabSessions: string;
    tabKpi: string;
    tabKpiPlans: string;
    tabSalary: string;
    goToKpiPlans: string;
    sessionsRevokeAll: string;
    titleCreate: string;
    titleEdit: string;
    loading: string;
    errorLoading: string;
    erpEmployeesError: string;
    usernameLabel: string;
    passwordLabelCreate: string;
    passwordLabelEdit: string;
    passwordHintEdit: string;
    firstnameLabel: string;
    lastnameLabel: string;
    emailLabel: string;
    phoneLabel: string;
    fullAccessLabel: string;
    fullAccessHint: string;
    visitorCountsLabel: string;
    visitorCountsHint: string;
    erpEmployeeLabel: string;
    erpEmployeeNone: string;
    erpEmployeeSearchPlaceholder: string;
    erpEmployeeNoResults: string;
    save: string;
    saving: string;
    deactivate: string;
    deactivating: string;
    reactivate: string;
    reactivating: string;
    selfDeactivateHint: string;
    usernameRequired: string;
    usernameTooShort: string;
    passwordRequired: string;
    passwordTooShort: string;
    firstnameRequired: string;
    lastnameRequired: string;
    jobTitleRequired: string;
    jobTitleLabel: string;
    jobTitlePlaceholder: string;
    defaultStoreLabel: string;
    defaultStoreHint: string;
    defaultStoreNone: string;
    emailInvalid: string;
    deactivateError: string;
    reactivateError: string;
    genericSaveError: string;
  };
  kpiTemplates: {
    title: string;
    searchPlaceholder: string;
    statusLabel: string;
    statusAll: string;
    statusActive: string;
    statusInactive: string;
    loading: string;
    errorLoading: string;
    empty: string;
    noSearchResults: string;
    resultCount: string;
    add: string;
    inactiveBadge: string;
    kpiCount: string;
    weightSummary: string;
    columnPlans: string;
    planCount: string;
    unused: string;
    openPlans: string;
    columnName: string;
    columnDescription: string;
    columnKpis: string;
    columnWeight: string;
    columnStatus: string;
    columnActions: string;
    editTemplate: string;
    activeBadge: string;
    bulkCopy: string;
    bulkActivate: string;
    bulkDeactivate: string;
    bulkDeactivateConfirm: string;
    bulkCopied: string;
    bulkActivated: string;
    bulkDeactivated: string;
    bulkDelete: string;
    bulkDeleteConfirm: string;
    bulkDeleted: string;
    bulkDeleteInUse: string;
    bulkError: string;
  };
  kpiTemplateForm: {
    titleCreate: string;
    titleEdit: string;
    loading: string;
    errorLoading: string;
    nameLabel: string;
    namePlaceholder: string;
    descriptionLabel: string;
    itemsTitle: string;
    itemsHint: string;
    addItem: string;
    itemTitle: string;
    removeItem: string;
    definitionLabel: string;
    definitionPlaceholder: string;
    definitionNoResults: string;
    definitionsError: string;
    weightLabel: string;
    targetLabel: string;
    unitMoney: string;
    unitCount: string;
    unitScore: string;
    storesPlaceholder: string;
    storesNoResults: string;
    storesError: string;
    removeStore: string;
    itemGroupsPlaceholder: string;
    itemGroupsNoResults: string;
    itemGroupsError: string;
    itemGroupOption: string;
    removeItemGroup: string;
    ungroupedHint: string;
    unknownItemGroup: string;
    selectPlaceholder: string;
    noInputs: string;
    totalWeight: string;
    totalWeightUnder: string;
    totalWeightOver: string;
    weightOver: string;
    weightUnder: string;
    save: string;
    saving: string;
    inactiveNotice: string;
    deactivate: string;
    deactivating: string;
    reactivate: string;
    reactivating: string;
    deactivateError: string;
    delete: string;
    deleting: string;
    deleteConfirm: string;
    deleteHint: string;
    deleteError: string;
    deleteInUse: string;
    copy: string;
    copyHint: string;
    copyError: string;
    copiedNotice: string;
    nameRequired: string;
    itemsRequired: string;
    definitionRequired: string;
    weightInvalid: string;
    targetInvalid: string;
    inputRequired: string;
    duplicateItem: string;
    unknownDefinition: string;
    invalidInput: string;
    unknownStore: string;
    nameTaken: string;
    genericSaveError: string;
  };
  recordInfo: {
    buttonFor: string;
    title: string;
    createdBy: string;
    updatedBy: string;
    system: string;
    history: string;
    historyEmpty: string;
    historyHint: string;
    loading: string;
    error: string;
    loadMore: string;
    actionCreate: string;
    actionUpdate: string;
    actionDelete: string;
    actionActivate: string;
    actionDeactivate: string;
    viaBulkStatus: string;
    viaBulkCopy: string;
    viaExcelImport: string;
    copiedFrom: string;
    actionExport: string;
    exportedFile: string;
    valueAdded: string;
    valueRemoved: string;
    valueChanged: string;
    valueYes: string;
    valueNo: string;
    valueActive: string;
    valueInactive: string;
    itemsBefore: string;
    itemsAfter: string;
    target: string;
    fields: {
      employees: {
        username: string;
        firstname: string;
        lastname: string;
        email: string;
        phoneNumber: string;
        erpEmployeeId: string;
        avatarId: string;
        fullAccess: string;
        canEnterVisitorCounts: string;
        jobTitle: string;
        defaultStoreId: string;
        isActive: string;
        passwordHash: string;
      };
      kpi_templates: {
        name: string;
        description: string;
        isActive: string;
        items: string;
      };
      kpi_periods: {
        year: string;
        month: string;
        status: string;
        closedAt: string;
      };
      kpi_assignments: {
        periodId: string;
        employeeId: string;
        templateId: string;
        templateName: string;
        items: string;
      };
      store_visitor_counts: {
        storeId: string;
        visitDate: string;
        visitorCount: string;
      };
      employee_salaries: {
        employeeId: string;
        effectiveMonth: string;
        amount: string;
        currency: string;
        fixedPercent: string;
        kpiPercent: string;
      };
    };
  };
  kpiPlans: {
    title: string;
    periodLabel: string;
    newPeriodTitle: string;
    year: string;
    month: string;
    open: string;
    statusOpen: string;
    statusClosed: string;
    closePeriod: string;
    newPeriod: string;
    closeConfirm: string;
    closeConfirmFinal: string;
    reopenPeriod: string;
    reopenPasswordMessage: string;
    exportExcel: string;
    exporting: string;
    exportTitle: string;
    exportConfirm: string;
    exportPasswordMessage: string;
    exported: string;
    reopened: string;
    reopenExpired: string;
    periodOpenHint: string;
    periodClosedReopenable: string;
    periodClosedFinal: string;
    periodPlans: string;
    periodMissingTargets: string;
    deletePlan: string;
    deleted: string;
    closed: string;
    assign: string;
    assignTitle: string;
    templateLabel: string;
    employeesLabel: string;
    employeeSearch: string;
    assignSubmit: string;
    assigned: string;
    copyFrom: string;
    copied: string;
    copiedNone: string;
    loading: string;
    errorLoading: string;
    empty: string;
    emptyPeriods: string;
    noSearchResults: string;
    searchPlaceholder: string;
    templateFilter: string;
    clearTemplateFilter: string;
    noTemplatePlans: string;
    targetProgress: string;
    columnEmployee: string;
    columnTemplate: string;
    columnTargets: string;
    columnActions: string;
    openPlan: string;
    openPlanShort: string;
    calculateAll: string;
    calculatingAll: string;
    calculatedAll: string;
    calculatedAllIncomplete: string;
    columnScore: string;
    noScore: string;
    scoreValue: string;
    assignError: string;
    alreadyAssigned: string;
    ineligible: string;
    reasonInactive: string;
    reasonMissingErpLink: string;
    reasonAlreadyAssigned: string;
    periodClosedError: string;
    selectTemplate: string;
    employeesEmpty: string;
    salaryTitle: string;
    salaryFixed: string;
    salaryKpi: string;
    salaryPayable: string;
    salaryPlans: string;
    salaryWithout: string;
    salaryNotCalculated: string;
    salaryNone: string;
    salaryBarLabel: string;
    noSalary: string;
  };
  kpiPlanForm: {
    title: string;
    loading: string;
    errorLoading: string;
    save: string;
    saved: string;
    saveError: string;
    closedError: string;
    invalidTarget: string;
    targetLabel: string;
    missingTarget: string;
    weight: string;
    stores: string;
    itemGroups: string;
    currency: string;
    recommendation: string;
    recommendationMonths: string;
    applyRecommendation: string;
    applyAll: string;
    applyConfirmOne: string;
    applyConfirmAll: string;
    applyConfirmButton: string;
    emptyTarget: string;
    combinedHint: string;
    manualHint: string;
    noRecommendation: string;
    deletePlan: string;
    deleteConfirm: string;
    deleteError: string;
    closedNotice: string;
    calculate: string;
    calculating: string;
    calculated: string;
    calculatedIncomplete: string;
    actualLabel: string;
    actualPlaceholder: string;
    actualHint: string;
    calculatedItem: string;
  };
  myKpi: {
    title: string;
    loading: string;
    errorLoading: string;
    empty: string;
    period: string;
    periodOption: string;
    periodOpen: string;
    periodClosed: string;
    weight: string;
    target: string;
    noTarget: string;
    emptyEmployee: string;
    errorLoadingEmployee: string;
  };
  leaderboard: {
    title: string;
    period: string;
    templateFilter: string;
    allTemplates: string;
    store: string;
    allStores: string;
    loading: string;
    errorLoading: string;
    empty: string;
    autoEvery: string;
    autoOff: string;
    periodClosed: string;
    updatedAt: string;
    notCalculated: string;
    scoredOf: string;
    you: string;
    rank: string;
    unranked: string;
    colRank: string;
    colEmployee: string;
    colTemplate: string;
    colScore: string;
    myStanding: string;
    placeShort: string;
    myNotCalculated: string;
    amongCount: string;
    gapToNext: string;
    leading: string;
    podium: string;
    others: string;
    openKpi: string;
  };
  salary: {
    loading: string;
    errorLoading: string;
    empty: string;
    noneYet: string;
    currentTitle: string;
    sinceMonth: string;
    fromMonth: string;
    inForce: string;
    history: string;
    fixedPart: string;
    kpiPart: string;
    splitLabel: string;
    add: string;
    addTitle: string;
    editTitle: string;
    editFor: string;
    deleteFor: string;
    deleteConfirm: string;
    deleteError: string;
    delete: string;
    effectiveMonth: string;
    effectiveHint: string;
    amount: string;
    amountPlaceholder: string;
    currency: string;
    fixedPercent: string;
    kpiPercent: string;
    preview: string;
    calcOpen: string;
    calcClose: string;
    calcTitle: string;
    calcHint: string;
    calcPartLabel: string;
    calcFixedAmount: string;
    calcKpiAmount: string;
    calcResult: string;
    calcApply: string;
    calcNeedPercents: string;
    calcZeroPercent: string;
    calcTooLarge: string;
    save: string;
    saving: string;
    saveError: string;
    errorMonthExists: string;
    errorPercentTotal: string;
    errorPeriodClosed: string;
  };
  kpiSalary: {
    title: string;
    since: string;
    show: string;
    hide: string;
    hidden: string;
    payable: string;
    fixedOnly: string;
    barLabel: string;
    fixedPart: string;
    kpiPart: string;
    byScore: string;
    fullSalary: string;
    interim: string;
    final: string;
    notCalculated: string;
    itemValue: string;
    itemEarned: string;
    noSalary: string;
    kpiEarnedShort: string;
  };
  kpiConversion: {
    title: string;
    formula: string;
    counted: string;
    countedStores: string;
    result: string;
    lowCoverage: string;
    noVisitors: string;
    noDays: string;
    rules: string;
    notScored: string;
  };
  passwordConfirm: {
    label: string;
    checking: string;
    wrong: string;
  };
  kpiProgress: {
    totalScore: string;
    outOf: string;
    notCalculated: string;
    calculatedAt: string;
    incomplete: string;
    achievement: string;
    percent: string;
    reached: string;
    actualOfTarget: string;
    actualOnly: string;
    contribution: string;
    noTarget: string;
    noActual: string;
    meterLabel: string;
    scoreMeterLabel: string;
  };
  visitorCounts: {
    title: string;
    store: string;
    date: string;
    count: string;
    countPlaceholder: string;
    save: string;
    update: string;
    saving: string;
    saved: string;
    replaceHint: string;
    existing: string;
    loading: string;
    errorLoading: string;
    empty: string;
    people: string;
    edit: string;
    editFor: string;
    deleteFor: string;
    deleteConfirm: string;
    deleted: string;
    errorUnknownStore: string;
    errorFutureDate: string;
    errorClosed: string;
    saveError: string;
    columnDate: string;
    columnStore: string;
    columnCount: string;
    columnActions: string;
    add: string;
    addTitle: string;
    editTitle: string;
    filters: string;
    filterDates: string;
    filterFrom: string;
    filterTo: string;
    rangeInvalid: string;
    rangeFrom: string;
    rangeTo: string;
    removeFilter: string;
    resultCount: string;
    emptyFiltered: string;
    excel: string;
    excelTitle: string;
    excelStep1: string;
    excelStep1Hint: string;
    excelStoreAll: string;
    excelStoreOne: string;
    excelDownload: string;
    excelDownloading: string;
    excelStep2: string;
    excelStep2Hint: string;
    excelChooseFile: string;
    excelChangeFile: string;
    excelUpload: string;
    excelUploading: string;
    excelResult: string;
    excelSkipped: string;
    excelRowsInvalid: string;
    excelRow: string;
    excelMoreErrors: string;
    excelErrorFile: string;
    excelErrorTooLarge: string;
    excelErrorEmpty: string;
    excelErrorRange: string;
    excelDone: string;
    excelRowErrors: Record<VisitorCountImportRowErrorCode, string>;
  };
  visitorReport: {
    button: string;
    title: string;
    rangeThisWeek: string;
    rangeLast10: string;
    rangeThisMonth: string;
    rangeLastMonth: string;
    rangeCustom: string;
    allStores: string;
    store: string;
    from: string;
    to: string;
    errorRange: string;
    loading: string;
    error: string;
    empty: string;
    totalVisitors: string;
    dailyAverage: string;
    perStoreDay: string;
    change: string;
    noChange: string;
    coverage: string;
    coverageLow: string;
    busiestDay: string;
    dailyTitle: string;
    dailyHint: string;
    dayValue: string;
    dayMissing: string;
    missing: string;
    weekdayTitle: string;
    weekdayHint: string;
    storesTitle: string;
    storeDays: string;
    storeAverage: string;
    notEntered: string;
    people: string;
    chartLabel: string;
    percent: string;
    weekdays: {
      w1: string;
      w2: string;
      w3: string;
      w4: string;
      w5: string;
      w6: string;
      w7: string;
    };
  };
  storeDashboard: {
    title: string;
    year: string;
    yearOption: string;
    store: string;
    allStores: string;
    currency: string;
    tabs: string;
    summaryTab: string;
    refreshEvery: string;
    refreshOff: string;
    updatedAt: string;
    loading: string;
    error: string;
    empty: string;
    comparing: string;
    comparedMonths: string;
    noComparison: string;
    inProgress: string;
    inProgressShort: string;
    growth: string;
    noGrowth: string;
    percent: string;
    /** A change between two percentages, e.g. the conversion's difference. */
    percentPoints: string;
    monthlyAverage: string;
    total: string;
    difference: string;
    yearSoFar: string;
    previousYearAll: string;
    monthlyTitle: string;
    monthlyHint: string;
    monthAria: string;
    month: string;
    change: string;
    storesTitle: string;
    storesHint: string;
    singleStore: string;
    openKpi: string;
    customersNote: string;
    ratioNote: string;
    /** Short names on the tabs and cards, next to each KPI's icon. */
    kpiShort: {
      sales: string;
      receipts: string;
      customers: string;
      newCustomers: string;
      returningCustomers: string;
      productVariety: string;
      conversion: string;
      visitors: string;
    };
  };
  /** Copying templates and plans with a target change (ADR-070). */
  kpiCopy: {
    changeLabel: string;
    decrease: string;
    increase: string;
    presets: string;
    summaryKeep: string;
    summaryUp: string;
    summaryDown: string;
    rangeError: string;
    roundingNote: string;
    previewTitle: string;
    previewTargets: string;
    previewLoading: string;
    previewError: string;
    noTarget: string;
    noDefaultTargets: string;
    capped: string;
    weight: string;
    templateTitle: string;
    templatesTitle: string;
    templateSource: string;
    nameLabel: string;
    nameHint: string;
    namePlaceholder: string;
    templatesList: string;
    moreTemplates: string;
    templatesNameHint: string;
    copyTemplate: string;
    copyTemplates: string;
    copying: string;
    plansTitle: string;
    sourceLabel: string;
    targetLabel: string;
    sampleTitle: string;
    sourceEmpty: string;
    samplePosition: string;
    previousSample: string;
    nextSample: string;
    skipNote: string;
    copyPlans: string;
    changedUp: string;
    changedDown: string;
  };
  errors: {
    generic: string;
    network: string;
    validation: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    conflict: string;
    payloadTooLarge: string;
    tooManyRequests: string;
    tooManyRequestsWait: string;
    server: string;
  };
}

export const translations: Record<Locale, TranslationShape> = {
  tr: {
    common: {
      showPassword: 'Parolayı göster',
      hidePassword: 'Parolayı gizle',
      close: 'Kapat',
      closeDialog: '{title} penceresini kapat',
      breadcrumb: 'Gezinme yolu',
      cancel: 'Vazgeç',
      confirm: 'Onayla',
      confirmTitle: 'Emin misiniz?',
      apply: 'Uygula',
      clear: 'Temizle',
      home: 'Ana sayfa',
      bulkActions: 'Toplu işlemler',
      selectedCount: '{count} seçili',
      clearSelection: 'Seçimi temizle',
      selectAll: 'Listelenenlerin tümünü seç',
      selectItem: '{name} seç',
    },
    login: {
      brand: 'Retail KPI Platform',
      title: 'Giriş yap',
      subtitle: 'Hesabınıza giriş yaparak başlayın',
      usernameLabel: 'Kullanıcı adı',
      usernamePlaceholder: 'Örn. admin',
      passwordLabel: 'Parola',
      submit: 'Giriş yap',
      submitting: 'Giriş yapılıyor…',
      errorInvalidCredentials: 'Kullanıcı adı veya parola hatalı.',
      errorGeneric: 'Giriş yapılamadı. Bağlantınızı kontrol edin.',
      sessionExpired: 'Oturumunuz sona erdi. Lütfen yeniden giriş yapın.',
      rememberMe: 'Beni hatırla',
      forgotPassword: 'Şifremi unuttum',
      forgotPasswordHelp:
        'Parola sıfırlama e-postası şu anda desteklenmiyor. Lütfen yöneticinizden parolanızı sıfırlamasını isteyin.',
    },
    appShell: {
      logout: 'Çıkış yap',
      language: 'Dil',
      openMenu: 'Menüyü aç',
      closeMenu: 'Menüyü kapat',
      navEmployees: 'Çalışanlar',
      navLeaderboard: 'Sıralama tablosu',
      navMyKpi: 'KPI’larım',
      navKpiPlans: 'KPI planları',
      navVisitorCounts: 'Ziyaretçi sayıları',
      navStoreDashboard: 'Mağaza dashboard’u',
      navKpiTemplates: 'KPI şablonları',
      navSettings: 'Ayarlar',
      navSessions: 'Oturumlarım',
    },
    employees: {
      title: 'Çalışanlar',
      loading: 'Yükleniyor…',
      errorLoading: 'Çalışanlar yüklenemedi.',
      empty: 'Henüz çalışan eklenmemiş.',
      managerBadge: 'Yönetici',
      inactiveBadge: 'Pasif',
      addEmployee: 'Yeni çalışan ekle',
      statusColumn: 'Durum',
      searchPlaceholder: 'Ad, soyad, kullanıcı adı, e-posta veya telefonda ara',
      noSearchResults: 'Aramanızla eşleşen çalışan bulunamadı.',
      filters: 'Filtreler',
      resultCount: '{count} çalışan',
      filtersActiveCount: '{count} filtre aktif',
      filterStatusAll: 'Tümü',
      filterOnlyActive: 'Yalnızca aktif çalışanlar',
      filterOnlyInactive: 'Yalnızca pasif çalışanlar',
      filterManagers: 'Yalnızca yöneticiler',
      filterErpLinked: 'ERP personeline bağlı',
      filterWithAvatar: 'Profil fotoğrafı olanlar',
      filterStore: 'Mağaza',
      filterStoreAll: 'Tüm mağazalar',
      sortLabel: 'Sıralama',
      sortFirstnameAsc: 'Ad (A→Z)',
      sortFirstnameDesc: 'Ad (Z→A)',
      sortLastname: 'Soyad (A→Z)',
      sortUsername: 'Kullanıcı adı (A→Z)',
      sortNewest: 'En yeni',
      sortOldest: 'En eski',
      columnLastname: 'Soyad',
      columnUsername: 'Kullanıcı adı',
      columnPhone: 'Telefon',
      columnActions: 'İşlem',
      openCard: '{name} çalışan kartını aç',
      editEmployee: '{name} çalışanını düzenle',
      activeBadge: 'Aktif',
      bulkActivate: 'Aktifleştir',
      bulkDeactivate: 'Pasifleştir',
      bulkDeactivateConfirm:
        '{count} çalışan pasifleştirilsin mi? Açık oturumları kapatılır ve yeniden aktifleştirilene kadar giriş yapamazlar.',
      bulkActivated: '{count} çalışan aktifleştirildi.',
      bulkDeactivated: '{count} çalışan pasifleştirildi, oturumları kapatıldı.',
      bulkError: 'Toplu işlem tamamlanamadı. Lütfen tekrar deneyin.',
      selfSelectHint: 'Kendi hesabınızı toplu işlemle değiştiremezsiniz.',
    },
    settings: {
      profilePhoto: 'Profil fotoğrafı',
      changePhoto: 'Fotoğrafı değiştir',
      cropPhoto: 'Fotoğrafı kırp',
      cropHint: 'Fotoğrafı sürükleyerek konumlandırın, kaydırıcı ile yakınlaştırın',
      zoom: 'Fotoğraf yakınlaştırma düzeyi',
      cropSave: 'Kırp ve kaydet',
      photoError: 'Fotoğraf güncellenemedi. Lütfen tekrar deneyin.',
      photoReadError: 'Seçilen fotoğraf okunamadı. Lütfen başka bir dosya deneyin.',
      changePassword: 'Parola değiştir',
      currentPassword: 'Mevcut parola',
      newPassword: 'Yeni parola',
      confirmPassword: 'Parolayı onayla',
      passwordMismatch: 'Parolalar eşleşmiyor.',
      passwordTooShort: 'Parola en az 6 karakter olmalıdır.',
      currentPasswordIncorrect: 'Mevcut parola hatalı.',
      passwordChangeError: 'Parola değiştirilemedi. Lütfen tekrar deneyin.',
      passwordUpdated: 'Parola güncellendi.',
      submitPassword: 'Parolayı değiştir',
      saving: 'Kaydediliyor…',
      theme: 'Tema',
      themeLight: 'Açık',
      themeDark: 'Koyu',
      themeSystem: 'Sistem',
    },
    sessions: {
      title: 'Oturumlarım',
      loading: 'Yükleniyor…',
      errorLoading: 'Oturumlar yüklenemedi.',
      empty: 'Aktif oturum bulunmuyor.',
      currentDevice: 'Bu cihaz',
      lastSeen: 'Son görülme',
      signedInAt: 'Giriş',
      expiresAt: 'Bitiş',
      ipAddress: 'IP adresi',
      unknownDevice: 'Bilinmeyen cihaz',
      revoke: 'Oturumu kapat',
      revoking: 'Kapatılıyor…',
      logoutAll: 'Tüm cihazlardan çık',
      logoutAllConfirm:
        'Tüm cihazlardaki oturumlar kapatılacak ve yeniden giriş yapmanız gerekecek. Devam edilsin mi?',
      revokeConfirm: 'Bu cihazdaki oturum kapatılacak. Devam edilsin mi?',
      rememberMeBadge: 'Kalıcı oturum',
      shortSessionBadge: 'Kısa oturum',
      expiryHint: 'Oturum her kullanımda uzar; bu tarihe kadar işlem yapılmazsa kapanır.',
      revokeError: 'Oturum kapatılamadı. Lütfen tekrar deneyin.',
      logoutAllError: 'Oturumlar kapatılamadı. Lütfen tekrar deneyin.',
    },
    employeeCard: {
      title: 'Çalışan kartı',
      email: 'E-posta',
      erpCode: 'ERP kodu',
      noErpLink: 'ERP bağlantısı yok',
      scanHint: 'ERP personel kodunu içerir; okutarak doğrulayın',
      noQrHint: 'Karekod üretmek için bu çalışanı bir ERP personeline bağlayın.',
      viewPhoto: 'Fotoğrafı büyüt',
      managerRole: 'Yönetici',
      employeeRole: 'Çalışan',
      open: '{name} çalışan kartını aç',
      loading: 'Çalışan kartı yükleniyor…',
      errorLoading: 'Çalışan kartı yüklenemedi.',
      jobTitle: 'Görevi',
      defaultStore: 'Mağaza',
    },
    employeeForm: {
      tabDetails: 'Bilgiler',
      tabSessions: 'Oturumlar',
      tabKpi: 'KPI',
      tabKpiPlans: 'KPI planları',
      tabSalary: 'Maaş',
      goToKpiPlans: 'KPI planları ekranına git',
      sessionsRevokeAll: 'Tüm oturumları kapat',
      titleCreate: 'Yeni çalışan',
      titleEdit: 'Çalışanı düzenle',
      loading: 'Yükleniyor…',
      errorLoading: 'Çalışan bilgileri yüklenemedi.',
      erpEmployeesError: 'ERP satış personeli listesi yüklenemedi.',
      usernameLabel: 'Kullanıcı adı',
      passwordLabelCreate: 'Parola',
      passwordLabelEdit: 'Yeni parola (opsiyonel)',
      passwordHintEdit: 'Boş bırakılırsa mevcut parola değişmez.',
      firstnameLabel: 'Ad',
      lastnameLabel: 'Soyad',
      emailLabel: 'E-posta (opsiyonel)',
      phoneLabel: 'Telefon (opsiyonel)',
      fullAccessLabel: 'Yönetici erişimi',
      fullAccessHint: 'Çalışanlar ve dosya yönetimi gibi ekranlara erişebilir.',
      visitorCountsLabel: 'Ziyaretçi sayısı girebilir',
      visitorCountsHint:
        'Mağazalara her gün giren kişi sayısını "Ziyaretçi sayıları" ekranından girer.',
      erpEmployeeLabel: 'ERP satış personeli (opsiyonel)',
      erpEmployeeNone: 'Bağlı değil',
      erpEmployeeSearchPlaceholder: 'Kod veya ad ile arayın',
      erpEmployeeNoResults: 'Eşleşen satış personeli bulunamadı.',
      save: 'Kaydet',
      saving: 'Kaydediliyor…',
      deactivate: 'Çalışanı devre dışı bırak',
      deactivating: 'Devre dışı bırakılıyor…',
      reactivate: 'Yeniden etkinleştir',
      reactivating: 'Etkinleştiriliyor…',
      selfDeactivateHint: 'Kendi hesabınızı buradan devre dışı bırakamazsınız.',
      usernameRequired: 'Kullanıcı adı zorunludur.',
      usernameTooShort: 'Kullanıcı adı en az 3 karakter olmalıdır.',
      passwordRequired: 'Parola zorunludur.',
      passwordTooShort: 'Parola en az 8 karakter olmalıdır.',
      firstnameRequired: 'Ad zorunludur.',
      lastnameRequired: 'Soyad zorunludur.',
      jobTitleRequired: 'Görevi zorunludur.',
      jobTitleLabel: 'Görevi',
      jobTitlePlaceholder: 'ör. Satış danışmanı, Mağaza müdürü',
      defaultStoreLabel: 'Varsayılan mağaza (opsiyonel)',
      defaultStoreHint: 'Çalışan kartında görünür; liderlik tablosu bu mağazaya göre süzülür.',
      defaultStoreNone: 'Mağaza yok',
      emailInvalid: 'Geçerli bir e-posta adresi girin.',
      deactivateError: 'Çalışan devre dışı bırakılamadı.',
      reactivateError: 'Çalışan yeniden etkinleştirilemedi.',
      genericSaveError: 'Kaydedilemedi. Lütfen tekrar deneyin.',
    },
    kpiTemplates: {
      title: 'KPI şablonları',
      searchPlaceholder: 'Ad veya açıklama ara',
      statusLabel: 'Durum',
      statusAll: 'Tümü',
      statusActive: 'Aktif',
      statusInactive: 'Pasif',
      loading: 'Yükleniyor…',
      errorLoading: 'KPI şablonları yüklenemedi.',
      empty: 'Henüz KPI şablonu yok.',
      noSearchResults: 'Aramaya uygun şablon bulunamadı.',
      resultCount: '{count} şablon',
      add: 'Yeni KPI şablonu',
      inactiveBadge: 'Pasif',
      kpiCount: '{count} KPI',
      weightSummary: 'Ağırlık %{total}',
      columnPlans: 'Planlar',
      planCount: 'Plan: {count}',
      unused: 'Kullanılmadı',
      openPlans: '{name} şablonuyla oluşturulan planları göster ({count})',
      columnName: 'Ad',
      columnDescription: 'Açıklama',
      columnKpis: 'KPI sayısı',
      columnWeight: 'Toplam ağırlık',
      columnStatus: 'Durum',
      columnActions: 'İşlem',
      editTemplate: '{name} şablonunu düzenle',
      activeBadge: 'Aktif',
      bulkCopy: 'Kopyala',
      bulkActivate: 'Aktifleştir',
      bulkDeactivate: 'Pasifleştir',
      bulkDeactivateConfirm:
        '{count} şablon pasifleştirilsin mi? İstediğiniz zaman yeniden aktifleştirebilirsiniz.',
      bulkCopied: '{count} şablon kopyalandı; kopyaların adına “(2)” gibi bir numara eklendi.',
      bulkActivated: '{count} şablon aktifleştirildi.',
      bulkDeactivated: '{count} şablon pasifleştirildi.',
      bulkDelete: 'Sil',
      bulkDeleteConfirm:
        '{count} şablon kalıcı olarak silinsin mi? Bu işlem geri alınamaz. KPI planında kullanılan şablon silinmez.',
      bulkDeleted: '{count} şablon kalıcı olarak silindi.',
      bulkDeleteInUse:
        'Şu şablonlar KPI planlarında kullanıldığı için silinemez: {names}. Bunları yalnız pasifleştirebilirsiniz.',
      bulkError: 'Toplu işlem tamamlanamadı. Lütfen tekrar deneyin.',
    },
    kpiTemplateForm: {
      titleCreate: 'Yeni KPI şablonu',
      titleEdit: 'KPI şablonunu düzenle',
      loading: 'Yükleniyor…',
      errorLoading: 'Şablon yüklenemedi.',
      nameLabel: 'Şablon adı',
      namePlaceholder: 'ör. MÜDÜR KPI 01',
      descriptionLabel: 'Açıklama (opsiyonel)',
      itemsTitle: 'KPI’lar',
      itemsHint:
        'Ağırlıkların toplamı tam %100 olmalı. Hedef isteğe bağlıdır; şablon döneme atanırken değiştirilebilir.',
      addItem: 'KPI ekle',
      itemTitle: '{number}. KPI',
      removeItem: '{number}. KPI satırını kaldır',
      definitionLabel: 'KPI',
      definitionPlaceholder: 'KPI ara ve seç',
      definitionNoResults: 'Eşleşen KPI bulunamadı.',
      definitionsError: 'KPI listesi yüklenemedi.',
      weightLabel: 'Ağırlık (%)',
      targetLabel: 'Hedef ({unit})',
      unitMoney: 'tutar',
      unitCount: 'adet',
      unitScore: 'puan',
      storesPlaceholder: 'Mağaza ara ve ekle',
      storesNoResults: 'Eşleşen mağaza bulunamadı.',
      storesError: 'Mağaza listesi yüklenemedi.',
      removeStore: '{name} mağazasını kaldır',
      itemGroupsPlaceholder: 'Malzeme grubu ara ve ekle',
      itemGroupsNoResults: 'Grup bulunamadı.',
      itemGroupsError: 'Malzeme grupları yüklenemedi.',
      itemGroupOption: '{code} · {count} ürün',
      removeItemGroup: '{name} grubunu çıkar',
      ungroupedHint:
        'Grubu boş ürünler hiçbir grup KPI’ına girmez: son 12 ayda cironun %{share}’i. Ürün kartlarına Tiger’da grup verildikçe dahil olurlar.',
      unknownItemGroup: '{number}. KPI artık bulunmayan malzeme grubu içeriyor: {codes}.',
      selectPlaceholder: 'Seçin',
      noInputs: 'Bu KPI için hedef dışında ek bilgi gerekmez.',
      totalWeight: 'Toplam ağırlık: %{total} / %100',
      totalWeightUnder: 'Toplam ağırlık: %{total} / %100 · %{difference} eksik',
      totalWeightOver: 'Toplam ağırlık: %{total} / %100 · %{difference} fazla, kaydedilemez',
      weightOver: 'Ağırlıkların toplamı %100’ü aşıyor (şu an %{total}). Bu şekilde kaydedilemez.',
      weightUnder: 'Ağırlıkların toplamı tam %100 olmalı (şu an %{total}).',
      save: 'Kaydet',
      saving: 'Kaydediliyor…',
      inactiveNotice: 'Bu şablon pasif.',
      deactivate: 'Şablonu pasifleştir',
      deactivating: 'Pasifleştiriliyor…',
      reactivate: 'Tekrar etkinleştir',
      reactivating: 'Etkinleştiriliyor…',
      deactivateError: 'Şablon pasifleştirilemedi.',
      delete: 'Şablonu sil',
      deleting: 'Siliniyor…',
      deleteConfirm: '“{name}” şablonu kalıcı olarak silinsin mi? Bu işlem geri alınamaz.',
      deleteHint: 'KPI planında kullanılmayan şablon kalıcı olarak silinebilir.',
      deleteError: 'Şablon silinemedi.',
      deleteInUse:
        'Bu şablondan {count} KPI planı oluşturulmuş, bu yüzden silinemez. Şablonu pasifleştirebilirsiniz.',
      copy: 'Kopyasını oluştur',
      copyHint: 'Kaydedilmiş son hâli bütün KPI’larıyla kopyalanır.',
      copyError: 'Şablon kopyalanamadı.',
      copiedNotice:
        '“{name}” şablonundan kopyalandı. Adını ve bilgilerini düzenleyip kaydedebilirsiniz.',
      nameRequired: 'Şablon adı zorunludur.',
      itemsRequired: 'En az bir KPI ekleyin.',
      definitionRequired: '{number}. satır için bir KPI seçin.',
      weightInvalid:
        '{number}. KPI için 0,01 ile 100 arasında, en fazla 2 ondalıklı bir ağırlık girin.',
      targetInvalid:
        '{number}. KPI için hedef 0 veya daha büyük, en fazla 4 ondalıklı bir sayı olmalı.',
      inputRequired: '{number}. KPI için “{field}” alanı zorunludur.',
      duplicateItem: '{number}. KPI, {other}. KPI ile aynı (aynı KPI ve aynı bilgiler).',
      unknownDefinition: '{number}. KPI artık aktif değil veya bulunamadı.',
      invalidInput: '{number}. KPI’nin bilgileri geçersiz.',
      unknownStore: '{number}. KPI artık bulunmayan bir mağaza içeriyor.',
      nameTaken: 'Bu adla bir KPI şablonu zaten var.',
      genericSaveError: 'Şablon kaydedilemedi. Lütfen tekrar deneyin.',
    },
    recordInfo: {
      buttonFor: '{name} kayıt bilgisi',
      title: 'Kayıt bilgisi',
      createdBy: 'Oluşturan',
      updatedBy: 'Son değiştiren',
      system: 'Sistem',
      history: 'Değişiklik geçmişi',
      historyEmpty: 'Bu kayıt için henüz değişiklik kaydı yok.',
      historyHint:
        'Değişiklik geçmişi bu özellik açıldığından beri tutuluyor; daha eski değişiklikler listede görünmez.',
      loading: 'Yükleniyor…',
      error: 'Kayıt bilgisi yüklenemedi.',
      loadMore: 'Daha fazla göster',
      actionCreate: 'Oluşturuldu',
      actionUpdate: 'Güncellendi',
      actionDelete: 'Silindi',
      actionActivate: 'Aktifleştirildi',
      actionDeactivate: 'Pasifleştirildi',
      viaBulkStatus: 'toplu işlemle',
      viaBulkCopy: 'toplu kopyalamayla',
      viaExcelImport: 'Excel’den',
      copiedFrom: '“{name}” şablonundan kopyalandı',
      actionExport: 'Excel indirildi',
      exportedFile: 'Dosya: {name}',
      valueAdded: 'eklendi',
      valueRemoved: 'kaldırıldı',
      valueChanged: 'değiştirildi',
      valueYes: 'Evet',
      valueNo: 'Hayır',
      valueActive: 'Aktif',
      valueInactive: 'Pasif',
      itemsBefore: 'Önce',
      itemsAfter: 'Sonra',
      target: 'hedef {value}',
      fields: {
        employees: {
          username: 'Kullanıcı adı',
          firstname: 'Ad',
          lastname: 'Soyad',
          email: 'E-posta',
          phoneNumber: 'Telefon',
          erpEmployeeId: 'ERP satış personeli',
          avatarId: 'Profil fotoğrafı',
          fullAccess: 'Yönetici erişimi',
          canEnterVisitorCounts: 'Ziyaretçi sayısı girebilir',
          jobTitle: 'Görevi',
          defaultStoreId: 'Varsayılan mağaza',
          isActive: 'Durum',
          passwordHash: 'Parola',
        },
        kpi_templates: {
          name: 'Şablon adı',
          description: 'Açıklama',
          isActive: 'Durum',
          items: 'KPI’lar',
        },
        kpi_periods: {
          year: 'Yıl',
          month: 'Ay',
          status: 'Durum',
          closedAt: 'Kapanış zamanı',
        },
        kpi_assignments: {
          periodId: 'Dönem',
          employeeId: 'Çalışan',
          templateId: 'Şablon',
          templateName: 'Şablon adı',
          items: 'KPI’lar',
        },
        store_visitor_counts: {
          storeId: 'Mağaza',
          visitDate: 'Gün',
          visitorCount: 'Giren kişi sayısı',
        },
        employee_salaries: {
          employeeId: 'Çalışan',
          effectiveMonth: 'Geçerli olduğu ay',
          amount: 'Maaş',
          currency: 'Para birimi',
          fixedPercent: 'Sabit yüzde',
          kpiPercent: 'KPI yüzdesi',
        },
      },
    },
    kpiPlans: {
      title: 'KPI planları',
      periodLabel: 'Dönem',
      newPeriodTitle: 'Yeni dönem aç',
      year: 'Yıl',
      month: 'Ay',
      open: 'Dönemi aç',
      statusOpen: 'Açık',
      statusClosed: 'Kapalı',
      closePeriod: 'Dönemi kapat',
      newPeriod: 'Yeni dönem',
      closeConfirm:
        '{period} dönemi kapatılsın mı? Kapalı dönemde plan, hedef ve puan değiştirilemez. Yanlışlıkla kapatırsanız {date} tarihine kadar yeniden açabilirsiniz.',
      closeConfirmFinal:
        '{period} dönemi kapatılsın mı? Yeniden açma süresi geçtiği için kapanış kesin olur; plan, hedef ve puan bir daha değiştirilemez.',
      reopenPeriod: 'Dönemi yeniden aç',
      reopenPasswordMessage:
        '{period} dönemi yeniden açılacak; planlar, hedefler ve hesap yeniden değiştirilebilir olacak. Onaylamak için şifrenizi girin.',
      exportExcel: 'Excel',
      exporting: 'Hazırlanıyor…',
      exportTitle: 'KPI ve maaş Excel’i',
      exportConfirm: 'İndir',
      exportPasswordMessage:
        '{period} döneminin bütün planları KPI puanları ve maaşlarıyla Excel olarak indirilecek. Dosya maaş bilgisi içerir; indirme dönemin kayıt bilgisine yazılır.\n\nOnaylamak için şifrenizi girin.',
      exported: '{file} indirildi.',
      reopened: '{period} dönemi yeniden açıldı.',
      reopenExpired: 'Bu dönem {date} tarihine kadar yeniden açılabilirdi; artık kesinleşti.',
      periodOpenHint: 'Planlar, hedefler ve puanlar değiştirilebilir.',
      periodClosedReopenable:
        'Değişiklik yapılamaz. Yanlışlıkla kapattıysanız {date} tarihine kadar yeniden açabilirsiniz.',
      periodClosedFinal: 'Kesinleşti: değişiklik yapılamaz, yeniden açılamaz.',
      periodPlans: '{count} plan',
      periodMissingTargets: '{count} planın hedefi eksik',
      deletePlan: '{name} planını sil',
      deleted: '{name} çalışanının planı silindi.',
      closed: '{period} dönemi kapatıldı.',
      assign: 'Şablon ata',
      assignTitle: 'Şablon ata',
      templateLabel: 'KPI şablonu',
      employeesLabel: 'Çalışanlar',
      employeeSearch: 'Çalışan ara',
      assignSubmit: 'Plan oluştur',
      assigned: '{count} çalışana plan verildi.',
      copyFrom: 'Başka dönemden kopyala',
      copied: '{created} plan kopyalandı, {skipped} çalışan atlandı.',
      copiedNone: 'Kopyalanacak uygun plan bulunamadı.',
      loading: 'Yükleniyor…',
      errorLoading: 'Planlar yüklenemedi.',
      empty: 'Bu dönemde henüz plan yok.',
      emptyPeriods: 'Henüz KPI dönemi yok. Başlamak için bir ay açın.',
      noSearchResults: 'Aramaya uygun plan bulunamadı.',
      searchPlaceholder: 'Çalışan ara',
      templateFilter: 'Şablon: {name}',
      clearTemplateFilter: 'Şablon süzgecini kaldır',
      noTemplatePlans: 'Bu dönemde bu şablonla oluşturulmuş plan yok.',
      targetProgress: '{done}/{total} hedef',
      columnEmployee: 'Çalışan',
      columnTemplate: 'Şablon',
      columnTargets: 'Hedefler',
      columnActions: 'İşlem',
      openPlan: '{name} planını aç',
      openPlanShort: 'Aç',
      calculateAll: 'Tümünü hesapla',
      calculatingAll: 'Hesaplanıyor…',
      calculatedAll: '{count} planın puanı hesaplandı.',
      calculatedAllIncomplete: '{count} planın puanı hesaplandı; {incomplete} planın puanı eksik.',
      columnScore: 'Puan',
      noScore: '—',
      scoreValue: '{value} puan',
      assignError: 'Plan oluşturulamadı.',
      alreadyAssigned: 'Bu çalışanların bu dönemde zaten planı var: {names}',
      ineligible: 'Bu çalışanlara plan verilemez: {names}',
      reasonInactive: 'pasif',
      reasonMissingErpLink: 'Tiger satış personeli eşlemesi yok',
      reasonAlreadyAssigned: 'planı zaten var',
      periodClosedError: 'Dönem kapalı olduğu için değişiklik yapılamadı.',
      selectTemplate: 'Şablon seçin',
      employeesEmpty: 'Çalışan bulunamadı.',
      salaryTitle: 'Bu dönem ödenecek',
      salaryFixed: 'Sabit',
      salaryKpi: "KPI'dan",
      salaryPayable: 'Alınacak',
      salaryPlans: '{count} planın toplamı',
      salaryWithout: '{count} kişinin bu ay geçerli maaşı yok',
      salaryNotCalculated: '{count} kişinin puanı hesaplanmadı; yalnız sabit kısım sayıldı',
      salaryNone:
        'Bu planların hiçbirinin bu ay geçerli maaşı yok. Maaş, çalışanın Maaş sekmesinden girilir.',
      salaryBarLabel: "Sabit %{fixed} · KPI'dan kazanılan %{earned}",
      noSalary: 'Bu ay geçerli maaş yok',
    },
    kpiPlanForm: {
      title: 'KPI planı',
      loading: 'Yükleniyor…',
      errorLoading: 'Plan yüklenemedi.',
      save: 'Hedefleri kaydet',
      saved: 'Hedefler kaydedildi.',
      saveError: 'Hedefler kaydedilemedi.',
      closedError: 'Dönem kapalı; hedefler değiştirilemez.',
      invalidTarget: 'Hedef geçersiz. Negatif olmayan, en fazla 4 ondalıklı bir sayı girin.',
      targetLabel: 'Hedef',
      missingTarget: 'Hedef girilmedi',
      weight: 'Ağırlık %{value}',
      stores: 'Mağazalar',
      itemGroups: 'Gruplar',
      currency: 'Para birimi',
      recommendation: 'Ortalama {average} · Ulaşılabilir max {max} · Önerilen {recommended}',
      recommendationMonths: '{count} aylık veri',
      applyRecommendation: 'Öneriyi uygula',
      applyAll: 'Bütün önerileri uygula',
      applyConfirmOne:
        "{name}: hedef {change} olacak.\nKaydet'e basınca kalıcı olur. Emin misiniz?",
      applyConfirmAll:
        "Şu hedefler değişecek:\n{changes}\nKaydet'e basınca kalıcı olur. Emin misiniz?",
      applyConfirmButton: 'Uygula',
      emptyTarget: 'boş',
      combinedHint: 'birden fazla mağaza birleştirildi',
      manualHint: 'Bu KPI elle girilir; raporu yoktur.',
      noRecommendation: 'Bu KPI için rapor verisi yok.',
      deletePlan: 'Planı sil',
      deleteConfirm: '{name} çalışanının {period} planı silinsin mi?',
      deleteError: 'Plan silinemedi.',
      closedNotice: '{period} dönemi kapalı; hedefler salt okunur.',
      calculate: 'Hesapla',
      calculating: 'Hesaplanıyor…',
      calculated: 'Puan hesaplandı.',
      calculatedIncomplete: 'Puan hesaplandı; {done}/{total} satır puanlanabildi.',
      actualLabel: 'Gerçekleşen',
      actualPlaceholder: 'Elle girilir',
      actualHint: 'Bu KPI Tiger’dan hesaplanmaz; değeri siz girersiniz.',
      calculatedItem: 'Bu KPI Tiger’dan hesaplanıyor, elle girilemez.',
    },
    myKpi: {
      title: 'KPI’larım',
      loading: 'Yükleniyor…',
      errorLoading: 'KPI planınız yüklenemedi.',
      empty: 'Size henüz bir KPI planı verilmedi.',
      period: 'Dönem',
      periodOption: '{period} · {score} puan',
      periodOpen: 'Dönem açık; puan henüz kesinleşmedi.',
      periodClosed: 'Dönem kapandı; puan kesinleşti.',
      weight: 'Ağırlık',
      target: 'Hedef',
      noTarget: 'Hedef henüz girilmedi',
      emptyEmployee: 'Bu çalışana henüz bir KPI planı verilmedi.',
      errorLoadingEmployee: 'Çalışanın KPI planı yüklenemedi.',
    },
    leaderboard: {
      title: 'Sıralama tablosu',
      period: 'Dönem',
      templateFilter: 'Şablona göre süz',
      allTemplates: 'Tümü',
      store: 'Mağaza',
      allStores: 'Tüm mağazalar',
      loading: 'Yükleniyor…',
      errorLoading: 'Sıralama yüklenemedi.',
      empty: 'Bu dönemde henüz KPI planı yok.',
      autoEvery: 'Puanlar {minutes} dakikada bir kendiliğinden güncellenir',
      autoOff: 'Otomatik güncelleme kapalı',
      periodClosed: 'Dönem kapandı; puanlar kesin',
      updatedAt: 'son güncelleme {at}',
      notCalculated: 'Puan henüz hesaplanmadı',
      scoredOf: '{done}/{total} KPI puanlandı',
      you: 'Sen',
      rank: '{rank}. sıra',
      unranked: 'Sırası yok',
      colRank: 'Sıra',
      colEmployee: 'Çalışan',
      colTemplate: 'Şablon',
      colScore: 'Puan',
      myStanding: 'Senin yerin',
      placeShort: 'sıra',
      myNotCalculated: 'Puanın henüz hesaplanmadı.',
      amongCount: '{count} kişi arasında',
      gapToNext: '{rank}. sıraya çıkmak için {gap} puan daha',
      leading: 'Zirvedesin! Böyle devam.',
      podium: 'İlk üç',
      others: 'Diğer sıralar',
      openKpi: "{name} KPI'larını aç",
    },
    salary: {
      loading: 'Yükleniyor…',
      errorLoading: 'Maaşlar yüklenemedi.',
      empty: 'Bu çalışana henüz maaş girilmedi.',
      noneYet: 'Bu ay için geçerli maaş yok; ilk maaş daha sonraki bir aydan başlıyor.',
      currentTitle: 'Şu an geçerli maaş',
      sinceMonth: '{month} ayından beri geçerli',
      fromMonth: '{month} ayından itibaren',
      inForce: 'Şu an geçerli',
      history: 'Maaş geçmişi',
      fixedPart: 'Sabit %{percent}',
      kpiPart: 'KPI %{percent}',
      splitLabel: 'Sabit %{fixed}, KPI %{kpi}',
      add: 'Maaş ekle',
      addTitle: 'Maaş ekle',
      editTitle: 'Maaşı düzelt',
      editFor: 'Maaşı düzelt: {range}',
      deleteFor: 'Maaşı sil: {range}',
      deleteConfirm:
        '{month} ayından itibaren geçerli maaş silinsin mi? O aydan sonra bir önceki maaş geçerli olur.',
      deleteError: 'Maaş silinemedi.',
      delete: 'Sil',
      effectiveMonth: 'Geçerli olduğu ay',
      effectiveHint: 'Bu aydan itibaren, yeni bir maaş girilene kadar geçerlidir.',
      amount: 'Maaş',
      amountPlaceholder: 'Örn. 12000',
      currency: 'Para birimi',
      fixedPercent: 'Sabit (%)',
      kpiPercent: 'KPI (%)',
      preview: 'Sabit {fixed} + KPI {kpi}',
      calcOpen: 'Maaşı sabit ya da KPI tutarından hesapla',
      calcClose: 'Hesap makinesini kapat',
      calcTitle: 'Maaşı hesapla',
      calcHint: 'Bir kısmın tutarını yazın; maaş yüzdelere göre hesaplanır.',
      calcPartLabel: 'Bilinen kısım',
      calcFixedAmount: 'Sabit kısım ne kadar olsun? ({currency})',
      calcKpiAmount: 'KPI kısmı ne kadar olsun? ({currency})',
      calcResult: 'Maaş',
      calcApply: 'Maaşa yaz',
      calcNeedPercents: 'Önce sabit ve KPI yüzdelerini girin; toplamları 100 olmalı.',
      calcZeroPercent: 'Bu kısmın yüzdesi 0; maaş ondan hesaplanamaz.',
      calcTooLarge: 'Hesaplanan maaş izin verilen en büyük tutarı aşıyor.',
      save: 'Kaydet',
      saving: 'Kaydediliyor…',
      saveError: 'Maaş kaydedilemedi.',
      errorMonthExists: 'Bu çalışanın bu ay için zaten bir maaşı var.',
      errorPercentTotal: 'Sabit ve KPI yüzdelerinin toplamı 100 olmalı.',
      errorPeriodClosed:
        'Bu değişiklik kapanmış dönemlerin maaşını değiştirir: {months}. Kapanmış ayın ödemesi kesindir; düzeltmek için önce dönemi yeniden açın.',
    },
    kpiSalary: {
      title: 'Maaş',
      since: '{month} ayından beri geçerli maaş',
      show: 'Göster',
      hide: 'Gizle · {seconds}',
      hidden: 'Gizli tutar; göstermek için dokunun',
      payable: 'Bu dönem alınacak',
      fixedOnly: 'Sabit kısım (KPI henüz hesaplanmadı)',
      barLabel: 'Sabit %{fixed}, KPI %{kpi}, puan {score}',
      fixedPart: 'Sabit %{percent}',
      kpiPart: 'KPI %{percent}',
      byScore: 'Puan {score} üzerinden',
      fullSalary: 'Toplam maaş',
      interim: 'Dönem açık: puan değiştikçe tutar da değişir.',
      final: 'Dönem kapandı; tutar kesin.',
      notCalculated: 'KPI kısmı, puan hesaplanınca eklenecek.',
      itemValue: 'Maaştaki değeri',
      itemEarned: 'Kazanılan',
      noSalary:
        'Bu çalışanın bu ay için geçerli maaşı yok; maaş, çalışanın Maaş sekmesinden girilir.',
      kpiEarnedShort: "KPI'dan kazanılan",
    },
    kpiConversion: {
      title: 'Nasıl hesaplandı?',
      formula: 'Dönüşüm = satış fişi ÷ mağazaya giren kişi × 100.',
      counted:
        "{last} tarihine kadar {possible} günün {counted}'inde giren kişi sayısı girildi (kapsama %{coverage}).",
      countedStores:
        "{stores} mağazanın {last} tarihine kadarki {possible} mağaza-gününün {counted}'inde giren kişi sayısı girildi (kapsama %{coverage}).",
      result:
        'Yalnız bu günler hesaba katıldı: {receipts} satış fişi ÷ {visitors} kişi = %{value}.',
      lowCoverage:
        'Puanlanmak için günlerin en az %{required}\'inde sayı girilmiş olmalı. Eksik günlerin sayıları "Ziyaretçi sayıları" ekranından girilince bir sonraki hesapta puanlanır.',
      noVisitors: 'Sayılan günlerin hepsinde giren kişi 0 girildi; oran hesaplanamaz.',
      noDays: 'Henüz hesaba girecek gün yok: yalnız bugünden önceki günler sayılır.',
      rules:
        'Bugün, gün bitmediği için sayılmaz. Sayısı girilmeyen günler tahmin edilmez, hesaba hiç girmez; 0 girilen gün (kapalı mağaza) sayılır. İade fişleri oranı etkilemez.',
      notScored: 'Ziyaretçi sayısı yeterli günde girilmediği için puanlanmadı.',
    },
    passwordConfirm: {
      label: 'Şifreniz',
      checking: 'Kontrol ediliyor…',
      wrong: 'Şifre yanlış.',
    },
    kpiProgress: {
      totalScore: 'Toplam puan',
      outOf: '/ {max}',
      notCalculated: 'Puan henüz hesaplanmadı.',
      calculatedAt: 'Son hesaplama: {at}',
      incomplete: '{done}/{total} KPI puanlandı; kalanların hedefi ya da gerçekleşeni yok.',
      achievement: 'Gerçekleşme',
      percent: '%{value}',
      reached: 'Hedefe ulaşıldı',
      actualOfTarget: 'Gerçekleşen {actual} / hedef {target}',
      actualOnly: 'Gerçekleşen {actual}',
      contribution: 'Katkı {score} / {weight}',
      noTarget: 'Hedef girilmediği için puanlanmadı.',
      noActual: 'Gerçekleşen girilmediği için puanlanmadı.',
      meterLabel: '{name} gerçekleşmesi',
      scoreMeterLabel: '{name} toplam puanı',
    },
    visitorCounts: {
      title: 'Ziyaretçi sayıları',
      store: 'Mağaza',
      date: 'Gün',
      count: 'Giren kişi sayısı',
      countPlaceholder: 'Örn. 184',
      save: 'Kaydet',
      update: 'Güncelle',
      saving: 'Kaydediliyor…',
      saved: '{store} · {date}: {count} kişi kaydedildi.',
      replaceHint: 'Aynı mağaza ve gün yeniden girilirse sayı güncellenir.',
      existing: 'Bu gün için kayıtlı sayı: {count}. Kaydedince değişir.',
      loading: 'Yükleniyor…',
      errorLoading: 'Girişler yüklenemedi.',
      empty: 'Henüz giriş yok.',
      people: 'kişi',
      edit: 'Düzenle',
      editFor: '{store} · {date} girişini düzenle',
      deleteFor: '{store} · {date} girişini sil',
      deleteConfirm: '{store} mağazasının {date} günlük sayısı silinsin mi?',
      deleted: 'Giriş silindi.',
      errorUnknownStore: 'Seçilen mağaza Tiger’da bulunamadı.',
      errorFutureDate: 'Gelecekteki bir gün için sayı girilemez.',
      errorClosed: 'Bu gün kapalı bir KPI dönemine ait; sayı değiştirilemez.',
      saveError: 'Sayı kaydedilemedi.',
      columnDate: 'Gün',
      columnStore: 'Mağaza',
      columnCount: 'Giren kişi',
      columnActions: 'İşlem',
      add: 'Sayı ekle',
      addTitle: 'Ziyaretçi sayısı ekle',
      editTitle: 'Ziyaretçi sayısını düzelt',
      filters: 'Filtreler',
      filterDates: 'Tarih aralığı',
      filterFrom: 'Başlangıç günü',
      filterTo: 'Bitiş günü',
      rangeInvalid: 'Başlangıç günü bitiş gününden sonra olamaz.',
      rangeFrom: '{date} ve sonrası',
      rangeTo: '{date} ve öncesi',
      removeFilter: '{filter} filtresini kaldır',
      resultCount: '{count} kayıt',
      emptyFiltered: 'Bu filtrelere uyan kayıt yok.',
      excel: 'Excel',
      excelTitle: 'Excel ile toplu giriş',
      excelStep1: 'Şablonu indirin',
      excelStep1Hint:
        'Seçtiğiniz günlerde her iş yeri için bir satır hazır gelir; kayıtlı sayılar doludur. Açıklama dosyanın “Açıklama” sayfasındadır.',
      excelStoreAll: 'Bütün iş yerleri',
      excelStoreOne: 'Yalnız {store}',
      excelDownload: 'Şablonu indir',
      excelDownloading: 'Hazırlanıyor…',
      excelStep2: 'Doldurup yükleyin',
      excelStep2Hint:
        'Sayıları D sütununa yazın; boş bıraktığınız satır değişmez. Aynı iş yeri ve gün için sayı varsa yenisi eskisinin yerine geçer ve kayıt izine yazılır. Bir satır bile hatalıysa hiçbir şey kaydedilmez.',
      excelChooseFile: 'Excel dosyası seç (.xlsx)',
      excelChangeFile: 'Başka dosya seç',
      excelUpload: 'Yükle',
      excelUploading: 'Yükleniyor…',
      excelResult:
        '{created} yeni sayı eklendi, {updated} sayı güncellendi, {unchanged} sayı zaten aynıydı.',
      excelSkipped: '{count} satırda sayı yazılı değildi, atlandı.',
      excelRowsInvalid:
        '{count} satır hatalı, hiçbir şey kaydedilmedi. Düzeltip dosyayı yeniden yükleyin:',
      excelRow: 'Satır {row}',
      excelMoreErrors: '… ve {count} hatalı satır daha',
      excelErrorFile: 'Dosya okunamadı. Buradan indirilen .xlsx şablonunu kullanın.',
      excelErrorTooLarge: 'Dosya çok büyük: en çok 5.000 satır ve 2 MB.',
      excelErrorEmpty: 'Dosyada sayı yazılmış satır yok.',
      excelErrorRange: 'Tarih aralığı en çok 62 gün olabilir ve bugünden ileri olamaz.',
      excelDone: 'Tamam',
      excelRowErrors: {
        INVALID_DATE: 'tarih okunamadı',
        FUTURE_DATE: 'gelecekteki bir gün',
        INVALID_STORE: 'iş yeri no okunamadı',
        UNKNOWN_STORE: 'bu numarada iş yeri yok',
        INVALID_COUNT: 'sayı 0 ya da daha büyük bir tam sayı olmalı',
        DUPLICATE: 'aynı iş yeri ve gün dosyada iki kez var',
        CLOSED_PERIOD: 'bu ayın KPI dönemi kapalı',
      },
    },
    visitorReport: {
      button: 'Rapor',
      title: 'Ziyaretçi raporu',
      rangeThisWeek: 'Bu hafta',
      rangeLast10: 'Son 10 gün',
      rangeThisMonth: 'Bu ay',
      rangeLastMonth: 'Geçen ay',
      rangeCustom: 'Özel',
      allStores: 'Bütün iş yerleri',
      store: 'İş yeri',
      from: 'Başlangıç',
      to: 'Bitiş',
      errorRange: 'Tarih aralığı en çok 366 gün olabilir ve bugünden ileri olamaz.',
      loading: 'Rapor hazırlanıyor…',
      error: 'Rapor yüklenemedi.',
      empty: 'Bu aralıkta girilmiş sayı yok.',
      totalVisitors: 'Toplam ziyaretçi',
      dailyAverage: 'Günlük ortalama',
      perStoreDay: 'iş yeri başına, girilen günlerden',
      change: 'önceki {days} güne göre',
      noChange: 'önceki dönemde veri yok',
      coverage: 'Girilen gün',
      coverageLow:
        'Bazı günler girilmemiş (%{percent}). Ortalamalar yalnız girilen günlerden hesaplanır; eksik günleri girin.',
      busiestDay: 'En yoğun gün',
      dailyTitle: 'Günlük ziyaretçi',
      dailyHint: 'Değerini görmek için bir çubuğa dokunun.',
      dayValue: '{date}: {count} kişi · {stores} iş yeri',
      dayMissing: '{date}: girilmedi',
      missing: 'Girilmedi',
      weekdayTitle: 'Haftanın günleri',
      weekdayHint: 'İş yeri başına ortalama kişi',
      storesTitle: 'İş yerleri',
      storeDays: '{days}/{possible} gün',
      storeAverage: 'ort. {average}',
      notEntered: 'girilmedi',
      people: 'kişi',
      chartLabel: 'Günlük ziyaretçi grafiği, {from} – {to}, toplam {total} kişi',
      percent: '%{value}',
      weekdays: {
        w1: 'Pzt',
        w2: 'Sal',
        w3: 'Çar',
        w4: 'Per',
        w5: 'Cum',
        w6: 'Cmt',
        w7: 'Paz',
      },
    },
    storeDashboard: {
      title: 'Mağaza dashboard’u',
      year: 'Yıl',
      yearOption: '{year} · {previous} ile',
      store: 'Mağaza',
      allStores: 'Tüm mağazalar',
      currency: 'Para birimi',
      tabs: 'KPI sekmeleri',
      summaryTab: 'Özet',
      refreshEvery: 'Değerler {minutes} dakikada bir güncellenir',
      refreshOff: 'Otomatik güncelleme kapalı',
      updatedAt: 'son güncelleme {at}',
      loading: 'Yükleniyor…',
      error: 'Dashboard yüklenemedi.',
      empty: 'Henüz saklanmış değer yok. Değerler Tiger’dan hesaplanır ve ilk güncellemede gelir.',
      comparing: '{year} ile {previous} karşılaştırması',
      comparedMonths: 'Karşılaştırılan aylar: {range} ({count} ay)',
      noComparison:
        '{previous} yılında karşılaştırılacak veri yok. Artış, iki yılda da verisi olan bitmiş aylardan hesaplanır; şimdilik yalnız {year} değerleri görünüyor.',
      inProgress: '{month} devam ediyor; karşılaştırmaya girmez.',
      inProgressShort: 'Devam ediyor',
      growth: 'Artış',
      noGrowth: 'Karşılaştırma yok',
      percent: '%{value}',
      percentPoints: '{value} yüzde puan',
      monthlyAverage: 'Aylık ortalama',
      total: 'Toplam',
      difference: 'Fark',
      yearSoFar: '{year}: bitmiş {count} ay',
      previousYearAll: '{year}: {count} ay',
      monthlyTitle: 'Ay ay karşılaştırma',
      monthlyHint: 'Ayrıntı için bir aya dokunun.',
      monthAria: '{month}: {year} {current}, {previousYear} {previous}',
      month: 'Ay',
      change: 'Değişim',
      storesTitle: 'Mağaza karşılaştırması',
      storesHint: 'Karşılaştırılan aylardaki artışa göre sıralı.',
      singleStore: 'Bu yıllarda yalnız bir mağazanın satışı var.',
      openKpi: '{name} ayrıntısı',
      customersNote:
        'Mağazalar toplanırken iki mağazada da görülen müşteri ya da ürün iki kez sayılır.',
      ratioNote:
        "Dönüşüm yalnız ziyaretçi sayısı girilmiş günlerden hesaplanır: o günlerin satış fişleri ÷ ziyaretçileri. Günlerinin %80'inden azına sayı girilen ay ölçülmez (—). Mağazalar ve aylar birleşirken fişler ve ziyaretçiler önce toplanır, sonra bölünür.",
      kpiShort: {
        sales: 'Ciro',
        receipts: 'Fiş',
        customers: 'Müşteri',
        newCustomers: 'Yeni müşteri',
        returningCustomers: 'Eski müşteri',
        productVariety: 'Ürün çeşidi',
        conversion: 'Dönüşüm',
        visitors: 'Ziyaretçi',
      },
    },
    kpiCopy: {
      changeLabel: 'Hedef değişimi',
      decrease: 'Bir puan azalt',
      increase: 'Bir puan artır',
      presets: 'Hazır oranlar',
      summaryKeep: 'Hedefler olduğu gibi kopyalanır.',
      summaryUp: 'Her hedef %{value} artırılır.',
      summaryDown: 'Her hedef %{value} azaltılır.',
      rangeError: '{min} ile {max} arasında, en fazla iki ondalıklı bir oran yazın.',
      roundingNote:
        'Para ve adet hedefleri tam sayıya yuvarlanır; yüzde hedefleri 100’ü geçmez. Hedefi boş satırlar boş kalır.',
      previewTitle: 'Önizleme',
      previewTargets: '{items} KPI’dan {targets} tanesinde hedef var',
      previewLoading: 'Önizleme yükleniyor…',
      previewError: 'Önizleme yüklenemedi; kopyalama yine de çalışır.',
      noTarget: 'Hedef yok, boş kalır',
      noDefaultTargets: 'Bu şablonda varsayılan hedef yok; kopya da hedefsiz oluşur.',
      capped: 'en fazla %100',
      weight: 'Ağırlık {value}',
      templateTitle: 'Şablonu kopyala',
      templatesTitle: '{count} şablonu kopyala',
      templateSource: '“{name}” bütün KPI’larıyla yeni bir şablon olarak kopyalanır.',
      nameLabel: 'Yeni şablonun adı',
      nameHint: 'Boş bırakırsanız sıradaki numara eklenir, ör. “{name}”.',
      namePlaceholder: 'Otomatik',
      templatesList: 'Kopyalanacak şablonlar',
      moreTemplates: '+{count} şablon daha',
      templatesNameHint: 'Her kopyanın adına “(2)” gibi sıradaki numara eklenir.',
      copyTemplate: 'Kopyala',
      copyTemplates: '{count} şablonu kopyala',
      copying: 'Kopyalanıyor…',
      plansTitle: 'Planları kopyala',
      sourceLabel: 'Kaynak dönem',
      targetLabel: 'Bu dönem',
      sampleTitle: 'Örnek plan',
      sourceEmpty: 'Seçilen dönemde kopyalanacak plan yok.',
      samplePosition: '{index} / {total}',
      previousSample: 'Önceki örnek',
      nextSample: 'Sonraki örnek',
      skipNote: 'Bu dönemde planı olan, pasif ya da Tiger eşlemesi olmayan çalışanlar atlanır.',
      copyPlans: 'Planları kopyala',
      changedUp: 'Hedefler %{value} artırıldı.',
      changedDown: 'Hedefler %{value} azaltıldı.',
    },
    errors: {
      generic: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      network: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.',
      validation: 'Girdiğiniz bilgileri kontrol edin.',
      unauthorized: 'Oturumunuz sona erdi. Lütfen yeniden giriş yapın.',
      forbidden: 'Bu işlemi yapmaya yetkiniz yok.',
      notFound: 'İstenen kayıt bulunamadı.',
      conflict: 'Bu bilgiler başka bir kayıtla çakışıyor.',
      payloadTooLarge: 'Seçilen dosya izin verilen boyuttan büyük.',
      tooManyRequests: 'Çok fazla deneme yapıldı. Lütfen biraz bekleyin.',
      tooManyRequestsWait:
        'Çok fazla hatalı deneme yapıldı. {minutes} dakika sonra tekrar deneyin.',
      server: 'Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
    },
  },
  en: {
    common: {
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      close: 'Close',
      closeDialog: 'Close {title}',
      breadcrumb: 'Breadcrumb',
      cancel: 'Cancel',
      confirm: 'Confirm',
      confirmTitle: 'Are you sure?',
      apply: 'Apply',
      clear: 'Clear',
      home: 'Home',
      bulkActions: 'Bulk actions',
      selectedCount: '{count} selected',
      clearSelection: 'Clear selection',
      selectAll: 'Select all listed',
      selectItem: 'Select {name}',
    },
    login: {
      brand: 'Retail KPI Platform',
      title: 'Sign in',
      subtitle: 'Sign in to your account to get started',
      usernameLabel: 'Username',
      usernamePlaceholder: 'e.g. admin',
      passwordLabel: 'Password',
      submit: 'Sign in',
      submitting: 'Signing in…',
      errorInvalidCredentials: 'Incorrect username or password.',
      errorGeneric: 'Could not sign in. Check your connection.',
      sessionExpired: 'Your session has ended. Please sign in again.',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      forgotPasswordHelp:
        'Password reset by email is not supported yet. Please ask an administrator to reset your password.',
    },
    appShell: {
      logout: 'Log out',
      language: 'Language',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      navEmployees: 'Employees',
      navLeaderboard: 'Leaderboard',
      navMyKpi: 'My KPI',
      navKpiPlans: 'KPI plans',
      navVisitorCounts: 'Visitor counts',
      navStoreDashboard: 'Store dashboard',
      navKpiTemplates: 'KPI templates',
      navSessions: 'My sessions',
      navSettings: 'Settings',
    },
    employees: {
      title: 'Employees',
      loading: 'Loading…',
      errorLoading: 'Could not load employees.',
      empty: 'No employees yet.',
      managerBadge: 'Admin',
      inactiveBadge: 'Inactive',
      addEmployee: 'Add employee',
      statusColumn: 'Status',
      searchPlaceholder: 'Search name, surname, username, email or phone',
      noSearchResults: 'No employees match your search.',
      filters: 'Filters',
      resultCount: '{count} employees',
      filtersActiveCount: '{count} filters active',
      filterStatusAll: 'All',
      filterOnlyActive: 'Active employees only',
      filterOnlyInactive: 'Inactive employees only',
      filterManagers: 'Admins only',
      filterErpLinked: 'Linked to an ERP rep',
      filterWithAvatar: 'Has a profile photo',
      filterStore: 'Store',
      filterStoreAll: 'All stores',
      sortLabel: 'Sort',
      sortFirstnameAsc: 'First name (A→Z)',
      sortFirstnameDesc: 'First name (Z→A)',
      sortLastname: 'Last name (A→Z)',
      sortUsername: 'Username (A→Z)',
      sortNewest: 'Newest',
      sortOldest: 'Oldest',
      columnLastname: 'Last name',
      columnUsername: 'Username',
      columnPhone: 'Phone',
      columnActions: 'Actions',
      openCard: 'Open employee card for {name}',
      editEmployee: 'Edit {name}',
      activeBadge: 'Active',
      bulkActivate: 'Activate',
      bulkDeactivate: 'Deactivate',
      bulkDeactivateConfirm:
        'Deactivate the selected employees ({count})? Their open sessions will be closed and they cannot sign in until reactivated.',
      bulkActivated: 'Employees activated: {count}.',
      bulkDeactivated: 'Employees deactivated and signed out: {count}.',
      bulkError: 'The bulk action could not be completed. Please try again.',
      selfSelectHint: 'You cannot change your own account with a bulk action.',
    },
    settings: {
      profilePhoto: 'Profile photo',
      changePhoto: 'Change photo',
      cropPhoto: 'Crop photo',
      cropHint: 'Drag the photo to position it, use the slider to zoom',
      zoom: 'Photo zoom level',
      cropSave: 'Crop and save',
      photoError: 'Could not update the photo. Please try again.',
      photoReadError: 'Could not read the selected photo. Please try another file.',
      changePassword: 'Change password',
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      passwordMismatch: 'Passwords do not match.',
      passwordTooShort: 'Password must be at least 6 characters.',
      currentPasswordIncorrect: 'The current password is incorrect.',
      passwordChangeError: 'Could not change the password. Please try again.',
      passwordUpdated: 'Password updated.',
      submitPassword: 'Change password',
      saving: 'Saving…',
      theme: 'Theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeSystem: 'System',
    },
    sessions: {
      title: 'My sessions',
      loading: 'Loading…',
      errorLoading: 'Could not load sessions.',
      empty: 'No active sessions.',
      currentDevice: 'This device',
      lastSeen: 'Last seen',
      signedInAt: 'Signed in',
      expiresAt: 'Expires',
      ipAddress: 'IP address',
      unknownDevice: 'Unknown device',
      revoke: 'Sign out',
      revoking: 'Signing out…',
      logoutAll: 'Sign out of all devices',
      logoutAllConfirm:
        'This signs you out on every device and you will need to log in again. Continue?',
      revokeConfirm: 'This signs out the session on that device. Continue?',
      rememberMeBadge: 'Long-lived session',
      shortSessionBadge: 'Short session',
      expiryHint: 'The session extends on each use; it closes if left idle past this time.',
      revokeError: 'Could not sign out this session. Please try again.',
      logoutAllError: 'Could not sign out the sessions. Please try again.',
    },
    employeeCard: {
      title: 'Employee card',
      email: 'Email',
      erpCode: 'ERP code',
      noErpLink: 'Not linked to ERP',
      scanHint: 'Holds the ERP staff code; scan it to verify',
      noQrHint: 'Link this employee to an ERP rep to generate a QR code.',
      viewPhoto: 'View full photo',
      managerRole: 'Admin',
      employeeRole: 'Employee',
      open: "Open {name}'s employee card",
      loading: 'Loading employee card…',
      errorLoading: 'Could not load the employee card.',
      jobTitle: 'Job title',
      defaultStore: 'Store',
    },
    employeeForm: {
      tabDetails: 'Details',
      tabSessions: 'Sessions',
      tabKpi: 'KPI',
      tabKpiPlans: 'KPI plans',
      tabSalary: 'Salary',
      goToKpiPlans: 'Go to KPI plans',
      sessionsRevokeAll: 'Sign out everywhere',
      titleCreate: 'New employee',
      titleEdit: 'Edit employee',
      loading: 'Loading…',
      errorLoading: 'Could not load the employee details.',
      erpEmployeesError: 'Could not load the ERP sales representative list.',
      usernameLabel: 'Username',
      passwordLabelCreate: 'Password',
      passwordLabelEdit: 'New password (optional)',
      passwordHintEdit: 'Leave blank to keep the current password.',
      firstnameLabel: 'First name',
      lastnameLabel: 'Last name',
      emailLabel: 'Email (optional)',
      phoneLabel: 'Phone (optional)',
      fullAccessLabel: 'Admin access',
      fullAccessHint: 'Can access screens like employees and file management.',
      visitorCountsLabel: 'Can enter visitor counts',
      visitorCountsHint:
        'Enters how many people walked into the stores each day on the "Visitor counts" screen.',
      erpEmployeeLabel: 'ERP sales rep (optional)',
      erpEmployeeNone: 'Not linked',
      erpEmployeeSearchPlaceholder: 'Search by code or name',
      erpEmployeeNoResults: 'No matching sales rep found.',
      save: 'Save',
      saving: 'Saving…',
      deactivate: 'Deactivate employee',
      deactivating: 'Deactivating…',
      reactivate: 'Reactivate',
      reactivating: 'Reactivating…',
      selfDeactivateHint: 'You cannot deactivate your own account from here.',
      usernameRequired: 'Username is required.',
      usernameTooShort: 'Username must be at least 3 characters.',
      passwordRequired: 'Password is required.',
      passwordTooShort: 'Password must be at least 8 characters.',
      firstnameRequired: 'First name is required.',
      lastnameRequired: 'Last name is required.',
      jobTitleRequired: 'Job title is required.',
      jobTitleLabel: 'Job title',
      jobTitlePlaceholder: 'e.g. Sales associate, Store manager',
      defaultStoreLabel: 'Default store (optional)',
      defaultStoreHint: 'Shown on the employee card; the leaderboard filters by it.',
      defaultStoreNone: 'No store',
      emailInvalid: 'Enter a valid email address.',
      deactivateError: 'Could not deactivate the employee.',
      reactivateError: 'Could not reactivate the employee.',
      genericSaveError: 'Could not save. Please try again.',
    },
    kpiTemplates: {
      title: 'KPI templates',
      searchPlaceholder: 'Search name or description',
      statusLabel: 'Status',
      statusAll: 'All',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      loading: 'Loading…',
      errorLoading: 'Could not load the KPI templates.',
      empty: 'No KPI templates yet.',
      noSearchResults: 'No templates match your search.',
      resultCount: '{count} templates',
      add: 'New KPI template',
      inactiveBadge: 'Inactive',
      kpiCount: '{count} KPIs',
      weightSummary: 'Weight {total}%',
      columnPlans: 'Plans',
      planCount: 'Plans: {count}',
      unused: 'Not used',
      openPlans: 'Show the plans built from {name} ({count})',
      columnName: 'Name',
      columnDescription: 'Description',
      columnKpis: 'KPIs',
      columnWeight: 'Total weight',
      columnStatus: 'Status',
      columnActions: 'Actions',
      editTemplate: 'Edit {name}',
      activeBadge: 'Active',
      bulkCopy: 'Copy',
      bulkActivate: 'Activate',
      bulkDeactivate: 'Deactivate',
      bulkDeactivateConfirm:
        'Deactivate the selected templates ({count})? You can reactivate them at any time.',
      bulkCopied: 'Templates copied: {count}. Each copy got a number such as “(2)” in its name.',
      bulkActivated: 'Templates activated: {count}.',
      bulkDeactivated: 'Templates deactivated: {count}.',
      bulkDelete: 'Delete',
      bulkDeleteConfirm:
        'Delete {count} templates for good? This cannot be undone. Templates used by a KPI plan are kept.',
      bulkDeleted: 'Templates deleted: {count}.',
      bulkDeleteInUse:
        'These templates are used by KPI plans and cannot be deleted: {names}. You can only deactivate them.',
      bulkError: 'The bulk action could not be completed. Please try again.',
    },
    kpiTemplateForm: {
      titleCreate: 'New KPI template',
      titleEdit: 'Edit KPI template',
      loading: 'Loading…',
      errorLoading: 'Could not load the template.',
      nameLabel: 'Template name',
      namePlaceholder: 'e.g. STORE MANAGER KPI 01',
      descriptionLabel: 'Description (optional)',
      itemsTitle: 'KPIs',
      itemsHint:
        'Weights must add up to exactly 100%. The target is optional and can be changed when the template is assigned to a period.',
      addItem: 'Add KPI',
      itemTitle: 'KPI {number}',
      removeItem: 'Remove KPI {number}',
      definitionLabel: 'KPI',
      definitionPlaceholder: 'Search and pick a KPI',
      definitionNoResults: 'No matching KPI found.',
      definitionsError: 'Could not load the KPI list.',
      weightLabel: 'Weight (%)',
      targetLabel: 'Target ({unit})',
      unitMoney: 'amount',
      unitCount: 'count',
      unitScore: 'points',
      storesPlaceholder: 'Search and add a store',
      storesNoResults: 'No matching store found.',
      storesError: 'Could not load the store list.',
      removeStore: 'Remove {name}',
      itemGroupsPlaceholder: 'Search and add an item group',
      itemGroupsNoResults: 'No group found.',
      itemGroupsError: 'Item groups could not be loaded.',
      itemGroupOption: '{code} · {count} items',
      removeItemGroup: 'Remove group {name}',
      ungroupedHint:
        'Items without a group count in no group KPI: {share}% of the last 12 months’ sales. They count once their item cards get a group in Tiger.',
      unknownItemGroup: 'KPI {number} contains item groups that no longer exist: {codes}.',
      selectPlaceholder: 'Select',
      noInputs: 'This KPI needs nothing besides the target.',
      totalWeight: 'Total weight: {total}% / 100%',
      totalWeightUnder: 'Total weight: {total}% / 100% · {difference}% missing',
      totalWeightOver: 'Total weight: {total}% / 100% · {difference}% over, cannot be saved',
      weightOver:
        'Weights exceed 100% (currently {total}%). The template cannot be saved like this.',
      weightUnder: 'Weights must add up to exactly 100% (currently {total}%).',
      save: 'Save',
      saving: 'Saving…',
      inactiveNotice: 'This template is inactive.',
      deactivate: 'Deactivate template',
      deactivating: 'Deactivating…',
      reactivate: 'Reactivate',
      reactivating: 'Reactivating…',
      deactivateError: 'Could not deactivate the template.',
      delete: 'Delete template',
      deleting: 'Deleting…',
      deleteConfirm: 'Delete the template “{name}” for good? This cannot be undone.',
      deleteHint: 'A template no KPI plan uses can be deleted for good.',
      deleteError: 'Could not delete the template.',
      deleteInUse:
        '{count} KPI plans were built from this template, so it cannot be deleted. You can deactivate it instead.',
      copy: 'Create a copy',
      copyHint: 'The last saved version is copied with all of its KPIs.',
      copyError: 'Could not copy the template.',
      copiedNotice: 'Copied from “{name}”. You can edit its name and details and save.',
      nameRequired: 'Template name is required.',
      itemsRequired: 'Add at least one KPI.',
      definitionRequired: 'Pick a KPI for row {number}.',
      weightInvalid:
        'Enter a weight between 0.01 and 100 with at most 2 decimals for KPI {number}.',
      targetInvalid: 'The target of KPI {number} must be 0 or more with at most 4 decimals.',
      inputRequired: '“{field}” is required for KPI {number}.',
      duplicateItem: 'KPI {number} repeats KPI {other} (same KPI and same details).',
      unknownDefinition: 'KPI {number} is no longer active or was not found.',
      invalidInput: 'The details of KPI {number} are invalid.',
      unknownStore: 'KPI {number} contains a store that no longer exists.',
      nameTaken: 'A KPI template with this name already exists.',
      genericSaveError: 'Could not save the template. Please try again.',
    },
    recordInfo: {
      buttonFor: 'Record info for {name}',
      title: 'Record info',
      createdBy: 'Created by',
      updatedBy: 'Last changed by',
      system: 'System',
      history: 'Change history',
      historyEmpty: 'No changes have been recorded for this record yet.',
      historyHint:
        'Changes are recorded since this feature was turned on; older changes do not appear here.',
      loading: 'Loading…',
      error: 'Could not load the record info.',
      loadMore: 'Show more',
      actionCreate: 'Created',
      actionUpdate: 'Updated',
      actionDelete: 'Deleted',
      actionActivate: 'Activated',
      actionDeactivate: 'Deactivated',
      viaBulkStatus: 'via bulk action',
      viaBulkCopy: 'via bulk copy',
      viaExcelImport: 'from Excel',
      copiedFrom: 'Copied from “{name}”',
      actionExport: 'Excel downloaded',
      exportedFile: 'File: {name}',
      valueAdded: 'added',
      valueRemoved: 'removed',
      valueChanged: 'changed',
      valueYes: 'Yes',
      valueNo: 'No',
      valueActive: 'Active',
      valueInactive: 'Inactive',
      itemsBefore: 'Before',
      itemsAfter: 'After',
      target: 'target {value}',
      fields: {
        employees: {
          username: 'Username',
          firstname: 'First name',
          lastname: 'Last name',
          email: 'Email',
          phoneNumber: 'Phone',
          erpEmployeeId: 'ERP sales rep',
          avatarId: 'Profile photo',
          fullAccess: 'Admin access',
          canEnterVisitorCounts: 'Can enter visitor counts',
          jobTitle: 'Job title',
          defaultStoreId: 'Default store',
          isActive: 'Status',
          passwordHash: 'Password',
        },
        kpi_templates: {
          name: 'Template name',
          description: 'Description',
          isActive: 'Status',
          items: 'KPIs',
        },
        kpi_periods: {
          year: 'Year',
          month: 'Month',
          status: 'Status',
          closedAt: 'Closed at',
        },
        kpi_assignments: {
          periodId: 'Period',
          employeeId: 'Employee',
          templateId: 'Template',
          templateName: 'Template name',
          items: 'KPIs',
        },
        store_visitor_counts: {
          storeId: 'Store',
          visitDate: 'Day',
          visitorCount: 'People who came in',
        },
        employee_salaries: {
          employeeId: 'Employee',
          effectiveMonth: 'Effective from',
          amount: 'Salary',
          currency: 'Currency',
          fixedPercent: 'Fixed percent',
          kpiPercent: 'KPI percent',
        },
      },
    },
    kpiPlans: {
      title: 'KPI plans',
      periodLabel: 'Period',
      newPeriodTitle: 'Open a new period',
      year: 'Year',
      month: 'Month',
      open: 'Open period',
      statusOpen: 'Open',
      statusClosed: 'Closed',
      closePeriod: 'Close period',
      newPeriod: 'New period',
      closeConfirm:
        'Close the {period} period? Plans, targets and scores can no longer be changed. If you close it by mistake, you can reopen it until {date}.',
      closeConfirmFinal:
        'Close the {period} period? The reopening window has passed, so closing is final: plans, targets and scores can never be changed again.',
      reopenPeriod: 'Reopen period',
      reopenPasswordMessage:
        'Period {period} will be reopened; plans, targets and results can change again. Enter your password to confirm.',
      exportExcel: 'Excel',
      exporting: 'Preparing…',
      exportTitle: 'KPI and salary Excel',
      exportConfirm: 'Download',
      exportPasswordMessage:
        'Every plan of {period} will be downloaded as Excel, with KPI scores and salaries. The file contains salaries; the download is written to the period’s record info.\n\nEnter your password to confirm.',
      exported: '{file} downloaded.',
      reopened: 'The {period} period is open again.',
      reopenExpired: 'This period could be reopened until {date}; it is final now.',
      periodOpenHint: 'Plans, targets and scores can be changed.',
      periodClosedReopenable:
        'Nothing can be changed. If it was closed by mistake, you can reopen it until {date}.',
      periodClosedFinal: 'Final: nothing can be changed and it cannot be reopened.',
      periodPlans: '{count} plans',
      periodMissingTargets: '{count} plans are missing targets',
      deletePlan: 'Delete the plan of {name}',
      deleted: 'The plan of {name} was deleted.',
      closed: 'The {period} period is closed.',
      assign: 'Assign template',
      assignTitle: 'Assign template',
      templateLabel: 'KPI template',
      employeesLabel: 'Employees',
      employeeSearch: 'Search employees',
      assignSubmit: 'Create plans',
      assigned: '{count} employees got a plan.',
      copyFrom: 'Copy from another period',
      copied: '{created} plans copied, {skipped} employees skipped.',
      copiedNone: 'No plan could be copied.',
      loading: 'Loading…',
      errorLoading: 'Could not load the plans.',
      empty: 'No plans in this period yet.',
      emptyPeriods: 'No KPI period yet. Open a month to start.',
      noSearchResults: 'No plans match your search.',
      searchPlaceholder: 'Search employees',
      templateFilter: 'Template: {name}',
      clearTemplateFilter: 'Remove the template filter',
      noTemplatePlans: 'No plan in this period was built from this template.',
      targetProgress: '{done}/{total} targets',
      columnEmployee: 'Employee',
      columnTemplate: 'Template',
      columnTargets: 'Targets',
      columnActions: 'Actions',
      openPlan: 'Open the plan of {name}',
      openPlanShort: 'Open',
      calculateAll: 'Calculate all',
      calculatingAll: 'Calculating…',
      calculatedAll: '{count} plans were scored.',
      calculatedAllIncomplete: '{count} plans were scored; {incomplete} are still incomplete.',
      columnScore: 'Score',
      noScore: '—',
      scoreValue: '{value} pts',
      assignError: 'Could not create the plans.',
      alreadyAssigned: 'These employees already have a plan in this period: {names}',
      ineligible: 'These employees cannot be given this template: {names}',
      reasonInactive: 'inactive',
      reasonMissingErpLink: 'no Tiger salesperson link',
      reasonAlreadyAssigned: 'already has a plan',
      periodClosedError: 'The period is closed, so nothing was changed.',
      selectTemplate: 'Select a template',
      employeesEmpty: 'No employees found.',
      salaryTitle: 'Payable this period',
      salaryFixed: 'Fixed',
      salaryKpi: 'From KPIs',
      salaryPayable: 'Payable',
      salaryPlans: 'Total of {count} plans',
      salaryWithout: '{count} without a salary for this month',
      salaryNotCalculated: '{count} not calculated yet; only the fixed part is counted',
      salaryNone:
        "None of these plans has a salary for this month. Salaries are entered on the employee's Salary tab.",
      salaryBarLabel: 'Fixed {fixed}% · earned from KPIs {earned}%',
      noSalary: 'No salary for this month',
    },
    kpiPlanForm: {
      title: 'KPI plan',
      loading: 'Loading…',
      errorLoading: 'Could not load the plan.',
      save: 'Save targets',
      saved: 'Targets saved.',
      saveError: 'Could not save the targets.',
      closedError: 'The period is closed; targets cannot be changed.',
      invalidTarget:
        'The target is invalid. Enter a number that is not negative, with at most 4 decimals.',
      targetLabel: 'Target',
      missingTarget: 'No target yet',
      weight: 'Weight {value}%',
      stores: 'Stores',
      itemGroups: 'Groups',
      currency: 'Currency',
      recommendation: 'Average {average} · Achievable max {max} · Suggested {recommended}',
      recommendationMonths: '{count} months of data',
      applyRecommendation: 'Apply suggestion',
      applyAll: 'Apply every suggestion',
      applyConfirmOne: '{name}: target {change}.\nIt is kept once you press Save. Are you sure?',
      applyConfirmAll:
        'These targets will change:\n{changes}\nThey are kept once you press Save. Are you sure?',
      applyConfirmButton: 'Apply',
      emptyTarget: 'empty',
      combinedHint: 'several stores combined',
      manualHint: 'This KPI is entered by hand; it has no report.',
      noRecommendation: 'No report data for this KPI.',
      deletePlan: 'Delete plan',
      deleteConfirm: 'Delete the {period} plan of {name}?',
      deleteError: 'Could not delete the plan.',
      closedNotice: 'The {period} period is closed; targets are read-only.',
      calculate: 'Calculate',
      calculating: 'Calculating…',
      calculated: 'The score was calculated.',
      calculatedIncomplete: 'The score was calculated; {done}/{total} rows could be scored.',
      actualLabel: 'Actual',
      actualPlaceholder: 'Typed in',
      actualHint: 'Tiger cannot measure this KPI; you enter the value.',
      calculatedItem: 'This KPI is read from Tiger and cannot be typed in.',
    },
    myKpi: {
      title: 'My KPI',
      loading: 'Loading…',
      errorLoading: 'Could not load your KPI plan.',
      empty: 'No KPI plan has been assigned to you yet.',
      period: 'Period',
      periodOption: '{period} · {score} pts',
      periodOpen: 'Period open; the score is not final yet.',
      periodClosed: 'Period closed; the score is final.',
      weight: 'Weight',
      target: 'Target',
      noTarget: 'No target yet',
      emptyEmployee: 'This employee has no KPI plan yet.',
      errorLoadingEmployee: "Could not load the employee's KPI plan.",
    },
    leaderboard: {
      title: 'Leaderboard',
      period: 'Period',
      templateFilter: 'Filter by template',
      allTemplates: 'All',
      store: 'Store',
      allStores: 'All stores',
      loading: 'Loading…',
      errorLoading: 'Could not load the leaderboard.',
      empty: 'There are no KPI plans in this period yet.',
      autoEvery: 'Scores update on their own every {minutes} minutes',
      autoOff: 'Automatic updates are off',
      periodClosed: 'Period closed; scores are final',
      updatedAt: 'last updated {at}',
      notCalculated: 'Score not calculated yet',
      scoredOf: '{done}/{total} KPIs scored',
      you: 'You',
      rank: 'Rank {rank}',
      unranked: 'Not ranked',
      colRank: 'Rank',
      colEmployee: 'Employee',
      colTemplate: 'Template',
      colScore: 'Score',
      myStanding: 'Your place',
      placeShort: 'place',
      myNotCalculated: 'Your score has not been calculated yet.',
      amongCount: 'out of {count} people',
      gapToNext: '{gap} more points to reach place {rank}',
      leading: 'You are on top! Keep it up.',
      podium: 'Top three',
      others: 'Everyone else',
      openKpi: "Open {name}'s KPIs",
    },
    salary: {
      loading: 'Loading…',
      errorLoading: 'Could not load the salaries.',
      empty: 'No salary has been entered for this employee yet.',
      noneYet: 'No salary is in force this month; the first one starts in a later month.',
      currentTitle: 'Salary in force',
      sinceMonth: 'In force since {month}',
      fromMonth: 'From {month} on',
      inForce: 'In force now',
      history: 'Salary history',
      fixedPart: 'Fixed {percent}%',
      kpiPart: 'KPI {percent}%',
      splitLabel: 'Fixed {fixed}%, KPI {kpi}%',
      add: 'Add salary',
      addTitle: 'Add salary',
      editTitle: 'Correct salary',
      editFor: 'Correct salary: {range}',
      deleteFor: 'Delete salary: {range}',
      deleteConfirm:
        'Delete the salary in force from {month}? The previous salary will apply from that month on.',
      deleteError: 'Could not delete the salary.',
      delete: 'Delete',
      effectiveMonth: 'Effective from',
      effectiveHint: 'Applies from this month until a newer salary is entered.',
      amount: 'Salary',
      amountPlaceholder: 'e.g. 12000',
      currency: 'Currency',
      fixedPercent: 'Fixed (%)',
      kpiPercent: 'KPI (%)',
      preview: 'Fixed {fixed} + KPI {kpi}',
      calcOpen: 'Work out the salary from the fixed or KPI amount',
      calcClose: 'Close the calculator',
      calcTitle: 'Work out the salary',
      calcHint: 'Type what one part should be; the salary follows from the percentages.',
      calcPartLabel: 'Known part',
      calcFixedAmount: 'Fixed part should be ({currency})',
      calcKpiAmount: 'KPI part should be ({currency})',
      calcResult: 'Salary',
      calcApply: 'Use as salary',
      calcNeedPercents: 'Enter the fixed and KPI percentages first; they must add up to 100.',
      calcZeroPercent: 'This part is 0%; the salary cannot be worked out from it.',
      calcTooLarge: 'The salary would be above the largest allowed amount.',
      save: 'Save',
      saving: 'Saving…',
      saveError: 'Could not save the salary.',
      errorMonthExists: 'This employee already has a salary for this month.',
      errorPercentTotal: 'Fixed and KPI percentages must add up to 100.',
      errorPeriodClosed:
        "This change would alter the salary of closed periods: {months}. A closed month's pay is final; reopen the period first to correct it.",
    },
    kpiSalary: {
      title: 'Salary',
      since: 'Salary in force since {month}',
      show: 'Show',
      hide: 'Hide · {seconds}',
      hidden: 'Hidden amount; tap to show',
      payable: 'Payable for this period',
      fixedOnly: 'Fixed part (KPIs not calculated yet)',
      barLabel: 'Fixed {fixed}%, KPI {kpi}%, score {score}',
      fixedPart: 'Fixed {percent}%',
      kpiPart: 'KPI {percent}%',
      byScore: 'At a score of {score}',
      fullSalary: 'Full salary',
      interim: 'Period open: the amount changes as the score does.',
      final: 'Period closed; the amount is final.',
      notCalculated: 'The KPI part is added once the score is calculated.',
      itemValue: 'Worth of salary',
      itemEarned: 'Earned',
      noSalary:
        "This employee has no salary in force for this month; enter one on the employee's Salary tab.",
      kpiEarnedShort: 'Earned from KPIs',
    },
    kpiConversion: {
      title: 'How it was calculated',
      formula: 'Conversion = sales receipts ÷ people who came in × 100.',
      counted:
        'Visitor counts were entered for {counted} of the {possible} days up to {last} (coverage {coverage}%).',
      countedStores:
        'Visitor counts were entered for {counted} of the {possible} store-days of {stores} stores up to {last} (coverage {coverage}%).',
      result: 'Only these days count: {receipts} sales receipts ÷ {visitors} people = {value}%.',
      lowCoverage:
        'To be scored, at least {required}% of the days need a count. Enter the missing days on the "Visitor counts" screen and the next calculation scores it.',
      noVisitors: 'Every counted day has 0 visitors, so there is no rate.',
      noDays: 'No day to count yet: only days before today count.',
      rules:
        'Today does not count until it is over. Days without a count are not estimated and do not count at all; a day entered as 0 (store closed) does. Returns do not change the rate.',
      notScored: 'Not scored: too few days have a visitor count.',
    },
    passwordConfirm: {
      label: 'Your password',
      checking: 'Checking…',
      wrong: 'Wrong password.',
    },
    kpiProgress: {
      totalScore: 'Total score',
      outOf: '/ {max}',
      notCalculated: 'The score has not been calculated yet.',
      calculatedAt: 'Last calculated: {at}',
      incomplete: '{done}/{total} KPIs scored; the rest have no target or no actual value.',
      achievement: 'Achievement',
      percent: '{value}%',
      reached: 'Target reached',
      actualOfTarget: 'Actual {actual} / target {target}',
      actualOnly: 'Actual {actual}',
      contribution: 'Contribution {score} / {weight}',
      noTarget: 'Not scored: there is no target.',
      noActual: 'Not scored: the actual value has not been entered.',
      meterLabel: '{name} achievement',
      scoreMeterLabel: '{name} total score',
    },
    visitorCounts: {
      title: 'Visitor counts',
      store: 'Store',
      date: 'Day',
      count: 'People who came in',
      countPlaceholder: 'e.g. 184',
      save: 'Save',
      update: 'Update',
      saving: 'Saving…',
      saved: '{store} · {date}: {count} people saved.',
      replaceHint: 'Entering the same store and day again replaces the number.',
      existing: 'Already saved for this day: {count}. Saving replaces it.',
      loading: 'Loading…',
      errorLoading: 'Could not load the entries.',
      empty: 'No entries yet.',
      people: 'people',
      edit: 'Edit',
      editFor: 'Edit the entry of {store} · {date}',
      deleteFor: 'Delete the entry of {store} · {date}',
      deleteConfirm: 'Delete the count of {store} for {date}?',
      deleted: 'The entry was deleted.',
      errorUnknownStore: 'The selected store was not found in Tiger.',
      errorFutureDate: 'A count cannot be entered for a future day.',
      errorClosed: 'This day belongs to a closed KPI period; its count cannot change.',
      saveError: 'The count could not be saved.',
      columnDate: 'Day',
      columnStore: 'Store',
      columnCount: 'People',
      columnActions: 'Actions',
      add: 'Add count',
      addTitle: 'Add visitor count',
      editTitle: 'Correct visitor count',
      filters: 'Filters',
      filterDates: 'Date range',
      filterFrom: 'From',
      filterTo: 'To',
      rangeInvalid: 'The start day cannot be after the end day.',
      rangeFrom: '{date} onwards',
      rangeTo: 'Up to {date}',
      removeFilter: 'Remove filter {filter}',
      resultCount: 'Entries: {count}',
      emptyFiltered: 'No entries match these filters.',
      excel: 'Excel',
      excelTitle: 'Bulk entry with Excel',
      excelStep1: 'Download the template',
      excelStep1Hint:
        'Each store gets a row for every day you pick; counts already saved are filled in. The file’s “Instructions” sheet explains the rest.',
      excelStoreAll: 'All stores',
      excelStoreOne: 'Only {store}',
      excelDownload: 'Download template',
      excelDownloading: 'Preparing…',
      excelStep2: 'Fill it in and upload',
      excelStep2Hint:
        'Type the counts in column D; a row left empty is not changed. When the store and day already have a count, the new one replaces it and is logged. If any row is wrong, nothing is saved.',
      excelChooseFile: 'Choose Excel file (.xlsx)',
      excelChangeFile: 'Choose another file',
      excelUpload: 'Upload',
      excelUploading: 'Uploading…',
      excelResult: '{created} new counts added, {updated} updated, {unchanged} already the same.',
      excelSkipped: '{count} rows had no count and were skipped.',
      excelRowsInvalid:
        '{count} rows are wrong, nothing was saved. Fix them and upload the file again:',
      excelRow: 'Row {row}',
      excelMoreErrors: '… and {count} more wrong rows',
      excelErrorFile: 'The file could not be read. Use the .xlsx template downloaded here.',
      excelErrorTooLarge: 'The file is too large: at most 5,000 rows and 2 MB.',
      excelErrorEmpty: 'No row in the file has a count.',
      excelErrorRange: 'The date range can be at most 62 days and cannot go past today.',
      excelDone: 'Done',
      excelRowErrors: {
        INVALID_DATE: 'the date cannot be read',
        FUTURE_DATE: 'a day in the future',
        INVALID_STORE: 'the store number cannot be read',
        UNKNOWN_STORE: 'no store has this number',
        INVALID_COUNT: 'the count must be a whole number from 0 up',
        DUPLICATE: 'the same store and day appear twice in the file',
        CLOSED_PERIOD: 'this month’s KPI period is closed',
      },
    },
    visitorReport: {
      button: 'Report',
      title: 'Visitor report',
      rangeThisWeek: 'This week',
      rangeLast10: 'Last 10 days',
      rangeThisMonth: 'This month',
      rangeLastMonth: 'Last month',
      rangeCustom: 'Custom',
      allStores: 'All stores',
      store: 'Store',
      from: 'From',
      to: 'To',
      errorRange: 'The date range can be at most 366 days and cannot go past today.',
      loading: 'Preparing the report…',
      error: 'The report could not be loaded.',
      empty: 'No counts were entered in this range.',
      totalVisitors: 'Total visitors',
      dailyAverage: 'Daily average',
      perStoreDay: 'per store, from entered days',
      change: 'vs the previous {days} days',
      noChange: 'no data in the previous period',
      coverage: 'Entered days',
      coverageLow:
        'Some days are missing ({percent}%). Averages use entered days only; enter the missing days.',
      busiestDay: 'Busiest day',
      dailyTitle: 'Daily visitors',
      dailyHint: 'Tap a bar to see its value.',
      dayValue: '{date}: {count} people · {stores} stores',
      dayMissing: '{date}: not entered',
      missing: 'Not entered',
      weekdayTitle: 'Days of the week',
      weekdayHint: 'Average visitors per store',
      storesTitle: 'Stores',
      storeDays: '{days}/{possible} days',
      storeAverage: 'avg {average}',
      notEntered: 'not entered',
      people: 'people',
      chartLabel: 'Daily visitors chart, {from} – {to}, {total} people in total',
      percent: '{value}%',
      weekdays: {
        w1: 'Mon',
        w2: 'Tue',
        w3: 'Wed',
        w4: 'Thu',
        w5: 'Fri',
        w6: 'Sat',
        w7: 'Sun',
      },
    },
    storeDashboard: {
      title: 'Store dashboard',
      year: 'Year',
      yearOption: '{year} vs {previous}',
      store: 'Store',
      allStores: 'All stores',
      currency: 'Currency',
      tabs: 'KPI tabs',
      summaryTab: 'Summary',
      refreshEvery: 'Values refresh every {minutes} minutes',
      refreshOff: 'Automatic refresh is off',
      updatedAt: 'last updated {at}',
      loading: 'Loading…',
      error: 'The dashboard could not be loaded.',
      empty:
        'No stored values yet. They are calculated from Tiger and arrive with the first refresh.',
      comparing: '{year} vs {previous}',
      comparedMonths: 'Months compared: {range} ({count})',
      noComparison:
        'There is no {previous} data to compare with. Growth is measured over finished months that have data in both years; for now only {year} values are shown.',
      inProgress: '{month} is still in progress and is not compared.',
      inProgressShort: 'In progress',
      growth: 'Growth',
      noGrowth: 'No comparison',
      percent: '{value}%',
      percentPoints: '{value} pp',
      monthlyAverage: 'Monthly average',
      total: 'Total',
      difference: 'Difference',
      yearSoFar: '{year}, finished months: {count}',
      previousYearAll: '{year}, months: {count}',
      monthlyTitle: 'Month by month',
      monthlyHint: 'Tap a month for details.',
      monthAria: '{month}: {year} {current}, {previousYear} {previous}',
      month: 'Month',
      change: 'Change',
      storesTitle: 'Store comparison',
      storesHint: 'Ranked by growth over the compared months.',
      singleStore: 'Only one store has sales in these years.',
      openKpi: '{name} details',
      customersNote:
        'When stores are added together, a customer or item seen in two stores counts twice.',
      ratioNote:
        'Conversion counts only days with an entered visitor count: their sales receipts ÷ their visitors. A month with counts on fewer than 80% of its days is not measured (—). Stores and months are combined by adding receipts and visitors first, then dividing.',
      kpiShort: {
        sales: 'Sales',
        receipts: 'Receipts',
        customers: 'Customers',
        newCustomers: 'New customers',
        returningCustomers: 'Returning',
        productVariety: 'Product variety',
        conversion: 'Conversion',
        visitors: 'Visitors',
      },
    },
    kpiCopy: {
      changeLabel: 'Target change',
      decrease: 'Decrease by one point',
      increase: 'Increase by one point',
      presets: 'Quick percentages',
      summaryKeep: 'Targets are copied as they are.',
      summaryUp: 'Every target goes up by {value}%.',
      summaryDown: 'Every target goes down by {value}%.',
      rangeError: 'Enter a percentage between {min} and {max}, with at most two decimals.',
      roundingNote:
        'Money and count targets are rounded to whole numbers; percentage targets never pass 100. Rows without a target stay empty.',
      previewTitle: 'Preview',
      previewTargets: '{targets} of {items} KPIs have a target',
      previewLoading: 'Loading the preview…',
      previewError: 'Could not load the preview; copying still works.',
      noTarget: 'No target, stays empty',
      noDefaultTargets: 'This template has no default targets, so neither will the copy.',
      capped: 'max 100%',
      weight: 'Weight {value}',
      templateTitle: 'Copy template',
      templatesTitle: 'Copy {count} templates',
      templateSource: '“{name}” is copied with all of its KPIs as a new template.',
      nameLabel: 'Name of the new template',
      nameHint: 'Leave it empty to get the next number, e.g. “{name}”.',
      namePlaceholder: 'Automatic',
      templatesList: 'Templates to copy',
      moreTemplates: '+{count} more',
      templatesNameHint: 'Each copy gets the next number in its name, such as “(2)”.',
      copyTemplate: 'Copy',
      copyTemplates: 'Copy {count} templates',
      copying: 'Copying…',
      plansTitle: 'Copy plans',
      sourceLabel: 'Copy from',
      targetLabel: 'Into this period',
      sampleTitle: 'Example plan',
      sourceEmpty: 'The selected period has no plans to copy.',
      samplePosition: '{index} of {total}',
      previousSample: 'Previous example',
      nextSample: 'Next example',
      skipNote:
        'Employees who already have a plan in this period, are inactive or have no Tiger link are skipped.',
      copyPlans: 'Copy plans',
      changedUp: 'Targets raised by {value}%.',
      changedDown: 'Targets lowered by {value}%.',
    },
    errors: {
      generic: 'An unexpected error occurred. Please try again.',
      network: 'Could not connect to the server. Check your internet connection.',
      validation: 'Check the information you entered.',
      unauthorized: 'Your session has ended. Please sign in again.',
      forbidden: 'You do not have permission to perform this action.',
      notFound: 'The requested record was not found.',
      conflict: 'This information conflicts with another record.',
      payloadTooLarge: 'The selected file exceeds the allowed size.',
      tooManyRequests: 'Too many attempts. Please wait a moment.',
      tooManyRequestsWait: 'Too many failed attempts. Try again in {minutes} minutes.',
      server: 'A server error occurred. Please try again later.',
    },
  },
  ru: {
    common: {
      showPassword: 'Показать пароль',
      hidePassword: 'Скрыть пароль',
      close: 'Закрыть',
      closeDialog: 'Закрыть окно «{title}»',
      breadcrumb: 'Навигационная цепочка',
      cancel: 'Отмена',
      confirm: 'Подтвердить',
      confirmTitle: 'Вы уверены?',
      apply: 'Применить',
      clear: 'Сбросить',
      home: 'Главная',
      bulkActions: 'Массовые действия',
      selectedCount: 'Выбрано: {count}',
      clearSelection: 'Снять выделение',
      selectAll: 'Выбрать все в списке',
      selectItem: 'Выбрать: {name}',
    },
    login: {
      brand: 'Retail KPI Platform',
      title: 'Вход',
      subtitle: 'Войдите в свою учётную запись, чтобы начать',
      usernameLabel: 'Имя пользователя',
      usernamePlaceholder: 'Например, admin',
      passwordLabel: 'Пароль',
      submit: 'Войти',
      submitting: 'Выполняется вход…',
      errorInvalidCredentials: 'Неверное имя пользователя или пароль.',
      errorGeneric: 'Не удалось войти. Проверьте подключение.',
      sessionExpired: 'Сессия завершена. Пожалуйста, войдите снова.',
      rememberMe: 'Запомнить меня',
      forgotPassword: 'Забыли пароль?',
      forgotPasswordHelp:
        'Сброс пароля по эл. почте пока не поддерживается. Обратитесь к администратору для сброса пароля.',
    },
    appShell: {
      logout: 'Выйти',
      language: 'Язык',
      openMenu: 'Открыть меню',
      closeMenu: 'Закрыть меню',
      navEmployees: 'Сотрудники',
      navLeaderboard: 'Рейтинг',
      navMyKpi: 'Мои KPI',
      navKpiPlans: 'Планы KPI',
      navVisitorCounts: 'Посетители',
      navStoreDashboard: 'Дашборд магазинов',
      navKpiTemplates: 'Шаблоны KPI',
      navSessions: 'Мои сессии',
      navSettings: 'Настройки',
    },
    employees: {
      title: 'Сотрудники',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить сотрудников.',
      empty: 'Сотрудники ещё не добавлены.',
      managerBadge: 'Админ',
      inactiveBadge: 'Неактивен',
      addEmployee: 'Добавить сотрудника',
      statusColumn: 'Статус',
      searchPlaceholder: 'Поиск по имени, фамилии, логину, эл. почте или телефону',
      noSearchResults: 'Нет сотрудников, соответствующих запросу.',
      filters: 'Фильтры',
      resultCount: 'Сотрудников: {count}',
      filtersActiveCount: 'Активных фильтров: {count}',
      filterStatusAll: 'Все',
      filterOnlyActive: 'Только активные',
      filterOnlyInactive: 'Только неактивные',
      filterManagers: 'Только администраторы',
      filterErpLinked: 'Привязан к продавцу ERP',
      filterWithAvatar: 'С фотографией профиля',
      filterStore: 'Магазин',
      filterStoreAll: 'Все магазины',
      sortLabel: 'Сортировка',
      sortFirstnameAsc: 'Имя (А→Я)',
      sortFirstnameDesc: 'Имя (Я→А)',
      sortLastname: 'Фамилия (А→Я)',
      sortUsername: 'Логин (А→Я)',
      sortNewest: 'Сначала новые',
      sortOldest: 'Сначала старые',
      columnLastname: 'Фамилия',
      columnUsername: 'Логин',
      columnPhone: 'Телефон',
      columnActions: 'Действия',
      openCard: 'Открыть карточку сотрудника {name}',
      editEmployee: 'Редактировать сотрудника {name}',
      activeBadge: 'Активен',
      bulkActivate: 'Активировать',
      bulkDeactivate: 'Деактивировать',
      bulkDeactivateConfirm:
        'Деактивировать выбранных сотрудников ({count})? Их сессии будут завершены, и они не смогут войти, пока их снова не активируют.',
      bulkActivated: 'Активировано сотрудников: {count}.',
      bulkDeactivated: 'Деактивировано сотрудников: {count}, их сессии завершены.',
      bulkError: 'Не удалось выполнить массовое действие. Попробуйте ещё раз.',
      selfSelectHint: 'Собственную учётную запись нельзя изменить массовым действием.',
    },
    settings: {
      profilePhoto: 'Фото профиля',
      changePhoto: 'Изменить фото',
      cropPhoto: 'Обрезать фото',
      cropHint: 'Перетащите фото, чтобы расположить его, ползунком измените масштаб',
      zoom: 'Масштаб фотографии',
      cropSave: 'Обрезать и сохранить',
      photoError: 'Не удалось обновить фото. Попробуйте ещё раз.',
      photoReadError: 'Не удалось прочитать выбранное фото. Выберите другой файл.',
      changePassword: 'Смена пароля',
      currentPassword: 'Текущий пароль',
      newPassword: 'Новый пароль',
      confirmPassword: 'Подтвердите пароль',
      passwordMismatch: 'Пароли не совпадают.',
      passwordTooShort: 'Пароль должен содержать не менее 6 символов.',
      currentPasswordIncorrect: 'Текущий пароль указан неверно.',
      passwordChangeError: 'Не удалось изменить пароль. Попробуйте ещё раз.',
      passwordUpdated: 'Пароль обновлён.',
      submitPassword: 'Сменить пароль',
      saving: 'Сохранение…',
      theme: 'Тема',
      themeLight: 'Светлая',
      themeDark: 'Тёмная',
      themeSystem: 'Системная',
    },
    sessions: {
      title: 'Мои сессии',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить сессии.',
      empty: 'Активных сессий нет.',
      currentDevice: 'Это устройство',
      lastSeen: 'Последняя активность',
      signedInAt: 'Вход',
      expiresAt: 'Истекает',
      ipAddress: 'IP-адрес',
      unknownDevice: 'Неизвестное устройство',
      revoke: 'Завершить сессию',
      revoking: 'Завершение…',
      logoutAll: 'Выйти на всех устройствах',
      logoutAllConfirm:
        'Сессии будут завершены на всех устройствах, потребуется войти заново. Продолжить?',
      revokeConfirm: 'Сессия на этом устройстве будет завершена. Продолжить?',
      rememberMeBadge: 'Долгая сессия',
      shortSessionBadge: 'Короткая сессия',
      expiryHint:
        'Сессия продлевается при каждом использовании и закрывается при бездействии до этого времени.',
      revokeError: 'Не удалось завершить сессию. Попробуйте ещё раз.',
      logoutAllError: 'Не удалось завершить сессии. Попробуйте ещё раз.',
    },
    employeeCard: {
      title: 'Карточка сотрудника',
      email: 'Эл. почта',
      erpCode: 'Код ERP',
      noErpLink: 'Не привязан к ERP',
      scanHint: 'Содержит код сотрудника ERP; отсканируйте для проверки',
      noQrHint: 'Привяжите сотрудника к продавцу ERP, чтобы создать QR-код.',
      viewPhoto: 'Открыть фото',
      managerRole: 'Администратор',
      employeeRole: 'Сотрудник',
      open: 'Открыть карточку сотрудника {name}',
      loading: 'Загрузка карточки сотрудника…',
      errorLoading: 'Не удалось загрузить карточку сотрудника.',
      jobTitle: 'Должность',
      defaultStore: 'Магазин',
    },
    employeeForm: {
      tabDetails: 'Данные',
      tabSessions: 'Сессии',
      tabKpi: 'KPI',
      tabKpiPlans: 'KPI-планы',
      tabSalary: 'Зарплата',
      goToKpiPlans: 'Перейти к KPI-планам',
      sessionsRevokeAll: 'Завершить все сессии',
      titleCreate: 'Новый сотрудник',
      titleEdit: 'Редактировать сотрудника',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить данные сотрудника.',
      erpEmployeesError: 'Не удалось загрузить список продавцов ERP.',
      usernameLabel: 'Имя пользователя',
      passwordLabelCreate: 'Пароль',
      passwordLabelEdit: 'Новый пароль (необязательно)',
      passwordHintEdit: 'Оставьте пустым, чтобы не менять текущий пароль.',
      firstnameLabel: 'Имя',
      lastnameLabel: 'Фамилия',
      emailLabel: 'Эл. почта (необязательно)',
      phoneLabel: 'Телефон (необязательно)',
      fullAccessLabel: 'Права администратора',
      fullAccessHint: 'Доступ к разделам «Сотрудники» и управлению файлами.',
      visitorCountsLabel: 'Может вводить число посетителей',
      visitorCountsHint: 'Вводит на экране «Посетители», сколько человек за день вошло в магазины.',
      erpEmployeeLabel: 'Продавец ERP (необязательно)',
      erpEmployeeNone: 'Не привязан',
      erpEmployeeSearchPlaceholder: 'Поиск по коду или имени',
      erpEmployeeNoResults: 'Подходящие продавцы не найдены.',
      save: 'Сохранить',
      saving: 'Сохранение…',
      deactivate: 'Деактивировать сотрудника',
      deactivating: 'Деактивация…',
      reactivate: 'Восстановить',
      reactivating: 'Восстановление…',
      selfDeactivateHint: 'Вы не можете деактивировать собственную учётную запись здесь.',
      usernameRequired: 'Имя пользователя обязательно.',
      usernameTooShort: 'Имя пользователя должно содержать не менее 3 символов.',
      passwordRequired: 'Пароль обязателен.',
      passwordTooShort: 'Пароль должен содержать не менее 8 символов.',
      firstnameRequired: 'Имя обязательно.',
      lastnameRequired: 'Фамилия обязательна.',
      jobTitleRequired: 'Должность обязательна.',
      jobTitleLabel: 'Должность',
      jobTitlePlaceholder: 'напр. Продавец-консультант, Директор магазина',
      defaultStoreLabel: 'Магазин по умолчанию (необязательно)',
      defaultStoreHint: 'Показывается в карточке сотрудника; по нему фильтруется рейтинг.',
      defaultStoreNone: 'Без магазина',
      emailInvalid: 'Введите корректный адрес электронной почты.',
      deactivateError: 'Не удалось деактивировать сотрудника.',
      reactivateError: 'Не удалось восстановить сотрудника.',
      genericSaveError: 'Не удалось сохранить. Попробуйте ещё раз.',
    },
    kpiTemplates: {
      title: 'Шаблоны KPI',
      searchPlaceholder: 'Поиск по названию или описанию',
      statusLabel: 'Статус',
      statusAll: 'Все',
      statusActive: 'Активные',
      statusInactive: 'Неактивные',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить шаблоны KPI.',
      empty: 'Шаблонов KPI пока нет.',
      noSearchResults: 'Нет шаблонов, соответствующих запросу.',
      resultCount: 'Шаблонов: {count}',
      add: 'Новый шаблон KPI',
      inactiveBadge: 'Неактивен',
      kpiCount: 'KPI: {count}',
      weightSummary: 'Вес {total} %',
      columnPlans: 'Планы',
      planCount: 'Планов: {count}',
      unused: 'Не используется',
      openPlans: 'Показать планы по шаблону {name} ({count})',
      columnName: 'Название',
      columnDescription: 'Описание',
      columnKpis: 'KPI',
      columnWeight: 'Общий вес',
      columnStatus: 'Статус',
      columnActions: 'Действия',
      editTemplate: 'Редактировать {name}',
      activeBadge: 'Активен',
      bulkCopy: 'Копировать',
      bulkActivate: 'Активировать',
      bulkDeactivate: 'Деактивировать',
      bulkDeactivateConfirm:
        'Деактивировать выбранные шаблоны ({count})? Их можно снова активировать в любой момент.',
      bulkCopied:
        'Скопировано шаблонов: {count}. К названиям копий добавлен номер, например «(2)».',
      bulkActivated: 'Активировано шаблонов: {count}.',
      bulkDeactivated: 'Деактивировано шаблонов: {count}.',
      bulkDelete: 'Удалить',
      bulkDeleteConfirm:
        'Удалить {count} шаблонов безвозвратно? Действие нельзя отменить. Шаблоны, используемые планами KPI, сохраняются.',
      bulkDeleted: 'Удалено шаблонов: {count}.',
      bulkDeleteInUse:
        'Эти шаблоны используются планами KPI и не могут быть удалены: {names}. Их можно только деактивировать.',
      bulkError: 'Не удалось выполнить массовое действие. Попробуйте ещё раз.',
    },
    kpiTemplateForm: {
      titleCreate: 'Новый шаблон KPI',
      titleEdit: 'Редактирование шаблона KPI',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить шаблон.',
      nameLabel: 'Название шаблона',
      namePlaceholder: 'напр. KPI ДИРЕКТОРА 01',
      descriptionLabel: 'Описание (необязательно)',
      itemsTitle: 'KPI',
      itemsHint:
        'Сумма весов должна быть ровно 100 %. Цель необязательна, её можно изменить при назначении шаблона на период.',
      addItem: 'Добавить KPI',
      itemTitle: 'KPI {number}',
      removeItem: 'Удалить KPI {number}',
      definitionLabel: 'KPI',
      definitionPlaceholder: 'Найдите и выберите KPI',
      definitionNoResults: 'Подходящие KPI не найдены.',
      definitionsError: 'Не удалось загрузить список KPI.',
      weightLabel: 'Вес (%)',
      targetLabel: 'Цель ({unit})',
      unitMoney: 'сумма',
      unitCount: 'количество',
      unitScore: 'баллы',
      storesPlaceholder: 'Найдите и добавьте магазин',
      storesNoResults: 'Подходящие магазины не найдены.',
      storesError: 'Не удалось загрузить список магазинов.',
      removeStore: 'Удалить {name}',
      itemGroupsPlaceholder: 'Найдите и добавьте группу товаров',
      itemGroupsNoResults: 'Группа не найдена.',
      itemGroupsError: 'Не удалось загрузить группы товаров.',
      itemGroupOption: '{code} · товаров: {count}',
      removeItemGroup: 'Убрать группу {name}',
      ungroupedHint:
        'Товары без группы не входят ни в один групповой KPI: {share}% выручки за 12 месяцев. Они будут учитываться, когда карточкам в Tiger назначат группу.',
      unknownItemGroup: 'KPI {number} содержит несуществующие группы товаров: {codes}.',
      selectPlaceholder: 'Выберите',
      noInputs: 'Для этого KPI нужна только цель.',
      totalWeight: 'Общий вес: {total} % / 100 %',
      totalWeightUnder: 'Общий вес: {total} % / 100 % · не хватает {difference} %',
      totalWeightOver: 'Общий вес: {total} % / 100 % · превышение {difference} %, сохранить нельзя',
      weightOver: 'Сумма весов превышает 100 % (сейчас {total} %). Сохранить в таком виде нельзя.',
      weightUnder: 'Сумма весов должна быть ровно 100 % (сейчас {total} %).',
      save: 'Сохранить',
      saving: 'Сохранение…',
      inactiveNotice: 'Этот шаблон неактивен.',
      deactivate: 'Деактивировать шаблон',
      deactivating: 'Деактивация…',
      reactivate: 'Активировать снова',
      reactivating: 'Активация…',
      deactivateError: 'Не удалось деактивировать шаблон.',
      delete: 'Удалить шаблон',
      deleting: 'Удаление…',
      deleteConfirm: 'Удалить шаблон «{name}» безвозвратно? Действие нельзя отменить.',
      deleteHint:
        'Шаблон, который не используется ни одним планом KPI, можно удалить безвозвратно.',
      deleteError: 'Не удалось удалить шаблон.',
      deleteInUse:
        'По этому шаблону создано планов KPI: {count}, поэтому его нельзя удалить. Его можно деактивировать.',
      copy: 'Создать копию',
      copyHint: 'Копируется последняя сохранённая версия со всеми KPI.',
      copyError: 'Не удалось скопировать шаблон.',
      copiedNotice: 'Скопировано из «{name}». Можно изменить название и данные и сохранить.',
      nameRequired: 'Название шаблона обязательно.',
      itemsRequired: 'Добавьте хотя бы один KPI.',
      definitionRequired: 'Выберите KPI для строки {number}.',
      weightInvalid:
        'Для KPI {number} укажите вес от 0,01 до 100, не более 2 знаков после запятой.',
      targetInvalid:
        'Цель KPI {number} должна быть не меньше 0 и иметь не более 4 знаков после запятой.',
      inputRequired: 'Для KPI {number} поле «{field}» обязательно.',
      duplicateItem: 'KPI {number} повторяет KPI {other} (тот же KPI и те же данные).',
      unknownDefinition: 'KPI {number} больше не активен или не найден.',
      invalidInput: 'Данные KPI {number} некорректны.',
      unknownStore: 'KPI {number} содержит несуществующий магазин.',
      nameTaken: 'Шаблон KPI с таким названием уже существует.',
      genericSaveError: 'Не удалось сохранить шаблон. Попробуйте ещё раз.',
    },
    recordInfo: {
      buttonFor: 'Сведения о записи: {name}',
      title: 'Сведения о записи',
      createdBy: 'Создал(а)',
      updatedBy: 'Последним изменил(а)',
      system: 'Система',
      history: 'История изменений',
      historyEmpty: 'Для этой записи ещё нет сохранённых изменений.',
      historyHint:
        'Изменения сохраняются с момента включения этой функции; более ранние изменения здесь не отображаются.',
      loading: 'Загрузка…',
      error: 'Не удалось загрузить сведения о записи.',
      loadMore: 'Показать ещё',
      actionCreate: 'Создано',
      actionUpdate: 'Изменено',
      actionDelete: 'Удалено',
      actionActivate: 'Активировано',
      actionDeactivate: 'Деактивировано',
      viaBulkStatus: 'массовым действием',
      viaBulkCopy: 'массовым копированием',
      viaExcelImport: 'из Excel',
      copiedFrom: 'Скопировано из «{name}»',
      actionExport: 'Скачан Excel',
      exportedFile: 'Файл: {name}',
      valueAdded: 'добавлено',
      valueRemoved: 'удалено',
      valueChanged: 'изменено',
      valueYes: 'Да',
      valueNo: 'Нет',
      valueActive: 'Активен',
      valueInactive: 'Неактивен',
      itemsBefore: 'Было',
      itemsAfter: 'Стало',
      target: 'цель {value}',
      fields: {
        employees: {
          username: 'Имя пользователя',
          firstname: 'Имя',
          lastname: 'Фамилия',
          email: 'Эл. почта',
          phoneNumber: 'Телефон',
          erpEmployeeId: 'Продавец ERP',
          avatarId: 'Фото профиля',
          fullAccess: 'Права администратора',
          canEnterVisitorCounts: 'Может вводить число посетителей',
          jobTitle: 'Должность',
          defaultStoreId: 'Магазин по умолчанию',
          isActive: 'Статус',
          passwordHash: 'Пароль',
        },
        kpi_templates: {
          name: 'Название шаблона',
          description: 'Описание',
          isActive: 'Статус',
          items: 'KPI',
        },
        kpi_periods: {
          year: 'Год',
          month: 'Месяц',
          status: 'Статус',
          closedAt: 'Время закрытия',
        },
        kpi_assignments: {
          periodId: 'Период',
          employeeId: 'Сотрудник',
          templateId: 'Шаблон',
          templateName: 'Название шаблона',
          items: 'KPI',
        },
        store_visitor_counts: {
          storeId: 'Магазин',
          visitDate: 'День',
          visitorCount: 'Сколько человек вошло',
        },
        employee_salaries: {
          employeeId: 'Сотрудник',
          effectiveMonth: 'Действует с',
          amount: 'Зарплата',
          currency: 'Валюта',
          fixedPercent: 'Фиксированная доля, %',
          kpiPercent: 'Доля KPI, %',
        },
      },
    },
    kpiPlans: {
      title: 'Планы KPI',
      periodLabel: 'Период',
      newPeriodTitle: 'Открыть новый период',
      year: 'Год',
      month: 'Месяц',
      open: 'Открыть период',
      statusOpen: 'Открыт',
      statusClosed: 'Закрыт',
      closePeriod: 'Закрыть период',
      newPeriod: 'Новый период',
      closeConfirm:
        'Закрыть период {period}? Планы, цели и баллы больше нельзя будет изменить. Если закроете по ошибке, период можно открыть заново до {date}.',
      closeConfirmFinal:
        'Закрыть период {period}? Срок повторного открытия прошёл, поэтому закрытие окончательное: планы, цели и баллы больше не изменить.',
      reopenPeriod: 'Открыть период заново',
      reopenPasswordMessage:
        'Период {period} будет открыт снова; планы, цели и расчёт снова можно будет менять. Введите пароль для подтверждения.',
      exportExcel: 'Excel',
      exporting: 'Подготовка…',
      exportTitle: 'Excel KPI и зарплат',
      exportConfirm: 'Скачать',
      exportPasswordMessage:
        'Все планы периода {period} будут скачаны в Excel с баллами KPI и зарплатами. Файл содержит зарплаты; скачивание записывается в историю периода.\n\nВведите пароль для подтверждения.',
      exported: '{file} скачан.',
      reopened: 'Период {period} снова открыт.',
      reopenExpired: 'Этот период можно было открыть заново до {date}; теперь он окончательный.',
      periodOpenHint: 'Планы, цели и баллы можно изменять.',
      periodClosedReopenable:
        'Изменения невозможны. Если период закрыт по ошибке, его можно открыть заново до {date}.',
      periodClosedFinal: 'Окончательно: изменения невозможны, открыть заново нельзя.',
      periodPlans: 'Планов: {count}',
      periodMissingTargets: 'Планов с незаполненными целями: {count}',
      deletePlan: 'Удалить план: {name}',
      deleted: 'План сотрудника {name} удалён.',
      closed: 'Период {period} закрыт.',
      assign: 'Назначить шаблон',
      assignTitle: 'Назначить шаблон',
      templateLabel: 'Шаблон KPI',
      employeesLabel: 'Сотрудники',
      employeeSearch: 'Поиск сотрудника',
      assignSubmit: 'Создать планы',
      assigned: 'Планы получили сотрудников: {count}.',
      copyFrom: 'Копировать из другого периода',
      copied: 'Скопировано планов: {created}, пропущено сотрудников: {skipped}.',
      copiedNone: 'Подходящих планов для копирования нет.',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить планы.',
      empty: 'В этом периоде пока нет планов.',
      emptyPeriods: 'Периодов KPI ещё нет. Откройте месяц, чтобы начать.',
      noSearchResults: 'По запросу планов не найдено.',
      searchPlaceholder: 'Поиск сотрудника',
      templateFilter: 'Шаблон: {name}',
      clearTemplateFilter: 'Убрать фильтр по шаблону',
      noTemplatePlans: 'В этом периоде нет планов по этому шаблону.',
      targetProgress: '{done}/{total} целей',
      columnEmployee: 'Сотрудник',
      columnTemplate: 'Шаблон',
      columnTargets: 'Цели',
      columnActions: 'Действие',
      openPlan: 'Открыть план: {name}',
      openPlanShort: 'Открыть',
      calculateAll: 'Рассчитать все',
      calculatingAll: 'Расчёт…',
      calculatedAll: 'Рассчитаны баллы {count} планов.',
      calculatedAllIncomplete: 'Рассчитаны баллы {count} планов; у {incomplete} балл неполный.',
      columnScore: 'Балл',
      noScore: '—',
      scoreValue: '{value} б.',
      assignError: 'Не удалось создать планы.',
      alreadyAssigned: 'У этих сотрудников уже есть план в периоде: {names}',
      ineligible: 'Этим сотрудникам нельзя назначить шаблон: {names}',
      reasonInactive: 'неактивен',
      reasonMissingErpLink: 'нет связи с продавцом Tiger',
      reasonAlreadyAssigned: 'план уже есть',
      periodClosedError: 'Период закрыт, изменения не сохранены.',
      selectTemplate: 'Выберите шаблон',
      employeesEmpty: 'Сотрудники не найдены.',
      salaryTitle: 'К выплате за период',
      salaryFixed: 'Фикс.',
      salaryKpi: 'По KPI',
      salaryPayable: 'К выплате',
      salaryPlans: 'Итого по планам: {count}',
      salaryWithout: 'Без зарплаты за этот месяц: {count}',
      salaryNotCalculated: 'Не рассчитано: {count}; учтена только фиксированная часть',
      salaryNone:
        'Ни у одного из этих планов нет действующей зарплаты за этот месяц. Зарплату вводят на вкладке «Зарплата» сотрудника.',
      salaryBarLabel: 'Фикс. {fixed}% · заработано по KPI {earned}%',
      noSalary: 'Нет зарплаты за этот месяц',
    },
    kpiPlanForm: {
      title: 'План KPI',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить план.',
      save: 'Сохранить цели',
      saved: 'Цели сохранены.',
      saveError: 'Не удалось сохранить цели.',
      closedError: 'Период закрыт; цели изменить нельзя.',
      invalidTarget:
        'Неверная цель. Введите неотрицательное число не более чем с 4 знаками после запятой.',
      targetLabel: 'Цель',
      missingTarget: 'Цель не задана',
      weight: 'Вес {value}%',
      stores: 'Магазины',
      itemGroups: 'Группы',
      currency: 'Валюта',
      recommendation: 'Среднее {average} · Достижимый максимум {max} · Рекомендуется {recommended}',
      recommendationMonths: 'данных за {count} мес.',
      applyRecommendation: 'Применить рекомендацию',
      applyAll: 'Применить все рекомендации',
      applyConfirmOne: '{name}: цель {change}.\nСохранится после нажатия «Сохранить». Вы уверены?',
      applyConfirmAll:
        'Изменятся цели:\n{changes}\nСохранятся после нажатия «Сохранить». Вы уверены?',
      applyConfirmButton: 'Применить',
      emptyTarget: 'пусто',
      combinedHint: 'несколько магазинов объединены',
      manualHint: 'Этот KPI вводится вручную; отчёта нет.',
      noRecommendation: 'Для этого KPI нет данных отчёта.',
      deletePlan: 'Удалить план',
      deleteConfirm: 'Удалить план {period} сотрудника {name}?',
      deleteError: 'Не удалось удалить план.',
      closedNotice: 'Период {period} закрыт; цели только для чтения.',
      calculate: 'Рассчитать',
      calculating: 'Расчёт…',
      calculated: 'Балл рассчитан.',
      calculatedIncomplete: 'Балл рассчитан; оценено строк: {done}/{total}.',
      actualLabel: 'Факт',
      actualPlaceholder: 'Вводится вручную',
      actualHint: 'Этот KPI не рассчитывается из Tiger; значение вводите вы.',
      calculatedItem: 'Этот KPI читается из Tiger и не вводится вручную.',
    },
    myKpi: {
      title: 'Мои KPI',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить ваш план KPI.',
      empty: 'Вам ещё не назначен план KPI.',
      period: 'Период',
      periodOption: '{period} · {score} б.',
      periodOpen: 'Период открыт; балл ещё не окончательный.',
      periodClosed: 'Период закрыт; балл окончательный.',
      weight: 'Вес',
      target: 'Цель',
      noTarget: 'Цель ещё не задана',
      emptyEmployee: 'У этого сотрудника пока нет KPI-плана.',
      errorLoadingEmployee: 'Не удалось загрузить KPI-план сотрудника.',
    },
    leaderboard: {
      title: 'Рейтинг',
      period: 'Период',
      templateFilter: 'Фильтр по шаблону',
      allTemplates: 'Все',
      store: 'Магазин',
      allStores: 'Все магазины',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить рейтинг.',
      empty: 'В этом периоде пока нет KPI-планов.',
      autoEvery: 'Баллы обновляются автоматически каждые {minutes} мин',
      autoOff: 'Автообновление выключено',
      periodClosed: 'Период закрыт; баллы окончательные',
      updatedAt: 'обновлено {at}',
      notCalculated: 'Балл ещё не рассчитан',
      scoredOf: 'Оценено KPI: {done}/{total}',
      you: 'Вы',
      rank: '{rank}-е место',
      unranked: 'Без места',
      colRank: 'Место',
      colEmployee: 'Сотрудник',
      colTemplate: 'Шаблон',
      colScore: 'Балл',
      myStanding: 'Ваше место',
      placeShort: 'место',
      myNotCalculated: 'Ваш балл ещё не рассчитан.',
      amongCount: 'из {count} человек',
      gapToNext: 'Ещё {gap} балла до {rank}-го места',
      leading: 'Вы на первом месте! Так держать.',
      podium: 'Тройка лидеров',
      others: 'Остальные места',
      openKpi: 'Открыть KPI: {name}',
    },
    salary: {
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить зарплаты.',
      empty: 'Зарплата этому сотруднику ещё не введена.',
      noneYet: 'В этом месяце зарплата не действует; первая начинается позже.',
      currentTitle: 'Действующая зарплата',
      sinceMonth: 'Действует с: {month}',
      fromMonth: 'С {month}',
      inForce: 'Действует сейчас',
      history: 'История зарплаты',
      fixedPart: 'Фикс. {percent}%',
      kpiPart: 'KPI {percent}%',
      splitLabel: 'Фикс. {fixed}%, KPI {kpi}%',
      add: 'Добавить зарплату',
      addTitle: 'Добавить зарплату',
      editTitle: 'Исправить зарплату',
      editFor: 'Исправить зарплату: {range}',
      deleteFor: 'Удалить зарплату: {range}',
      deleteConfirm:
        'Удалить зарплату, действующую с {month}? С этого месяца будет действовать предыдущая.',
      deleteError: 'Не удалось удалить зарплату.',
      delete: 'Удалить',
      effectiveMonth: 'Действует с месяца',
      effectiveHint: 'Действует с этого месяца, пока не введена новая зарплата.',
      amount: 'Зарплата',
      amountPlaceholder: 'Напр. 12000',
      currency: 'Валюта',
      fixedPercent: 'Фикс. (%)',
      kpiPercent: 'KPI (%)',
      preview: 'Фикс. {fixed} + KPI {kpi}',
      calcOpen: 'Рассчитать зарплату по фиксированной части или части KPI',
      calcClose: 'Закрыть калькулятор',
      calcTitle: 'Расчёт зарплаты',
      calcHint: 'Введите сумму одной части — зарплата рассчитается по процентам.',
      calcPartLabel: 'Известная часть',
      calcFixedAmount: 'Фиксированная часть ({currency})',
      calcKpiAmount: 'Часть KPI ({currency})',
      calcResult: 'Зарплата',
      calcApply: 'Подставить в зарплату',
      calcNeedPercents: 'Сначала введите проценты фиксированной части и KPI; в сумме 100.',
      calcZeroPercent: 'Доля этой части 0%; по ней зарплату не рассчитать.',
      calcTooLarge: 'Зарплата превысит максимально допустимую сумму.',
      save: 'Сохранить',
      saving: 'Сохранение…',
      saveError: 'Не удалось сохранить зарплату.',
      errorMonthExists: 'У сотрудника уже есть зарплата за этот месяц.',
      errorPercentTotal: 'Сумма фиксированной доли и доли KPI должна быть 100.',
      errorPeriodClosed:
        'Изменение затронет зарплату закрытых периодов: {months}. Выплата за закрытый месяц окончательна; сначала откройте период заново.',
    },
    kpiSalary: {
      title: 'Зарплата',
      since: 'Действует с {month}',
      show: 'Показать',
      hide: 'Скрыть · {seconds}',
      hidden: 'Сумма скрыта; нажмите, чтобы показать',
      payable: 'К выплате за период',
      fixedOnly: 'Фиксированная часть (KPI ещё не рассчитаны)',
      barLabel: 'Фикс. {fixed}%, KPI {kpi}%, балл {score}',
      fixedPart: 'Фикс. {percent}%',
      kpiPart: 'KPI {percent}%',
      byScore: 'При балле {score}',
      fullSalary: 'Полная зарплата',
      interim: 'Период открыт: сумма меняется вместе с баллом.',
      final: 'Период закрыт; сумма окончательная.',
      notCalculated: 'Часть KPI добавится после расчёта балла.',
      itemValue: 'Доля в зарплате',
      itemEarned: 'Заработано',
      noSalary:
        'У сотрудника нет действующей зарплаты за этот месяц; её вводят на вкладке «Зарплата».',
      kpiEarnedShort: 'Заработано по KPI',
    },
    kpiConversion: {
      title: 'Как рассчитано',
      formula: 'Конверсия = чеки продаж ÷ вошедшие посетители × 100.',
      counted:
        'Число посетителей введено за {counted} из {possible} дней по {last} (охват {coverage}%).',
      countedStores:
        'Число посетителей введено за {counted} из {possible} магазино-дней {stores} магазинов по {last} (охват {coverage}%).',
      result: 'Учтены только эти дни: {receipts} чеков ÷ {visitors} посетителей = {value}%.',
      lowCoverage:
        'Для оценки число посетителей должно быть введено минимум за {required}% дней. Введите недостающие дни на экране «Посетители», и следующий расчёт оценит показатель.',
      noVisitors: 'Во всех учтённых днях 0 посетителей; конверсию рассчитать нельзя.',
      noDays: 'Пока нет дней для расчёта: учитываются только дни до сегодняшнего.',
      rules:
        'Сегодняшний день не учитывается, пока не закончится. Дни без введённого числа не оцениваются и не учитываются; день с 0 (магазин закрыт) учитывается. Возвраты не влияют на конверсию.',
      notScored: 'Не оценено: число посетителей введено за слишком малое число дней.',
    },
    passwordConfirm: {
      label: 'Ваш пароль',
      checking: 'Проверка…',
      wrong: 'Неверный пароль.',
    },
    kpiProgress: {
      totalScore: 'Итоговый балл',
      outOf: '/ {max}',
      notCalculated: 'Балл ещё не рассчитан.',
      calculatedAt: 'Последний расчёт: {at}',
      incomplete: 'Оценено {done}/{total} KPI; у остальных нет цели или факта.',
      achievement: 'Выполнение',
      percent: '{value}%',
      reached: 'Цель достигнута',
      actualOfTarget: 'Факт {actual} / цель {target}',
      actualOnly: 'Факт {actual}',
      contribution: 'Вклад {score} / {weight}',
      noTarget: 'Не оценено: цель не задана.',
      noActual: 'Не оценено: факт не введён.',
      meterLabel: 'Выполнение: {name}',
      scoreMeterLabel: 'Итоговый балл: {name}',
    },
    visitorCounts: {
      title: 'Посетители',
      store: 'Магазин',
      date: 'День',
      count: 'Сколько человек вошло',
      countPlaceholder: 'Напр. 184',
      save: 'Сохранить',
      update: 'Обновить',
      saving: 'Сохранение…',
      saved: '{store} · {date}: сохранено, {count} чел.',
      replaceHint: 'Если снова ввести тот же магазин и день, число заменится.',
      existing: 'На этот день уже сохранено: {count}. Сохранение заменит число.',
      loading: 'Загрузка…',
      errorLoading: 'Не удалось загрузить записи.',
      empty: 'Записей пока нет.',
      people: 'чел.',
      edit: 'Изменить',
      editFor: 'Изменить запись: {store} · {date}',
      deleteFor: 'Удалить запись: {store} · {date}',
      deleteConfirm: 'Удалить число посетителей магазина {store} за {date}?',
      deleted: 'Запись удалена.',
      errorUnknownStore: 'Выбранный магазин не найден в Tiger.',
      errorFutureDate: 'Нельзя вводить число за будущий день.',
      errorClosed: 'Этот день относится к закрытому периоду KPI; число изменить нельзя.',
      saveError: 'Не удалось сохранить число.',
      columnDate: 'День',
      columnStore: 'Магазин',
      columnCount: 'Посетители',
      columnActions: 'Действие',
      add: 'Добавить',
      addTitle: 'Добавить число посетителей',
      editTitle: 'Исправить число посетителей',
      filters: 'Фильтры',
      filterDates: 'Период',
      filterFrom: 'С',
      filterTo: 'По',
      rangeInvalid: 'Начальная дата не может быть позже конечной.',
      rangeFrom: 'С {date}',
      rangeTo: 'По {date}',
      removeFilter: 'Убрать фильтр {filter}',
      resultCount: 'Записей: {count}',
      emptyFiltered: 'Нет записей по этим фильтрам.',
      excel: 'Excel',
      excelTitle: 'Массовый ввод из Excel',
      excelStep1: 'Скачайте шаблон',
      excelStep1Hint:
        'Для каждого магазина на каждый выбранный день готова строка; уже сохранённые числа заполнены. Подробности — на листе «Инструкция».',
      excelStoreAll: 'Все магазины',
      excelStoreOne: 'Только {store}',
      excelDownload: 'Скачать шаблон',
      excelDownloading: 'Готовим…',
      excelStep2: 'Заполните и загрузите',
      excelStep2Hint:
        'Впишите числа в столбец D; пустая строка не меняется. Если за магазин и день число уже есть, новое заменяет его и записывается в историю. Если хотя бы одна строка неверна, ничего не сохраняется.',
      excelChooseFile: 'Выбрать файл Excel (.xlsx)',
      excelChangeFile: 'Выбрать другой файл',
      excelUpload: 'Загрузить',
      excelUploading: 'Загружаем…',
      excelResult: 'Добавлено новых: {created}, обновлено: {updated}, без изменений: {unchanged}.',
      excelSkipped: 'Строк без числа пропущено: {count}.',
      excelRowsInvalid:
        'Неверных строк: {count}, ничего не сохранено. Исправьте и загрузите файл снова:',
      excelRow: 'Строка {row}',
      excelMoreErrors: '… и ещё неверных строк: {count}',
      excelErrorFile: 'Не удалось прочитать файл. Используйте шаблон .xlsx, скачанный здесь.',
      excelErrorTooLarge: 'Файл слишком большой: не более 5 000 строк и 2 МБ.',
      excelErrorEmpty: 'В файле нет строк с числом.',
      excelErrorRange: 'Диапазон — не более 62 дней и не позже сегодняшнего дня.',
      excelDone: 'Готово',
      excelRowErrors: {
        INVALID_DATE: 'не удаётся прочитать дату',
        FUTURE_DATE: 'день в будущем',
        INVALID_STORE: 'не удаётся прочитать номер магазина',
        UNKNOWN_STORE: 'магазина с таким номером нет',
        INVALID_COUNT: 'число должно быть целым, от 0',
        DUPLICATE: 'тот же магазин и день встречаются в файле дважды',
        CLOSED_PERIOD: 'KPI-период этого месяца закрыт',
      },
    },
    visitorReport: {
      button: 'Отчёт',
      title: 'Отчёт по посетителям',
      rangeThisWeek: 'Эта неделя',
      rangeLast10: 'Последние 10 дней',
      rangeThisMonth: 'Этот месяц',
      rangeLastMonth: 'Прошлый месяц',
      rangeCustom: 'Период',
      allStores: 'Все магазины',
      store: 'Магазин',
      from: 'С',
      to: 'По',
      errorRange: 'Период — не более 366 дней и не позже сегодняшнего дня.',
      loading: 'Готовим отчёт…',
      error: 'Не удалось загрузить отчёт.',
      empty: 'За этот период числа не вводились.',
      totalVisitors: 'Всего посетителей',
      dailyAverage: 'Среднее в день',
      perStoreDay: 'на магазин, по введённым дням',
      change: 'к предыдущим {days} дн.',
      noChange: 'нет данных за прошлый период',
      coverage: 'Введено дней',
      coverageLow:
        'Некоторые дни не введены ({percent}%). Средние считаются только по введённым дням; введите пропущенные.',
      busiestDay: 'Самый загруженный день',
      dailyTitle: 'Посетители по дням',
      dailyHint: 'Нажмите на столбец, чтобы увидеть значение.',
      dayValue: '{date}: {count} чел. · магазинов: {stores}',
      dayMissing: '{date}: не введено',
      missing: 'Не введено',
      weekdayTitle: 'Дни недели',
      weekdayHint: 'Среднее число посетителей на магазин',
      storesTitle: 'Магазины',
      storeDays: '{days}/{possible} дн.',
      storeAverage: 'ср. {average}',
      notEntered: 'не введено',
      people: 'чел.',
      chartLabel: 'График посетителей по дням, {from} – {to}, всего {total} чел.',
      percent: '{value}%',
      weekdays: {
        w1: 'Пн',
        w2: 'Вт',
        w3: 'Ср',
        w4: 'Чт',
        w5: 'Пт',
        w6: 'Сб',
        w7: 'Вс',
      },
    },
    storeDashboard: {
      title: 'Дашборд магазинов',
      year: 'Год',
      yearOption: '{year} к {previous}',
      store: 'Магазин',
      allStores: 'Все магазины',
      currency: 'Валюта',
      tabs: 'Вкладки KPI',
      summaryTab: 'Сводка',
      refreshEvery: 'Значения обновляются каждые {minutes} мин',
      refreshOff: 'Автоматическое обновление выключено',
      updatedAt: 'обновлено {at}',
      loading: 'Загрузка…',
      error: 'Не удалось загрузить дашборд.',
      empty:
        'Сохранённых значений пока нет. Они рассчитываются из Tiger и появятся после первого обновления.',
      comparing: '{year} в сравнении с {previous}',
      comparedMonths: 'Сравниваемые месяцы: {range} ({count})',
      noComparison:
        'За {previous} год нет данных для сравнения. Рост считается по завершённым месяцам, по которым есть данные в обоих годах; пока показаны только значения {year} года.',
      inProgress: '{month} ещё идёт и в сравнение не входит.',
      inProgressShort: 'Идёт',
      growth: 'Рост',
      noGrowth: 'Нет сравнения',
      percent: '{value}%',
      percentPoints: '{value} п.п.',
      monthlyAverage: 'Среднее за месяц',
      total: 'Итого',
      difference: 'Разница',
      yearSoFar: '{year}, завершённых месяцев: {count}',
      previousYearAll: '{year}, месяцев: {count}',
      monthlyTitle: 'По месяцам',
      monthlyHint: 'Нажмите на месяц, чтобы увидеть детали.',
      monthAria: '{month}: {year} — {current}, {previousYear} — {previous}',
      month: 'Месяц',
      change: 'Изменение',
      storesTitle: 'Сравнение магазинов',
      storesHint: 'По росту за сравниваемые месяцы.',
      singleStore: 'В эти годы продажи есть только у одного магазина.',
      openKpi: '{name}: подробнее',
      customersNote:
        'При сложении магазинов покупатель или товар, встречающийся в двух магазинах, учитывается дважды.',
      ratioNote:
        'Конверсия считается только по дням с введённым числом посетителей: чеки продаж этих дней ÷ их посетители. Месяц, где число введено менее чем за 80% дней, не измеряется (—). При объединении магазинов и месяцев сначала складываются чеки и посетители, затем делятся.',
      kpiShort: {
        sales: 'Выручка',
        receipts: 'Чеки',
        customers: 'Покупатели',
        newCustomers: 'Новые',
        returningCustomers: 'Постоянные',
        productVariety: 'Ассортимент',
        conversion: 'Конверсия',
        visitors: 'Посетители',
      },
    },
    kpiCopy: {
      changeLabel: 'Изменение целей',
      decrease: 'Уменьшить на один пункт',
      increase: 'Увеличить на один пункт',
      presets: 'Быстрый выбор',
      summaryKeep: 'Цели копируются без изменений.',
      summaryUp: 'Каждая цель увеличится на {value}%.',
      summaryDown: 'Каждая цель уменьшится на {value}%.',
      rangeError: 'Введите процент от {min} до {max}, не более двух знаков после запятой.',
      roundingNote:
        'Денежные и количественные цели округляются до целых; процентные цели не превышают 100. Строки без цели остаются пустыми.',
      previewTitle: 'Предпросмотр',
      previewTargets: 'Цели заданы: {targets} из {items} KPI',
      previewLoading: 'Загрузка предпросмотра…',
      previewError: 'Не удалось загрузить предпросмотр; копирование всё равно работает.',
      noTarget: 'Цели нет, останется пустой',
      noDefaultTargets: 'В шаблоне нет целей по умолчанию, в копии их тоже не будет.',
      capped: 'не более 100%',
      weight: 'Вес {value}',
      templateTitle: 'Копировать шаблон',
      templatesTitle: 'Копировать шаблоны: {count}',
      templateSource: '«{name}» копируется со всеми KPI как новый шаблон.',
      nameLabel: 'Название нового шаблона',
      nameHint: 'Если оставить пустым, добавится следующий номер, например «{name}».',
      namePlaceholder: 'Автоматически',
      templatesList: 'Копируемые шаблоны',
      moreTemplates: 'и ещё {count}',
      templatesNameHint: 'К названию каждой копии добавится следующий номер, например «(2)».',
      copyTemplate: 'Копировать',
      copyTemplates: 'Копировать: {count}',
      copying: 'Копирование…',
      plansTitle: 'Копировать планы',
      sourceLabel: 'Откуда',
      targetLabel: 'Куда',
      sampleTitle: 'Пример плана',
      sourceEmpty: 'В выбранном периоде нет планов для копирования.',
      samplePosition: '{index} из {total}',
      previousSample: 'Предыдущий пример',
      nextSample: 'Следующий пример',
      skipNote:
        'Сотрудники, у которых уже есть план в этом периоде, неактивные или без привязки к Tiger, пропускаются.',
      copyPlans: 'Копировать планы',
      changedUp: 'Цели увеличены на {value}%.',
      changedDown: 'Цели уменьшены на {value}%.',
    },
    errors: {
      generic: 'Произошла непредвиденная ошибка. Попробуйте ещё раз.',
      network: 'Не удалось подключиться к серверу. Проверьте интернет-соединение.',
      validation: 'Проверьте введённые данные.',
      unauthorized: 'Сессия завершена. Войдите снова.',
      forbidden: 'У вас нет разрешения на выполнение этого действия.',
      notFound: 'Запрошенная запись не найдена.',
      conflict: 'Эти данные конфликтуют с другой записью.',
      payloadTooLarge: 'Выбранный файл превышает допустимый размер.',
      tooManyRequests: 'Слишком много попыток. Подождите немного.',
      tooManyRequestsWait: 'Слишком много неудачных попыток. Повторите через {minutes} мин.',
      server: 'Произошла ошибка сервера. Повторите попытку позже.',
    },
  },
  tk: {
    common: {
      showPassword: 'Paroly görkez',
      hidePassword: 'Paroly gizle',
      close: 'Ýap',
      closeDialog: '{title} penjiresini ýap',
      breadcrumb: 'Nawigasiýa ýoly',
      cancel: 'Ýatyr',
      confirm: 'Tassykla',
      confirmTitle: 'Ynamyňyz barmy?',
      apply: 'Ulan',
      clear: 'Arassala',
      home: 'Baş sahypa',
      bulkActions: 'Köpçülikleýin amallar',
      selectedCount: '{count} saýlandy',
      clearSelection: 'Saýlawy aýyr',
      selectAll: 'Sanawdakylaryň hemmesini saýla',
      selectItem: '{name} saýla',
    },
    login: {
      brand: 'Retail KPI Platform',
      title: 'Giriş',
      subtitle: 'Başlamak üçin hasabyňyza giriň',
      usernameLabel: 'Ulanyjy ady',
      usernamePlaceholder: 'Mysal üçin, admin',
      passwordLabel: 'Parol',
      submit: 'Giriş et',
      submitting: 'Giriş edilýär…',
      errorInvalidCredentials: 'Ulanyjy ady ýa-da parol nädogry.',
      errorGeneric: 'Giriş edip bolmady. Internet baglanyşygyňyzy barlaň.',
      sessionExpired: 'Sessiýaňyz tamamlandy. Täzeden giriň.',
      rememberMe: 'Meni ýatda sakla',
      forgotPassword: 'Paroly unutdyňyzmy?',
      forgotPasswordHelp:
        'E-poçta arkaly parol sıfırlama heniz goldanmaýar. Parolyňyzy sıfırlamak üçin admin bilen habarlaşyň.',
    },
    appShell: {
      logout: 'Çykyş',
      language: 'Dil',
      openMenu: 'Menýuny aç',
      closeMenu: 'Menýuny ýap',
      navEmployees: 'Işgärler',
      navLeaderboard: 'Reýting tablisasy',
      navMyKpi: 'Meniň KPI-larym',
      navKpiPlans: 'KPI meýilnamalary',
      navVisitorCounts: 'Gelýänleriň sany',
      navStoreDashboard: 'Dükan paneli',
      navKpiTemplates: 'KPI şablonlary',
      navSessions: 'Meniň sessiýalarym',
      navSettings: 'Sazlamalar',
    },
    employees: {
      title: 'Işgärler',
      loading: 'Ýüklenýär…',
      errorLoading: 'Işgärler ýüklenip bilinmedi.',
      empty: 'Heniz işgär goşulmady.',
      managerBadge: 'Admin',
      inactiveBadge: 'Passiw',
      addEmployee: 'Täze işgär goş',
      statusColumn: 'Ýagdaýy',
      searchPlaceholder: 'Ady, familiýasy, ulanyjy ady, e-poçta ýa-da telefon boýunça gözle',
      noSearchResults: 'Gözlegiňize laýyk işgär tapylmady.',
      filters: 'Filtrler',
      resultCount: '{count} işgär',
      filtersActiveCount: '{count} filtr işjeň',
      filterStatusAll: 'Ählisi',
      filterOnlyActive: 'Diňe aktiw işgärler',
      filterOnlyInactive: 'Diňe passiw işgärler',
      filterManagers: 'Diňe adminler',
      filterErpLinked: 'ERP satyjysyna baglanan',
      filterWithAvatar: 'Profil suraty barlar',
      filterStore: 'Dükan',
      filterStoreAll: 'Ähli dükanlar',
      sortLabel: 'Tertip',
      sortFirstnameAsc: 'Ady (A→Z)',
      sortFirstnameDesc: 'Ady (Z→A)',
      sortLastname: 'Familiýasy (A→Z)',
      sortUsername: 'Ulanyjy ady (A→Z)',
      sortNewest: 'Iň täze',
      sortOldest: 'Iň köne',
      columnLastname: 'Familiýasy',
      columnUsername: 'Ulanyjy ady',
      columnPhone: 'Telefon',
      columnActions: 'Amal',
      openCard: '{name} işgär kartasyny aç',
      editEmployee: '{name} işgärini üýtget',
      activeBadge: 'Aktiw',
      bulkActivate: 'Aktiwleşdir',
      bulkDeactivate: 'Passiwleşdir',
      bulkDeactivateConfirm:
        '{count} işgär passiwleşdirilsinmi? Açyk sessiýalary ýapylar we gaýtadan aktiwleşdirilýänçä ulgama girip bilmezler.',
      bulkActivated: '{count} işgär aktiwleşdirildi.',
      bulkDeactivated: '{count} işgär passiwleşdirildi, sessiýalary ýapyldy.',
      bulkError: 'Köpçülikleýin amal tamamlanmady. Gaýtadan synanyşyň.',
      selfSelectHint: 'Öz hasabyňyzy köpçülikleýin amal bilen üýtgedip bilmersiňiz.',
    },
    settings: {
      profilePhoto: 'Profil suraty',
      changePhoto: 'Suraty üýtget',
      cropPhoto: 'Suraty kes',
      cropHint: 'Surady süýşürip ýerleşdiriň, slaýder bilen ulaldyň',
      zoom: 'Suratyň ulaldyş derejesi',
      cropSave: 'Kes we sakla',
      photoError: 'Surat täzelenip bilinmedi. Gaýtadan synanyşyň.',
      photoReadError: 'Saýlanan surat okalmady. Başga faýly synap görüň.',
      changePassword: 'Paroly üýtget',
      currentPassword: 'Häzirki parol',
      newPassword: 'Täze parol',
      confirmPassword: 'Paroly tassykla',
      passwordMismatch: 'Parollar gabat gelmeýär.',
      passwordTooShort: 'Parol azyndan 6 belgiden ybarat bolmaly.',
      currentPasswordIncorrect: 'Häzirki parol nädogry.',
      passwordChangeError: 'Paroly üýtgedip bolmady. Gaýtadan synanyşyň.',
      passwordUpdated: 'Parol täzelendi.',
      submitPassword: 'Paroly üýtget',
      saving: 'Saklanýar…',
      theme: 'Tema',
      themeLight: 'Açyk',
      themeDark: 'Goýy',
      themeSystem: 'Ulgam',
    },
    sessions: {
      title: 'Meniň sessiýalarym',
      loading: 'Ýüklenýär…',
      errorLoading: 'Sessiýalar ýüklenip bilinmedi.',
      empty: 'Aktiw sessiýa ýok.',
      currentDevice: 'Bu enjam',
      lastSeen: 'Soňky görlen',
      signedInAt: 'Giriş',
      expiresAt: 'Gutarýar',
      ipAddress: 'IP salgysy',
      unknownDevice: 'Näbelli enjam',
      revoke: 'Sessiýany ýap',
      revoking: 'Ýapylýar…',
      logoutAll: 'Ähli enjamlardan çyk',
      logoutAllConfirm:
        'Ähli enjamlardaky sessiýalar ýapylar we gaýtadan girmeli bolarsyňyz. Dowam edilsinmi?',
      revokeConfirm: 'Bu enjamdaky sessiýa ýapylar. Dowam edilsinmi?',
      rememberMeBadge: 'Uzyn sessiýa',
      shortSessionBadge: 'Gysga sessiýa',
      expiryHint: 'Sessiýa her ulanylanda uzalýar; şu wagta çenli hereket edilmese ýapylýar.',
      revokeError: 'Sessiýany ýapyp bolmady. Gaýtadan synanyşyň.',
      logoutAllError: 'Sessiýalary ýapyp bolmady. Gaýtadan synanyşyň.',
    },
    employeeCard: {
      title: 'Işgär kartasy',
      email: 'E-poçta',
      erpCode: 'ERP kody',
      noErpLink: 'ERP bilen baglanyşyk ýok',
      scanHint: 'ERP işgär kodyny saklaýar; barlamak üçin okadyň',
      noQrHint: 'QR kod döretmek üçin bu işgäri ERP satyjysyna baglaň.',
      viewPhoto: 'Suraty ulalt',
      managerRole: 'Admin',
      employeeRole: 'Işgär',
      open: '{name} işgär kartyny aç',
      loading: 'Işgär kartyny ýüklenýär…',
      errorLoading: 'Işgär kartyny ýükläp bolmady.',
      jobTitle: 'Wezipesi',
      defaultStore: 'Dükan',
    },
    employeeForm: {
      tabDetails: 'Maglumatlar',
      tabSessions: 'Sessiýalar',
      tabKpi: 'KPI',
      tabKpiPlans: 'KPI meýilnamalary',
      tabSalary: 'Aýlyk',
      goToKpiPlans: 'KPI meýilnamalaryna geç',
      sessionsRevokeAll: 'Ähli sessiýalary ýap',
      titleCreate: 'Täze işgär',
      titleEdit: 'Işgäri üýtget',
      loading: 'Ýüklenýär…',
      errorLoading: 'Işgär maglumatlary ýüklenip bilinmedi.',
      erpEmployeesError: 'ERP satyjylarynyň sanawy ýüklenip bilinmedi.',
      usernameLabel: 'Ulanyjy ady',
      passwordLabelCreate: 'Parol',
      passwordLabelEdit: 'Täze parol (hökman däl)',
      passwordHintEdit: 'Boş goýulsa, häzirki parol üýtgemez.',
      firstnameLabel: 'Ady',
      lastnameLabel: 'Familiýasy',
      emailLabel: 'E-poçta (hökman däl)',
      phoneLabel: 'Telefon (hökman däl)',
      fullAccessLabel: 'Admin hukugy',
      fullAccessHint: 'Işgärler we faýl dolandyryşy ýaly ekranlara girip bilýär.',
      visitorCountsLabel: 'Gelýänleriň sanyny girizip biler',
      visitorCountsHint:
        'Dükanlara her gün giren adam sanyny "Gelýänleriň sany" ekranynda girizýär.',
      erpEmployeeLabel: 'ERP satyjysy (hökman däl)',
      erpEmployeeNone: 'Baglanmadyk',
      erpEmployeeSearchPlaceholder: 'Kod ýa-da at boýunça gözläň',
      erpEmployeeNoResults: 'Laýyk gelýän satyjy tapylmady.',
      save: 'Sakla',
      saving: 'Saklanýar…',
      deactivate: 'Işgäri passiwleşdir',
      deactivating: 'Passiwleşdirilýär…',
      reactivate: 'Gaýtadan aktiwleşdir',
      reactivating: 'Aktiwleşdirilýär…',
      selfDeactivateHint: 'Öz hasabyňyzy şu ýerden passiwleşdirip bilmersiňiz.',
      usernameRequired: 'Ulanyjy ady hökmany.',
      usernameTooShort: 'Ulanyjy ady azyndan 3 belgiden ybarat bolmaly.',
      passwordRequired: 'Parol hökmany.',
      passwordTooShort: 'Parol azyndan 8 belgiden ybarat bolmaly.',
      firstnameRequired: 'Ady hökmany.',
      lastnameRequired: 'Familiýasy hökmany.',
      jobTitleRequired: 'Wezipesi hökmany.',
      jobTitleLabel: 'Wezipesi',
      jobTitlePlaceholder: 'mysal üçin Satuw geňeşçisi, Dükan müdiri',
      defaultStoreLabel: 'Esasy dükany (hökman däl)',
      defaultStoreHint: 'Işgär kartynda görünýär; reýting şu dükan boýunça süzülýär.',
      defaultStoreNone: 'Dükan ýok',
      emailInvalid: 'Dogry e-poçta salgysyny giriziň.',
      deactivateError: 'Işgäri passiwleşdirip bolmady.',
      reactivateError: 'Işgäri gaýtadan aktiwleşdirip bolmady.',
      genericSaveError: 'Saklanyp bilinmedi. Gaýtadan synanyşyň.',
    },
    kpiTemplates: {
      title: 'KPI şablonlary',
      searchPlaceholder: 'Ady ýa-da düşündirişi boýunça gözle',
      statusLabel: 'Ýagdaýy',
      statusAll: 'Ählisi',
      statusActive: 'Aktiw',
      statusInactive: 'Passiw',
      loading: 'Ýüklenýär…',
      errorLoading: 'KPI şablonlary ýüklenip bilinmedi.',
      empty: 'Heniz KPI şablony ýok.',
      noSearchResults: 'Gözlegiňize laýyk şablon tapylmady.',
      resultCount: '{count} şablon',
      add: 'Täze KPI şablony',
      inactiveBadge: 'Passiw',
      kpiCount: '{count} KPI',
      weightSummary: 'Agram {total}%',
      columnPlans: 'Meýilnamalar',
      planCount: 'Meýilnama: {count}',
      unused: 'Ulanylmadyk',
      openPlans: '{name} şablony bilen düzülen meýilnamalary görkez ({count})',
      columnName: 'Ady',
      columnDescription: 'Düşündiriş',
      columnKpis: 'KPI sany',
      columnWeight: 'Jemi agram',
      columnStatus: 'Ýagdaýy',
      columnActions: 'Hereket',
      editTemplate: '{name} şablonyny üýtget',
      activeBadge: 'Aktiw',
      bulkCopy: 'Nusgala',
      bulkActivate: 'Aktiwleşdir',
      bulkDeactivate: 'Passiwleşdir',
      bulkDeactivateConfirm:
        '{count} şablon passiwleşdirilsinmi? Islän wagtyňyz gaýtadan aktiwleşdirip bilersiňiz.',
      bulkCopied: '{count} şablon nusgalandy; nusgalaryň adyna “(2)” ýaly san goşuldy.',
      bulkActivated: '{count} şablon aktiwleşdirildi.',
      bulkDeactivated: '{count} şablon passiwleşdirildi.',
      bulkDelete: 'Poz',
      bulkDeleteConfirm:
        '{count} şablon hemişelik pozulsynmy? Bu amal yzyna alynmaýar. KPI meýilnamasynda ulanylýan şablon pozulmaýar.',
      bulkDeleted: '{count} şablon hemişelik pozuldy.',
      bulkDeleteInUse:
        'Şu şablonlar KPI meýilnamalarynda ulanylýar we pozulyp bilinmeýär: {names}. Olary diňe passiwleşdirip bilersiňiz.',
      bulkError: 'Köpçülikleýin amal tamamlanmady. Gaýtadan synanyşyň.',
    },
    kpiTemplateForm: {
      titleCreate: 'Täze KPI şablony',
      titleEdit: 'KPI şablonyny üýtget',
      loading: 'Ýüklenýär…',
      errorLoading: 'Şablon ýüklenip bilinmedi.',
      nameLabel: 'Şablonyň ady',
      namePlaceholder: 'mysal üçin MÜDÜR KPI 01',
      descriptionLabel: 'Düşündiriş (hökman däl)',
      itemsTitle: 'KPI-lar',
      itemsHint:
        'Agramlaryň jemi takyk 100% bolmaly. Maksat hökman däl; şablon döwre bellenende üýtgedip bolýar.',
      addItem: 'KPI goş',
      itemTitle: 'KPI {number}',
      removeItem: 'KPI {number} setirini aýyr',
      definitionLabel: 'KPI',
      definitionPlaceholder: 'KPI gözle we saýla',
      definitionNoResults: 'Laýyk KPI tapylmady.',
      definitionsError: 'KPI sanawy ýüklenip bilinmedi.',
      weightLabel: 'Agram (%)',
      targetLabel: 'Maksat ({unit})',
      unitMoney: 'möçber',
      unitCount: 'sany',
      unitScore: 'bal',
      storesPlaceholder: 'Dükan gözle we goş',
      storesNoResults: 'Laýyk dükan tapylmady.',
      storesError: 'Dükanlaryň sanawy ýüklenip bilinmedi.',
      removeStore: '{name} dükanyny aýyr',
      itemGroupsPlaceholder: 'Haryt toparyny gözläň we goşuň',
      itemGroupsNoResults: 'Topar tapylmady.',
      itemGroupsError: 'Haryt toparlary ýüklenip bilinmedi.',
      itemGroupOption: '{code} · {count} haryt',
      removeItemGroup: '{name} toparyny aýyr',
      ungroupedHint:
        'Topary bolmadyk harytlar hiç bir topar KPI-syna girmeýär: soňky 12 aýda satuwyň %{share}-i. Tiger-de haryt kartlaryna topar berlende hasaba alynýar.',
      unknownItemGroup:
        '{number}-nji KPI indi ýok bolan haryt toparlaryny öz içine alýar: {codes}.',
      selectPlaceholder: 'Saýlaň',
      noInputs: 'Bu KPI üçin maksatdan başga maglumat gerek däl.',
      totalWeight: 'Jemi agram: {total}% / 100%',
      totalWeightUnder: 'Jemi agram: {total}% / 100% · {difference}% ýetmezçilik',
      totalWeightOver: 'Jemi agram: {total}% / 100% · {difference}% artyk, saklap bolmaýar',
      weightOver:
        'Agramlaryň jemi 100%-den geçýär (häzir {total}%). Şeýle ýagdaýda saklap bolmaýar.',
      weightUnder: 'Agramlaryň jemi takyk 100% bolmaly (häzir {total}%).',
      save: 'Sakla',
      saving: 'Saklanýar…',
      inactiveNotice: 'Bu şablon passiw.',
      deactivate: 'Şablony passiwleşdir',
      deactivating: 'Passiwleşdirilýär…',
      reactivate: 'Gaýtadan aktiwleşdir',
      reactivating: 'Aktiwleşdirilýär…',
      deactivateError: 'Şablony passiwleşdirip bolmady.',
      delete: 'Şablony poz',
      deleting: 'Pozulýar…',
      deleteConfirm: '“{name}” şablony hemişelik pozulsynmy? Bu amal yzyna alynmaýar.',
      deleteHint: 'KPI meýilnamasynda ulanylmaýan şablon hemişelik pozulyp bilner.',
      deleteError: 'Şablon pozulmady.',
      deleteInUse:
        'Bu şablondan {count} KPI meýilnamasy döredilipdir, şonuň üçin pozulyp bilinmeýär. Ony passiwleşdirip bilersiňiz.',
      copy: 'Nusgasyny döret',
      copyHint: 'Iň soňky saklanan görnüşi ähli KPI-lary bilen nusgalanýar.',
      copyError: 'Şablony nusgalap bolmady.',
      copiedNotice:
        '“{name}” şablonyndan nusgalandy. Adyny we maglumatlaryny üýtgedip saklap bilersiňiz.',
      nameRequired: 'Şablonyň ady hökmany.',
      itemsRequired: 'Iň bolmanda bir KPI goşuň.',
      definitionRequired: 'Setir {number} üçin KPI saýlaň.',
      weightInvalid:
        'KPI {number} üçin 0,01 bilen 100 aralygynda, iň köp 2 onluk belgili agram giriziň.',
      targetInvalid:
        'KPI {number} üçin maksat 0-dan kiçi bolmaly däl we iň köp 4 onluk belgisi bolmaly.',
      inputRequired: 'KPI {number} üçin “{field}” meýdany hökmany.',
      duplicateItem:
        'KPI {number} KPI {other} bilen gaýtalanýar (şol bir KPI we şol bir maglumatlar).',
      unknownDefinition: 'KPI {number} indi aktiw däl ýa-da tapylmady.',
      invalidInput: 'KPI {number} maglumatlary nädogry.',
      unknownStore: 'KPI {number} indi ýok bolan dükany öz içine alýar.',
      nameTaken: 'Bu atly KPI şablony eýýäm bar.',
      genericSaveError: 'Şablony saklap bolmady. Gaýtadan synanyşyň.',
    },
    recordInfo: {
      buttonFor: '{name} ýazgy maglumaty',
      title: 'Ýazgy maglumaty',
      createdBy: 'Döreden',
      updatedBy: 'Soňky üýtgeden',
      system: 'Ulgam',
      history: 'Üýtgeşmeler taryhy',
      historyEmpty: 'Bu ýazgy üçin entek üýtgeşme ýazylmady.',
      historyHint:
        'Üýtgeşmeler bu aýratynlyk açylandan bäri ýazylýar; has öňki üýtgeşmeler bu ýerde görünmeýär.',
      loading: 'Ýüklenýär…',
      error: 'Ýazgy maglumatyny ýükläp bolmady.',
      loadMore: 'Ýene görkez',
      actionCreate: 'Döredildi',
      actionUpdate: 'Üýtgedildi',
      actionDelete: 'Pozuldy',
      actionActivate: 'Aktiwleşdirildi',
      actionDeactivate: 'Passiwleşdirildi',
      viaBulkStatus: 'köpçülikleýin amal bilen',
      viaBulkCopy: 'köpçülikleýin nusgalamak bilen',
      viaExcelImport: 'Excel-den',
      copiedFrom: '“{name}” şablonyndan nusgalandy',
      actionExport: 'Excel göçürilip alndy',
      exportedFile: 'Faýl: {name}',
      valueAdded: 'goşuldy',
      valueRemoved: 'aýryldy',
      valueChanged: 'üýtgedildi',
      valueYes: 'Hawa',
      valueNo: 'Ýok',
      valueActive: 'Aktiw',
      valueInactive: 'Passiw',
      itemsBefore: 'Öň',
      itemsAfter: 'Soň',
      target: 'maksat {value}',
      fields: {
        employees: {
          username: 'Ulanyjy ady',
          firstname: 'Ady',
          lastname: 'Familiýasy',
          email: 'E-poçta',
          phoneNumber: 'Telefon',
          erpEmployeeId: 'ERP satyjysy',
          avatarId: 'Profil suraty',
          fullAccess: 'Admin hukugy',
          canEnterVisitorCounts: 'Gelýänleriň sanyny girizip biler',
          jobTitle: 'Wezipesi',
          defaultStoreId: 'Esasy dükany',
          isActive: 'Ýagdaýy',
          passwordHash: 'Parol',
        },
        kpi_templates: {
          name: 'Şablonyň ady',
          description: 'Düşündiriş',
          isActive: 'Ýagdaýy',
          items: 'KPI-lar',
        },
        kpi_periods: {
          year: 'Ýyl',
          month: 'Aý',
          status: 'Ýagdaýy',
          closedAt: 'Ýapylan wagty',
        },
        kpi_assignments: {
          periodId: 'Döwür',
          employeeId: 'Işgär',
          templateId: 'Şablon',
          templateName: 'Şablonyň ady',
          items: 'KPI-lar',
        },
        store_visitor_counts: {
          storeId: 'Dükan',
          visitDate: 'Gün',
          visitorCount: 'Giren adam sany',
        },
        employee_salaries: {
          employeeId: 'Işgär',
          effectiveMonth: 'Güýje girýän aýy',
          amount: 'Aýlyk',
          currency: 'Pul birligi',
          fixedPercent: 'Hemişelik göterim',
          kpiPercent: 'KPI göterimi',
        },
      },
    },
    kpiPlans: {
      title: 'KPI meýilnamalary',
      periodLabel: 'Döwür',
      newPeriodTitle: 'Täze döwür aç',
      year: 'Ýyl',
      month: 'Aý',
      open: 'Döwri aç',
      statusOpen: 'Açyk',
      statusClosed: 'Ýapyk',
      closePeriod: 'Döwri ýap',
      newPeriod: 'Täze döwür',
      closeConfirm:
        '{period} döwri ýapylsynmy? Ýapyk döwürde meýilnama, maksat we bal üýtgedilip bilinmeýär. Ýalňyşlyk bilen ýapsaňyz, {date} senesine çenli gaýtadan açyp bilersiňiz.',
      closeConfirmFinal:
        '{period} döwri ýapylsynmy? Gaýtadan açmak möhleti geçdi, şonuň üçin ýapmak kesgitli bolar: meýilnama, maksat we bal indi üýtgedilip bilinmez.',
      reopenPeriod: 'Döwri gaýtadan aç',
      reopenPasswordMessage:
        '{period} döwri gaýtadan açylar; meýilnamalar, maksatlar we hasap ýene üýtgedilip bilner. Tassyklamak üçin açar sözüňizi giriziň.',
      exportExcel: 'Excel',
      exporting: 'Taýýarlanýar…',
      exportTitle: 'KPI we aýlyk Excel-i',
      exportConfirm: 'Göçürip al',
      exportPasswordMessage:
        '{period} döwrüniň ähli meýilnamalary KPI bahalary we aýlyklary bilen Excel görnüşinde göçürilip alnar. Faýlda aýlyk maglumaty bar; göçürip almak döwrüň ýazgy maglumatyna ýazylýar.\n\nTassyklamak üçin açar sözüňizi giriziň.',
      exported: '{file} göçürilip alndy.',
      reopened: '{period} döwri gaýtadan açyldy.',
      reopenExpired: 'Bu döwri {date} senesine çenli gaýtadan açyp bolýardy; indi kesgitlendi.',
      periodOpenHint: 'Meýilnamalar, maksatlar we ballar üýtgedilip bilner.',
      periodClosedReopenable:
        'Üýtgeşme girizip bolmaýar. Ýalňyşlyk bilen ýapylan bolsa, {date} senesine çenli gaýtadan açyp bilersiňiz.',
      periodClosedFinal: 'Kesgitlendi: üýtgeşme girizip bolmaýar, gaýtadan açylmaýar.',
      periodPlans: '{count} meýilnama',
      periodMissingTargets: '{count} meýilnamanyň maksady doly däl',
      deletePlan: '{name} işgäriniň meýilnamasyny poz',
      deleted: '{name} işgäriniň meýilnamasy pozuldy.',
      closed: '{period} döwri ýapyldy.',
      assign: 'Şablon belle',
      assignTitle: 'Şablon belle',
      templateLabel: 'KPI şablony',
      employeesLabel: 'Işgärler',
      employeeSearch: 'Işgär gözle',
      assignSubmit: 'Meýilnama döret',
      assigned: '{count} işgäre meýilnama berildi.',
      copyFrom: 'Başga döwürden göçür',
      copied: '{created} meýilnama göçürildi, {skipped} işgär geçildi.',
      copiedNone: 'Göçürmäge amatly meýilnama tapylmady.',
      loading: 'Ýüklenýär…',
      errorLoading: 'Meýilnamalar ýüklenmedi.',
      empty: 'Bu döwürde entek meýilnama ýok.',
      emptyPeriods: 'Entek KPI döwri ýok. Başlamak üçin bir aý açyň.',
      noSearchResults: 'Gözlege laýyk meýilnama tapylmady.',
      searchPlaceholder: 'Işgär gözle',
      templateFilter: 'Şablon: {name}',
      clearTemplateFilter: 'Şablon süzgüjini aýyr',
      noTemplatePlans: 'Bu döwürde bu şablon bilen düzülen meýilnama ýok.',
      targetProgress: '{done}/{total} maksat',
      columnEmployee: 'Işgär',
      columnTemplate: 'Şablon',
      columnTargets: 'Maksatlar',
      columnActions: 'Amal',
      openPlan: '{name} meýilnamasyny aç',
      openPlanShort: 'Aç',
      calculateAll: 'Hemmesini hasapla',
      calculatingAll: 'Hasaplanýar…',
      calculatedAll: '{count} meýilnamanyň baly hasaplandy.',
      calculatedAllIncomplete:
        '{count} meýilnamanyň baly hasaplandy; {incomplete} sanysy doly däl.',
      columnScore: 'Bal',
      noScore: '—',
      scoreValue: '{value} bal',
      assignError: 'Meýilnama döredilmedi.',
      alreadyAssigned: 'Bu işgärleriň bu döwürde eýýäm meýilnamasy bar: {names}',
      ineligible: 'Bu işgärlere şablon berip bolmaýar: {names}',
      reasonInactive: 'passiw',
      reasonMissingErpLink: 'Tiger satyjy baglanyşygy ýok',
      reasonAlreadyAssigned: 'meýilnamasy eýýäm bar',
      periodClosedError: 'Döwür ýapyk bolany üçin üýtgeşme ýazylmady.',
      selectTemplate: 'Şablon saýlaň',
      employeesEmpty: 'Işgär tapylmady.',
      salaryTitle: 'Bu döwür üçin tölenjek',
      salaryFixed: 'Hemişelik',
      salaryKpi: 'KPI-dan',
      salaryPayable: 'Alynjak',
      salaryPlans: '{count} meýilnamanyň jemi',
      salaryWithout: '{count} işgäriň bu aý üçin aýlygy ýok',
      salaryNotCalculated: '{count} işgäriň baly hasaplanmady; diňe hemişelik bölek hasaba alyndy',
      salaryNone:
        'Bu meýilnamalaryň hiç biriniň bu aý üçin güýjündäki aýlygy ýok. Aýlyk işgäriň Aýlyk bölüminden girizilýär.',
      salaryBarLabel: 'Hemişelik %{fixed} · KPI-dan gazanylan %{earned}',
      noSalary: 'Bu aý üçin aýlyk ýok',
    },
    kpiPlanForm: {
      title: 'KPI meýilnamasy',
      loading: 'Ýüklenýär…',
      errorLoading: 'Meýilnama ýüklenmedi.',
      save: 'Maksatlary sakla',
      saved: 'Maksatlar saklandy.',
      saveError: 'Maksatlar saklanmady.',
      closedError: 'Döwür ýapyk; maksatlar üýtgedilip bilinmeýär.',
      invalidTarget: 'Maksat nädogry. Otrisatel bolmadyk, iň köp 4 onluk belgili san giriziň.',
      targetLabel: 'Maksat',
      missingTarget: 'Maksat girizilmedi',
      weight: 'Agram {value}%',
      stores: 'Dükanlar',
      itemGroups: 'Toparlar',
      currency: 'Walýuta',
      recommendation: 'Ortaça {average} · Ýetip boljak iň ýokary {max} · Teklip {recommended}',
      recommendationMonths: '{count} aýlyk maglumat',
      applyRecommendation: 'Teklibi ulan',
      applyAll: 'Ähli teklipleri ulan',
      applyConfirmOne:
        '{name}: maksat {change} bolar.\nÝatda sakla basylanda hemişelik bolar. Ynamyňyz barmy?',
      applyConfirmAll:
        'Şu maksatlar üýtgeýär:\n{changes}\nÝatda sakla basylanda hemişelik bolar. Ynamyňyz barmy?',
      applyConfirmButton: 'Ulan',
      emptyTarget: 'boş',
      combinedHint: 'birnäçe dükan birleşdirildi',
      manualHint: 'Bu KPI el bilen girizilýär; hasabaty ýok.',
      noRecommendation: 'Bu KPI üçin hasabat maglumaty ýok.',
      deletePlan: 'Meýilnamany poz',
      deleteConfirm: '{name} işgäriniň {period} meýilnamasy pozulsynmy?',
      deleteError: 'Meýilnama pozulmady.',
      closedNotice: '{period} döwri ýapyk; maksatlar diňe okalýar.',
      calculate: 'Hasapla',
      calculating: 'Hasaplanýar…',
      calculated: 'Bal hasaplandy.',
      calculatedIncomplete: 'Bal hasaplandy; {done}/{total} setir bahalandy.',
      actualLabel: 'Hakyky',
      actualPlaceholder: 'El bilen girizilýär',
      actualHint: 'Bu KPI Tiger’dan hasaplanmaýar; bahany siz girizýärsiňiz.',
      calculatedItem: 'Bu KPI Tiger’dan okalýar, el bilen girizilmeýär.',
    },
    myKpi: {
      title: 'Meniň KPI-larym',
      loading: 'Ýüklenýär…',
      errorLoading: 'KPI meýilnamaňyz ýüklenmedi.',
      empty: 'Size entek KPI meýilnamasy berilmedi.',
      period: 'Döwür',
      periodOption: '{period} · {score} bal',
      periodOpen: 'Döwür açyk; bal entek kesgitlenmedi.',
      periodClosed: 'Döwür ýapyldy; bal kesgitlendi.',
      weight: 'Agram',
      target: 'Maksat',
      noTarget: 'Maksat entek girizilmedi',
      emptyEmployee: 'Bu işgäre entek KPI meýilnamasy berilmedi.',
      errorLoadingEmployee: 'Işgäriň KPI meýilnamasy ýüklenip bilmedi.',
    },
    leaderboard: {
      title: 'Reýting tablisasy',
      period: 'Döwür',
      templateFilter: 'Şablon boýunça süzgüç',
      allTemplates: 'Hemmesi',
      store: 'Dükan',
      allStores: 'Ähli dükanlar',
      loading: 'Ýüklenýär…',
      errorLoading: 'Reýting ýüklenip bilmedi.',
      empty: 'Bu döwürde entek KPI meýilnamasy ýok.',
      autoEvery: 'Ballar her {minutes} minutda özbaşdak täzelenýär',
      autoOff: 'Awtomatik täzelenme öçük',
      periodClosed: 'Döwür ýapyldy; ballar gutarnykly',
      updatedAt: 'soňky täzelenme {at}',
      notCalculated: 'Bal entek hasaplanmady',
      scoredOf: '{done}/{total} KPI bahalandyryldy',
      you: 'Siz',
      rank: '{rank}-nji orun',
      unranked: 'Orny ýok',
      colRank: 'Orun',
      colEmployee: 'Işgär',
      colTemplate: 'Şablon',
      colScore: 'Bal',
      myStanding: 'Siziň orunyňyz',
      placeShort: 'orun',
      myNotCalculated: 'Balyňyz entek hasaplanmady.',
      amongCount: '{count} adamyň arasynda',
      gapToNext: '{rank}-nji orna çykmak üçin ýene {gap} bal',
      leading: 'Siz birinji! Şeýle dowam ediň.',
      podium: 'Ilkinji üçlük',
      others: 'Beýleki orunlar',
      openKpi: '{name} KPI-laryny aç',
    },
    salary: {
      loading: 'Ýüklenýär…',
      errorLoading: 'Aýlyklar ýüklenip bilmedi.',
      empty: 'Bu işgäre entek aýlyk girizilmedi.',
      noneYet: 'Bu aý üçin güýjünde aýlyk ýok; ilkinji aýlyk has soňky aýdan başlaýar.',
      currentTitle: 'Häzirki aýlyk',
      sinceMonth: '{month} aýyndan bäri güýjünde',
      fromMonth: '{month} aýyndan başlap',
      inForce: 'Häzir güýjünde',
      history: 'Aýlyk taryhy',
      fixedPart: 'Hemişelik %{percent}',
      kpiPart: 'KPI %{percent}',
      splitLabel: 'Hemişelik %{fixed}, KPI %{kpi}',
      add: 'Aýlyk goş',
      addTitle: 'Aýlyk goş',
      editTitle: 'Aýlygy düzet',
      editFor: 'Aýlygy düzet: {range}',
      deleteFor: 'Aýlygy poz: {range}',
      deleteConfirm:
        '{month} aýyndan başlap güýjündäki aýlyk pozulsynmy? Şol aýdan soň öňki aýlyk güýje girer.',
      deleteError: 'Aýlyk pozulyp bilmedi.',
      delete: 'Poz',
      effectiveMonth: 'Güýje girýän aýy',
      effectiveHint: 'Şu aýdan başlap, täze aýlyk girizilýänçä güýjünde bolýar.',
      amount: 'Aýlyk',
      amountPlaceholder: 'Mysal üçin 12000',
      currency: 'Pul birligi',
      fixedPercent: 'Hemişelik (%)',
      kpiPercent: 'KPI (%)',
      preview: 'Hemişelik {fixed} + KPI {kpi}',
      calcOpen: 'Aýlygy hemişelik ýa-da KPI möçberinden hasapla',
      calcClose: 'Hasaplaýjyny ýap',
      calcTitle: 'Aýlygy hasapla',
      calcHint: 'Bir bölegiň möçberini ýazyň; aýlyk göterimlere görä hasaplanar.',
      calcPartLabel: 'Belli bölek',
      calcFixedAmount: 'Hemişelik bölek näçe bolsun? ({currency})',
      calcKpiAmount: 'KPI bölegi näçe bolsun? ({currency})',
      calcResult: 'Aýlyk',
      calcApply: 'Aýlyga ýaz',
      calcNeedPercents: 'Ilki hemişelik we KPI göterimlerini giriziň; jemi 100 bolmaly.',
      calcZeroPercent: 'Bu bölegiň göterimi 0; aýlygy ondan hasaplap bolmaýar.',
      calcTooLarge: 'Aýlyk rugsat berlen iň uly möçberden geçýär.',
      save: 'Ýatda sakla',
      saving: 'Ýatda saklanýar…',
      saveError: 'Aýlyk ýatda saklanyp bilmedi.',
      errorMonthExists: 'Bu işgäriň bu aý üçin eýýäm aýlygy bar.',
      errorPercentTotal: 'Hemişelik we KPI göterimleriniň jemi 100 bolmaly.',
      errorPeriodClosed:
        'Bu üýtgeşme ýapylan döwürleriň aýlygyny üýtgedýär: {months}. Ýapylan aýyň tölegi gutarnykly; düzetmek üçin ilki döwri gaýtadan açyň.',
    },
    kpiSalary: {
      title: 'Aýlyk',
      since: '{month} aýyndan bäri güýjündäki aýlyk',
      show: 'Görkez',
      hide: 'Gizle · {seconds}',
      hidden: 'Gizlin mukdar; görmek üçin basyň',
      payable: 'Bu döwür üçin alynjak',
      fixedOnly: 'Hemişelik bölek (KPI entek hasaplanmady)',
      barLabel: 'Hemişelik %{fixed}, KPI %{kpi}, bal {score}',
      fixedPart: 'Hemişelik %{percent}',
      kpiPart: 'KPI %{percent}',
      byScore: '{score} bal boýunça',
      fullSalary: 'Doly aýlyk',
      interim: 'Döwür açyk: bal üýtgedigiçe mukdar hem üýtgeýär.',
      final: 'Döwür ýapyldy; mukdar gutarnykly.',
      notCalculated: 'KPI bölegi bal hasaplanandan soň goşular.',
      itemValue: 'Aýlykdaky gymmaty',
      itemEarned: 'Gazanylan',
      noSalary:
        'Bu işgäriň bu aý üçin güýjündäki aýlygy ýok; aýlyk işgäriň Aýlyk bölüminden girizilýär.',
      kpiEarnedShort: 'KPI-dan gazanylan',
    },
    kpiConversion: {
      title: 'Nähili hasaplandy?',
      formula: 'Konwersiýa = satuw çegi ÷ dükana giren adam × 100.',
      counted:
        '{last} senesine çenli {possible} günüň {counted}-sinde giren adam sany girizildi (gurşaw %{coverage}).',
      countedStores:
        '{stores} dükanyň {last} senesine çenli {possible} dükan-gününiň {counted}-sinde giren adam sany girizildi (gurşaw %{coverage}).',
      result: 'Diňe bu günler hasaba alyndy: {receipts} satuw çegi ÷ {visitors} adam = %{value}.',
      lowCoverage:
        'Bahalandyrylmak üçin günleriň azyndan %{required}-inde san girizilmeli. Ýetmeýän günleriň sanlary "Gelen adam sanlary" ekranyndan girizilse, indiki hasapda bahalandyrylar.',
      noVisitors: 'Hasaba alnan günleriň hemmesinde giren adam 0; gatnaşygy hasaplap bolmaýar.',
      noDays: 'Entek hasaba girjek gün ýok: diňe şu günden öňki günler hasaba alynýar.',
      rules:
        'Şu gün, gutarmanka hasaba alynmaýar. San girizilmedik günler çaklanmaýar we hasaba girmeýär; 0 girizilen gün (ýapyk dükan) hasaba alynýar. Yzyna gaýtarmalar gatnaşyga täsir etmeýär.',
      notScored: 'Bahalandyrylmady: gelen adam sany ýeterlik günde girizilmedi.',
    },
    passwordConfirm: {
      label: 'Siziň açar sözüňiz',
      checking: 'Barlanýar…',
      wrong: 'Açar söz nädogry.',
    },
    kpiProgress: {
      totalScore: 'Jemi bal',
      outOf: '/ {max}',
      notCalculated: 'Bal entek hasaplanmady.',
      calculatedAt: 'Soňky hasaplama: {at}',
      incomplete: '{done}/{total} KPI bahalandy; galanlarynyň maksady ýa-da hakykaty ýok.',
      achievement: 'Ýerine ýetiriş',
      percent: '{value}%',
      reached: 'Maksada ýetildi',
      actualOfTarget: 'Hakyky {actual} / maksat {target}',
      actualOnly: 'Hakyky {actual}',
      contribution: 'Goşandy {score} / {weight}',
      noTarget: 'Maksat girizilmedi, şonuň üçin bahalanmady.',
      noActual: 'Hakyky baha girizilmedi, şonuň üçin bahalanmady.',
      meterLabel: '{name}: ýerine ýetiriş',
      scoreMeterLabel: '{name}: jemi bal',
    },
    visitorCounts: {
      title: 'Gelýänleriň sany',
      store: 'Dükan',
      date: 'Gün',
      count: 'Giren adam sany',
      countPlaceholder: 'Mysal üçin, 184',
      save: 'Sakla',
      update: 'Täzele',
      saving: 'Saklanýar…',
      saved: '{store} · {date}: {count} adam saklandy.',
      replaceHint: 'Şol bir dükan we gün gaýtadan girizilse, san täzelenýär.',
      existing: 'Bu gün üçin saklanan san: {count}. Saklasaňyz üýtgär.',
      loading: 'Ýüklenýär…',
      errorLoading: 'Girizmeler ýüklenmedi.',
      empty: 'Entek girizme ýok.',
      people: 'adam',
      edit: 'Üýtget',
      editFor: '{store} · {date} girizmesini üýtget',
      deleteFor: '{store} · {date} girizmesini poz',
      deleteConfirm: '{store} dükanynyň {date} günki sany pozulsynmy?',
      deleted: 'Girizme pozuldy.',
      errorUnknownStore: 'Saýlanan dükan Tiger-da tapylmady.',
      errorFutureDate: 'Geljekdäki gün üçin san girizip bolmaýar.',
      errorClosed: 'Bu gün ýapyk KPI döwrüne degişli; sany üýtgedip bolmaýar.',
      saveError: 'San saklanmady.',
      columnDate: 'Gün',
      columnStore: 'Dükan',
      columnCount: 'Adam',
      columnActions: 'Amal',
      add: 'San goş',
      addTitle: 'Gelen adam sanyny goş',
      editTitle: 'Gelen adam sanyny düzet',
      filters: 'Süzgüçler',
      filterDates: 'Sene aralygy',
      filterFrom: 'Başlangyç güni',
      filterTo: 'Soňky gün',
      rangeInvalid: 'Başlangyç güni soňky günden soň bolup bilmez.',
      rangeFrom: '{date} we soňra',
      rangeTo: '{date} çenli',
      removeFilter: '{filter} süzgüjini aýyr',
      resultCount: '{count} ýazgy',
      emptyFiltered: 'Bu süzgüçlere laýyk ýazgy ýok.',
      excel: 'Excel',
      excelTitle: 'Excel bilen köpçülikleýin giriş',
      excelStep1: 'Nusgany ýükläp alyň',
      excelStep1Hint:
        'Saýlan günleriňizde her iş ýeri üçin setir taýýar gelýär; ýazylan sanlar doldurylandyr. Düşündiriş faýlyň “Düşündiriş” sahypasynda.',
      excelStoreAll: 'Ähli iş ýerleri',
      excelStoreOne: 'Diňe {store}',
      excelDownload: 'Nusgany ýükle',
      excelDownloading: 'Taýýarlanýar…',
      excelStep2: 'Dolduryp ýükläň',
      excelStep2Hint:
        'Sanlary D sütünine ýazyň; boş galdyrylan setir üýtgemeýär. Şol iş ýeri we gün üçin san bar bolsa, täzesi onuň ornuna geçýär we ýazgy yzyna ýazylýar. Bir setir hem ýalňyş bolsa hiç zat ýazylmaýar.',
      excelChooseFile: 'Excel faýlyny saýla (.xlsx)',
      excelChangeFile: 'Başga faýl saýla',
      excelUpload: 'Ýükle',
      excelUploading: 'Ýüklenýär…',
      excelResult:
        '{created} täze san goşuldy, {updated} san täzelendi, {unchanged} san öňküsi ýalydy.',
      excelSkipped: '{count} setirde san ýokdy, geçildi.',
      excelRowsInvalid: '{count} setir ýalňyş, hiç zat ýazylmady. Düzedip faýly täzeden ýükläň:',
      excelRow: '{row}-nji setir',
      excelMoreErrors: '… we ýene {count} ýalňyş setir',
      excelErrorFile: 'Faýl okalmady. Şu ýerden ýüklenen .xlsx nusgasyny ulanyň.',
      excelErrorTooLarge: 'Faýl gaty uly: iň köp 5 000 setir we 2 MB.',
      excelErrorEmpty: 'Faýlda san ýazylan setir ýok.',
      excelErrorRange: 'Sene aralygy iň köp 62 gün bolup biler we şu günden geçip bilmez.',
      excelDone: 'Bolýar',
      excelRowErrors: {
        INVALID_DATE: 'sene okalmady',
        FUTURE_DATE: 'geljekki gün',
        INVALID_STORE: 'iş ýeriniň belgisi okalmady',
        UNKNOWN_STORE: 'bu belgili iş ýeri ýok',
        INVALID_COUNT: 'san 0-dan uly ýa-da deň bitin san bolmaly',
        DUPLICATE: 'şol bir iş ýeri we gün faýlda iki gezek bar',
        CLOSED_PERIOD: 'bu aýyň KPI döwri ýapyk',
      },
    },
    visitorReport: {
      button: 'Hasabat',
      title: 'Gelýänler hasabaty',
      rangeThisWeek: 'Şu hepde',
      rangeLast10: 'Soňky 10 gün',
      rangeThisMonth: 'Şu aý',
      rangeLastMonth: 'Geçen aý',
      rangeCustom: 'Başga',
      allStores: 'Ähli iş ýerleri',
      store: 'Iş ýeri',
      from: 'Başy',
      to: 'Soňy',
      errorRange: 'Sene aralygy iň köp 366 gün bolup biler we şu günden geçip bilmez.',
      loading: 'Hasabat taýýarlanýar…',
      error: 'Hasabat ýüklenmedi.',
      empty: 'Bu aralykda san girizilmedi.',
      totalVisitors: 'Jemi gelýänler',
      dailyAverage: 'Günlük ortaça',
      perStoreDay: 'iş ýeri boýunça, girizilen günlerden',
      change: 'öňki {days} güne görä',
      noChange: 'öňki döwürde maglumat ýok',
      coverage: 'Girizilen gün',
      coverageLow:
        'Käbir günler girizilmedi (%{percent}). Ortaçalar diňe girizilen günlerden hasaplanýar; galan günleri giriziň.',
      busiestDay: 'Iň köp gelnen gün',
      dailyTitle: 'Günlük gelýänler',
      dailyHint: 'Bahasyny görmek üçin sütüne basyň.',
      dayValue: '{date}: {count} adam · {stores} iş ýeri',
      dayMissing: '{date}: girizilmedi',
      missing: 'Girizilmedi',
      weekdayTitle: 'Hepdäniň günleri',
      weekdayHint: 'Iş ýeri boýunça ortaça gelýän',
      storesTitle: 'Iş ýerleri',
      storeDays: '{days}/{possible} gün',
      storeAverage: 'ort. {average}',
      notEntered: 'girizilmedi',
      people: 'adam',
      chartLabel: 'Günlük gelýänler grafigi, {from} – {to}, jemi {total} adam',
      percent: '%{value}',
      weekdays: {
        w1: 'Duş',
        w2: 'Siş',
        w3: 'Çar',
        w4: 'Pen',
        w5: 'Ann',
        w6: 'Şen',
        w7: 'Ýek',
      },
    },
    storeDashboard: {
      title: 'Dükan paneli',
      year: 'Ýyl',
      yearOption: '{year} · {previous} bilen',
      store: 'Dükan',
      allStores: 'Ähli dükanlar',
      currency: 'Walýuta',
      tabs: 'KPI bölümleri',
      summaryTab: 'Jemleme',
      refreshEvery: 'Bahalar her {minutes} minutda täzelenýär',
      refreshOff: 'Awtomatik täzelenme öçük',
      updatedAt: 'soňky täzelenme {at}',
      loading: 'Ýüklenýär…',
      error: 'Panel ýüklenmedi.',
      empty:
        'Entek saklanan baha ýok. Bahalar Tiger-den hasaplanýar we ilkinji täzelenmede peýda bolýar.',
      comparing: '{year} bilen {previous} deňeşdirmesi',
      comparedMonths: 'Deňeşdirilýän aýlar: {range} ({count} aý)',
      noComparison:
        '{previous} ýylynda deňeşdirmek üçin maglumat ýok. Ösüş iki ýylda hem maglumaty bolan tamamlanan aýlardan hasaplanýar; häzirlikçe diňe {year} bahalary görkezilýär.',
      inProgress: '{month} dowam edýär; deňeşdirmä girmeýär.',
      inProgressShort: 'Dowam edýär',
      growth: 'Ösüş',
      noGrowth: 'Deňeşdirme ýok',
      percent: '%{value}',
      percentPoints: '{value} göterim bendi',
      monthlyAverage: 'Aýlyk ortaça',
      total: 'Jemi',
      difference: 'Tapawut',
      yearSoFar: '{year}: tamamlanan {count} aý',
      previousYearAll: '{year}: {count} aý',
      monthlyTitle: 'Aýma-aý deňeşdirme',
      monthlyHint: 'Jikme-jiklik üçin bir aýa basyň.',
      monthAria: '{month}: {year} {current}, {previousYear} {previous}',
      month: 'Aý',
      change: 'Üýtgeşme',
      storesTitle: 'Dükanlaryň deňeşdirmesi',
      storesHint: 'Deňeşdirilýän aýlardaky ösüşe görä tertiplenen.',
      singleStore: 'Bu ýyllarda diňe bir dükanyň satuwy bar.',
      openKpi: '{name} jikme-jikligi',
      customersNote:
        'Dükanlar goşulanda iki dükanda-da görlen müşderi ýa-da haryt iki gezek sanalýar.',
      ratioNote:
        'Konwersiýa diňe gelýänleriň sany girizilen günlerden hasaplanýar: şol günleriň satuw çekleri ÷ gelýänleri. Günleriniň 80%-den azyna san girizilen aý ölçenilmeýär (—). Dükanlar we aýlar birleşende çekler we gelýänler ilki goşulýar, soňra bölünýär.',
      kpiShort: {
        sales: 'Satuw',
        receipts: 'Çekler',
        customers: 'Müşderiler',
        newCustomers: 'Täze müşderi',
        returningCustomers: 'Köne müşderi',
        productVariety: 'Haryt dürlüligi',
        conversion: 'Konwersiýa',
        visitors: 'Gelýänler',
      },
    },
    kpiCopy: {
      changeLabel: 'Maksatlaryň üýtgemegi',
      decrease: 'Bir bal azalt',
      increase: 'Bir bal artdyr',
      presets: 'Taýýar göterimler',
      summaryKeep: 'Maksatlar bolşy ýaly göçürilýär.',
      summaryUp: 'Her maksat {value}% artdyrylýar.',
      summaryDown: 'Her maksat {value}% azaldylýar.',
      rangeError: '{min} bilen {max} aralygynda, iň köp iki onluk belgili göterim ýazyň.',
      roundingNote:
        'Pul we san maksatlary bitin sana tegelekleýär; göterim maksatlary 100-den geçmeýär. Maksady boş setirler boş galýar.',
      previewTitle: 'Öňünden görmek',
      previewTargets: '{items} KPI-dan {targets}-synyň maksady bar',
      previewLoading: 'Öňünden görnüş ýüklenýär…',
      previewError: 'Öňünden görnüş ýüklenmedi; göçürmek barybir işleýär.',
      noTarget: 'Maksat ýok, boş galýar',
      noDefaultTargets: 'Bu şablonda deslapky maksat ýok, nusgada hem bolmaz.',
      capped: 'iň köp 100%',
      weight: 'Agram {value}',
      templateTitle: 'Şablony nusgala',
      templatesTitle: '{count} şablony nusgala',
      templateSource: '“{name}” ähli KPI-lary bilen täze şablon hökmünde nusgalanýar.',
      nameLabel: 'Täze şablonyň ady',
      nameHint: 'Boş goýsaňyz, indiki belgi goşulýar, mysal üçin “{name}”.',
      namePlaceholder: 'Awtomatik',
      templatesList: 'Nusgalanjak şablonlar',
      moreTemplates: 'ýene {count}',
      templatesNameHint: 'Her nusganyň adyna “(2)” ýaly indiki belgi goşulýar.',
      copyTemplate: 'Nusgala',
      copyTemplates: '{count} şablony nusgala',
      copying: 'Göçürilýär…',
      plansTitle: 'Meýilnamalary göçür',
      sourceLabel: 'Nireden',
      targetLabel: 'Nirä',
      sampleTitle: 'Mysal meýilnama',
      sourceEmpty: 'Saýlanan döwürde göçüriljek meýilnama ýok.',
      samplePosition: '{index} / {total}',
      previousSample: 'Öňki mysal',
      nextSample: 'Indiki mysal',
      skipNote:
        'Bu döwürde meýilnamasy bar, işjeň däl ýa-da Tiger baglanyşygy ýok işgärler geçilýär.',
      copyPlans: 'Meýilnamalary göçür',
      changedUp: 'Maksatlar {value}% artdyryldy.',
      changedDown: 'Maksatlar {value}% azaldyldy.',
    },
    errors: {
      generic: 'Garaşylmadyk ýalňyşlyk ýüze çykdy. Gaýtadan synanyşyň.',
      network: 'Serwere birikmek başartmady. Internet baglanyşygyňyzy barlaň.',
      validation: 'Girizen maglumatlaryňyzy barlaň.',
      unauthorized: 'Sessiýaňyz tamamlandy. Gaýtadan giriň.',
      forbidden: 'Bu amaly ýerine ýetirmäge hukugyňyz ýok.',
      notFound: 'Talap edilen ýazgy tapylmady.',
      conflict: 'Bu maglumatlar başga bir ýazgy bilen gabat gelýär.',
      payloadTooLarge: 'Saýlanan faýl rugsat berlen ölçegden uly.',
      tooManyRequests: 'Gaty köp synanyşyk edildi. Biraz garaşyň.',
      tooManyRequestsWait:
        'Gaty köp ýalňyş synanyşyk edildi. {minutes} minutdan soň gaýtadan synanyşyň.',
      server: 'Serwerde ýalňyşlyk ýüze çykdy. Soňrak gaýtadan synanyşyň.',
    },
  },
};
