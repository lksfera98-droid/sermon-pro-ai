import React, { createContext, useContext, useState } from 'react';

type Language = 'pt';

interface Translations {
  [key: string]: {
    pt: string;
  };
}

const translations: Translations = {
  // Navigation
  backToList: {
    pt: 'Voltar para a Lista'
  },
  clickToView: {
    pt: 'Clique para ver'
  },
  // Welcome
  welcome: {
    pt: 'O App que foi criado para te aproximar de Deus'
  },
  welcomeSubtitle: {
    pt: 'Tudo o que você precisa para se conectar com a Palavra de DEUS'
  },
  chooseLanguage: {
    pt: 'Clique abaixo e escolha o melhor idioma para você'
  },
  // Menu items
  mainMenu: {
    pt: 'Menu Principal'
  },
  createSermon: {
    pt: 'Crie seu novo sermão'
  },
  bibleTranslator: {
    pt: 'Tradutor Bíblico'
  },
  bibleStudies: {
    pt: 'Estudos Bíblicos'
  },
  bibleDictionaries: {
    pt: 'Dicionários Bíblicos'
  },
  studyBibles: {
    pt: 'Bíblias de Estudo'
  },
  // PWA
  installApp: {
    pt: 'Instale o App no seu Celular'
  },
  installAndroid: {
    pt: 'Instalar no Android'
  },
  installIPhone: {
    pt: 'Como Instalar no iPhone'
  },
  // Language
  selectLanguage: {
    pt: 'Selecione o Idioma'
  },
  // Sermon Form
  sermonTheme: {
    pt: 'Tema do Sermão'
  },
  baseVerse: {
    pt: 'Versículo Base (Opcional)'
  },
  sermonTime: {
    pt: 'Tempo do Sermão'
  },
  generateSermon: {
    pt: 'Gerar Sermão'
  },
  generating: {
    pt: 'Gerando Sermão...'
  },
  // Actions
  home: {
    pt: 'Início'
  },
  copy: {
    pt: 'Copiar'
  },
  copied: {
    pt: 'Copiado!'
  },
  download: {
    pt: 'Baixar'
  },
  downloadPDF: {
    pt: 'Baixar PDF'
  },
  yourSermon: {
    pt: 'Seu Sermão'
  },
  // Translator
  wordOrName: {
    pt: 'Palavra ou Nome'
  },
  translate: {
    pt: 'Traduzir'
  },
  translating: {
    pt: 'Traduzindo...'
  },
  translationResult: {
    pt: 'Resultado da Tradução'
  },
  hebrew: {
    pt: 'Hebraico'
  },
  greek: {
    pt: 'Grego'
  },
  aramaic: {
    pt: 'Aramaico'
  },
  etymology: {
    pt: 'Etimologia'
  },
  wordHistory: {
    pt: 'História da Palavra'
  },
  // Resources
  accessResources: {
    pt: 'Acessar Recursos'
  },
  bibleStudiesDesc: {
    pt: 'Acesse uma coleção completa de estudos bíblicos para enriquecer suas pregações'
  },
  dictionariesDesc: {
    pt: 'Consulte dicionários bíblicos para aprofundar seu conhecimento teológico'
  },
  studyBiblesDesc: {
    pt: 'Baixe diferentes versões de Bíblias de estudo para suas pesquisas'
  },
  recentSermons: {
    pt: 'Sermões Recentes'
  },
  noSermons: {
    pt: 'Nenhum sermão criado ainda'
  },
  createFirstSermon: {
    pt: 'Crie seu primeiro sermão para começar!'
  },
  fillDataBelow: {
    pt: 'Preencha os dados abaixo para gerar seu sermão'
  },
  mySermons: {
    pt: 'Seus Sermões Criados'
  },
  deleteSermon: {
    pt: 'Apagar'
  },
  noSavedSermons: {
    pt: 'Nenhum sermão salvo ainda'
  },
  verseSearch: {
    pt: 'Pesquisar Versículos'
  },
  searchWord: {
    pt: 'Digite uma palavra (ex: amor)'
  },
  search: {
    pt: 'Pesquisar'
  },
  searching: {
    pt: 'Pesquisando...'
  },
  verseResults: {
    pt: 'Versículos e Referências'
  },
  copyAction: {
    pt: 'Copiar Texto'
  },
  downloadAction: {
    pt: 'Baixar TXT'
  },
  downloadPDFAction: {
    pt: 'Baixar PDF'
  },
  logout: {
    pt: 'Sair'
  },
  sermonsGallery: {
    pt: 'Galeria de Sermões'
  },
  saveToGallery: {
    pt: 'Salve na Galeria Publica e deixe Deus falar com alguém'
  },
  // Prayer Requests
  prayerRequests: {
    pt: 'Pedidos de Oração'
  },
  newPrayerRequest: {
    pt: 'Novo Pedido de Oração'
  },
  sharePrayerRequest: {
    pt: 'Compartilhe seu pedido de oração com a comunidade'
  },
  sendAnonymously: {
    pt: 'Enviar anonimamente'
  },
  yourName: {
    pt: 'Seu Nome'
  },
  enterYourName: {
    pt: 'Digite seu nome'
  },
  prayerRequest: {
    pt: 'Pedido de Oração'
  },
  writeYourRequest: {
    pt: 'Escreva seu pedido de oração...'
  },
  image: {
    pt: 'Imagem'
  },
  optional: {
    pt: 'opcional'
  },
  remove: {
    pt: 'Remover'
  },
  sending: {
    pt: 'Enviando...'
  },
  sendRequest: {
    pt: 'Enviar Pedido'
  },
  success: {
    pt: 'Sucesso'
  },
  error: {
    pt: 'Erro'
  },
  fillAllFields: {
    pt: 'Por favor preencha todos os campos obrigatórios'
  },
  tryAgain: {
    pt: 'Algo deu errado. Tente novamente.'
  },
  prayerRequestSent: {
    pt: 'Seu pedido de oração foi compartilhado'
  },
  noPrayerRequests: {
    pt: 'Nenhum pedido de oração ainda. Seja o primeiro a compartilhar!'
  },
  anonymous: {
    pt: 'Anônimo'
  },
  confirmDelete: {
    pt: 'Confirmar Exclusão'
  },
  confirmDeleteRequest: {
    pt: 'Tem certeza que deseja excluir este pedido de oração?'
  },
  cancel: {
    pt: 'Cancelar'
  },
  delete: {
    pt: 'Excluir'
  },
  requestDeleted: {
    pt: 'Pedido de oração excluído'
  },
  // Hear God Speak
  hearGodSpeak: {
    pt: 'Ouvir Deus Falar Comigo'
  },
  hearGodSpeakDesc: {
    pt: 'Receba um versículo especial e uma mensagem inspiradora de Deus'
  },
  hearGodSpeakBtn: {
    pt: 'Ouvir Deus Falar'
  },
  hearGodSpeakLoading: {
    pt: 'Preparando mensagem...'
  },
  hearGodSpeakTitle: {
    pt: 'Deus falou com você'
  },
  amen: {
    pt: 'Amém'
  },
  // Bible Study
  bibleStudy: {
    pt: 'Estudo Bíblico Profundo'
  },
  bibleStudySubtitle: {
    pt: 'Entenda a verdade completa sobre qualquer versículo'
  },
  // Image Upload
  tapToAddPhoto: {
    pt: 'Toque aqui para adicionar uma foto'
  },
  selectFromGallery: {
    pt: 'Selecione da galeria do seu celular'
  },
  photoWillBeVisible: {
    pt: 'A foto será visível para todos que orarem por você'
  },
  photoSelected: {
    pt: 'Foto selecionada'
  },
  removePhoto: {
    pt: 'Remover foto'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language] = useState<Language>('pt');

  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    console.warn(`Translation missing for key: ${key}`);
    return key;
  };

  const setLanguage = () => {
    // Language is fixed to Portuguese, no-op
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};