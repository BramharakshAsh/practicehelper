import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { seedInitialData } from './services/seed.service';
import { DataMigrationService } from './services/data-migration.service';

// Check and migrate data if needed
const dataMigrated = DataMigrationService.checkAndMigrateData();

// Initialize local data for demo
seedInitialData();

if (dataMigrated) {
  console.log('✅ Data migration complete! Loaded fresh compliance types with hierarchical structure.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
