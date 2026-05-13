import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import config from "@/utils/config";
import Swal from "sweetalert2";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "@/components/ui/menubar";

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const Navbar = () => {
  const { user, logout } = useAuth();
  const token = localStorage.getItem("token");
  const [menus, setMenus] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [corpInfo, setCorpInfo] = useState({
    name: "",
    logo: ""
  });
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const MENU_KEY = `ACCOUNTS_MENU_${user?.userId}`;

  // const fetchMenus = async () => {
  //   try {
  //     Swal.fire({
  //       title: "Loading Menu...",
  //       allowOutsideClick: false,
  //       didOpen: () => {
  //         Swal.showLoading();
  //       },
  //     });

  //     const res = await axios.post(`${BASE_URL}/api/menu-access/AccountMenus`,
  //       {
  //         ulbId: user?.ulbId,
  //         userId: user?.userId,
  //         deptId: config.deptId,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     console.log("Menu Response: ", res);

  //     if (res.data.data?.success) {
  //       setMenus(res.data.data.data);
  //     }

  //     Swal.close();
  //   } catch (err) {
  //     Swal.close();
  //     console.error("❌ Menu fetch error:", err);

  //     Swal.fire({
  //       icon: "error",
  //       title: "Error",
  //       text: "Failed to load menu",
  //     });
  //   }
  // };

  const fetchMenus = async () => {
    try {
      // 🔹 CHECK CACHE FIRST
      const cachedMenus = sessionStorage.getItem(MENU_KEY);

      if (cachedMenus) {
        console.log("✅ Loaded menus from session");
        setMenus(JSON.parse(cachedMenus));
        return;
      }

      // 🔹 API CALL (if no cache)
      Swal.fire({
        title: "Loading Menu...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${BASE_URL}/api/menu-access/AccountMenus`,
        {
          ulbId: user?.ulbId,
          userId: user?.userId,
          deptId: config.deptId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.data?.success) {
        const menuData = res.data.data.data;

        setMenus(menuData);

        sessionStorage.setItem(MENU_KEY, JSON.stringify(menuData));
      }

      Swal.close();
    } catch (err) {
      Swal.close();
      console.error("❌ Menu fetch error:", err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load menu",
      });
    }
  };

  const fetchCorporationInfo = async () => {
  try {
    const res = await axios.post(
      `${BASE_URL}/api/menu-access/CorporationInfo`,
      {
        ulbId: ulbId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.data.ok) {
      const data = res.data.data;

      setCorpInfo({
        name: data.ABC_MUNICIPAL_TEXT,
        logo: data.ULBLOGO,
      });
    }
  } catch (err) {
    console.error("❌ Corporation fetch error:", err);
  }
};

  useEffect(() => {
    console.log("USER:", user);
    if (user && user.userId && user.ulbId) {
      fetchMenus();
      fetchCorporationInfo();
    }
  }, [user]);

  const handleLogout = () => {
    sessionStorage.removeItem(MENU_KEY);
    logout();
  };


  // const allMenus = [homeMenu, ...menus.filter(m => m.PARENTID === 0)];
  const allMenus = menus
    .filter(m => m.PARENTID === 0)
    .sort((a, b) => {
      if (a.MENUTITLE === "Dashboard") return -1;
      if (b.MENUTITLE === "Dashboard") return 1;
      return a.ORDERBY - b.ORDERBY;
    });

  const MENU_ICONS = {
    dashboard: "/home.png",
    "मास्टर": "/master.png",
    "जेनेरिक मास्टर": "/master.png",
    "व्यवहार": "/transaction.png",
    search: "/search.png",
    "दैनिक अहवाल": "/dailyreport.png",
    "सामान्य अहवाल": "/reports_icon.png",
    "आर्थिक अहवाल": "/mis.png",
    "व्यवहार शोधा": "/assessment.png",
  };

  const normalize = (str = "") =>
    str.toLowerCase().replace(/\s+/g, " ").trim();

  const getMenuIcon = (title = "") => {
    const key = normalize(title);
    const src = MENU_ICONS[key];

    if (!src) {
      console.log("❌ No icon for:", title); // debug
      return null;
    }

    return (
      <img
        src={src}
        alt=""
        className="w-4 h-4 object-contain"
      />
    );
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 shadow w-full">

      {/* 🔷 TOP BAR */}
      <div className="flex items-center justify-between w-full h-18 px-5 bg-[#2f6fb2]">

        {/* LOGO + TITLE */}
        <div className="flex items-center justify-between w-[60%] gap-4">
          <img src={corpInfo.logo || null} className="sm:h-14 sm:w-14 h-10 w-10 rounded" />
          <h1 className="text-white font-bold text-lg sm:text-2xl">
            {corpInfo.name}
          </h1>
        </div>

        {/* USER INFO */}
        <div className="flex items-center gap-3 text-white">
          <div className="hidden sm:flex flex-col text-right text-xs">
            <span>User: {user?.username}</span>
            <span>Login: {user?.lastLogin}</span>
            <span>Logout: {user?.lastLogout || "-"}</span>
          </div>

          <Button
            size="sm"
            onClick={handleLogout}
            className="bg-white max-sm:hidden text-[#184aa6] hover:bg-gray-200"
          >
            Logout
          </Button>

          {/* MOBILE MENU BUTTON */}
          <button
            className="sm:hidden text-2xl"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* 🔷 DESKTOP MENU */}
      <div className="bg-[#083c76] px-2 py-1 hidden sm:block">
        <Menubar className="bg-transparent border-none text-white flex flex-wrap justify-center gap-1">

          {allMenus.map((parent) => {
            const children = menus.filter(
              (m) => m.PARENTID === parent.MENUID
            );

            return (
              <MenubarMenu key={parent.MENUID}>

                {/* 🔷 MAIN MENU */}
                <MenubarTrigger
                  onClick={() => parent.PAGEPATH && navigate(parent.PAGEPATH)}
                  className="bg-white cursor-pointer text-[#184aa6] px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center gap-1"
                >
                  {getMenuIcon(parent.MENUTITLE)}
                  {parent.MENUTITLE}
                </MenubarTrigger>

                {/* 🔷 DROPDOWN */}
                {children.length > 0 && (
                  <MenubarContent
                    align="start"
                    // className="z-50 bg-white text-black border shadow-lg rounded-md min-w-50 p-1"
                    sideOffset={4}
                    className=" z-50 bg-white text-black border shadow-lg rounded-md min-w-60 max-h-[70vh] overflow-y-auto overflow-x-hidden p-1 scrollbar-thin
                    "
                  >
                    {children.map((child) => (
                      <MenubarItem
                        key={child.MENUID}
                        onClick={() => navigate(child.PAGEPATH)}
                        className="cursor-pointer text-sm px-2 py-1.5 hover:bg-gray-100 rounded"
                      >
                        {child.MENUTITLE}
                      </MenubarItem>
                    ))}
                  </MenubarContent>
                )}

              </MenubarMenu>
            );
          })}

        </Menubar>
      </div>

      {/* 🔷 MOBILE MENU */}
      {mobileOpen && (
        <div className="sm:hidden bg-white border-t shadow p-3 max-h-[calc(100vh-72px)] overflow-y-auto overflow-x-hidden scrollbar-thin">

          {/* 🔷 USER INFO */}
          <div className="text-center text-sm mb-3">
            <p className="font-semibold">{user?.username}</p>
            <p className="text-xs">Login: {user?.lastLogin}</p>
            <p className="text-xs">Logout: {user?.lastLogout || "-"}</p>
          </div>

          {/* 🔷 MENU */}
          <div className="space-y-2">

            {allMenus.map((menu) => {
              const children = menus.filter(
                (m) => m.PARENTID === menu.MENUID
              );

              return (
                <details key={menu.MENUID} className="border rounded">

                  {/* 🔷 PARENT */}
                  <summary
                    className="
                p-2 cursor-pointer font-medium
                flex justify-between items-center
              "
                  >
                    {menu.MENUTITLE}
                    {children.length > 0 && <span>+</span>}
                  </summary>

                  {/* 🔷 CHILDREN */}
                  <div className="pl-4 pb-2">
                    {children.length > 0 ? (
                      children.map((child) => (
                        <div
                          key={child.MENUID}
                          onClick={() => {
                            navigate(child.PAGEPATH);
                            setMobileOpen(false);
                          }}
                          className="py-2 text-sm text-gray-700 cursor-pointer hover:text-blue-600"
                        >
                          {child.MENUTITLE}
                        </div>
                      ))
                    ) : (
                      <div
                        onClick={() => {
                          if (menu.PAGEPATH) navigate(menu.PAGEPATH);
                          setMobileOpen(false);
                        }}
                        className="py-2 text-sm cursor-pointer"
                      >
                        Open
                      </div>
                    )}
                  </div>

                </details>
              );
            })}

          </div>

          {/* 🔷 LOGOUT */}
          <Button className="w-full mt-4" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;