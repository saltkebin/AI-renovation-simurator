import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

// 1. Define the shape of the context data and the available views
export type AppView = 'menu' | 'main' | 'database' | 'quotation' | 'tenant-settings' | 'item-masters' | 'templates' | 'email-settings' | 'sales-chatbot';

interface IAppContext {
  appView: AppView;
  previousAppView: AppView;
  navigate: (view: AppView, from?: AppView) => void;
  goBack: () => void;
}

// 2. Create the context
const AppContext = createContext<IAppContext | null>(null);

// 3. Create the Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appView, setAppView] = useState<AppView>('menu');
  const [previousAppView, setPreviousAppView] = useState<AppView>('menu');

  const navigate = useCallback((view: AppView, from?: AppView) => {
    if (from) {
      setPreviousAppView(from);
    } else {
      setPreviousAppView(appView);
    }
    setAppView(view);
  }, [appView]);

  const goBack = useCallback(() => {
    setAppView(previousAppView);
  }, [previousAppView]);

  const value = {
    appView,
    previousAppView,
    navigate,
    goBack,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 4. Create a custom hook for easy consumption
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
