import { create } from "zustand";

interface ContestState {
  isCreatingContest: boolean;
  setIsCreatingContest: (isCreating: boolean) => void;
  refetchContests: number;
  setRefetchContests: (refetchContests: number) => void;
  isEditingContest: boolean;
  setIsEditingContest: (isEditingContest: boolean) => void;
  selectedContest: any;
  setSelectedContest: (selectedContest: any) => void;
  refetchContestDetail: number;
  setRefetchContestDetail: (refetchContestDetail: number) => void;
  isAddingParticipant: boolean;
  setIsAddingParticipant: (isAddingParticipant: boolean) => void;
  contestId: string;
  setContestId: (contestId: string) => void;
  isDisplayParticipantActivities: boolean;
  setIsDisplayParticipantActivities: (
    isDisplayParticipantActivities: boolean
  ) => void;
  selectedActivityUserId: string;
  setSelectedActivityUserId: (selectedActivityUserId: string) => void;
}

export const useContestStore = create<ContestState>((set) => ({
  isCreatingContest: false,
  setIsCreatingContest: (isCreatingContest) => set({ isCreatingContest }),
  refetchContests: 0,
  setRefetchContests: (refetchContests) => set({ refetchContests }),
  isEditingContest: false,
  setIsEditingContest: (isEditingContest) => set({ isEditingContest }),
  selectedContest: null,
  setSelectedContest: (selectedContest) => set({ selectedContest }),
  refetchContestDetail: 0,
  setRefetchContestDetail: (refetchContestDetail) =>
    set({ refetchContestDetail }),
  isAddingParticipant: false,
  setIsAddingParticipant: (isAddingParticipant: boolean) =>
    set({ isAddingParticipant }),
  contestId: "",
  setContestId: (contestId) => set({ contestId }),
  isDisplayParticipantActivities: false,
  setIsDisplayParticipantActivities: (isDisplayParticipantActivities) =>
    set({ isDisplayParticipantActivities }),
  selectedActivityUserId: "",
  setSelectedActivityUserId: (selectedActivityUserId) =>
    set({ selectedActivityUserId }),
}));
