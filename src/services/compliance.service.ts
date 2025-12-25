import { ComplianceType } from '../types';
import { LocalStorageService } from './local-storage.service';

const COMPLIANCE_TYPES_KEY = 'ca_practice_manager_compliance_types';

class ComplianceService {
  async getComplianceTypes(): Promise<ComplianceType[]> {
    return LocalStorageService.getItem<ComplianceType[]>(COMPLIANCE_TYPES_KEY, []);
  }

  async createComplianceType(type: Omit<ComplianceType, 'id' | 'created_at'>): Promise<ComplianceType> {
    const types = await this.getComplianceTypes();
    const newType: ComplianceType = {
      ...type,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    types.push(newType);
    LocalStorageService.setItem(COMPLIANCE_TYPES_KEY, types);
    return newType;
  }
}

export const complianceService = new ComplianceService();