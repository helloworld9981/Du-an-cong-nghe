import { GetParticipantLeaderboard } from "@/api/contest/contest";
import { IParticipantLeaderboard } from "@/types/contest";
import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { useContestStore } from "@/zustand/contestStore";
import { useGroupStore } from "@/zustand/groupStore";
import { Feather } from "@expo/vector-icons";
import {
  cacheDirectory,
  EncodingType,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";
import XLSX from "xlsx-js-style";
import ParticipantLeaderboardCard from "./participant-leaderboard-card";

export default function ParticipantLeaderboard() {
  const isAndroid = Platform.OS === "android";
  const [leaderboard, setLeaderboard] = useState<IParticipantLeaderboard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const {
    contestId,
    setSelectedActivityUserId,
    selectedContest,
    refetchContestDetail,
  } = useContestStore();

  const { openSheet } = useBottomSheetStore();
  const { isGroupAdmin } = useGroupStore();

  useEffect(() => {
    setIsLoading(true);
    GetParticipantLeaderboard(contestId)
      .then((res) => {
        if (res.data) {
          setLeaderboard(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [contestId, refetchContestDetail]);

  const handleExportResultStatistics = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const sheetHeaders = [
        "Họ và tên",
        "Số ngày theo dõi",
        "Tổng quãng đường",
        "Tốc độ trung bình",
        "Tốc độ nhanh nhất",
        "Quãng đường lớn nhất",
        "Trạng thái",
        "Quãng đường còn thiếu",
      ];

      const processedData = leaderboard.map((item) => {
        const firstName = item.userDetails.stravaProfile?.firstname || "";
        const lastName = item.userDetails.stravaProfile?.lastname || "";
        const fullName = `${firstName} ${lastName}` || item.userDetails.name;

        const totalDistance = item.totalDistance || 0;
        const averagePace = item.averagePace || 0;
        const fatestPace = item.fastestPace || 0;
        const maxDistance = item.maxDistance || 0;
        const targetDistance = selectedContest.minDistance;
        const totalTracklog = item.totalTracklog || 0;

        const isCompleted = totalDistance >= targetDistance;
        const remainingDistance = isCompleted
          ? 0
          : targetDistance - totalDistance;

        const statusCell = {
          v: isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành",
          s: {
            font: {
              color: { rgb: isCompleted ? "00800" : "FF0000" },
              bold: true,
            },
            alignment: { horizontal: "center" },
          },
        };

        return [
          fullName,
          totalTracklog,
          totalDistance,
          averagePace,
          fatestPace,
          maxDistance,
          statusCell,
          remainingDistance,
        ];
      });

      const wsData = [sheetHeaders, ...processedData];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws["!cols"] = [
        { wch: 40 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Thống kê thành viên");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const fileName = `Thong_ke_thanh_vien_${Date.now()}.xlsx`;
      const fileUri = `${cacheDirectory}${fileName}`;
      await writeAsStringAsync(fileUri, wbout, {
        encoding: EncodingType.Base64,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        toast.error("Sharing is not available on this device");
        return;
      }
      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Xuất dữ liệu thống kê",
        UTI: "com.microsoft.excel.xlsx",
      });

      toast.success("Export successful");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isAndroid ? 12 : 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
            <Feather name="award" size={isAndroid ? 14 : 16} color="#4F6AEE" />
          </View>
          <View>
            <Text
              style={{
                fontSize: isAndroid ? 16 : 18,
                fontWeight: "700",
                color: "#1F2937",
              }}
              allowFontScaling={false}
            >
              Leaderboard
            </Text>
            {leaderboard.length > 0 && (
              <Text
                style={{
                  fontSize: isAndroid ? 11 : 12,
                  color: "#9CA3AF",
                  fontWeight: "500",
                }}
                allowFontScaling={false}
              >
                {leaderboard.length} participants
              </Text>
            )}
          </View>
        </View>

        {leaderboard.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleExportResultStatistics}
            disabled={isExporting}
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
              {isExporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather
                    name="download"
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
                    Export
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 60,
          }}
        >
          <ActivityIndicator size="large" color="#4F6AEE" />
          <Text
            style={{
              marginTop: 12,
              fontSize: isAndroid ? 13 : 14,
              color: "#6B7280",
            }}
            allowFontScaling={false}
          >
            Loading leaderboard...
          </Text>
        </View>
      ) : leaderboard.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: isAndroid ? 24 : 32,
            paddingVertical: 60,
          }}
        >
          <View
            style={{
              width: isAndroid ? 80 : 100,
              height: isAndroid ? 80 : 100,
              borderRadius: isAndroid ? 40 : 50,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: isAndroid ? 16 : 20,
            }}
          >
            <Feather name="award" size={isAndroid ? 32 : 40} color="#9CA3AF" />
          </View>
          <Text
            style={{
              fontSize: isAndroid ? 16 : 18,
              fontWeight: "600",
              color: "#374151",
              textAlign: "center",
            }}
            allowFontScaling={false}
          >
            No activities yet
          </Text>
          <Text
            style={{
              fontSize: isAndroid ? 13 : 14,
              color: "#9CA3AF",
              textAlign: "center",
              marginTop: 8,
              lineHeight: isAndroid ? 18 : 20,
            }}
            allowFontScaling={false}
          >
            Participants haven't recorded any activities for this contest yet.
          </Text>
        </View>
      ) : (
        <View style={{ gap: isAndroid ? 10 : 12 }}>
          {leaderboard.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.9}
              onPress={() => {
                openSheet("participantActivities", {
                  contestId,
                  userId: item.userId,
                  participantName: item.userDetails.name,
                  isAdmin: isGroupAdmin,
                });
                setSelectedActivityUserId(item.userId);
              }}
            >
              <ParticipantLeaderboardCard
                rank={idx + 1}
                name={item.userDetails.name}
                username={item.userDetails.username}
                totalDistance={item.totalDistance}
                averagePace={item.averagePace}
                fastestPace={item.fastestPace}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
