import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";

import { MaterialUIControllerProvider } from "context";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyDzyazmm4OU65Ls-eHtIS4gU_Eryg50ayU",
  authDomain: "mdweb-f5cf9.firebaseapp.com",
  projectId: "mdweb-f5cf9",
  storageBucket: "mdweb-f5cf9.appspot.com",
  messagingSenderId: "977082720913",
  appId: "1:977082720913:web:913dc0cdc58d8fdcd89530",
  measurementId: "G-R67GH8J9KT",
};

const app = initializeApp(firebaseConfig);

const container = document.getElementById("app");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <MaterialUIControllerProvider>
      <App />
    </MaterialUIControllerProvider>
  </BrowserRouter>
);
