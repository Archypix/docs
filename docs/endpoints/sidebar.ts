import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "endpoints/archypix-app-back",
    },
    {
      type: "category",
      label: "Authentication",
      items: [
        {
          type: "doc",
          id: "endpoints/auth-signup",
          label: "auth_signup",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "endpoints/auth-signin",
          label: "auth_signin",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "endpoints/auth-signin-email",
          label: "auth_signin_email",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "endpoints/auth-status",
          label: "auth_status",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "endpoints/auth-confirm-code",
          label: "auth_confirm_code",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "endpoints/auth-confirm-token",
          label: "auth_confirm_token",
          className: "api-method post",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
