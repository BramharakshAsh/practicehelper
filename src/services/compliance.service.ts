import { supabase } from './supabase';
import { ComplianceType } from '../types';

class ComplianceService {
  async getComplianceTypes(): Promise<ComplianceType[]> {
    const { data, error } = await supabase
      .from('compliance_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async createComplianceType(complianceType: Omit<ComplianceType, 'id' | 'firm_id' | 'created_at'>): Promise<ComplianceType> {
    const firmId = 'demo-firm-id'; // This should be dynamic based on authenticated user
    
    const { data, error } = await supabase
      .from('compliance_types')
      .insert([{ ...complianceType, firm_id: firmId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const complianceService = new ComplianceService();