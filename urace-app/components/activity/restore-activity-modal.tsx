import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface RestoreActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  activityName?: string;
}

export default function RestoreActivityModal({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
  activityName,
}: RestoreActivityModalProps) {
  const isAndroid = Platform.OS === "android";

  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    onClose();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            alignItems: "center",
          }}
        >
          <View
            style={{
              flex: 1,
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: isAndroid ? 16 : 20,
                  width: "100%",
                  maxWidth: 400,
                  overflow: "hidden",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: isAndroid ? 16 : 20,
                    paddingVertical: isAndroid ? 14 : 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: isAndroid ? 36 : 40,
                        height: isAndroid ? 36 : 40,
                        borderRadius: isAndroid ? 10 : 12,
                        backgroundColor: "#D1FAE5",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather
                        name="rotate-ccw"
                        size={isAndroid ? 18 : 20}
                        color="#10B981"
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: isAndroid ? 16 : 18,
                        fontWeight: "700",
                        color: "#1F2937",
                      }}
                      allowFontScaling={false}
                    >
                      Restore activity
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleClose}
                    style={{
                      width: isAndroid ? 32 : 36,
                      height: isAndroid ? 32 : 36,
                      borderRadius: isAndroid ? 8 : 10,
                      backgroundColor: "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather
                      name="x"
                      size={isAndroid ? 16 : 18}
                      color="#6B7280"
                    />
                  </Pressable>
                </View>

                {/* Content */}
                <View
                  style={{
                    paddingHorizontal: isAndroid ? 16 : 20,
                    paddingVertical: isAndroid ? 16 : 20,
                  }}
                >
                  {activityName && (
                    <View
                      style={{
                        backgroundColor: "#D1FAE5",
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: isAndroid ? 10 : 12,
                        marginBottom: isAndroid ? 14 : 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: isAndroid ? 12 : 13,
                          color: "#047857",
                          fontWeight: "500",
                        }}
                        allowFontScaling={false}
                        numberOfLines={2}
                      >
                        {activityName}
                      </Text>
                    </View>
                  )}

                  <Text
                    style={{
                      fontSize: isAndroid ? 13 : 14,
                      color: "#6B7280",
                      marginBottom: isAndroid ? 12 : 14,
                      lineHeight: isAndroid ? 18 : 20,
                    }}
                    allowFontScaling={false}
                  >
                    Are you sure you want to restore this activity? This
                    activity will be included again in the competition
                    statistics.
                  </Text>
                </View>

                {/* Actions */}
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: isAndroid ? 16 : 20,
                    paddingVertical: isAndroid ? 14 : 16,
                    gap: 12,
                    borderTopWidth: 1,
                    borderTopColor: "#F3F4F6",
                  }}
                >
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isLoading}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: isAndroid ? 12 : 14,
                      borderRadius: isAndroid ? 10 : 12,
                      backgroundColor: "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: isAndroid ? 14 : 15,
                        fontWeight: "600",
                        color: "#6B7280",
                      }}
                      allowFontScaling={false}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={isLoading}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      paddingVertical: isAndroid ? 12 : 14,
                      borderRadius: isAndroid ? 10 : 12,
                      backgroundColor: "#10B981",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="rotate-ccw" size={16} color="#FFFFFF" />
                        <Text
                          style={{
                            fontSize: isAndroid ? 14 : 15,
                            fontWeight: "600",
                            color: "#FFFFFF",
                          }}
                          allowFontScaling={false}
                        >
                          Restore
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
