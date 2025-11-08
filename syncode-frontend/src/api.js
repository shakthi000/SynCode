import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:5000", // match whatever port you use
  headers: { "Content-Type": "application/json" },
});
