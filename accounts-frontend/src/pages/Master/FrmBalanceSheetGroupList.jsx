import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShadCNTable from "@/components/ui/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmBalanceSheetGroupList = () => {
  const navigate = useNavigate();

  const [groupList, setGroupList] = useState([]);
  const [loading, setLoading] = useState(false);

  /* 🔥 AXIOS WITH TOKEN */
  const api = axios.create({
    baseURL: BASE_URL,
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const headers = ["निवडा", "शिल्लकपत्रक गट नांव"];

  const keyMapping = {
    निवडा: "select",
    "शिल्लकपत्रक गट नांव": "name",
  };

  /* 🔥 FETCH GROUP LIST */
  const fetchGroupList = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/Balancesheet/balgrouplist");

      console.log("📥 GROUP LIST:", res.data);

      if (res.data?.ok && res.data?.data?.list) {
        setGroupList(res.data.data.list);
      }
    } catch (err) {
      console.error("❌ Error fetching group list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupList();
  }, []);

  /* 🔥 MAP TABLE DATA */
  const tableData = groupList.map((row) => ({
    select: (
      <Button
        variant="link"
        className="text-blue-700 px-0 h-auto"
        onClick={() =>
          navigate("/Masters/FrmBalanceSheetGroupMst", {
            state: {
              mode: 2,
              data: row,
            },
          })
        }
      >
        निवडा
      </Button>
    ),
    name: row.BALGRPNAME,
  }));

  if (loading) {
    return (
      <div className="flex justify-center mt-10 text-gray-600">Loading...</div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="shadow-sm border rounded-lg">
        {/* HEADER */}
        <CardHeader className="border-b flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            ताळमेळ पत्रक गटची यादी
          </CardTitle>

          <Button
            className="bg-blue-900 hover:bg-blue-800 text-white"
            onClick={() => navigate("/Masters/FrmBalanceSheetGroupMst")}
          >
            नवीन जोडा
          </Button>
        </CardHeader>

        {/* TABLE */}
        <CardContent className="p-6">
          <div className="border rounded-md overflow-hidden bg-white">
            {tableData.length > 0 ? (
              <ShadCNTable
                headers={headers}
                data={tableData}
                keyMapping={keyMapping}
                pagination={true}
              />
            ) : (
              <div className="text-center py-10 text-gray-500 font-medium">
                Data not found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmBalanceSheetGroupList;
