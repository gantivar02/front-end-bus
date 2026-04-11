import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey="6LeHpbEsAAAAAKy1ztO3SRBgz6CUk80SEE0KmaRt">
      <GoogleOAuthProvider clientId="429776556637-evnln8ok9vbqnc0di3umr174tr9pkgiq.apps.googleusercontent.com">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </GoogleOAuthProvider>
    </GoogleReCaptchaProvider>
  </React.StrictMode>
);