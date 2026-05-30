import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import SearchableSelect from "@/components/SearchableSelect";
import ShadCNTable from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const FrmVoucherPreparreprint = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const [voucherList, setVoucherList] = useState([]);
  const [filteredVoucherList, setFilteredVoucherList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [partyOptions, setPartyOptions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Form state
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [isCheck, setIsCheck] = useState(false);
  const [party, setParty] = useState("");

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const headers = [
    "रेफ क्रमांक",
    "पार्टीचे नाव",
    "प्रभाग",
    "व्हाउचर दिनांक",
    "रक्कम",
    "प्रिंट",
  ];

  const keyMapping = {
    "रेफ क्रमांक": "refNo",
    "पार्टीचे नाव": "partyName",
    "प्रभाग": "zoneName",
    "व्हाउचर दिनांक": "voucherDate",
    "रक्कम": "amount",
    "प्रिंट": "print",
  };

  const formatDateForAPI = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDisplayDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB");
  };

  const fetchParties = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/party`,
        { ulbid: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res?.data?.data) {
        setPartyOptions(
          res.data.data.map((p) => ({
            label: p.PARTYNAME,
            value: p.NUM_PARTYMST_PARTYID.toString(),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching parties:", err);
    }
  };

  useEffect(() => {
    if (ulbId) fetchParties();
  }, [ulbId]);

  const fetchVoucherList = async () => {
    try {
      setLoading(true);

      const payload = {
        fromDate: formatDateForAPI(fromDate),
        toDate: formatDateForAPI(toDate),
        corp_id: Number(ulbId),
        partyId: isCheck ? party || "" : "",
      };

      const res = await axios.post(
        `${BASE_URL}/api/FrmVoucherPreparreprint/voucher-list`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res?.data?.data?.success) {
        setVoucherList(res.data.data.list || []);
        setFilteredVoucherList(res.data.data.list || []);
      } else {
        setVoucherList([]);
        setFilteredVoucherList([]);
      }
    } catch (error) {
      console.error("Error fetching voucher list:", error);
      setVoucherList([]);
      setFilteredVoucherList([]);
      Swal.fire({
        text: error.response?.data?.error || "यादी मिळवताना त्रुटी आली.",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = async (refNo) => {
    try {
      const loader = Swal.fire({
        title: "Generating PDF...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${BASE_URL}/api/FrmVoucherPreparreprint/voucher-details-pdf`,
        {
          refNo: Number(refNo),
          corp_id: Number(ulbId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      loader.close();

      if (res?.data?.success && res?.data?.pdfUrl) {
        window.open(res.data.pdfUrl, "_blank");
      } else {
        throw new Error("PDF generation failed");
      }
    } catch (error) {
      console.error("PDF Error:", error);
      Swal.fire({
        text: error.response?.data?.message || "PDF तयार करताना त्रुटी आली.",
        confirmButtonColor: "#1e3a8a",
      });
    }
  };

  const handleSubmit = async () => {
    if (isCheck && !party) {
      Swal.fire({
        text: "कृपया पार्टी निवडा",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    setHasSearched(true);
    await fetchVoucherList();
  };

  const tableRows = filteredVoucherList.map((row) => ({
    refNo: row.REFNO,
    partyName: row.PARTYNAME,
    zoneName: row.ZONEENAME,
    voucherDate: formatDisplayDate(row.TRANSDATE),
    amount: Number(row.AMT || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    print: (
      <Button
        variant="link"
        size="sm"
        className="text-blue-700 px-0"
        onClick={() => handlePrintPDF(row.REFNO)}
      >
        Print
      </Button>
    ),
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <Card className="shadow-sm border">
        <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <CardTitle className="text-lg font-semibold">
            व्हाउचर तयारी करणे रिप्रिंट
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-6">
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="sm:w-36 flex justify-between">
                <Label text="दिनांका पासुन" />
                <span>:</span>
              </div>
              <DatePicker
                value={fromDate}
                onChange={(d) => setFromDate(d)}
                className="w-full h-9"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="sm:w-36 flex justify-between">
                <Label text="दिनांका पर्यंत" />
                <span>:</span>
              </div>
              <DatePicker
                value={toDate}
                onChange={(d) => setToDate(d)}
                className="w-full h-9"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="sm:w-36 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Input
                    type="checkbox"
                    checked={isCheck}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsCheck(checked);
                      if (!checked) setParty("");
                    }}
                    className="w-4 h-4"
                  />
                  <Label text="पार्टी" />
                </div>
                <span>:</span>
              </div>

              <SearchableSelect
                options={partyOptions}
                value={party}
                onChange={(option) => setParty(option?.value || "")}
                placeholder="पार्टी शोधा"
                isDisabled={!isCheck}
              />
            </div>
          </motion.div>

          <div className="flex justify-center gap-4">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "लोड करत आहे..." : "शोधा"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/HomePage/FrmHomePage")}
            >
              बाहेर
            </Button>
          </div>

          <div className="rounded-lg bg-white overflow-hidden">
            {loading && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                माहिती लोड होत आहे...
              </div>
            )}
            
            {/* {!loading && hasSearched && filteredVoucherList.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                कोणतीही माहिती उपलब्ध नाही
              </div>
            )} */}

            {!loading && hasSearched && filteredVoucherList.length > 0 && (
              <ShadCNTable
                headers={headers}
                data={tableRows}
                keyMapping={keyMapping}
                pagination={true}
                rowsPerPage={10}
                className="max-md:min-w-380"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmVoucherPreparreprint;