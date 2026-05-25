import { create } from "zustand";

type BottomSheetType =
  | "createGroup"
  | "createContest"
  | "createTeam"
  | "addMember"
  | "editMember"
  | "addParticipant"
  | "addMemberToTeam"
  | "memberActivities"
  | "filterTeam"
  | "participantActivities"
  | null;

interface BottomSheetState {
  activeSheet: BottomSheetType;
  sheetProps: Record<string, any>;
  openSheet: (sheet: BottomSheetType, props?: Record<string, any>) => void;
  closeSheet: () => void;
}

export const useBottomSheetStore = create<BottomSheetState>((set) => ({
  activeSheet: null,
  sheetProps: {},
  openSheet: (sheet, props = {}) =>
    set({ activeSheet: sheet, sheetProps: props }),
  closeSheet: () => set({ activeSheet: null, sheetProps: {} }),
}));
