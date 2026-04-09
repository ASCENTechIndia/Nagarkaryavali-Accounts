import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmAccountList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showTable, setShowTable] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [corporationList, setCorporationList] = useState([]);
  const [corpLoading, setCorpLoading] = useState(false);

  const [filters, setFilters] = useState({
    ulbId: "",
    functionCode: "",
    objectCode: "",
  });

  const headers = ["निवडा", "जी.एल. कोड", "खाते नाव"];

  const keyMapping = {
    निवडा: "select",
    "जी.एल. कोड": "code",
    "खाते नाव": "name",
  };

  // ✅ GET CORPORATIONS
  const getCorporations = async () => {
    try {
      setCorpLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/FrmParty/corporation/list`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      const list = res.data?.data?.list || [];
      setCorporationList(list);

      if (user?.ulbId) {
        setFilters((prev) => ({
          ...prev,
          ulbId: user.ulbId.toString(),
        }));
      }
    } catch (err) {
      console.error("Corporation API Error:", err);
    } finally {
      setCorpLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      getCorporations();
    }
  }, [user]);

  // ✅ SEARCH API
  const handleSearch = async () => {
    debugger;
    try {
      setLoading(true);

      const payload = {
        functionCode: filters.functionCode || "",
        ulbId: filters.ulbId || user?.ulbId || "-1",
        objectCode: filters.objectCode || "",
      };

      const res = await axios.post(
        `${BASE_URL}/api/FrmAccount/account-details`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      console.log("API Response:", res.data);

      const list = res.data?.data?.data || [];

      if (list.length === 0) {
        setTableData([]);
        setShowTable(true);
        return;
      }

      const mapped = list.map((row) => ({
        select: (
          <Button
            variant="link"
            className="text-blue-700 px-0 h-auto"
            onClick={() =>
              navigate("/Masters/FrmAccountMst", {
                state: { mode: 2, data: row },
              })
            }
          >
            निवडा
          </Button>
        ),
        code: row.OBJECTCODE,
        name: row.VAR_ACCMASTER_ACCNAME,
      }));

      setTableData(mapped);
      setShowTable(true);
    } catch (err) {
      console.error("Search API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto mt-6"
    >
      <Card className="shadow-sm border rounded-lg">
        {/* HEADER */}
        <CardHeader className="border-b flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            खाते मास्टर यादी
          </CardTitle>

          <Button
            className="bg-blue-900 text-white"
            onClick={() => navigate("/Masters/FrmAccountMst")}
          >
            नवीन जोडा
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* FILTER */}
          <div className="p-6">
            <div className="space-y-6">
              {/* CORPORATION */}
              <div className="flex items-center gap-6">
                <span className="w-52 text-right font-medium">
                  नगरपालिका :
                </span>

                <Select
                disabled
                  value={filters.ulbId}
                  onValueChange={(val) =>
                    setFilters({ ...filters, ulbId: val })
                  }
                  disabled={corpLoading}
                >
                  <SelectTrigger className="w-72 h-9">
                    <SelectValue placeholder="-- निवडा --" />
                  </SelectTrigger>

                  <SelectContent>
                    {corporationList.map((item) => (
                      <SelectItem
                        key={item.NUM_CORPORATION_ID}
                        value={item.NUM_CORPORATION_ID.toString()}
                      >
                        {item.VAR_CORPORATION_NAME}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* FUNCTION CODE */}
              <div className="flex items-center gap-6">
                <span className="w-52 text-right font-medium">
                  जी.एल. नांव :
                </span>

                <Input
                  className="w-72 h-9"
                  value={filters.functionCode}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      functionCode: e.target.value,
                    })
                  }
                />
              </div>

              {/* OBJECT CODE */}
              <div className="flex items-center gap-6">
                <span className="w-52 text-right font-medium">
                  खाते नांव :
                </span>

                <Input
                  className="w-72 h-9"
                  value={filters.objectCode}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      objectCode: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-center gap-4 mt-6 pt-6 border-t">
              <Button
                className="bg-blue-900 text-white px-6"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? "Loading..." : "शोधा"}
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  setShowTable(false);
                  setTableData([]);
                }}
              >
                परत
              </Button>
            </div>
          </div>

          {/* TABLE */}
          {showTable && (
            <div className="border rounded-md overflow-hidden bg-white">
              {tableData.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No Data Found
                </div>
              ) : (
                <ShadCNTable
                  headers={headers}
                  data={tableData}
                  keyMapping={keyMapping}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmAccountList;