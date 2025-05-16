/**
 * Configurazione Jest per TypeScript
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Modifica la trasformazione per usare ts-jest per i file TS/TSX
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
      isolatedModules: true
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Configura i moduli mock
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  transformIgnorePatterns: [
    '/node_modules/(?!(@genkit-ai|react-icons)/)'
  ],
  
  // Ottimizzazione
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  
  // Verbosità
  verbose: true
};