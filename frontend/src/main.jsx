import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AppStoreProvider } from "./store/AppStoreContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppStoreProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppStoreProvider>
  </React.StrictMode>
);
