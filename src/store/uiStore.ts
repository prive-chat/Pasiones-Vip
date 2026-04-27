import { create } from 'zustand';
import { UserProfile } from '../types';

export type ModalType = 'upload' | 'stats' | 'ad' | 'broadcast' | 'confirm' | null;

interface UIStore {
  activeModal: ModalType;
  modalData: any;
  setActiveModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  profileCache: Record<string, UserProfile>;
  setProfileCache: (userId: string, profile: UserProfile) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeModal: null,
  modalData: null,
  setActiveModal: (type, data = null) => set({ activeModal: type, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  profileCache: {},
  setProfileCache: (userId, profile) => 
    set((state) => ({ 
      profileCache: { ...state.profileCache, [userId]: profile } 
    })),
}));
