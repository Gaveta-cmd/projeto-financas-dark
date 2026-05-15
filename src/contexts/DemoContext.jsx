import { createContext, useContext, useState } from 'react';

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [isDemo, setIsDemo]           = useState(false);
  const [blockVisible, setBlockVisible] = useState(false);

  return (
    <DemoContext.Provider value={{
      isDemo,
      enterDemo:     () => setIsDemo(true),
      exitDemo:      () => setIsDemo(false),
      showDemoBlock: () => setBlockVisible(true),
      blockVisible,
      hideDemoBlock: () => setBlockVisible(false),
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoContext);
}
