// src/services/apiService.js
import CryptoJS from "crypto-js";

const API_SECRET = "your-secret-key"; // Must match backend
const BASE_API_URL = "https://accountsapi.nagarkaryavalinewuat.com"
// const BASE_API_URL = "http://localhost:5000"

const encryptParams = (params) => {
  const jsonString = JSON.stringify(params);
  return CryptoJS.AES.encrypt(jsonString, API_SECRET).toString();
};

const decryptResponse = (payload) => {
  try {
    if (!payload || typeof payload !== "string") {
      // If it's not a string (i.e., already JSON), return as-is
      return payload;
    }

    const bytes = CryptoJS.AES.decrypt(payload, API_SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    // Check if decryption succeeded
    if (!decrypted) throw new Error("Decryption returned empty string");

    return JSON.parse(decrypted);
  } catch (error) {
    console.warn(
      "⚠️ Skipping decryption. Response might be plain JSON:",
      payload
    );
    return payload; // Return raw if already JSON or decryption failed
  }
};

const apiService = {
  post: async (endpoint, data) => {
    const encryptedData = encryptParams(data);
    console.log("🔐 Encrypted payload to send:", data);
    console.log(`🔐 POST: ${BASE_API_URL}/proxy/${btoa(endpoint)}`);

    return fetch(`${BASE_API_URL}/proxy/${btoa(endpoint)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: encryptedData }),
    })
      .then((res) => res.json())
      .then((response) => {
        const decrypted = decryptResponse(response.payload);
        return { data: decrypted };
      });
  },

  get: async (endpoint, params = {}) => {
    const encryptedData = encryptParams(params);
    console.log("🔐 Encrypted Payload:", encryptedData);
    console.log(`🔐 GET: ${BASE_API_URL}/proxy/${btoa(endpoint)}`);

    return fetch(
      `${BASE_API_URL}/proxy/${btoa(endpoint)}?payload=${encodeURIComponent(
        encryptedData
      )}`,
      {
        method: "GET",
      }
    )
      .then((res) => res.json())
      .then((response) => {
        const decrypted = decryptResponse(response.payload);
        return { data: decrypted };
      });
  },

  delete: async (endpoint, data = {}) => {
    const encryptedData = encryptParams(data);
    console.log(`🔐 DELETE: ${BASE_API_URL}/proxy/${btoa(endpoint)}`);

    return fetch(`${BASE_API_URL}/proxy/${btoa(endpoint)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: encryptedData }),
    })
      .then((res) => res.json())
      .then((response) => {
        const decrypted = decryptResponse(response.payload);
        return { data: decrypted };
      });
  },
  getRawFile: async (encodedPath) => {
    try {
      const response = await fetch(
        `${BASE_API_URL}/proxy/public-file/${encodedPath}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";
      return { arrayBuffer, contentType };
    } catch (err) {
      console.error("❌ Error fetching raw file:", err);
      throw err;
    }
  },
  getBlob: async (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${BASE_API_URL}/${endpoint}?${queryString}`;

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const blob = await response.blob();
      const contentType = response.headers.get("content-type");
      return { blob, contentType };
    } catch (error) {
      console.error("❌ Error in getBlob:", error);
      throw error;
    }
  },
};

export default apiService;
