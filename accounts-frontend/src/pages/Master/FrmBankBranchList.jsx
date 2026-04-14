
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

const FrmBankBranchList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token;

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [selectedBank, setSelectedBank] = useState("");
  const [bankList, setBankList] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const headers = ["निवडा", "शाखेचं नाव", "आयएफएससी कोड", "एमआयसीआर कोड"];

  const keyMapping = {
    निवडा: "select",
    "शाखेचं नाव": "branchName",
    "आयएफएससी कोड": "ifsc",
    "एमआयसीआर कोड": "micr",
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
      setLoading(true);

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
        branchName: item.VAR_BRANCHMST_BRANCHNAME.trim(),
        ifsc: item.VAR_BRANCHMST_IFSC,
        micr: item.VAR_BRANCHMST_MICR || "-",
      }));

      setTableData(formatted);
    } catch (err) {
      console.error("Branch List API Error:", err);
      setTableData([]);
    } finally {
      setLoading(false);
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
            </div>
          </div>

          {selectedBank && (
            <div className="border rounded-md bg-white overflow-x-auto">
              <ShadCNTable
                headers={headers}
                data={tableData}
                keyMapping={keyMapping}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmBankBranchList;