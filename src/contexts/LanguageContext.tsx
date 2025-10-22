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
    pt: 'Bem-vindo ao SermonPro!',
    en: 'Welcome to SermonPro!',
    es: '¡Bienvenido a SermonPro!'
  },
  welcomeSubtitle: {
    pt: 'Seu assistente completo para criação de sermões bíblicos',
    en: 'Your complete assistant for creating biblical sermons',
    es: 'Tu asistente completo para crear sermones bíblicos'
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
