import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();
let inactivityTimer;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const startInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      alert("Session expired due to inactivity.");
      logout();
    }, 15 * 60 * 1000); // 15 minutes
  };

  const resetInactivityTimer = () => {
    startInactivityTimer();
  };

  const setupInactivityListeners = () => {
    ["mousemove", "keydown", "click", "scroll"].forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });
  };
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now(); // exp is in seconds, Date.now() in ms
        if (isExpired) {
          console.warn("Token expired, logging out.");
          logout(); // clear localStorage and set user to null
          return;
        }
        const userData = {
          // userId: decoded.userId,
          userId: decoded.sub,
          username: localStorage.getItem("username"),
          deptId: localStorage.getItem("deptid"),
          ulbId: localStorage.getItem("ulbId"),
          collcenterid: localStorage.getItem("collcenterid"),
          lastLogin: localStorage.getItem("lastlogin"),
          lastLogout: localStorage.getItem("lastlogout"),
          prabhagName: localStorage.getItem("prabhagName"),
          prabhagID: localStorage.getItem("prabhagID"), // Fixed key
          token,
        };

        if (
          userData.userId &&
          userData.username &&
          userData.deptId &&
          userData.ulbId &&
          userData.collcenterid &&
          userData.lastLogin &&
          userData.lastLogout &&
          userData.prabhagName &&
          userData.prabhagID
        ) {
          setUser(userData);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const loginAdmin = (userData, token) => {
    try {
      const decoded = jwtDecode(token);
      // const userId = decoded.userId;
      const userId = decoded.sub;

      localStorage.setItem("username", userData.out_username);
      localStorage.setItem("deptid", userData.acccounttype);
      localStorage.setItem("ulbId", userData.out_orgid);
      localStorage.setItem("collcenterid", userData.out_collectioncenter);
      localStorage.setItem("token", token);
      localStorage.setItem("lastlogin", userData.out_lastlogin);
      localStorage.setItem("lastlogout", userData.out_lastlogout);
      localStorage.setItem("prabhagName", userData.out_prabhagname || "");
      localStorage.setItem("prabhagID", userData.out_prabhagid || ""); // Fixed key
      // localStorage.setItem("userId", userData.userId);
      localStorage.setItem("userId", userId);

      setUser({
        userId,
        username: userData.out_username,
        deptId: userData.deptId,
        ulbId: userData.out_orgid,
        collcenterid: userData.out_collectioncenter,
        lastLogin: userData.out_lastlogin,
        lastLogout: userData.out_lastlogout,
        prabhagName: userData.out_prabhagname,
        prabhagID: userData.out_prabhagid, // Fixed key
        token,
      });
    } catch (error) {
      console.error("Error decoding token during login:", error);
    }
    setupInactivityListeners();
    startInactivityTimer();
  };

  const logout = () => {
    clearTimeout(inactivityTimer);
    localStorage.clear();
    setUser(null);
    window.location.replace("/"); // force redirect to login
  };

  return (
    <AuthContext.Provider value={{ user,  setUser, loginAdmin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
