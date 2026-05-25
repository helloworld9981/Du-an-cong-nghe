import { IUser } from "@/types/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  user: IUser | null;
  setToken: (token: string | null) => void;
  setUser: (user: IUser | null) => void;
  logout: () => Promise<void>;
  isUserRefetch: number;
  setIsUserRefetch: (isUserRefetch: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem("accessToken", token);
      set({ accessToken: token });
    } else {
      await AsyncStorage.removeItem("accessToken");
      set({ accessToken: null });
    }
  },
  setUser: (user) => set({ user }),
  logout: async () => {
    await AsyncStorage.removeItem("accessToken");
    set({ accessToken: null, user: null });
  },
  isUserRefetch: 0,
  setIsUserRefetch: (isUserRefetch) => set({ isUserRefetch }),
}));
