import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  ImageSourcePropType,
  Platform,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

export default function NoData({
  className,
  imageSource,
  title,
  content,
  buttonText,
  handleSubmit,
  buttonIcon,
  isStravaButton,
  stravaButtonAction,
  isHideShadowOpacity,
}: {
  className?: string;
  imageSource?: ImageSourcePropType;
  title?: string;
  content?: string;
  buttonText?: string;
  handleSubmit?: () => void;
  buttonIcon?: React.ReactNode;
  isStravaButton?: boolean;
  stravaButtonAction?: () => void;
  isHideShadowOpacity?: boolean;
}) {
  const { width } = useWindowDimensions();
  const isAndroid = Platform.OS === "android";
  const isSmallScreen = width < 380;

  return (
    <View
      style={{
        width: "100%",
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 28,
        shadowColor: isHideShadowOpacity ? "transparent" : "#6366F1",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isHideShadowOpacity ? 0 : 0.08,
        shadowRadius: 20,
        elevation: isAndroid && !isHideShadowOpacity ? 4 : 0,
        borderWidth: 1,
        borderColor: "#F1F5F9",
      }}
    >
      {/* Illustration Container */}
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: "#F8FAFC",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Image
          source={imageSource ?? require("../../assets/images/NoData01.png")}
          style={{
            width: 70,
            height: 70,
            resizeMode: "contain",
          }}
        />
      </View>

      {/* Title */}
      {title && (
        <Text
          style={{
            fontSize: isSmallScreen ? 15 : 16,
            fontWeight: "700",
            color: "#1E293B",
            textAlign: "center",
            marginBottom: 8,
            letterSpacing: -0.3,
          }}
          allowFontScaling={false}
        >
          {title}
        </Text>
      )}

      {/* Content */}
      {content && (
        <Text
          style={{
            fontSize: isSmallScreen ? 12 : 13,
            color: "#94A3B8",
            fontWeight: "500",
            textAlign: "center",
            lineHeight: 20,
            paddingHorizontal: 12,
          }}
          allowFontScaling={false}
        >
          {content}
        </Text>
      )}

      {/* Action Button */}
      {buttonText && (
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.8}
          style={{ width: "100%", marginTop: 24, paddingHorizontal: 16 }}
        >
          <LinearGradient
            colors={["#6366F1", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 14,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {buttonIcon}
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "700",
              }}
              allowFontScaling={false}
            >
              {buttonText}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Strava Button */}
      {isStravaButton && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            backgroundColor: "#FF390D",
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 32,
            marginTop: 24,
            shadowColor: "#FF390D",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: isAndroid ? 4 : 0,
          }}
          onPress={stravaButtonAction}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#FFFFFF",
              textAlign: "center",
            }}
            allowFontScaling={false}
          >
            Connect with Strava
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
