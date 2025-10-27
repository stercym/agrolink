// src/Config.jsx
import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export { api, BASE_URL };
