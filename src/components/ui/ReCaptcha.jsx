import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useCallback } from "react";

export default function useReCaptcha() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getToken = useCallback(async (action = "submit") => {
    if (!executeRecaptcha) return null;
    return await executeRecaptcha(action);
  }, [executeRecaptcha]);

  return { getToken };
}