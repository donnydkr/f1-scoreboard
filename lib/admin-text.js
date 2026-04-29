export const adminText = {
  shell: {
    eyebrow: "Scoreboard invoerscherm",
    title: "Race tijden invoeren",
  },
  loginPage: {
    eyebrow: "Admin login",
    title: "F1-Scoreboard",
    intro: "",
    backToScoreboard: "Terug naar scoreboard"
  },
  loginForm: {
    accessCodeLabel: "Access code",
    accessCodePlaceholder: "Voer de admin code in",
    loginError: "Login mislukt.",
    submitting: "Bezig...",
    submit: "Inloggen"
  },
  page: {
    openPublicScoreboard: "Open Scoreboard",
    openAdminPage: "Open Invoerscherm",
    logout: "Uitloggen",
    newLapTitle: "Nieuwe tijd invoeren",
    recentTimesTitle: "Recente tijden"
  },
  lapForm: {
    driverLabel: "Coureur",
    driverPlaceholder: "Kies een Coureur",
    emptyDrivers: "Nog geen coureurs beschikbaar.",
    circuitLabel: "Circuit",
    circuitPlaceholder: "Kies een circuit",
    lapTimeLabel: "Lap time",
    lapTimePlaceholder: "Tik cijfers, bv. 123456",
    setupLabel: "Setup",
    sessionDateLabel: "Session date",
    isWetLabel: "Weer",
    createDriver: "Creëer een Coureur",
    newDriverPlaceholder: "Naam Coureur",
    saveDriver: "Opslaan",
    cancelDriver: "Annuleer",
    addDriverEmptyError: "Vul eerst een Coureur in.",
    addDriverError: "Coureur aanmaken mislukt.",
    addDriverSuccess: 'Coureur "{name}" toegevoegd.',
    confirmDeleteDriver: 'Weet je zeker dat je "{name}" en al zijn tijden wilt verwijderen?',
    deleteDriver: "Verwijder Coureur",
    deleteDriverAria: 'Verwijder Coureur "{name}" en al zijn tijden',
    deleteDriverError: "Coureur verwijderen mislukt.",
    deleteDriverSuccess: 'Coureur "{name}" verwijderd.',
    saveError: "Opslaan mislukt.",
    saveSkipped: "Niet opgeslagen.",
    saveSuccess: "Rondetijd opgeslagen.",
    submitting: "Opslaan...",
    submit: "Tijd opslaan",
    seatLabel: "Stoel selectie"
  },
  trackList: {
    allCircuits: "Alle circuits",
    filterLabel: "Circuit:",
    fastestLapLabel: "Snelste ronde",
    emptyMessage: "Nog geen tijden beschikbaar voor dit circuit."
  },
  recentTimesList: {
    confirmDelete: "Weet je zeker dat je deze tijd wilt verwijderen?",
    deleteError: "Verwijderen mislukt.",
    deleteSuccess: "Tijd verwijderd.",
    emptyMessage: "Nog geen tijden beschikbaar.",
    deleting: "Bezig...",
    delete: "Verwijder"
  },
  api: {
    unauthorized: "Niet geautoriseerd.",
    loginNotConfigured: "Admin login is nog niet geconfigureerd in .env.",
    wrongAccessCode: "Onjuiste access code.",
    driverRequired: "Vul een Coureur in.",
    driverInvalidId: "Ongeldige Coureur-id.",
    driverNotFound: "Coureur niet gevonden.",
    driverCreateServerError: "Coureur aanmaken mislukt door een server- of databasefout.",
    driverDeleteServerError: "Coureur verwijderen mislukt door een server- of databasefout.",
    driverDeleted: "Coureur en tijden verwijderd.",
    lapTimeMissingFields: "Vul Coureur, circuit, lap time en session date in.",
    lapTimeFormatError: "Gebruik een tijd zoals 1:23.456 of 83.456.",
    lapTimeRangeError: "Gebruik een rondetijd tussen 30 seconden en 2 minuten.",
    lapTimeSkipped: "Niet opgeslagen: deze Coureur heeft op dit circuit al een snellere of gelijke tijd.",
    lapTimeReplaced: "Snellere tijd opgeslagen. De vorige tijd van deze Coureur op dit circuit is vervangen.",
    lapTimeSaved: "Rondetijd opgeslagen.",
    lapTimeServerError: "Opslaan mislukt door een server- of databasefout."
  }
};
