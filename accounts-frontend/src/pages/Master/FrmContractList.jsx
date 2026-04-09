import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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

const FrmContractList = () => {
  const { user } = useAuth()
  const token = user?.token;
  const ulbId = user?.ulbId;

  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedPrabhag, setSelectedPrabhag] = useState("");
  const [zones, setZones] = useState([]);
  
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const headers = [
    "निवडा",
    "कॉन्ट्रॅक्ट नं.",
    "दिनांक",
    "कॉन्ट्रॅक्टर",
    "रक्कम",
    "प्रारंभ दिनांक",
    "शेवटची दिनांक",
  ];

  const keyMapping = {
    निवडा: "select",
    "कॉन्ट्रॅक्ट नं.": "contractno",
    दिनांक: "trnsdate",
    "कॉन्ट्रॅक्टर": "contractor",
    रक्कम: "amount",
    "प्रारंभ दिनांक": "startdate",
    "शेवटची दिनांक": "enddate",
  };

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await axios.post(`${BASE_URL}/api/Receipt/zones`, 
          {
            corp_id: ulbId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res?.data) {
          setZones(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching zones:", err);
      }
    };

    if (ulbId) {
      fetchZones();
    }
  }, [user]);

  const fetchVoucherList = async (zoneId) => {
    try {
      if (!zoneId || !ulbId) return;

      setLoading(true);

      const response = await axios.get(
        `${BASE_URL}/api/FrmContract/contract/list`,
        {
          params: {
            zoneId: Number(zoneId),
            ulbId: Number(ulbId),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("response: ", response);

      if (response?.data?.data?.success) {
        setData(response.data.data.list || []);
        setFilteredData(response.data.data.list || []);
      }
    } catch (error) {
      console.error("Error fetching voucher list", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPrabhag) {
      fetchVoucherList(selectedPrabhag);
    }
  }, [selectedPrabhag]);

  useEffect(() => {
    let filtered = [...data];

    if (searchText) {
      const search = searchText.toLowerCase();

      filtered = filtered.filter(item =>
        item.ID?.toString().toLowerCase().includes(search) ||
        item.PARTYNAME?.toLowerCase().includes(search) ||
        item.AMOUNT?.toString().includes(search)
      );
    }

    setFilteredData(filtered);
  }, [searchText, data]);

  const handleSelectVoucher = (row) => {
    navigate("/Transactions/FrmContractEntry", {
      state: {
        mode: 2,
        voucherData: {
          contractno: row.ID
        },
      },
    });
  };

  const tableRows = filteredData.map((row) => ({
    select: (
      <Button
        variant="link"
        size="sm"
        className="text-blue-700 font-medium px-0 cursor-pointer hover:text-blue-900"
        onClick={() => handleSelectVoucher(row)}
      >
        निवडा
      </Button>
    ),
    contractno: row.ID,
    trnsdate: row.CONTRACTDATE ? new Date(row.CONTRACTDATE).toLocaleDateString("en-GB") : "-",
    contractor: row.PARTYNAME,
    amount: row.AMOUNT?.toLocaleString("en-IN") || "0",
    startdate: row.STARTDATE ? new Date(row.STARTDATE).toLocaleDateString("en-GB") : "-",
    enddate: row.ENDDATE ? new Date(row.ENDDATE).toLocaleDateString("en-GB") : "-",
  }));

  const prabhagOptions = zones.map((z) => ({
    value: z.ZONEID?.toString(),
    label: z.ZONEENAME,
  }));

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
    //   className="p-4 sm:p-6 min-h-screen bg-gray-100"
    >
      <Card className=" shadow-sm border">
        <CardContent className="p-4 space-y-4">
          <motion.h2
            variants={item}
            className="text-lg sm:text-xl font-semibold text-gray-800"
          >
            कंत्राटची यादी
          </motion.h2>

          <hr />

          <motion.div variants={item}>
            <Button
              className="bg-blue-900 hover:bg-blue-800 text-white w-full sm:w-auto"
              onClick={() => navigate("/Transactions/FrmContractEntry", { state: { mode: 1 } })}
            >
              नविन जोडा
            </Button>
          </motion.div>

          <hr />

          <motion.div
            variants={item}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label className="w-32 font-medium text-gray-700" text="प्रभाग :" />
              <Select
                value={selectedPrabhag}
                onValueChange={(v) => setSelectedPrabhag(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- विकल्प निवडा --" />
                </SelectTrigger>
                <SelectContent>
                  {prabhagOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <div className="border rounded-lg bg-white overflow-hidden">
            {loading && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                माहिती लोड होत आहे...
              </div>
            )}

            {!loading && filteredData.length === 0 && (
              <div className="py-14 text-center">
                <p className="text-slate-500 text-sm">
                  कोणतीही माहिती उपलब्ध नाही
                </p>
                <Button
                  variant="link"
                  className="mt-2 text-blue-700"
                  onClick={() => navigate("/Transactions/FrmVoucherPreparation", { state: { mode: 1 } })}
                >
                  नवीन कंत्राट जोडा
                </Button>
              </div>
            )}

            {!loading && filteredData.length > 0 && (
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

export default FrmContractList;