import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeType = "light" | "dark";

interface ThemeState {
  theme: ThemeType;

  setTheme: (theme: ThemeType) => Promise<void>;

  toggleTheme: () => Promise<void>;

  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",

  setTheme: async (theme) => {
    await AsyncStorage.setItem("theme", theme);
    set({ theme });
  },

  
  toggleTheme: async () => {
    const current = get().theme;
    const newTheme = current === "light" ? "dark" : "light";

    await AsyncStorage.setItem("theme", newTheme);
    set({ theme: newTheme });
  },

  
  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem("theme");

      if (saved === "light" || saved === "dark") {
        set({ theme: saved });
      }
    } catch (e) {
      console.log("Load theme error:", e);
    }
  },
}));