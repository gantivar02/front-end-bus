import { useCallback } from "react";
import { executeRecaptcha } from "../../services/recaptcha";

export default function useReCaptcha() {
  const getToken = useCallback((action = "submit") => executeRecaptcha(action), []);

  return { getToken };
}
