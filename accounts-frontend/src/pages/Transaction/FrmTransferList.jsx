import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ShadCNTable from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmTransferList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [corporations, setCorporations] = useState([]);
  const [selectedCorp, setSelectedCorp] = useState("");
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [list, setList] = useState([]);

  const api = axios.create({ baseURL: BASE_URL });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  /* ================= Swal Loader ================= */
  const showLoader = () => {
    Swal.fire({
      title: "Loading...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  };

  const hideLoader = () => {
    Swal.close();
  };

  /* ================= Load Corporations ================= */
  useEffect(() => {
    const loadCorporations = async () => {
      try {
        showLoader();

        const res = await api.get("/api/FrmParty/corporation/list");
        const corpList = res.data?.data?.list || [];
        setCorporations(corpList);
      } catch (err) {
        Swal.fire("Corporation load failed");
      } finally {
        hideLoader();
      }
    };

    loadCorporations();
  }, []);

  /* ================= Auto Select Corporation ================= */
  useEffect(() => {
    if (!user?.ulbId || corporations.length === 0) return;

    const selected = corporations.find(
      (c) => c.NUM_CORPORATION_ID === Number(user.ulbId),
    );

    if (selected) {
      setSelectedCorp(selected.NUM_CORPORATION_ID.toString());
    }
  }, [user?.ulbId, corporations]);

  /* ================= Load Zones ================= */
  useEffect(() => {
    if (!selectedCorp) return;

    const loadZones = async () => {
      try {
        showLoader();

        const res = await api.post("/api/Receipt/zones", {
          corp_id: Number(selectedCorp),
        });

        setZones(res.data?.data || []);
        setSelectedZone("");
        setList([]);
      } catch (err) {
        Swal.fire("Zone load failed");
      } finally {
        hideLoader();
      }
    };

    loadZones();
  }, [selectedCorp]);

  /* ================= Load Transfer List ================= */
  const loadTransferList = async (zoneId) => {
    try {
      showLoader();

      const res = await api.post("/api/FrmTransfer/transfer-list", {
        zoneId: Number(zoneId),
        ulbId: Number(selectedCorp),
      });

      setList(res.data?.data?.rows || []);
    } catch (err) {
      Swal.fire("Error loading transfer list");
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    if (!selectedZone) return;
    loadTransferList(selectedZone);
  }, [selectedZone]);

  /* ================= Format Date ================= */
  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  };

  /* ================= Table Mapping ================= */
  const tableData = list.map((row) => ({
    select: (
      <Button
        variant="link"
        className="text-blue-700 px-0 h-auto"
        onClick={() =>
          navigate("/Transactions/FrmTransfer", {
            state: { mode: 2, refNo: row.REFNO },
          })
        }
      >
        निवडा
      </Button>
    ),
    ref: row.REFNO,
    date: formatDate(row.TRNSDATE),
    voucher: row.DOCNO,
    type: row.TRNSTYPE,
    zone: row.ZONENAME,
    amount: row.AMOUNT,
    user: row.USERNAME,
    datetime: formatDate(row.DATETIME),
  }));

  const headers = [
    "निवडा",
    "संदर्भ क्र.",
    "दिनांक",
    "चलन/पावती क्र.",
    "व्यवहार प्रकार",
    "झोन",
    "रक्कम",
    "वापरकर्ता",
    "दिनांक वेळ",
  ];

  const keyMapping = {
    निवडा: "select",
    "संदर्भ क्र.": "ref",
    दिनांक: "date",
    "चलन/पावती क्र.": "voucher",
    "व्यवहार प्रकार": "type",
    झोन: "zone",
    रक्कम: "amount",
    वापरकर्ता: "user",
    "दिनांक वेळ": "datetime",
  };

  /* ================= UI ================= */
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="shadow-sm border rounded-lg">
        <CardHeader className="border-b flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            हस्तांतरण करार यादी
          </CardTitle>

          <Button
            className="bg-blue-900 hover:bg-blue-800 text-white"
            onClick={() => navigate("/Transactions/FrmTransfer")}
          >
            नवीन जोडा
          </Button>
        </CardHeader>

        <CardContent className="p-4">
          <div className="bg-white border rounded-md p-4">
            <div className="space-y-2">
              {/* Corporation */}
              <div className="grid grid-cols-[120px_300px] items-center gap-3">
                <Label>महानगरपालिका :</Label>

                <Select
                  value={selectedCorp}
                  onValueChange={setSelectedCorp}
                  disabled={!!user?.ulbId}
                >
                  <SelectTrigger className="h-8 w-full">
                    {" "}
                    {/* ✅ FIX */}
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>

                  <SelectContent>
                    {corporations.map((c) => (
                      <SelectItem
                        key={c.NUM_CORPORATION_ID}
                        value={c.NUM_CORPORATION_ID.toString()}
                      >
                        {c.VAR_CORPORATION_NAME}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zone */}
              <div className="grid grid-cols-[120px_300px] items-center gap-3">
                <Label>झोन :</Label>

                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger className="h-8 w-full">
                    {" "}
                    {/* ✅ FIX */}
                    <SelectValue placeholder="Select Zone" />
                  </SelectTrigger>

                  <SelectContent>
                    {zones.map((z) => (
                      <SelectItem key={z.ZONEID} value={z.ZONEID.toString()}>
                        {z.ZONEENAME}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 border rounded-md overflow-hidden">
              <ShadCNTable
                headers={headers}
                data={tableData}
                keyMapping={keyMapping}
                pagination={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmTransferList;
