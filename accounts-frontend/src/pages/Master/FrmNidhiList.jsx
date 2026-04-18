import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ShadCNTable from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import apiService from "@/apiService";
import axios from "axios";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const FrmNidhiList = () => {
  const { user } = useAuth()
  const token = user?.token;
  const ulbId = user?.ulbId;

  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const headers = [
    "Select",
    "Nidhi",
    "Budget",
    "Status"
  ];

  const keyMapping = {
    Select: "select",
    "Nidhi": "nidhi",
    "Budget": "budget",
    "Status": "status"
  };

  const fetchNidhiList = async () => {
    try {
        setLoading(true);

        const res = await axios.get(
        `${BASE_URL}/api/NidhiList/nidhi/list`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
        );

        if (res?.data?.data?.success) {
        setData(res.data.data.list || []);
        }
    } catch (err) {
        console.error("Error fetching nidhi list:", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchNidhiList();
  }, []);

  const handleSelectVoucher = (row) => {
    navigate("/Masters/FrmNidhiMaster", {
      state: {
        mode: 2,
        data: {
            nidhiId: row.NUM_NIDHI_ID 
        },
      },
    });
  };

  const tableRows = data.map((row) => ({
    select: (
      <Button
        variant="link"
        size="sm"
        className="text-blue-700 font-medium px-0 cursor-pointer hover:text-blue-900"
        onClick={() => handleSelectVoucher(row)}
      >
        Select
      </Button>
    ),
    nidhi: row.VAR_NIDHI_NIDHINAME,
    budget: row.VAR_BUDGETCONFIG_BUDGETNAME,
    status: row.STATUS,
  }));


  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
    //   className="p-4 sm:p-6 min-h-screen bg-gray-100"
    >
      <Card className=" shadow-sm border">

        <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="text-lg font-semibold">
                Nidhi Master List
            </CardTitle>
            <Button
              className="bg-blue-900 hover:bg-blue-800 text-white w-full sm:w-auto"
              onClick={() => navigate("/Masters/FrmNidhiMaster", { state: { mode: 1 } })}
            >
              Add New
            </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="border rounded-lg bg-white overflow-hidden">
            {loading && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                loading data...
              </div>
            )}

            {!loading && data.length === 0 && (
                <div className="py-14 text-center">
                <p className="text-slate-500 text-sm">
                    No data available
                </p>
                <Button
                    variant="link"
                    className="mt-2 text-blue-700"
                    onClick={() => navigate("/Masters/FrmNidhiMaster", { state: { mode: 1 } })}
                >
                    Add New
                </Button>
                </div>
            )}

            {!loading && data.length > 0 && (
              <ShadCNTable
                headers={headers}
                data={tableRows}
                keyMapping={keyMapping}
                pagination={true}
                rowsPerPage={5}
                className="max-md:min-w-380"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmNidhiList;