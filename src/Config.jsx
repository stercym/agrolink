import axios from "axios";

const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:5000" // local backend
    : "https://agrolink-backend-kjb1.onrender.com"; // deployed backend

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export { api, BASE_URL };
