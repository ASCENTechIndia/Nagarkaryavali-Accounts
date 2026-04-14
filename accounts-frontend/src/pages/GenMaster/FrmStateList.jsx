import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import { useAuth } from "@/context/AuthContext"; // ✅ ADD

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShadCNTable from "@/components/ui/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmStateList = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ GET TOKEN

  const [stateList, setStateList] = useState([]);

  const headers = ["निवडा", "राज्याचे नाव"];

  const keyMapping = {
    निवडा: "select",
    "राज्याचे नाव": "name",
  };

  /* 🔥 FETCH LIST */
  const fetchStates = async () => {
    try {
      Swal.fire({
        title: "Loading States...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.get(
        `${BASE_URL}/api/CityList/statelist`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`, // ✅ FIX
          },
        }
      );

      Swal.close();

      if (res.data?.ok && res.data?.data?.list) {
        setStateList(res.data.data.list);
      } else {
        setStateList([]);
      }
    } catch (err) {
      Swal.close();
      console.error("State list error:", err);
      Swal.fire("Error loading states");
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchStates(); // ✅ only call when token available
    }
  }, [user]);

  /* 🔥 TABLE DATA */
  const tableData = stateList.map((row, index) => ({
    id: row.STATE_ID || index,
    select: (
      <Button
        variant="link"
        className="text-blue-700 px-0"
        onClick={() =>
          navigate("/Masters/FrmState", {
            state: { mode: 2, data: row },
          })
        }
      >
        निवडा
      </Button>
    ),
    name: row.STATE_NAME?.trim() || "-",
  }));

  const finalData =
    tableData.length > 0
      ? tableData
      : [
          {
            id: 0,
            select: "",
            name: "डेटा उपलब्ध नाही",
          },
        ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto mt-6"
    >
       <Card className="shadow-sm border rounded-lg">
        <CardHeader className="border-b flex justify-between items-center">
           <CardTitle className="text-lg font-semibold">राज्याची यादी</CardTitle>

          <Button onClick={() => navigate("/Masters/FrmState")}>
            नवीन जोडा
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          <div className="border rounded-md overflow-hidden">
            <ShadCNTable
              headers={headers}
              data={finalData}
              keyMapping={keyMapping}
              pagination={tableData.length > 0}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmStateList;