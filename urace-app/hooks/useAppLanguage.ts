import { useTranslation } from "react-i18next"
import i18n from "@/config/i18n"

export const useAppLanguage = () => {
  const { t } = useTranslation()

  const changeLanguage = async (lang: string) => {
    try {
      await i18n.changeLanguage(lang)
    } catch (err) {
      console.error("Change language error:", err)
    }
  }

  const currentLanguage = i18n.language

  const languages = [
    { label: "Tiếng Việt", value: "vi" },
    { label: "English", value: "en" },
    { label: "中文", value: "zh" },
  ]

  return {
    t,
    changeLanguage,
    currentLanguage,
    languages,
  }
}