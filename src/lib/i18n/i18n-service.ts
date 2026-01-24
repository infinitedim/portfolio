import {
  getLocaleConfig,
  isRegionalVariant,
  getFallbackLocale,
  getSupportedLocales,
  isValidLocale,
  DEFAULT_LOCALE,
  type LocaleConfig,
} from "./locales";

export interface TranslationKeys {
  welcome: string;
  loading: string;
  error: string;
  success: string;
  cancel: string;
  confirm: string;
  save: string;
  delete: string;
  edit: string;
  add: string;
  search: string;
  filter: string;
  sort: string;
  refresh: string;
  close: string;
  back: string;
  next: string;
  previous: string;
  submit: string;
  reset: string;

  home: string;
  about: string;
  projects: string;
  skills: string;
  contact: string;
  resume: string;
  blog: string;
  settings: string;

  commandNotFound: string;
  commandHelp: string;
  commandUsage: string;
  commandExamples: string;
  commandAliases: string;
  commandEdit: string;
  commandRefresh: string;
  commandClear: string;

  languageChanged: string;
  languageNotSupported: string;
  languageFallback: string;
  currentLanguage: string;
  availableLanguages: string;

  terminalWelcome: string;
  terminalPrompt: string;
  terminalReady: string;
  terminalBusy: string;
  terminalError: string;

  skillsOverview: string;
  skillsProgress: string;
  skillsCompleted: string;
  skillsInProgress: string;
  skillsNotStarted: string;
  skillsTotal: string;
  skillsCategory: string;
  skillsSearch: string;
  skillsUpdate: string;
  skillsSync: string;

  projectsTitle: string;
  projectsDescription: string;
  projectsTechnologies: string;
  projectsDemo: string;
  projectsSource: string;
  projectsLive: string;
  projectsFeatured: string;

  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactSocial: string;
  contactForm: string;
  contactSend: string;

  themeChanged: string;
  themeCustom: string;
  themePreset: string;
  themeColors: string;
  themeFonts: string;
  themeExport: string;
  themeImport: string;

  helpTitle: string;
  helpCommands: string;
  helpExamples: string;
  helpShortcuts: string;
  helpTips: string;

  adminTitle: string;
  adminDashboard: string;
  adminOverview: string;
  adminPerformance: string;
  adminLogs: string;
  adminBlogEditor: string;
  adminBackendTesting: string;
  adminSettings: string;
  adminNavigation: string;
  adminAvailableCommands: string;
  adminSystemStatus: string;
  adminQuickCommands: string;
  adminLogout: string;

  adminSystem: string;
  adminUptime: string;
  adminLoad: string;
  adminProcesses: string;
  adminCPU: string;
  adminMemory: string;
  adminDisk: string;
  adminNetwork: string;
  adminTime: string;
  adminOnline: string;
  adminOffline: string;

  blogNewPost: string;
  blogUntitled: string;
  blogTitle: string;
  blogContent: string;
  blogSummary: string;
  blogTags: string;
  blogAddTag: string;
  blogPreview: string;
  blogPublish: string;
  blogSaveDraft: string;
  blogLastSaved: string;
  blogSaving: string;
  blogDrafts: string;
  blogPublished: string;
  blogUnpublished: string;

  testingTitle: string;
  testingSelectService: string;
  testingSelectMethod: string;
  testingParameters: string;
  testingExecute: string;
  testingRequest: string;
  testingResponse: string;
  testingLoading: string;
  testingSuccess: string;
  testingError: string;
  testingClear: string;

  performanceTitle: string;
  performanceCPU: string;
  performanceMemory: string;
  performanceDisk: string;
  performanceNetwork: string;
  performanceLatency: string;
  performanceRequests: string;
  performanceErrors: string;
  performanceUptime: string;

  logsTitle: string;
  logsLevel: string;
  logsTimestamp: string;
  logsMessage: string;
  logsClear: string;
  logsFilter: string;
  logsAll: string;
  logsInfo: string;
  logsWarning: string;
  logsErrorLevel: string;
  logsDebug: string;
}

const translations: Record<string, TranslationKeys> = {
  en_US: {
    welcome: "Welcome",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    refresh: "Refresh",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    submit: "Submit",
    reset: "Reset",

    home: "Home",
    about: "About",
    projects: "Projects",
    skills: "Skills",
    contact: "Contact",
    resume: "Resume",
    blog: "Blog",
    settings: "Settings",

    commandNotFound: "Command not found",
    commandHelp: "Help",
    commandUsage: "Usage",
    commandExamples: "Examples",
    commandAliases: "Aliases",
    commandEdit: "Edit",
    commandRefresh: "Refresh",
    commandClear: "Clear",

    languageChanged: "Language changed successfully",
    languageNotSupported: "Language not supported",
    languageFallback: "Language will be changed to",
    currentLanguage: "Current language",
    availableLanguages: "Available languages",

    terminalWelcome: "Welcome to the terminal",
    terminalPrompt: "Enter a command",
    terminalReady: "Ready",
    terminalBusy: "Processing...",
    terminalError: "An error occurred",

    skillsOverview: "Skills Overview",
    skillsProgress: "Progress",
    skillsCompleted: "Completed",
    skillsInProgress: "In Progress",
    skillsNotStarted: "Not Started",
    skillsTotal: "Total",
    skillsCategory: "Category",
    skillsSearch: "Search Skills",
    skillsUpdate: "Update Skill",
    skillsSync: "Sync Skills",

    projectsTitle: "Projects",
    projectsDescription: "Description",
    projectsTechnologies: "Technologies",
    projectsDemo: "Demo",
    projectsSource: "Source",
    projectsLive: "Live",
    projectsFeatured: "Featured",

    contactTitle: "Contact",
    contactEmail: "Email",
    contactPhone: "Phone",
    contactAddress: "Address",
    contactSocial: "Social Media",
    contactForm: "Contact Form",
    contactSend: "Send Message",

    themeChanged: "Theme changed",
    themeCustom: "Custom Theme",
    themePreset: "Preset Themes",
    themeColors: "Colors",
    themeFonts: "Fonts",
    themeExport: "Export Theme",
    themeImport: "Import Theme",

    helpTitle: "Help",
    helpCommands: "Commands",
    helpExamples: "Examples",
    helpShortcuts: "Shortcuts",
    helpTips: "Tips",

    adminTitle: "Admin Panel",
    adminDashboard: "Dashboard",
    adminOverview: "Overview",
    adminPerformance: "Performance",
    adminLogs: "Logs",
    adminBlogEditor: "Blog Editor",
    adminBackendTesting: "Backend Testing",
    adminSettings: "Settings",
    adminNavigation: "Navigation",
    adminAvailableCommands: "Available commands",
    adminSystemStatus: "System Status",
    adminQuickCommands: "Quick Commands",
    adminLogout: "Logout",

    adminSystem: "System",
    adminUptime: "Uptime",
    adminLoad: "Load",
    adminProcesses: "Processes",
    adminCPU: "CPU",
    adminMemory: "MEM",
    adminDisk: "DISK",
    adminNetwork: "NET",
    adminTime: "Time",
    adminOnline: "ONLINE",
    adminOffline: "OFFLINE",

    blogNewPost: "New Post",
    blogUntitled: "Untitled Post",
    blogTitle: "Title",
    blogContent: "Content",
    blogSummary: "Summary",
    blogTags: "Tags",
    blogAddTag: "Add Tag",
    blogPreview: "Preview",
    blogPublish: "Publish",
    blogSaveDraft: "Save Draft",
    blogLastSaved: "Last saved",
    blogSaving: "Saving...",
    blogDrafts: "Drafts",
    blogPublished: "Published",
    blogUnpublished: "Unpublished",

    testingTitle: "Backend Testing",
    testingSelectService: "Select Service",
    testingSelectMethod: "Select Method",
    testingParameters: "Parameters",
    testingExecute: "Execute",
    testingRequest: "Request",
    testingResponse: "Response",
    testingLoading: "Loading...",
    testingSuccess: "Success",
    testingError: "Error",
    testingClear: "Clear",

    performanceTitle: "Performance Monitor",
    performanceCPU: "CPU Usage",
    performanceMemory: "Memory Usage",
    performanceDisk: "Disk Usage",
    performanceNetwork: "Network",
    performanceLatency: "Latency",
    performanceRequests: "Requests",
    performanceErrors: "Errors",
    performanceUptime: "Uptime",

    logsTitle: "System Logs",
    logsLevel: "Level",
    logsTimestamp: "Timestamp",
    logsMessage: "Message",
    logsClear: "Clear Logs",
    logsFilter: "Filter",
    logsAll: "All",
    logsInfo: "Info",
    logsWarning: "Warning",
    logsErrorLevel: "Error",
    logsDebug: "Debug",
  },

  id_ID: {
    welcome: "Selamat Datang",
    loading: "Memuat...",
    error: "Kesalahan",
    success: "Berhasil",
    cancel: "Batal",
    confirm: "Konfirmasi",
    save: "Simpan",
    delete: "Hapus",
    edit: "Edit",
    add: "Tambah",
    search: "Cari",
    filter: "Filter",
    sort: "Urutkan",
    refresh: "Segarkan",
    close: "Tutup",
    back: "Kembali",
    next: "Selanjutnya",
    previous: "Sebelumnya",
    submit: "Kirim",
    reset: "Reset",

    home: "Beranda",
    about: "Tentang",
    projects: "Proyek",
    skills: "Keahlian",
    contact: "Kontak",
    resume: "Resume",
    blog: "Blog",
    settings: "Pengaturan",

    commandNotFound: "Perintah tidak ditemukan",
    commandHelp: "Bantuan",
    commandUsage: "Penggunaan",
    commandExamples: "Contoh",
    commandAliases: "Alias",
    commandEdit: "Edit",
    commandRefresh: "Segarkan",
    commandClear: "Bersihkan",

    languageChanged: "Bahasa berhasil diubah",
    languageNotSupported: "Bahasa tidak didukung",
    languageFallback: "Bahasa akan diubah ke",
    currentLanguage: "Bahasa saat ini",
    availableLanguages: "Bahasa yang tersedia",

    terminalWelcome: "Selamat datang di terminal",
    terminalPrompt: "Masukkan perintah",
    terminalReady: "Siap",
    terminalBusy: "Memproses...",
    terminalError: "Terjadi kesalahan",

    skillsOverview: "Ringkasan Keahlian",
    skillsProgress: "Progress",
    skillsCompleted: "Selesai",
    skillsInProgress: "Sedang Berlangsung",
    skillsNotStarted: "Belum Dimulai",
    skillsTotal: "Total",
    skillsCategory: "Kategori",
    skillsSearch: "Cari Keahlian",
    skillsUpdate: "Perbarui Keahlian",
    skillsSync: "Sinkronisasi Keahlian",

    projectsTitle: "Proyek",
    projectsDescription: "Deskripsi",
    projectsTechnologies: "Teknologi",
    projectsDemo: "Demo",
    projectsSource: "Sumber",
    projectsLive: "Live",
    projectsFeatured: "Unggulan",

    contactTitle: "Kontak",
    contactEmail: "Email",
    contactPhone: "Telepon",
    contactAddress: "Alamat",
    contactSocial: "Media Sosial",
    contactForm: "Formulir Kontak",
    contactSend: "Kirim Pesan",

    themeChanged: "Tema berubah",
    themeCustom: "Tema Kustom",
    themePreset: "Tema Preset",
    themeColors: "Warna",
    themeFonts: "Font",
    themeExport: "Ekspor Tema",
    themeImport: "Impor Tema",

    helpTitle: "Bantuan",
    helpCommands: "Perintah",
    helpExamples: "Contoh",
    helpShortcuts: "Shortcut",
    helpTips: "Tips",

    adminTitle: "Panel Admin",
    adminDashboard: "Dasbor",
    adminOverview: "Ringkasan",
    adminPerformance: "Performa",
    adminLogs: "Log",
    adminBlogEditor: "Editor Blog",
    adminBackendTesting: "Pengujian Backend",
    adminSettings: "Pengaturan",
    adminNavigation: "Navigasi",
    adminAvailableCommands: "Perintah tersedia",
    adminSystemStatus: "Status Sistem",
    adminQuickCommands: "Perintah Cepat",
    adminLogout: "Keluar",

    adminSystem: "Sistem",
    adminUptime: "Waktu Aktif",
    adminLoad: "Beban",
    adminProcesses: "Proses",
    adminCPU: "CPU",
    adminMemory: "MEM",
    adminDisk: "DISK",
    adminNetwork: "NET",
    adminTime: "Waktu",
    adminOnline: "ONLINE",
    adminOffline: "OFFLINE",

    blogNewPost: "Post Baru",
    blogUntitled: "Post Tanpa Judul",
    blogTitle: "Judul",
    blogContent: "Konten",
    blogSummary: "Ringkasan",
    blogTags: "Tag",
    blogAddTag: "Tambah Tag",
    blogPreview: "Pratinjau",
    blogPublish: "Publikasikan",
    blogSaveDraft: "Simpan Draft",
    blogLastSaved: "Terakhir disimpan",
    blogSaving: "Menyimpan...",
    blogDrafts: "Draft",
    blogPublished: "Dipublikasikan",
    blogUnpublished: "Belum Dipublikasikan",

    testingTitle: "Pengujian Backend",
    testingSelectService: "Pilih Layanan",
    testingSelectMethod: "Pilih Metode",
    testingParameters: "Parameter",
    testingExecute: "Jalankan",
    testingRequest: "Permintaan",
    testingResponse: "Respons",
    testingLoading: "Memuat...",
    testingSuccess: "Berhasil",
    testingError: "Kesalahan",
    testingClear: "Hapus",

    performanceTitle: "Monitor Performa",
    performanceCPU: "Penggunaan CPU",
    performanceMemory: "Penggunaan Memori",
    performanceDisk: "Penggunaan Disk",
    performanceNetwork: "Jaringan",
    performanceLatency: "Latensi",
    performanceRequests: "Permintaan",
    performanceErrors: "Kesalahan",
    performanceUptime: "Waktu Aktif",

    logsTitle: "Log Sistem",
    logsLevel: "Level",
    logsTimestamp: "Waktu",
    logsMessage: "Pesan",
    logsClear: "Hapus Log",
    logsFilter: "Filter",
    logsAll: "Semua",
    logsInfo: "Info",
    logsWarning: "Peringatan",
    logsErrorLevel: "Kesalahan",
    logsDebug: "Debug",
  },

  es_ES: {
    welcome: "Bienvenido",
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    add: "Agregar",
    search: "Buscar",
    filter: "Filtrar",
    sort: "Ordenar",
    refresh: "Actualizar",
    close: "Cerrar",
    back: "Atrás",
    next: "Siguiente",
    previous: "Anterior",
    submit: "Enviar",
    reset: "Restablecer",

    home: "Inicio",
    about: "Acerca de",
    projects: "Proyectos",
    skills: "Habilidades",
    contact: "Contacto",
    resume: "Currículum",
    blog: "Blog",
    settings: "Configuración",

    commandNotFound: "Comando no encontrado",
    commandHelp: "Ayuda",
    commandUsage: "Uso",
    commandExamples: "Ejemplos",
    commandAliases: "Alias",
    commandEdit: "Editar",
    commandRefresh: "Actualizar",
    commandClear: "Limpiar",

    languageChanged: "Idioma cambiado exitosamente",
    languageNotSupported: "Idioma no soportado",
    languageFallback: "El idioma se cambiará a",
    currentLanguage: "Idioma actual",
    availableLanguages: "Idiomas disponibles",

    terminalWelcome: "Bienvenido al terminal",
    terminalPrompt: "Ingrese un comando",
    terminalReady: "Listo",
    terminalBusy: "Procesando...",
    terminalError: "Ocurrió un error",

    skillsOverview: "Resumen de Habilidades",
    skillsProgress: "Progreso",
    skillsCompleted: "Completado",
    skillsInProgress: "En Progreso",
    skillsNotStarted: "No Iniciado",
    skillsTotal: "Total",
    skillsCategory: "Categoría",
    skillsSearch: "Buscar Habilidades",
    skillsUpdate: "Actualizar Habilidad",
    skillsSync: "Sincronizar Habilidades",

    projectsTitle: "Proyectos",
    projectsDescription: "Descripción",
    projectsTechnologies: "Tecnologías",
    projectsDemo: "Demo",
    projectsSource: "Código",
    projectsLive: "En Vivo",
    projectsFeatured: "Destacado",

    contactTitle: "Contacto",
    contactEmail: "Correo",
    contactPhone: "Teléfono",
    contactAddress: "Dirección",
    contactSocial: "Redes Sociales",
    contactForm: "Formulario de Contacto",
    contactSend: "Enviar Mensaje",

    themeChanged: "Tema cambiado",
    themeCustom: "Tema Personalizado",
    themePreset: "Temas Preestablecidos",
    themeColors: "Colores",
    themeFonts: "Fuentes",
    themeExport: "Exportar Tema",
    themeImport: "Importar Tema",

    helpTitle: "Ayuda",
    helpCommands: "Comandos",
    helpExamples: "Ejemplos",
    helpShortcuts: "Atajos",
    helpTips: "Consejos",

    adminTitle: "Panel de Admin",
    adminDashboard: "Panel de Control",
    adminOverview: "Vista General",
    adminPerformance: "Rendimiento",
    adminLogs: "Registros",
    adminBlogEditor: "Editor de Blog",
    adminBackendTesting: "Pruebas de Backend",
    adminSettings: "Configuración",
    adminNavigation: "Navegación",
    adminAvailableCommands: "Comandos disponibles",
    adminSystemStatus: "Estado del Sistema",
    adminQuickCommands: "Comandos Rápidos",
    adminLogout: "Cerrar Sesión",

    adminSystem: "Sistema",
    adminUptime: "Tiempo Activo",
    adminLoad: "Carga",
    adminProcesses: "Procesos",
    adminCPU: "CPU",
    adminMemory: "MEM",
    adminDisk: "DISCO",
    adminNetwork: "RED",
    adminTime: "Hora",
    adminOnline: "EN LÍNEA",
    adminOffline: "FUERA DE LÍNEA",

    blogNewPost: "Nueva Entrada",
    blogUntitled: "Entrada Sin Título",
    blogTitle: "Título",
    blogContent: "Contenido",
    blogSummary: "Resumen",
    blogTags: "Etiquetas",
    blogAddTag: "Agregar Etiqueta",
    blogPreview: "Vista Previa",
    blogPublish: "Publicar",
    blogSaveDraft: "Guardar Borrador",
    blogLastSaved: "Último guardado",
    blogSaving: "Guardando...",
    blogDrafts: "Borradores",
    blogPublished: "Publicado",
    blogUnpublished: "No Publicado",

    testingTitle: "Pruebas de Backend",
    testingSelectService: "Seleccionar Servicio",
    testingSelectMethod: "Seleccionar Método",
    testingParameters: "Parámetros",
    testingExecute: "Ejecutar",
    testingRequest: "Solicitud",
    testingResponse: "Respuesta",
    testingLoading: "Cargando...",
    testingSuccess: "Éxito",
    testingError: "Error",
    testingClear: "Limpiar",

    performanceTitle: "Monitor de Rendimiento",
    performanceCPU: "Uso de CPU",
    performanceMemory: "Uso de Memoria",
    performanceDisk: "Uso de Disco",
    performanceNetwork: "Red",
    performanceLatency: "Latencia",
    performanceRequests: "Solicitudes",
    performanceErrors: "Errores",
    performanceUptime: "Tiempo Activo",

    logsTitle: "Registros del Sistema",
    logsLevel: "Nivel",
    logsTimestamp: "Fecha/Hora",
    logsMessage: "Mensaje",
    logsClear: "Limpiar Registros",
    logsFilter: "Filtrar",
    logsAll: "Todos",
    logsInfo: "Info",
    logsWarning: "Advertencia",
    logsErrorLevel: "Error",
    logsDebug: "Depuración",
  },
};

export class I18nService {
  private static instance: I18nService;
  private currentLocale: string = DEFAULT_LOCALE;
  private listeners: Set<(locale: string) => void> = new Set();

  private constructor() {
    if (typeof window !== "undefined") {
      const savedLocale = localStorage.getItem("portfolio_locale");
      if (savedLocale && isValidLocale(savedLocale)) {
        this.currentLocale = savedLocale;
      }
    }
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  public getCurrentLocale(): string {
    return this.currentLocale;
  }

  public getCurrentLocaleConfig(): LocaleConfig | null {
    return getLocaleConfig(this.currentLocale);
  }

  public setLocale(localeCode: string): boolean {
    const normalizedCode = localeCode.replace("-", "_");

    if (!isValidLocale(normalizedCode)) {
      return false;
    }

    if (isRegionalVariant(normalizedCode)) {
      const fallbackLocale = getFallbackLocale(normalizedCode);
      this.currentLocale = fallbackLocale;
    } else {
      this.currentLocale = normalizedCode;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("portfolio_locale", this.currentLocale);
    }

    this.notifyListeners();

    return true;
  }

  public t(key: keyof TranslationKeys): string {
    const locale = this.currentLocale;
    const translation = translations[locale] || translations[DEFAULT_LOCALE];
    return translation[key] || key;
  }

  public tWithFallback(key: keyof TranslationKeys, fallback?: string): string {
    const translation = this.t(key);
    return translation !== key ? translation : fallback || key;
  }

  public subscribe(listener: (locale: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentLocale);
      } catch (error) {
        console.error("Error in i18n listener:", error);
      }
    });
  }

  public getSupportedLocales(): LocaleConfig[] {
    return getSupportedLocales();
  }

  public isLocaleSupported(localeCode: string): boolean {
    return isValidLocale(localeCode);
  }

  public getLocaleInfo(localeCode: string): LocaleConfig | null {
    return getLocaleConfig(localeCode);
  }

  public isRTL(): boolean {
    const config = this.getCurrentLocaleConfig();
    return config?.direction === "rtl";
  }

  public getDocumentDirection(): "ltr" | "rtl" {
    return this.isRTL() ? "rtl" : "ltr";
  }

  public updateDocumentDirection(): void {
    if (typeof document !== "undefined") {
      document.documentElement.dir = this.getDocumentDirection();
      document.documentElement.lang = this.currentLocale;
    }
  }
}

export const i18n = I18nService.getInstance();

export const t = (key: keyof TranslationKeys): string => i18n.t(key);

export const tWithFallback = (
  key: keyof TranslationKeys,
  fallback?: string,
): string => i18n.tWithFallback(key, fallback);
