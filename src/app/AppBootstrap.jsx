import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { router } from "./router";
import { AuthProvider } from "../context/AuthContext";
import { warmUpRecaptcha } from "../services/recaptcha";

const GOOGLE_CLIENT_ID =
  "429776556637-evnln8ok9vbqnc0di3umr174tr9pkgiq.apps.googleusercontent.com";

export default function AppBootstrap() {
  useEffect(() => {
    warmUpRecaptcha().catch((error) => {
      console.warn(error.message);
    });
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
