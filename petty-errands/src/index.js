import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux';
import App from "./App";
import store from "./Redux/Store/configureStore";
import "./index.css";




const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
  <App />
</Provider>,
);
