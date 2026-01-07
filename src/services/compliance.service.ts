import { ComplianceType } from '../types';
import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';

class ComplianceService {
  async getComplianceTypes(): Promise<ComplianceType[]> {
    const firmId = useAuthStore.getState().user?.firm_id;

    const { data, error } = await supabase
      .from('compliance_types')
      .select('*')
      .or(`firm_id.is.null,firm_id.eq.${firmId || '00000000-0000-0000-0000-000000000000'}`)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createComplianceType(type: Omit<ComplianceType, 'id' | 'created_at'>): Promise<ComplianceType> {
    const firmId = useAuthStore.getState().user?.firm_id;
    if (!firmId) throw new Error('User not authenticated or missing firm ID');

    const { data, error } = await supabase
      .from('compliance_types')
      .insert({
        ...type,
        firm_id: firmId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const complianceService = new ComplianceService();