import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import getEnvVars from "../config/config";

const { apiUrl } = getEnvVars();
const API_URL = typeof apiUrl === "function" ? apiUrl() : apiUrl;

const API = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

API.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["x-mobile-app"] = "true";
    config.headers["ngrok-skip-browser-warning"] = "true";
    return config;
  },
  (error) => Promise.reject(error),
);

export default API;

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn("Unauthorized - redirect to login");
    }
    return Promise.reject(err);
  },
);

async function getToken() {
  try {
    const storedToken = await AsyncStorage.getItem("accessToken");
    return storedToken;
  } catch {
    return null;
  }
}
