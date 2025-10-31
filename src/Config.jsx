import axios from "axios";

const BASE_URL = 
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:5000" 
    : "https://agrolink-backend-nezp.onrender.com"; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export { api, BASE_URL };
