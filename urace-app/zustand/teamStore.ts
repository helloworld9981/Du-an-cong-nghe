import { create } from "zustand";

interface TeamState {
  isCreatingTeam: boolean;
  setIsCreatingTeam: (isCreatingTeam: boolean) => void;
  refetchTeams: number;
  setRefetchTeams: (refetchTeams: number) => void;
  isAddingMemberToTeam: boolean;
  setIsAddingMemberToTeam: (isAddingMemberToTeam: boolean) => void;
  selectedTeamId: string;
  setSelectedTeamId: (selectedTeamId: string) => void;
  refetchDetailTeam: number;
  setRefetchDetailTeam: (refetchDetailTeam: number) => void;
  isDisplayingMemberActivities: boolean;
  setIsDisplayingMemberActivities: (
    isDisplayingMemberActivities: boolean
  ) => void;
  selectedMember: any;
  setSelectedMember: (selectedMember: any) => void;
  allTeams: any;
  setAllTeams: (allTeams: any) => void;
  isFilteringTeamInMemberLeaderboard: boolean;
  setIsFilteringTeamInMemberLeaderboard: (
    isFilteringTeamInMemberLeaderboard: boolean
  ) => void;
  filteredTeamId: string;
  setFilteredTeamId: (filteredTeamId: string) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  isCreatingTeam: false,
  setIsCreatingTeam: (isCreatingTeam) => set({ isCreatingTeam }),
  refetchTeams: 0,
  setRefetchTeams: (refetchTeams) => set({ refetchTeams }),
  isAddingMemberToTeam: false,
  setIsAddingMemberToTeam: (isAddingMemberToTeam) =>
    set({ isAddingMemberToTeam }),
  selectedTeamId: "",
  setSelectedTeamId: (selectedTeamId) => set({ selectedTeamId }),
  refetchDetailTeam: 0,
  setRefetchDetailTeam: (refetchDetailTeam) => set({ refetchDetailTeam }),
  isDisplayingMemberActivities: false,
  setIsDisplayingMemberActivities: (isDisplayingMemberActivities) =>
    set({ isDisplayingMemberActivities }),
  selectedMember: null,
  setSelectedMember: (selectedMember) => set({ selectedMember }),
  allTeams: null,
  setAllTeams: (allTeams) => set({ allTeams }),
  isFilteringTeamInMemberLeaderboard: false,
  setIsFilteringTeamInMemberLeaderboard: (isFilteringTeamInMemberLeaderboard) =>
    set({ isFilteringTeamInMemberLeaderboard }),
  filteredTeamId: "",
  setFilteredTeamId: (filteredTeamId) => set({ filteredTeamId }),
}));
