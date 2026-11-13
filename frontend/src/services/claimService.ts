import api from './api';
import { Claim } from '../types';

export const claimService = {
  async createClaim(data: {
    itemId: string;
    claimDescription: string;
    identifyingCharacteristics: string;
    supportingEvidence?: string;
  }) {
    const res = await api.post('/claims', data);
    return res.data.data as Claim;
  },

  async getClaims(params: { claimantId?: string; itemId?: string; status?: string } = {}) {
    const query = new URLSearchParams();
    if (params.claimantId) query.append('claimantId', params.claimantId);
    if (params.itemId) query.append('itemId', params.itemId);
    if (params.status) query.append('status', params.status);

    const res = await api.get(`/claims?${query.toString()}`);
    return res.data.data as Claim[];
  },

  async getClaimById(id: string) {
    const res = await api.get(`/claims/${id}`);
    return res.data.data as Claim;
  },

  async reviewClaim(id: string, data: {
    status: 'APPROVED' | 'REJECTED' | 'ADDITIONAL_INFORMATION_REQUIRED' | 'UNDER_REVIEW';
    rejectionReason?: string;
    verificationNotes?: string;
  }) {
    const res = await api.patch(`/claims/${id}/review`, data);
    return res.data.data as Claim;
  },
};
