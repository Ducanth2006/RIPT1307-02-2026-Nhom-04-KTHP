import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import router from "./routers/router";
import { store } from "./store/store";
import { queryClient } from "./queries/queryClient";
import { colorPrimary } from "./constants";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: colorPrimary,
          fontFamily: "Inter",
          borderRadius: 8,
          fontSize: 16,
        },
      }}
    >
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </Provider>
    </ConfigProvider>
  </React.StrictMode>,
);
