import {
  AcceptPendingRequest,
  DeclinePendingRequest,
  GetGroupPendingRequests,
} from "@/api/group/group";
import { GetUserById } from "@/api/user/user";
import { IMember } from "@/types/member";
import { useBottomSheetStore } from "@/zustand/bottomSheetStore";
import { useMemberStore } from "@/zustand/memberStore";
import { AntDesign, Feather } from "@expo/vector-icons";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";
import MemberCard from "../member/member-card";
import MemberPendingCard from "../member/member-pending-card";
import NoData from "../ui/no-data";

const isAndroid = Platform.OS === "android";

export default function GroupDetailMember({
  isAdmin,
  groupId,
  groupMembers,
  searchName,
  setSearchName,
  isLoading,
}: {
  isAdmin: boolean;
  groupId: string;
  groupMembers: IMember[];
  searchName: string;
  setSearchName: (searchName: string) => void;
  isLoading: boolean;
}) {
  const { openSheet } = useBottomSheetStore();

  const [activeTab, setActiveTab] = useState<number>(0);

  const [pendingUserIds, setPendingUserIds] = useState<string[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const { refetchMembers, setRefetchMembers } = useMemberStore();

  const sortedMembers = useMemo(() => {
    return [...groupMembers].sort((a, b) =>
      a.role === "admin" ? -1 : b.role === "admin" ? 1 : 0
    );
  }, [groupMembers]);

  useEffect(() => {
    if (isAdmin) {
      GetGroupPendingRequests(groupId)
        .then((res) => {
          if (res.data) {
            setPendingUserIds(res.data);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isAdmin, groupId, refetchMembers]);

  useEffect(() => {
    if (pendingUserIds) {
      pendingUserIds.forEach((userId) => {
        GetUserById(userId)
          .then((res) => {
            if (res.data) {
              setPendingUsers((prev) => {
                if (!prev.some((user) => user._id === userId)) {
                  return [...prev, res.data];
                }
                return prev;
              });
            }
          })
          .catch((err) => console.error(err));
      });
    }
  }, [pendingUserIds]);

  const handleAcceptRequest = (userId: string) => {
    AcceptPendingRequest(groupId, userId)
      .then((res) => {
        if (res.data) {
          toast.success("Accept pending request successfully");
          setRefetchMembers(refetchMembers + 1);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleDeclineRequest = (userId: string) => {
    DeclinePendingRequest(groupId, userId)
      .then((res) => {
        if (res.data) {
          toast.success("Decline pending request successfully");
          setRefetchMembers(refetchMembers + 1);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleFabPress = () => {
    openSheet("addMember", {
      groupId,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {isAdmin && (
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
            marginBottom: isAndroid ? 12 : 16,
          }}
        >
          <View className="flex-row">
            <TouchableOpacity
              activeOpacity={0.7}
              className="flex-1"
              onPress={() => setActiveTab(0)}
              style={{
                paddingVertical: isAndroid ? 12 : 14,
                alignItems: "center",
                borderBottomWidth: activeTab === 0 ? 3 : 0,
                borderBottomColor: activeTab === 0 ? "#4F6AEE" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: isAndroid ? 13 : 14,
                  fontWeight: activeTab === 0 ? "600" : "500",
                  color: activeTab === 0 ? "#4F6AEE" : "#9CA3AF",
                }}
                allowFontScaling={false}
              >
                Members
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              className="flex-1"
              onPress={() => setActiveTab(1)}
              style={{
                paddingVertical: isAndroid ? 12 : 14,
                alignItems: "center",
                borderBottomWidth: activeTab === 1 ? 3 : 0,
                borderBottomColor: activeTab === 1 ? "#4F6AEE" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: isAndroid ? 13 : 14,
                  fontWeight: activeTab === 1 ? "600" : "500",
                  color: activeTab === 1 ? "#4F6AEE" : "#9CA3AF",
                }}
                allowFontScaling={false}
              >
                Requests
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {activeTab === 0 && (
        <View className={clsx(isAndroid ? "mb-3" : "mb-4", !isAdmin && "mb-3")}>
          <View
            className={`flex-row items-center bg-white rounded-2xl ${isAndroid ? "px-4 py-2.5" : "px-5 py-3"}`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <View
              className="mr-3"
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 8,
                padding: isAndroid ? 6 : 8,
              }}
            >
              <Feather
                name="search"
                size={isAndroid ? 16 : 18}
                color="#6B7280"
              />
            </View>
            <TextInput
              className={`flex-1 text-gray-800 ${isAndroid ? "text-xs" : "text-sm"}`}
              placeholder="Search by name, username or email"
              placeholderTextColor="#9CA3AF"
              value={searchName}
              onChangeText={setSearchName}
              allowFontScaling={false}
            />
            {searchName.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchName("")}
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                  padding: isAndroid ? 6 : 8,
                  marginLeft: 8,
                }}
              >
                <Feather name="x" size={isAndroid ? 16 : 18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      {isLoading && (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F6AEE" />
        </View>
      )}
      {sortedMembers.length > 0 && !isLoading && activeTab === 0 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: isAdmin ? (isAndroid ? 130 : 140) : 100,
            paddingTop: isAndroid ? 12 : 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {sortedMembers.map((member, idx) => (
            <TouchableOpacity
              key={idx}
              className={isAndroid ? "mb-2" : "mb-3"}
              activeOpacity={0.8}
              onPress={() => {
                openSheet("editMember", {
                  selectedName: member.username,
                  selectedEmail: member.email,
                  selectedRole: member.role,
                  selectedUserId: member._id,
                  groupId,
                });
              }}
            >
              <MemberCard
                name={member.username}
                role={member.role}
                joinedAt={member.joinedAt}
                email={member.email}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {sortedMembers.length === 0 && !isLoading && activeTab === 0 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: isAdmin ? (isAndroid ? 130 : 140) : 100,
          }}
        >
          <View className={isAndroid ? "mt-3" : "mt-4"}>
            <NoData
              imageSource={require("../../assets/images/NoData03.png")}
              title={"No members match your search"}
              content={"No members found. Try a different keyword?"}
            />
          </View>
        </ScrollView>
      )}
      {!isLoading && activeTab === 1 && pendingUserIds.length > 0 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: isAdmin ? (isAndroid ? 130 : 140) : 100,
            paddingTop: isAndroid ? 12 : 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {pendingUsers.map((user, idx) => (
            <View key={idx} className={isAndroid ? "mb-2" : "mb-3"}>
              <MemberPendingCard
                name={user.displayName}
                email={user.email}
                handleAcceptRequest={() => handleAcceptRequest(user._id)}
                handleDeclineRequest={() => handleDeclineRequest(user._id)}
              />
            </View>
          ))}
        </ScrollView>
      )}
      {!isLoading && activeTab === 1 && pendingUserIds.length === 0 && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: isAdmin ? (isAndroid ? 130 : 140) : 100,
          }}
        >
          <View className={isAndroid ? "mt-3" : "mt-4"}>
            <NoData
              imageSource={require("../../assets/images/NoData03.png")}
              title={"No request pending"}
              content={
                "There are currently no pending requests waiting for your approval."
              }
            />
          </View>
        </ScrollView>
      )}

      {isAdmin && (
        <View
          style={{
            position: "absolute",
            bottom: isAndroid ? 110 : 120,
            right: isAndroid ? 16 : 20,
            zIndex: 999,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleFabPress}
            style={{
              shadowColor: "#4F6AEE",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={["#4F6AEE", "#9B4BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: isAndroid ? 52 : 60,
                height: isAndroid ? 52 : 60,
                borderRadius: isAndroid ? 26 : 30,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <AntDesign name="plus" size={isAndroid ? 24 : 28} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
