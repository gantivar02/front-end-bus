export const msalConfig = {
  auth: {
    clientId: "4d228d72-295f-4da1-8034-2df9238f9ae5",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: `${window.location.origin}/microsoft-auth.html`,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
