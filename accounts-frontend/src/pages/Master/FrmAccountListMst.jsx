import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {Label} from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import SearchableSelect from "@/components/SearchableSelect";
import ShadCNTable from "@/components/ui/table";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmAccountList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showTable, setShowTable] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [corporationList, setCorporationList] = useState([]);
  const [glList, setGlList] = useState([]);
  const [ledgerOptions, setLedgerOptions] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [filters, setFilters] = useState({
    ulbId: "",
    functionCode: "",
    objectCode: "",
  });

  const headers = [
    "निवडा",
    "GL Code",
    "Account No",
    "Old Account No",
    "Account Name",
    "Balance Sheet Group",
  ];

  const keyMapping = {
    निवडा: "select",
    "GL Code": "FUNCTIONCODE",
    "Account No": "OBJECTCODE",
    "Old Account No": "OLDACCNO",
    "Account Name": "name",
    "Balance Sheet Group": "SUBTYPE",
  };

  // ================= CORPORATION =================
  const getCorporations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/FrmParty/corporation/list`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      const list = res.data?.data?.list || [];
      setCorporationList(list);

      if (user?.ulbId) {
        setFilters((prev) => ({
          ...prev,
          ulbId: user.ulbId.toString(),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================= GL LIST =================
  const loadGLList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      setGlList(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= LEDGERS =================
  const loadLedgers = async (glcode) => {
    try {
      if (!glcode) return;

      setLedgerLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/FrmTransfer/credit-leasure`,
        {
          corp_id: Number(user?.ulbId),
          glcode: Number(glcode),
        },
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        },
      );

      setLedgerOptions(res.data?.data?.rows || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.token) return;
    getCorporations();
    loadGLList();
  }, [user]);

  // ================= SEARCH =================
  const handleSearch = async () => {
    try {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      setLoading(true);

      const payload = {
        ulbId: Number(filters.ulbId || user?.ulbId),
        ...(filters.functionCode && {
          functionCode: Number(filters.functionCode),
        }),
        ...(filters.objectCode && {
          objectCode: Number(filters.objectCode),
        }),
      };

      console.log("Payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/api/FrmAccount/account-details`,
        payload,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        },
      );

      console.log("API Response:", res.data);

      // 🔥 SAFE DATA EXTRACTION
      const list = res.data?.data?.data || res.data?.data?.rows || [];

      const mapped = list.map((row) => ({
        select: (
          <Button
            variant="link"
            className="text-blue-700 px-0 h-auto"
            onClick={() =>
              navigate("/Masters/FrmAccountMst", {
                state: {
                  accNo: row.OBJECTCODE,
                  oldAccNo: row.OLDACCNO,
                  functionCode: row.FUNCTIONCODE,
                  ulbId: filters.ulbId,
                  balanceSheet: row.ACCSUBTYPE,
                },
              })
            }
          >
            निवडा
          </Button>
        ),

        FUNCTIONCODE: row.FUNCTIONCODE,
        OBJECTCODE: row.OBJECTCODE,

        // ✅ CLEANED SUBTYPE
        SUBTYPE: row.ACCSUBTYPE
          ? row.ACCSUBTYPE.replace(/\t/g, "")
              .split("-")
              .map((p) => p.trim())
              .join(" - ")
          : "",

        name: row.VAR_ACCMASTER_ACCNAME,
      }));

      setTableData(mapped);
      setShowTable(true);
    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setLoading(false);
      Swal.close();
    }
  };

  useEffect(() => {
    if (user?.ulbId) {
      setFilters((prev) => ({
        ...prev,
        ulbId: String(user.ulbId),
      }));
    }
  }, [user]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="shadow-sm border rounded-lg">
        <CardHeader className="border-b flex justify-between items-center">
          <CardTitle>खाते मास्टर यादी</CardTitle>

          <Button onClick={() => navigate("/Masters/FrmAccountMst")}>
            नवीन जोडा
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* FORM GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CORPORATION */}
            <div className="space-y-2">
            
              <Label text="महानगरपालिका" />
              <Select
                value={filters.ulbId}
                onValueChange={(v) => setFilters({ ...filters, ulbId: v })}
                disabled
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="निवडा" />
                </SelectTrigger>

                <SelectContent>
                  {corporationList.map((c) => (
                    <SelectItem
                      key={c.NUM_CORPORATION_ID}
                      value={String(c.NUM_CORPORATION_ID)}
                    >
                      {c.VAR_CORPORATION_NAME}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* GL */}
            <div className="space-y-2">
             
              <Label text="जी.एल. नांव" />
              <SearchableSelect
                className="w-full"
                options={glList.map((g) => ({
                  label: g.GLSEARCHNAME,
                  value: String(g.GLCODE),
                }))}
                value={filters.functionCode}
                onChange={(v) => {
                  const gl = v?.value || "";
                  setFilters((p) => ({
                    ...p,
                    functionCode: gl,
                    objectCode: "",
                  }));
                  loadLedgers(gl);
                }}
              />
            </div>

            {/* LEDGER */}
            <div className="space-y-2">
             
              <Label text="खाते नांव" />
              <SearchableSelect
                className="w-full"
                options={ledgerOptions.map((l) => ({
                  label: l.ACCNAME,
                  value: String(l.OBJECTCODE),
                }))}
                value={filters.objectCode}
                onChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    objectCode: v?.value || "",
                  }))
                }
                isLoading={ledgerLoading}
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col md:flex-row gap-3 justify-center pt-6 border-t">
            <Button
              size="lg"
              className="min-w-[120px]"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? "Loading..." : "शोधा"}
            </Button>

            <Button
              size="lg"
              variant="destructive"
              className="min-w-[120px]"
              onClick={() => {
                setFilters({
                  ulbId: user?.ulbId?.toString() || "",
                  functionCode: "",
                  objectCode: "",
                });
                setShowTable(false);
                setTableData([]);
              }}
            >
              परत
            </Button>
          </div>

          {/* TABLE */}
          {showTable && (
            <div className="border rounded-lg overflow-hidden shadow-sm">
              {tableData.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
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
