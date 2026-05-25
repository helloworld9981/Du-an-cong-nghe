import { GetContestParticipants } from "@/api/contest/contest";
import { IContestParticipant } from "@/types/contest";
import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { useContestStore } from "@/zustand/contestStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import NoData from "../ui/no-data";
import ContestParticipantCard from "./contest-participant-card";

export default function ContestDetailParticipants({
  contestId,
  contestStartDate,
}: {
  contestId: string;
  contestStartDate?: Date | string;
}) {
  const isAndroid = Platform.OS === "android";
  const { refetchContestDetail } = useContestStore();
  const [participants, setParticipants] = useState<IContestParticipant[]>([]);

  const { openSheet } = useBottomSheetStore();

  const isUpcoming = useMemo(() => {
    if (!contestStartDate) return false;
    return new Date(contestStartDate) > new Date();
  }, [contestStartDate]);

  useEffect(() => {
    GetContestParticipants(contestId)
      .then((res) => {
        if (res.data) {
          setParticipants(res.data);
        }
      })
      .catch((err) => console.error(err));
  }, [refetchContestDetail, contestId]);

  return (
    <View style={{ flex: 1 }}>
      {participants.length > 0 ? (
        <View>
          {/* Header Row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: isAndroid ? 12 : 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View
                style={{
                  width: isAndroid ? 32 : 36,
                  height: isAndroid ? 32 : 36,
                  borderRadius: isAndroid ? 8 : 10,
                  backgroundColor: "#4F6AEE15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather
                  name="users"
                  size={isAndroid ? 14 : 16}
                  color="#4F6AEE"
                />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: isAndroid ? 14 : 15,
                    fontWeight: "600",
                    color: "#1F2937",
                  }}
                  allowFontScaling={false}
                >
                  Participants
                </Text>
                <Text
                  style={{
                    fontSize: isAndroid ? 11 : 12,
                    color: "#9CA3AF",
                    fontWeight: "500",
                  }}
                  allowFontScaling={false}
                >
                  {participants.length}{" "}
                  {participants.length > 1 ? "people" : "person"}
                </Text>
              </View>
            </View>

            {isUpcoming && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  openSheet("addParticipant", {
                    contestId,
                  });
                }}
              >
                <LinearGradient
                  colors={["#4F6AEE", "#9B4BE2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: isAndroid ? 12 : 14,
                    paddingVertical: isAndroid ? 8 : 10,
                    borderRadius: isAndroid ? 10 : 12,
                    gap: 6,
                  }}
                >
                  <Feather
                    name="plus"
                    size={isAndroid ? 14 : 16}
                    color="#FFFFFF"
                  />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: isAndroid ? 12 : 13,
                      fontWeight: "600",
                    }}
                    allowFontScaling={false}
                  >
                    Add
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Participant List */}
          <View style={{ gap: isAndroid ? 8 : 10 }}>
            {participants.map((participant, idx) => (
              <ContestParticipantCard
                key={idx}
                participantDisplayName={participant.name}
                participantUsername={participant.username}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={{ marginTop: isAndroid ? 8 : 12 }}>
          <NoData
            content={
              isUpcoming
                ? "There is no participants in this contest yet. Add participants to get started!"
                : "There is no participants in this contest."
            }
            buttonText={isUpcoming ? "Add Participant" : undefined}
            handleSubmit={
              isUpcoming
                ? () => {
                    openSheet("addParticipant", {
                      contestId,
                    });
                  }
                : undefined
            }
          />
        </View>
      )}
    </View>
  );
}
