// import { createContext, useContext, useEffect, useState } from "react";
// import { jwtDecode } from "jwt-decode";

// const AuthContext = createContext();
// let inactivityTimer;

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const startInactivityTimer = () => {
//     clearTimeout(inactivityTimer);
//     inactivityTimer = setTimeout(() => {
//       alert("Session expired due to inactivity.");
//       logout();
//     }, 15 * 60 * 1000); // 15 minutes
//   };

//   const resetInactivityTimer = () => {
//     startInactivityTimer();
//   };

//   const setupInactivityListeners = () => {
//     ["mousemove", "keydown", "click", "scroll"].forEach((event) => {
//       window.addEventListener(event, resetInactivityTimer);
//     });
//   };
//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         const isExpired = decoded.exp * 1000 < Date.now(); // exp is in seconds, Date.now() in ms
//         if (isExpired) {
//           console.warn("Token expired, logging out.");
//           logout(); // clear localStorage and set user to null
//           return;
//         }
//         const userData = {
//           // userId: decoded.userId,
//           userId: decoded.sub,
//           username: localStorage.getItem("username"),
//           deptId: localStorage.getItem("deptid"),
//           ulbId: localStorage.getItem("ulbId"),
//           collcenterid: localStorage.getItem("collcenterid"),
//           lastLogin: localStorage.getItem("lastlogin"),
//           lastLogout: localStorage.getItem("lastlogout"),
//           prabhagName: localStorage.getItem("prabhagName"),
//           prabhagID: localStorage.getItem("prabhagID"), // Fixed key
//           token,
//         };

//         if (
//           userData.userId &&
//           userData.username &&
//           userData.deptId &&
//           userData.ulbId &&
//           userData.collcenterid &&
//           userData.lastLogin &&
//           userData.lastLogout &&
//           userData.prabhagName &&
//           userData.prabhagID
//         ) {
//           setUser(userData);
//         }
//       } catch (error) {
//         console.error("Error decoding token:", error);
//         logout();
//       }
//     }
//     setLoading(false);
//   }, []);

//   const loginAdmin = (userData, token) => {
//     try {
//       const decoded = jwtDecode(token);
//       // const userId = decoded.userId;
//       const userId = decoded.sub;

//       localStorage.setItem("username", userData.out_username);
//       localStorage.setItem("deptid", userData.acccounttype);
//       localStorage.setItem("ulbId", userData.out_orgid);
//       localStorage.setItem("collcenterid", userData.out_collectioncenter);
//       localStorage.setItem("token", token);
//       localStorage.setItem("lastlogin", userData.out_lastlogin);
//       localStorage.setItem("lastlogout", userData.out_lastlogout);
//       localStorage.setItem("prabhagName", userData.out_prabhagname || "");
//       localStorage.setItem("prabhagID", userData.out_prabhagid || ""); // Fixed key
//       // localStorage.setItem("userId", userData.userId);
//       localStorage.setItem("userId", userId);

//       setUser({
//         userId,
//         username: userData.out_username,
//         deptId: userData.deptId,
//         ulbId: userData.out_orgid,
//         collcenterid: userData.out_collectioncenter,
//         lastLogin: userData.out_lastlogin,
//         lastLogout: userData.out_lastlogout,
//         prabhagName: userData.out_prabhagname,
//         prabhagID: userData.out_prabhagid, // Fixed key
//         token,
//       });
//     } catch (error) {
//       console.error("Error decoding token during login:", error);
//     }
//     setupInactivityListeners();
//     startInactivityTimer();
//   };

//   const logout = () => {
//     clearTimeout(inactivityTimer);
//     localStorage.clear();
//     setUser(null);
//     window.location.replace("/"); // force redirect to login
//   };

//   return (
//     <AuthContext.Provider value={{ user,  setUser, loginAdmin, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);


import { createContext, useContext, useEffect, useState, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

const AuthContext = createContext();

let inactivityTimer = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refs to hold timer IDs
  const tokenCheckIntervalRef = useRef(null);
  const tokenExpiryTimeoutRef = useRef(null);

  const logout = async ( reason = "Your login session has expired. Please login again.") => {
    console.warn("🚪 Logging out user...");

    // Clear inactivity timer
    clearTimeout(inactivityTimer);

    // Clear token check interval
    if (tokenCheckIntervalRef.current) {
      clearInterval(tokenCheckIntervalRef.current);
      tokenCheckIntervalRef.current = null;
    }

    // Clear exact expiry timeout
    if (tokenExpiryTimeoutRef.current) {
      clearTimeout(tokenExpiryTimeoutRef.current);
      tokenExpiryTimeoutRef.current = null;
    }

    // Clear local storage
    localStorage.clear();

    // Notify other tabs
    localStorage.setItem("logout", Date.now().toString());

    // Clear state
    setUser(null);
    setLoading(false);

    // Swal popup
    await Swal.fire({
      icon: "warning",
      // title: "Session Expired",
      text: reason,
      confirmButtonText: "Login Again",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    window.location.replace("/login");
  };


  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);

      if (!decoded.exp) return true;

      return decoded.exp * 1000 <= Date.now();
    } catch (err) {
      console.error("❌ Invalid token:", err);
      return true;
    }
  };


  const startTokenCheckInterval = (token) => {
    // Clear existing interval
    if (tokenCheckIntervalRef.current) {
      clearInterval(tokenCheckIntervalRef.current);
    }

    tokenCheckIntervalRef.current = setInterval(() => {
      const currentToken = localStorage.getItem("token");

      if (!currentToken || isTokenExpired(currentToken)) {
        console.warn(" Token expired during interval check");
        logout("Your login session has expired.");
      } else {
        console.log(" Token still valid");
      }
    }, 60 * 1000); // 60 seconds
  };

  const scheduleTokenExpiryLogout = (token) => {
    try {
      const decoded = jwtDecode(token);

      if (!decoded.exp) {
        logout("Your login session has expired.");
        return;
      }

      const expiresAt = decoded.exp * 1000;
      const remainingTime = expiresAt - Date.now();

      if (remainingTime <= 0) {
        console.warn("⛔ Token already expired");
        logout("Your login session has expired.");
        return;
      }

      // Clear previous timeout
      if (tokenExpiryTimeoutRef.current) {
        clearTimeout(tokenExpiryTimeoutRef.current);
      }

      tokenExpiryTimeoutRef.current = setTimeout(() => {
        console.warn("⏰ Token expired exactly at expiry time");
        logout("Your login session has expired.");
      }, remainingTime);

      console.log(
        `⏳ Auto logout scheduled in ${Math.round(
          remainingTime / 1000
        )} seconds`
      );
    } catch (err) {
      console.error("❌ Failed to schedule token expiry logout:", err);
      logout("Your login session has expired.");
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                            INACTIVITY TIMER                               */
  /* -------------------------------------------------------------------------- */
  const startInactivityTimer = () => {
    clearTimeout(inactivityTimer);

    inactivityTimer = setTimeout(() => {
      // alert("Session expired due to inactivity.");
      logout("Your login session has expired.");
    }, 15 * 60 * 1000); // 15 minutes
  };

  const resetInactivityTimer = () => {
    startInactivityTimer();
  };

  const setupInactivityListeners = () => {
    const events = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });
  };

  const removeInactivityListeners = () => {
    const events = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => {
      window.removeEventListener(event, resetInactivityTimer);
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      if (isTokenExpired(token)) {
        console.warn("⛔ Stored token expired");
        logout("Your login session has expired.");
        return;
      }

      const decoded = jwtDecode(token);

      const userData = {
        userId: decoded.sub,
        username: localStorage.getItem("username"),
        deptId: localStorage.getItem("deptid"),
        ulbId: localStorage.getItem("ulbId"),
        collcenterid: localStorage.getItem("collcenterid"),
        lastLogin: localStorage.getItem("lastlogin"),
        lastLogout: localStorage.getItem("lastlogout"),
        prabhagName: localStorage.getItem("prabhagName"),
        prabhagID: localStorage.getItem("prabhagID"),
        token,
      };

      setUser(userData);

      // Start session management
      setupInactivityListeners();
      startInactivityTimer();
      startTokenCheckInterval(token);
      scheduleTokenExpiryLogout(token);
    } catch (err) {
      console.error("❌ Error restoring auth:", err);
      logout("Your login session has expired.");
      return;
    }

    setLoading(false);

    // Cleanup on unmount
    return () => {
      clearTimeout(inactivityTimer);

      if (tokenCheckIntervalRef.current) {
        clearInterval(tokenCheckIntervalRef.current);
      }

      if (tokenExpiryTimeoutRef.current) {
        clearTimeout(tokenExpiryTimeoutRef.current);
      }

      removeInactivityListeners();
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                   LOGIN                                    */
  /* -------------------------------------------------------------------------- */
  const loginAdmin = (userData, token) => {
    try {
      const decoded = jwtDecode(token);
      const userId = decoded.sub;

      // Save to localStorage
      localStorage.setItem("username", userData.out_username);
      localStorage.setItem("deptid", userData.acccounttype);
      localStorage.setItem("ulbId", userData.out_orgid);
      localStorage.setItem(
        "collcenterid",
        userData.out_collectioncenter
      );
      localStorage.setItem("token", token);
      localStorage.setItem("lastlogin", userData.out_lastlogin);
      localStorage.setItem("lastlogout", userData.out_lastlogout);
      localStorage.setItem(
        "prabhagName",
        userData.out_prabhagname || ""
      );
      localStorage.setItem(
        "prabhagID",
        userData.out_prabhagid || ""
      );
      localStorage.setItem("userId", userId);

      const authUser = {
        userId,
        username: userData.out_username,
        deptId: userData.acccounttype,
        ulbId: userData.out_orgid,
        collcenterid: userData.out_collectioncenter,
        lastLogin: userData.out_lastlogin,
        lastLogout: userData.out_lastlogout,
        prabhagName: userData.out_prabhagname,
        prabhagID: userData.out_prabhagid,
        token,
      };

      setUser(authUser);
      setLoading(false);

      // Start session management
      setupInactivityListeners();
      startInactivityTimer();
      startTokenCheckInterval(token);
      scheduleTokenExpiryLogout(token);
    } catch (error) {
      console.error("❌ Error decoding token during login:", error);
      logout("Your login session has expired.");
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                        CROSS-TAB LOGOUT HANDLING                           */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "logout") {
        console.log("🗂️ Logout detected in another tab");
        setUser(null);
        setLoading(false);
        window.location.replace("/");
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                   PROVIDER                                 */
  /* -------------------------------------------------------------------------- */
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token: user?.token,
        loading,
        loginAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);