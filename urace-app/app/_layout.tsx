import AddParticipantBottomSheet from "@/components/contest/add-participant-bottom-sheet";
import ParticipantActivitiesBottomSheet from "@/components/contest/participant-activities-bottom-sheet";
import CreateContestBottomSheet from "@/components/group-detail/create-contest-bottom-sheet";
import CreateGroupBottomSheet from "@/components/groups/create-group-bottom-sheet";
import CreateMemberBottomSheet from "@/components/member/create-member-bottom-sheet";
import EditMemberBottomSheet from "@/components/member/edit-member-bottom-sheet";
import AddMemberToTeamBottomSheet from "@/components/team/add-member-to-team-bottom-sheet";
import CreateTeamBottomSheet from "@/components/team/create-team-bottom-sheet";
import FilterTeamBottomSheet from "@/components/team/filter-team-bottom-sheet";
import MemberActivitiesBottomSheet from "@/components/team/member-activities-bottom-sheet";
import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { NativeWindStyleSheet } from "nativewind";
import { Pressable, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { Toaster } from "sonner-native";
import "../global.css";

import { useEffect } from "react";
import { useThemeStore } from "@/zustand/themeStore";

export const unstable_settings = {
  anchor: "(tabs)",
};

NativeWindStyleSheet.setOutput({
  default: "native",
});

export default function RootLayout() {
  const { activeSheet, sheetProps, closeSheet } = useBottomSheetStore();

  // sửa theme hẹ hẹ
  const theme = useThemeStore((s) => s.theme); 
  const loadTheme = useThemeStore((state) => state.loadTheme);

  useEffect(() => {
    loadTheme();
  }, []);

  const isDisplayOverlay = activeSheet !== null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="login/index" options={{ headerShown: false }} />
        <Stack.Screen
  name="login-streak"
  options={{
    headerShown: false,
  }}
/>
        <Stack.Screen name="register/index" options={{ headerShown: false }} />
        <Stack.Screen
          name="forgot-password/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="notifications/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="group" options={{ headerShown: false }} />
        <Stack.Screen name="ask-ai" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />

      {isDisplayOverlay && (
        <Pressable
          className="absolute inset-0 z-[100] w-full h-full bg-[#7D7B7B] opacity-60"
          onPress={closeSheet}
        ></Pressable>
      )}
      {activeSheet === "createGroup" && (
        <View className="absolute bottom-0 z-[100]">
          <CreateGroupBottomSheet
            visible={true}
            onClose={closeSheet}
            {...sheetProps}
          />
        </View>
      )}
      {activeSheet === "createContest" && (
        <View className="absolute bottom-0 z-[100]">
          <CreateContestBottomSheet
            visible={true}
            onClose={closeSheet}
            {...sheetProps}
          />
        </View>
      )}
      {activeSheet === "addMember" && (
        <View className="absolute bottom-0 z-[100]">
          <CreateMemberBottomSheet
            visible={true}
            onClose={closeSheet}
            {...sheetProps}
          />
        </View>
      )}
      {activeSheet === "editMember" && (
        <View className="absolute bottom-0 z-[100]">
          <EditMemberBottomSheet
            visible={true}
            onClose={closeSheet}
            {...sheetProps}
          />
        </View>
      )}
      {activeSheet === "addParticipant" && (
        <View className="absolute bottom-0 z-[100]">
          <AddParticipantBottomSheet
            visible={true}
            onClose={closeSheet}
            {...sheetProps}
          />
        </View>
      )}
      {activeSheet === "createTeam" && (
        <View className="absolute bottom-0 z-[100]">
          <CreateTeamBottomSheet
            visible={true}
            onClose={closeSheet}
            {...sheetProps}
          />
        </View>
      )}
      {activeSheet === "addMemberToTeam" && (
        <View className="absolute bottom-0 z-[100]">
          <AddMemberToTeamBottomSheet
            visible={true}
            onClose={closeSheet}
            {...sheetProps}
          />
        </View>
      )}
      {activeSheet === "memberActivities" && (
        <MemberActivitiesBottomSheet
          visible={true}
          onClose={closeSheet}
          {...sheetProps}
        />
      )}
      {activeSheet === "filterTeam" && (
        <View className="absolute bottom-0 z-[100]">
          <FilterTeamBottomSheet visible={true} onClose={closeSheet} />
        </View>
      )}
      {activeSheet === "participantActivities" && (
        <View className="absolute bottom-0 z-[100]">
          <ParticipantActivitiesBottomSheet
            visible={true}
            onClose={closeSheet}
            {...sheetProps}
          />
        </View>
      )}
      <Toaster position="top-center" />
    </GestureHandlerRootView>
  );
}
