import { useThemeStore } from "@/zustand/themeStore";
import { themes } from "@/theme/colors";

export const useTheme = () => {
  const theme = useThemeStore((state) => state.theme);
  return themes[theme];
};