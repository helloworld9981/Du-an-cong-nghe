import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface RejectActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string, isFraud: boolean) => void;
  isLoading?: boolean;
  activityName?: string;
}

export default function RejectActivityModal({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
  activityName,
}: RejectActivityModalProps) {
  const isAndroid = Platform.OS === "android";
  const [reason, setReason] = useState("");
  const [isFraud, setIsFraud] = useState(false);

  const handleConfirm = () => {
    Keyboard.dismiss();
    onConfirm(reason, isFraud);
  };

  const handleClose = () => {
    setReason("");
    setIsFraud(false);
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
          <KeyboardAvoidingView
            behavior={isAndroid ? "height" : "padding"}
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
                        backgroundColor: "#FEE2E2",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather
                        name="alert-triangle"
                        size={isAndroid ? 18 : 20}
                        color="#EF4444"
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
                      Reject activity
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
                    paddingVertical: isAndroid ? 4 : 8,
                  }}
                >
                  {activityName && (
                    <View
                      style={{
                        backgroundColor: "#FEF3C7",
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: isAndroid ? 10 : 12,
                        marginBottom: isAndroid ? 14 : 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: isAndroid ? 12 : 13,
                          color: "#92400E",
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
                    Are you sure you want to reject this activity? This activity
                    will be excluded from the competition statistics.
                  </Text>

                  {/* Reason Input */}
                  <Text
                    style={{
                      fontSize: isAndroid ? 12 : 13,
                      color: "#374151",
                      fontWeight: "600",
                      marginBottom: 8,
                    }}
                    allowFontScaling={false}
                  >
                    Reject reason (optional)
                  </Text>
                  <TextInput
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Enter reject reason..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: isAndroid ? 10 : 12,
                      paddingHorizontal: 14,
                      paddingVertical: isAndroid ? 10 : 12,
                      fontSize: isAndroid ? 13 : 14,
                      color: "#1F2937",
                      minHeight: isAndroid ? 72 : 80,
                      textAlignVertical: "top",
                      marginBottom: isAndroid ? 14 : 16,
                    }}
                  />
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
                      backgroundColor: "#EF4444",
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
                        <Feather name="x-circle" size={16} color="#FFFFFF" />
                        <Text
                          style={{
                            fontSize: isAndroid ? 14 : 15,
                            fontWeight: "600",
                            color: "#FFFFFF",
                          }}
                          allowFontScaling={false}
                        >
                          Reject
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
