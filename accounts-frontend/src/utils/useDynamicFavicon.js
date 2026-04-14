import { useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useDynamicFavicon = () => {
  const { user } = useAuth();
  console.log("user,",user)
  const ulbId = user?.orgId;
  console.log("ulbID:",ulbId)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/textlogo/${ulbId}`);
        const logoBase64 = response.data?.data?.ULBLOGO;
        const ulbName = response.data?.data?.ABC_MUNICIPAL_TEXT;
        console.log("response:",response)
        if (response.data.success && logoBase64) {
          updateFavicon(logoBase64);
          // console.log("✅ ULB Name:", ulbName); // You can use this wherever needed
        } else {
          console.warn("Logo not found or invalid format.");
        }
      } catch (err) {
        console.error("Failed to fetch logo:", err);
      }
    };

    if (ulbId) {
      fetchLogo();
    }
  }, [ulbId]);
};

const updateFavicon = (base64Image) => {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = base64Image;
};

export default useDynamicFavicon;
