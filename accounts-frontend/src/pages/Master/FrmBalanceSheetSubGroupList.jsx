import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShadCNTable from "@/components/ui/table";
import Swal from "sweetalert2";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmBalanceSheetSubGroupList = () => {
  const navigate = useNavigate();

  const [group, setGroup] = useState("");
  const [groupList, setGroupList] = useState([]);
  const [subGroupList, setSubGroupList] = useState([]);
  const [loading, setLoading] = useState(false);

  /* 🔥 AXIOS INSTANCE WITH TOKEN */
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

  const headers = ["निवडा", "Balance SubGroup Name"];

  const keyMapping = {
    निवडा: "select",
    "Balance SubGroup Name": "name",
  };

  /* 🔥 FETCH GROUP LIST */
  const fetchGroupList = async () => {
    try {
      const res = await api.get("/api/SubGroup/balgrouplist");

      if (res.data?.ok && res.data?.data?.list) {
        setGroupList(res.data.data.list);
      }
    } catch (err) {
      console.error("❌ Error fetching group list:", err);
    }
  };

  /* 🔥 FETCH SUBGROUP LIST */
  const fetchSubGroupList = async (groupId) => {
    try {
      setLoading(true);

      Swal.fire({
        title: "डेटा लोड होत आहे...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await api.get(
        `/api/SubGroup/balsubgrouplist?groupId=${groupId}`,
      );

      if (res.data?.ok && res.data?.data?.list) {
        setSubGroupList(res.data.data.list);
      }

      Swal.close();
    } catch (err) {
      Swal.close();
      console.error("❌ Error fetching subgroup list:", err);
      Swal.fire("Error", "डेटा लोड करताना त्रुटी आली", "error");
    } finally {
      setLoading(false);
    }
  };

  /* 🔥 HANDLE DROPDOWN */
  const handleGroupChange = (value) => {
    setGroup(value);
    fetchSubGroupList(value);
  };

  /* 🔥 LOAD DROPDOWN ON MOUNT */
  useEffect(() => {
    fetchGroupList();
  }, []);

  /* 🔥 MAP TABLE */
  /* 🔥 MAP TABLE */
  const tableData = subGroupList.map((row) => ({
    select: (
      <Button
        variant="link"
        className="text-blue-700 px-0 h-auto"
        onClick={() =>
          navigate("/Masters/FrmBalanceSheetSubGroupMst", {
            state: {
              mode: 2,
              data: {
                // Extracting using the exact keys from your provided List JSON
                BALANCESUBGRPID: row.NUM_BALSUBGRPMST_BALSUBGRPID,
                BALANCEGRPID: row.NUM_BALGRPMST_BALGRPID,
                BALANCESUBGRPNAME: row.VAR_BALSUBGRPMST_BALSUBGRPNAME,
              },
            },
          })
        }
      >
        निवडा
      </Button>
    ),
    name: row.VAR_BALSUBGRPMST_BALSUBGRPNAME,
  }));

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
            onClick={() => navigate("/Masters/FrmBalanceSheetSubGroupMst")}
          >
            नवीन जोडा
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* FILTER */}
          <div className="border rounded-md p-6">
            <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
              <div className="flex items-center gap-4">
                <span className="w-40 text-right font-medium text-gray-700">
                  शिल्लकपत्रक गट :
                </span>

                <Select value={group} onValueChange={handleGroupChange}>
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue placeholder="-- निवडा --" />
                  </SelectTrigger>

                  <SelectContent>
                    {groupList.map((grp) => (
                      <SelectItem key={grp.VALUE} value={String(grp.VALUE)}>
                        {grp.LABEL}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* TABLE */}
          {group && (
            <div className="border rounded-md overflow-hidden bg-white">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-2 h-2 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 text-xs">डेटा लोड होत आहे...</p>
                </div>
              ) : (
                <ShadCNTable
                  headers={headers}
                  data={tableData}
                  keyMapping={keyMapping}
                  pagination={true}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmBalanceSheetSubGroupList;
