
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import ShadCNTable from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import { Input } from "@/components/ui/input";

const FrmBankBranchList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token;

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [selectedBank, setSelectedBank] = useState("");
  const [bankList, setBankList] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [search, setSearch] = useState("");

  const headers = [
    "निवडा",
    "बँकेचे नाव",
    "शाखेचे नाव",
    "आयएफएससी कोड",
    "एमआयसीआर कोड",
    "शाखेचे पत्ता",
    "राज्य",
    "जिल्हा",
    "शहर",
    "शाखा संपर्क क्र",
  ];

  const keyMapping = {
    निवडा: "select",
    "बँकेचे नाव": "bankName",
    "शाखेचे नाव": "branchName",
    "आयएफएससी कोड": "ifsc",
    "एमआयसीआर कोड": "micr",
    "शाखेचे पत्ता": "branchAddress",
    राज्य: "state",
    जिल्हा: "district",
    शहर: "city",
    "शाखा संपर्क क्र": "branchMobileNo",
  };

  const fetchBankList = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/Bankbranch/banklist`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const banks = res.data?.data?.list || [];
      setBankList(banks);
    } catch (err) {
      console.error("Bank List API Error:", err);
    }
  };

  const fetchBranchList = async (bankId) => {
    try {

      Swal.fire({
        title: "Loading ...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.get(
        `${BASE_URL}/api/Bankbranch/branchlist?bankId=${bankId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const apiData = res.data?.data?.list || [];

      const formatted = apiData.map((item) => ({
        select: (
          <Button
            variant="link"
            className="text-blue-700 px-0 h-auto"
            onClick={() =>
              navigate("/Masters/FrmBankBranchMst", {
                state: {
                  mode: 2,
                  data: {
                    id: item.NUM_BRANCHMST_BRANCHID,
                    branchName: item.VAR_BRANCHMST_BRANCHNAME.trim(),
                    ifsc: item.VAR_BRANCHMST_IFSC,
                    micr: item.VAR_BRANCHMST_MICR,
                    bankId: item.NUM_BRANCHMST_BANKID,
                  },
                },
              })
            }
          >
            निवडा
          </Button>
        ),
        bankName: item.VAR_BANKMST_BANKNAME || "-",
        branchName: item.VAR_BRANCHMST_BRANCHNAME?.trim() || "-",
        ifsc: item.VAR_BRANCHMST_IFSC || "-",
        micr: item.VAR_BRANCHMST_MICR || "-",
        branchAddress: item.VAR_BRANCHMST_ADDRESS || "-",
        state: item.VAR_BRANCHMST_RAJYA || "-",
        district: item.VAR_BRANCHMST_JILA || "-",
        city: item.VAR_BRANCHMST_SAHAR || "-",
        branchMobileNo: item.NUM_BRANCHMST_PINCODE || "-",
      }));

      setTableData(formatted);
    } catch (err) {
      console.error("Branch List API Error:", err);
      setTableData([]);
    } finally {
      Swal.close();
    }
  };

  useEffect(() => {
    fetchBankList();
  }, []);

  useEffect(() => {
    if (selectedBank) {
      fetchBranchList(selectedBank);
    }
  }, [selectedBank]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 sm:mt-6 px-2 sm:px-4"
    >
      <Card className="shadow-sm border rounded-lg">
        <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <CardTitle className="text-lg font-semibold">
            शाखेची यादी
          </CardTitle>

          <Button
            className="bg-blue-900 hover:bg-blue-800 text-white w-full sm:w-auto"
            onClick={() => navigate("/Masters/FrmBankBranchMst")}
          >
            नविन जोडा
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="p-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="sm:w-40 text-left sm:text-right font-medium text-gray-700">
                  बँकेचं नाव :
                </span>

                <Select onValueChange={(value) => setSelectedBank(value)}>
                  <SelectTrigger className="w-full sm:flex-1 h-9">
                    <SelectValue placeholder="-- निवडा --" />
                  </SelectTrigger>

                  <SelectContent>
                    {bankList.map((bank) => (
                      <SelectItem
                        key={bank.VALUE}
                        value={bank.VALUE.toString()}
                      >
                        {bank.LABEL}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="sm:w-40 text-left sm:text-right font-medium text-gray-700">
                  शोधा :
                </span>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:flex-1 h-9"
                />
              </div>
            </div>
          </div>

          {/* {selectedBank && (
            <div className="border rounded-md bg-white overflow-x-auto">
              <ShadCNTable
                headers={headers}
                data={tableData}
                keyMapping={keyMapping}
              />
            </div>
          )} */}
          {selectedBank && (
            <div className="border rounded-md bg-white overflow-x-auto">
              {(() => {
                const lowerSearch = search.toLowerCase();
                
                const filteredData = tableData.filter((row) => {
                  return Object.keys(row).some((key) => {
                    if (key === "select") return false;
                    return String(row[key]).toLowerCase().includes(lowerSearch);
                  });
                });

                if (filteredData.length === 0) {
                  return (
                    <div className="text-center py-10 text-gray-500 font-medium">
                      Data not found
                    </div>
                  );
                }

                return (
                  <ShadCNTable
                    headers={headers}
                    data={filteredData}
                    keyMapping={keyMapping}
                  />
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmBankBranchList;