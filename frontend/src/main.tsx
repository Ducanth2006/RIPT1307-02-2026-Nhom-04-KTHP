import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "./index.css";
import router from "./routers/router";
import { store } from "./store/store";
import { queryClient } from "./queries/queryClient";
import { colorPrimary, GOOGLE_CLIENT_ID } from "./constants";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#af101a", // Beautiful branding red from homepage
          fontFamily: "'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          borderRadius: 8,
          fontSize: 15,
          colorBorder: "#e4beba", // Soft elegant border to match admin layout
          colorTextBase: "#191c1e",
        },
        components: {
          Button: {
            borderRadius: 8,
            colorPrimary: "#af101a",
            colorPrimaryHover: "#d32f2f",
            colorPrimaryActive: "#9a0f16",
            controlOutline: "rgba(175, 16, 26, 0.1)",
          },
          Input: {
            borderRadius: 8,
            colorBorder: "#e4beba",
            colorPrimaryHover: "#af101a",
            controlOutline: "rgba(175, 16, 26, 0.1)",
          },
          InputNumber: {
            borderRadius: 8,
            colorBorder: "#e4beba",
            colorPrimaryHover: "#af101a",
            controlOutline: "rgba(175, 16, 26, 0.1)",
          },
          Select: {
            borderRadius: 8,
            colorBorder: "#e4beba",
            colorPrimaryHover: "#af101a",
            controlOutline: "rgba(175, 16, 26, 0.1)",
          },
          Card: {
            borderRadiusLG: 12,
            colorBorderSecondary: "#e4beba",
          },
          Table: {
            borderRadius: 8,
            colorBorderSecondary: "#e4beba",
            headerBg: "#f7f9fb",
            headerColor: "#191c1e",
          },
          Modal: {
            borderRadiusLG: 12,
          },
        },
      }}
    >
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <RouterProvider router={router} />
          </GoogleOAuthProvider>
        </QueryClientProvider>
      </Provider>
    </ConfigProvider>
  </React.StrictMode>,
);
