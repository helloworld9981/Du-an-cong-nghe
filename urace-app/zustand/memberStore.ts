import { IMember } from "@/types/member";
import { create } from "zustand";

interface MemberState {
  isAddingMemberToGroup: boolean;
  setIsAddingMemberToGroup: (isAdding: boolean) => void;
  refetchMembers: number;
  setRefetchMembers: (refetchMembers: number) => void;
  isEditingMember: boolean;
  setIsEditingMember: (isEditing: boolean) => void;
  editingMember: IMember;
  setEditingMember: (editingMember: IMember) => void;
}

export const useMemberStore = create<MemberState>((set) => ({
  isAddingMemberToGroup: false,
  setIsAddingMemberToGroup: (isAddingMemberToGroup) =>
    set({ isAddingMemberToGroup }),
  refetchMembers: 0,
  setRefetchMembers: (refetchMembers) => set({ refetchMembers }),
  isEditingMember: false,
  setIsEditingMember: (isEditingMember) => set({ isEditingMember }),
  editingMember: {
    userId: "",
    _id: "",
    username: "",
    email: "",
    role: "",
    joinedAt: "",
    stravaProfile: "",
  },
  setEditingMember: (editingMember) => set({ editingMember }),
}));
