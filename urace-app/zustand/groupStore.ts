import { create } from "zustand";

interface GroupState {
  isCreatingGroup: boolean;
  setIsCreatingGroup: (isCreating: boolean) => void;
  refetchGroups: number;
  setRefetchGroups: (refetchGroups: number) => void;
  groupId: string;
  setGroupId: (groupId: string) => void;
  isEditingGroup: boolean;
  setIsEditingGroup: (isEditingGroup: boolean) => void;
  selectedGroup: any;
  setSelectedGroup: (selectedGroup: any) => void;
  refetchGroupDetail: number;
  setRefetchGroupDetail: (refetchGroupDetail: number) => void;
  isGroupAdmin: boolean;
  setIsGroupAdmin: (isGroupAdmin: boolean) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  isCreatingGroup: false,
  setIsCreatingGroup: (isCreatingGroup) => set({ isCreatingGroup }),
  refetchGroups: 0,
  setRefetchGroups: (refetchGroups) => set({ refetchGroups }),
  groupId: "",
  setGroupId: (groupId) => set({ groupId }),
  isEditingGroup: false,
  setIsEditingGroup: (isEditingGroup) => set({ isEditingGroup }),
  selectedGroup: null,
  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),
  refetchGroupDetail: 0,
  setRefetchGroupDetail: (refetchGroupDetail) => set({ refetchGroupDetail }),
  isGroupAdmin: false,
  setIsGroupAdmin: (isGroupAdmin) => set({ isGroupAdmin }),
}));
