import { useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const useDynamicFavicon = () => {
  const { user } = useAuth();
  const ulbId = user?.ulbId;
  const token = user?.token;
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/menu-access/CorporationInfo`,
          { ulbId },
          {headers: {Authorization: `Bearer ${token}`}}
        );

        const logoBase64 = response.data?.data?.ULBLOGO;
        const ulbName = response.data?.data?.ABC_MUNICIPAL_TEXT;
        if (response.data?.ok && logoBase64) {
          updateFavicon(logoBase64);
        } else {
          console.warn("API returned no logo or invalid response");
        }
      } catch (error) {
        console.error("API Error:", error);

        if (error.response) {
          console.error("Response Status:", error.response.status);
          console.error("Response Data:", error.response.data);
        }
      }
    };

    if (!ulbId) {
      console.warn("ulbId missing");
      return;
    }
    if (!token) {
      console.warn("token missing");
      return;
    }

    fetchLogo();
  }, [ulbId, token]);
};

const updateFavicon = (base64Image) => {
  try {
    const existingFavicons = document.querySelectorAll("link[rel*='icon']");

    existingFavicons.forEach((favicon) => {
      favicon.remove();
    });

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = base64Image;
    document.head.appendChild(link);
    console.log("Favicon href length:", base64Image.length);
    const checkFavicon = document.querySelector("link[rel='icon']");
    console.log("Current favicon element:", checkFavicon);
  } catch (error) {
    console.error("updateFavicon Error:", error);
  }
};

export default useDynamicFavicon;