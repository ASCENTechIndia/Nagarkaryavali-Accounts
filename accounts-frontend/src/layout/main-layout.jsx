import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="min-h-screen w-full  flex flex-col">
      <Navbar />
       <main className="flex-1 w-full pt-20 md:pt-30 px-2 sm:px-4 md:px-6 lg:px-8 overflow-y-auto">
        <ProtectedRoute>
          <Outlet />
        </ProtectedRoute>
      </main>
    </div>
  );
};

export default Layout;