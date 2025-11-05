import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'pt' | 'en' | 'es';

interface Translations {
  [key: string]: {
    pt: string;
    en: string;
    es: string;
  };
}

const translations: Translations = {
  // Welcome
  welcome: {
    pt: 'Bem-vindo ao App do Pregador',
    en: 'Welcome to the Preacher App',
    es: 'Bienvenido a la App del Predicador'
  },
  welcomeSubtitle: {
    pt: 'Seu assistente completo para criação de sermões bíblicos',
    en: 'Your complete assistant for creating biblical sermons',
    es: 'Tu asistente completo para crear sermones bíblicos'
  },
  chooseLanguage: {
    pt: 'Clique abaixo e escolha o melhor idioma para você',
    en: 'Click below and choose the best language for you',
    es: 'Haz clic abajo y elige el mejor idioma para ti'
  },
  // Menu items
  mainMenu: {
    pt: 'Menu Principal',
    en: 'Main Menu',
    es: 'Menú Principal'
  },
  createSermon: {
    pt: 'Crie seu novo sermão',
    en: 'Create your new sermon',
    es: 'Crea tu nuevo sermón'
  },
  bibleTranslator: {
    pt: 'Tradutor Bíblico',
    en: 'Bible Translator',
    es: 'Traductor Bíblico'
  },
  bibleStudies: {
    pt: 'Estudos Bíblicos',
    en: 'Bible Studies',
    es: 'Estudios Bíblicos'
  },
  bibleDictionaries: {
    pt: 'Dicionários Bíblicos',
    en: 'Bible Dictionaries',
    es: 'Diccionarios Bíblicos'
  },
  studyBibles: {
    pt: 'Bíblias de Estudo',
    en: 'Study Bibles',
    es: 'Biblias de Estudio'
  },
  // PWA
  installApp: {
    pt: 'Instale o App no seu Celular',
    en: 'Install App on your Phone',
    es: 'Instala la App en tu Celular'
  },
  installAndroid: {
    pt: 'Instalar no Android',
    en: 'Install on Android',
    es: 'Instalar en Android'
  },
  installIPhone: {
    pt: 'Como Instalar no iPhone',
    en: 'How to Install on iPhone',
    es: 'Cómo Instalar en iPhone'
  },
  // Language
  selectLanguage: {
    pt: 'Selecione o Idioma',
    en: 'Select Language',
    es: 'Seleccionar Idioma'
  },
  // Sermon Form
  sermonTheme: {
    pt: 'Tema do Sermão',
    en: 'Sermon Theme',
    es: 'Tema del Sermón'
  },
  baseVerse: {
    pt: 'Versículo Base (Opcional)',
    en: 'Base Verse (Optional)',
    es: 'Versículo Base (Opcional)'
  },
  sermonTime: {
    pt: 'Tempo do Sermão',
    en: 'Sermon Time',
    es: 'Tiempo del Sermón'
  },
  generateSermon: {
    pt: 'Gerar Sermão',
    en: 'Generate Sermon',
    es: 'Generar Sermón'
  },
  generating: {
    pt: 'Gerando Sermão...',
    en: 'Generating Sermon...',
    es: 'Generando Sermón...'
  },
  // Actions
  home: {
    pt: 'Início',
    en: 'Home',
    es: 'Inicio'
  },
  copy: {
    pt: 'Copiar',
    en: 'Copy',
    es: 'Copiar'
  },
  copied: {
    pt: 'Copiado!',
    en: 'Copied!',
    es: '¡Copiado!'
  },
  download: {
    pt: 'Baixar',
    en: 'Download',
    es: 'Descargar'
  },
  downloadPDF: {
    pt: 'Baixar PDF',
    en: 'Download PDF',
    es: 'Descargar PDF'
  },
  yourSermon: {
    pt: 'Seu Sermão',
    en: 'Your Sermon',
    es: 'Tu Sermón'
  },
  // Translator
  wordOrName: {
    pt: 'Palavra ou Nome',
    en: 'Word or Name',
    es: 'Palabra o Nombre'
  },
  translate: {
    pt: 'Traduzir',
    en: 'Translate',
    es: 'Traducir'
  },
  translating: {
    pt: 'Traduzindo...',
    en: 'Translating...',
    es: 'Traduciendo...'
  },
  translationResult: {
    pt: 'Resultado da Tradução',
    en: 'Translation Result',
    es: 'Resultado de la Traducción'
  },
  hebrew: {
    pt: 'Hebraico',
    en: 'Hebrew',
    es: 'Hebreo'
  },
  greek: {
    pt: 'Grego',
    en: 'Greek',
    es: 'Griego'
  },
  aramaic: {
    pt: 'Aramaico',
    en: 'Aramaic',
    es: 'Arameo'
  },
  etymology: {
    pt: 'Etimologia',
    en: 'Etymology',
    es: 'Etimología'
  },
  wordHistory: {
    pt: 'História da Palavra',
    en: 'Word History',
    es: 'Historia de la Palabra'
  },
  // Resources
  accessResources: {
    pt: 'Acessar Recursos',
    en: 'Access Resources',
    es: 'Acceder a Recursos'
  },
  bibleStudiesDesc: {
    pt: 'Acesse uma coleção completa de estudos bíblicos para enriquecer suas pregações',
    en: 'Access a complete collection of Bible studies to enrich your preaching',
    es: 'Accede a una colección completa de estudios bíblicos para enriquecer tus predicaciones'
  },
  dictionariesDesc: {
    pt: 'Consulte dicionários bíblicos para aprofundar seu conhecimento teológico',
    en: 'Consult Bible dictionaries to deepen your theological knowledge',
    es: 'Consulta diccionarios bíblicos para profundizar tu conocimiento teológico'
  },
  studyBiblesDesc: {
    pt: 'Baixe diferentes versões de Bíblias de estudo para suas pesquisas',
    en: 'Download different versions of study Bibles for your research',
    es: 'Descarga diferentes versiones de Biblias de estudio para tus investigaciones'
  },
  recentSermons: {
    pt: 'Sermões Recentes',
    en: 'Recent Sermons',
    es: 'Sermones Recientes'
  },
  noSermons: {
    pt: 'Nenhum sermão criado ainda',
    en: 'No sermons created yet',
    es: 'Ningún sermón creado aún'
  },
  createFirstSermon: {
    pt: 'Crie seu primeiro sermão para começar!',
    en: 'Create your first sermon to get started!',
    es: '¡Crea tu primer sermón para empezar!'
  },
  fillDataBelow: {
    pt: 'Preencha os dados abaixo para gerar seu sermão',
    en: 'Fill in the data below to generate your sermon',
    es: 'Completa los datos a continuación para generar tu sermón'
  },
  mySermons: {
    pt: 'Seus Sermões Criados',
    en: 'Your Created Sermons',
    es: 'Tus Sermones Creados'
  },
  deleteSermon: {
    pt: 'Apagar',
    en: 'Delete',
    es: 'Eliminar'
  },
  noSavedSermons: {
    pt: 'Nenhum sermão salvo ainda',
    en: 'No saved sermons yet',
    es: 'Ningún sermón guardado aún'
  },
  verseSearch: {
    pt: 'Pesquisar Versículos',
    en: 'Search Bible Verses',
    es: 'Buscar Versículos'
  },
  searchWord: {
    pt: 'Digite uma palavra (ex: amor)',
    en: 'Enter a word (ex: love)',
    es: 'Escribe una palabra (ej: amor)'
  },
  search: {
    pt: 'Pesquisar',
    en: 'Search',
    es: 'Buscar'
  },
  searching: {
    pt: 'Pesquisando...',
    en: 'Searching...',
    es: 'Buscando...'
  },
  verseResults: {
    pt: 'Versículos e Referências',
    en: 'Verses and References',
    es: 'Versículos y Referencias'
  },
  copyAction: {
    pt: 'Copiar Texto',
    en: 'Copy Text',
    es: 'Copiar Texto'
  },
  downloadAction: {
    pt: 'Baixar TXT',
    en: 'Download TXT',
    es: 'Descargar TXT'
  },
  downloadPDFAction: {
    pt: 'Baixar PDF',
    en: 'Download PDF',
    es: 'Descargar PDF'
  },
  logout: {
    pt: 'Sair',
    en: 'Logout',
    es: 'Cerrar Sesión'
  },
  sermonsGallery: {
    pt: 'Galeria de Sermões',
    en: 'Sermons Gallery',
    es: 'Galería de Sermones'
  },
  saveToGallery: {
    pt: 'Salve na Galeria Publica e deixe Deus falar com alguém',
    en: 'Save to Public Gallery and let God speak to someone',
    es: 'Guarde en la Galería Pública y deje que Dios hable con alguien'
  },
  // Prayer Requests
  prayerRequests: {
    pt: 'Pedidos de Oração',
    en: 'Prayer Requests',
    es: 'Pedidos de Oración'
  },
  newPrayerRequest: {
    pt: 'Novo Pedido de Oração',
    en: 'New Prayer Request',
    es: 'Nueva Petición de Oración'
  },
  sharePrayerRequest: {
    pt: 'Compartilhe seu pedido de oração com a comunidade',
    en: 'Share your prayer request with the community',
    es: 'Comparte tu petición de oración con la comunidad'
  },
  sendAnonymously: {
    pt: 'Enviar anonimamente',
    en: 'Send anonymously',
    es: 'Enviar anónimamente'
  },
  yourName: {
    pt: 'Seu Nome',
    en: 'Your Name',
    es: 'Tu Nombre'
  },
  enterYourName: {
    pt: 'Digite seu nome',
    en: 'Enter your name',
    es: 'Escribe tu nombre'
  },
  prayerRequest: {
    pt: 'Pedido de Oração',
    en: 'Prayer Request',
    es: 'Petición de Oración'
  },
  writeYourRequest: {
    pt: 'Escreva seu pedido de oração...',
    en: 'Write your prayer request...',
    es: 'Escribe tu petición de oración...'
  },
  image: {
    pt: 'Imagem',
    en: 'Image',
    es: 'Imagen'
  },
  optional: {
    pt: 'opcional',
    en: 'optional',
    es: 'opcional'
  },
  remove: {
    pt: 'Remover',
    en: 'Remove',
    es: 'Eliminar'
  },
  sending: {
    pt: 'Enviando...',
    en: 'Sending...',
    es: 'Enviando...'
  },
  sendRequest: {
    pt: 'Enviar Pedido',
    en: 'Send Request',
    es: 'Enviar Petición'
  },
  success: {
    pt: 'Sucesso',
    en: 'Success',
    es: 'Éxito'
  },
  error: {
    pt: 'Erro',
    en: 'Error',
    es: 'Error'
  },
  fillAllFields: {
    pt: 'Por favor preencha todos os campos obrigatórios',
    en: 'Please fill all required fields',
    es: 'Por favor completa todos los campos obligatorios'
  },
  tryAgain: {
    pt: 'Algo deu errado. Tente novamente.',
    en: 'Something went wrong. Please try again.',
    es: 'Algo salió mal. Por favor intenta de nuevo.'
  },
  prayerRequestSent: {
    pt: 'Seu pedido de oração foi compartilhado',
    en: 'Your prayer request has been shared',
    es: 'Tu petición de oración ha sido compartida'
  },
  noPrayerRequests: {
    pt: 'Nenhum pedido de oração ainda. Seja o primeiro a compartilhar!',
    en: 'No prayer requests yet. Be the first to share!',
    es: '¡Aún no hay peticiones de oración. Sé el primero en compartir!'
  },
  anonymous: {
    pt: 'Anônimo',
    en: 'Anonymous',
    es: 'Anónimo'
  },
  confirmDelete: {
    pt: 'Confirmar Exclusão',
    en: 'Confirm Delete',
    es: 'Confirmar Eliminación'
  },
  confirmDeleteRequest: {
    pt: 'Tem certeza que deseja excluir este pedido de oração?',
    en: 'Are you sure you want to delete this prayer request?',
    es: '¿Estás seguro de que quieres eliminar esta petición de oración?'
  },
  cancel: {
    pt: 'Cancelar',
    en: 'Cancel',
    es: 'Cancelar'
  },
  delete: {
    pt: 'Excluir',
    en: 'Delete',
    es: 'Eliminar'
  },
  requestDeleted: {
    pt: 'Pedido de oração excluído',
    en: 'Prayer request deleted',
    es: 'Petición de oración eliminada'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && ['pt', 'en', 'es'].includes(saved)) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
