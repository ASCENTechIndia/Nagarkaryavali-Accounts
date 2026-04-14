import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import ShadCNTable from "@/components/ui/table";

const FrmBankList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [tableData, setTableData] = useState([]);

  // ✅ Bank List headers
  const headers = ["निवडा", "बँकेचे नाव"];

  const keyMapping = {
    निवडा: "select",
    "बँकेचे नाव": "bankName",
  };

  const fetchBankList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Bank/banklist`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      const apiData = res.data?.data?.list || [];

      const formatted = apiData.map((item) => ({
        select: (
          <Button
            variant="link"
            className="text-blue-700 px-0 h-auto"
            onClick={() =>
              navigate("/Masters/FrmBankMst", {
                state: {
                  mode: 2,
                  data: {
                    id: item.BANKID,
                    bankName: item.BANKNAME.trim(),
                  },
                },
              })
            }
          >
            निवडा
          </Button>
        ),
        bankName: item.BANKNAME.trim(),
      }));

      setTableData(formatted);
    } catch (err) {
      console.error("Bank API Error:", err);
      setTableData([]);
    }
  };

  useEffect(() => {
    fetchBankList();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 sm:mt-6 px-2 sm:px-4"
    >
      <Card className="shadow-sm border rounded-lg">
        {/* HEADER */}
        <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <CardTitle className="text-lg font-semibold">बँकेची यादी</CardTitle>

          <Button
            className="bg-blue-900 hover:bg-blue-800 text-white w-full sm:w-auto"
            onClick={() => navigate("/Masters/FrmBankMst")}
          >
            नविन जोडा
          </Button>
        </CardHeader>

        {/* TABLE */}
        <CardContent className="p-4 sm:p-6">
          <div className="border rounded-md bg-white overflow-x-auto">
            <ShadCNTable
              headers={headers}
              data={tableData}
              keyMapping={keyMapping}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmBankList;
