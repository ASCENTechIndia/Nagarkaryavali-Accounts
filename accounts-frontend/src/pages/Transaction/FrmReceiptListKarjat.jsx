import React, { useState, useEffect, useMemo } from "react";
import { Formik, Form } from "formik";
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

import ShadCNTable from "@/components/ui/table";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const FrmReceiptListKarjat = () => {
  const [tableData, setTableData] = useState([]);
  const [corporations, setCorporations] = useState([]);
  const [zones, setZones] = useState([]);
  const { user } = useAuth();
  const [defaultMunicipality, setDefaultMunicipality] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // <-- NEW
  const navigate = useNavigate();

  const ulbId = user?.ulbId;
  const userId = user?.userId;

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  console.log("usertokan :", user.token);
  console.log("BASE_URL:", BASE_URL);

  const fetchCorporations = async () => {
    try {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/Receipt/corporation`,
        {
          corp_id: ulbId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const corpData = res.data.data || [];
      setCorporations(corpData);

      if (corpData.length > 0) {
        const defaultCorp = corpData[0].CORPORATIONID.toString();
        setDefaultMunicipality(defaultCorp);
        fetchZones(defaultCorp);
      }
    } catch (err) {
      console.error("Corporation API Error:", err);
    } finally {
      Swal.close();
    }
  };


const fetchReceiptList = async () => {
  try {
    setLoading(true);

    const res = await axios.post(
      `${BASE_URL}/api/FrmReceiptKarjat/receipt-Karjat-list`,
      {
        ulbId: Number(ulbId),
        userId: userId,
      },
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      },
    );

    const formatted = (res.data.rows || []).map((item) => ({
      receiptNo: item.REFNO,
      date: item.TRNSDATE
        ? new Date(item.TRNSDATE).toLocaleDateString("en-GB")
        : "",
      voucherNo: item.DOCNO,
      type: item.TRNSTYPE,
      zone: item.ZONENAME,
      amount: item.AMOUNT,
      user: item.USERNAME,
      createdAt: item.DATETIME
        ? new Date(item.DATETIME).toLocaleDateString("en-GB")
        : "",
    }));

    setTableData(formatted);
  } catch (err) {
    console.error("Karjat Receipt API Error:", err);
    setTableData([]);
  } finally {
    setLoading(false);
  }
};

  const handleNewAdd = async () => {
navigate("/Transactions/FrmReceiptKarjat");
  };

  const handleSelect = (receiptNo) => {
    navigate("/Transactions/FrmReceiptKarjat", {
      state: {
        mode: "EDIT",
        receiptNo: receiptNo,
      },
    });
  };

  const headers = [
    "निवडा",
    "रि. नं.",
    "तारीख",
    "चलन/पावती क्र.",
    "व्यवहार प्रकार",
    "झोन",
    "रक्कम",
    "यूजर",
    "तारीख/वेळ",
  ];

  const keyMapping = {
    निवडा: "select",
    "रि. नं.": "receiptNo",
    तारीख: "date",
    "चलन/पावती क्र.": "voucherNo",
    "व्यवहार प्रकार": "type",
    झोन: "zone",
    रक्कम: "amount",
    यूजर: "user",
    "तारीख/वेळ": "createdAt",
  };

  const initialValues = {
    municipality: defaultMunicipality,
    prabhag: "",
  };

  // ---- NEW: Generic search filter across all visible columns ----
 const filteredData = useMemo(() => {
  if (!searchTerm.trim()) return tableData;

  const term = searchTerm.trim().toLowerCase();

  return tableData.filter((row) =>
    Object.values(row).some((val) =>
      String(val ?? "").toLowerCase().includes(term),
    ),
  );
}, [tableData, searchTerm]);

 useEffect(() => {
  if (ulbId && userId) {
    fetchReceiptList();
  }
}, [ulbId, userId]);

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      onSubmit={() => {}}
    >
      {({ values, setFieldValue }) => {
        const tableRows = filteredData.map((row) => {
          return {
            select: (
              <Button
                variant="link"
                size="sm"
                className="text-blue-700 px-0"
                onClick={() => handleSelect(row.receiptNo)}
              >
                निवडा
              </Button>
            ),
            ...row,
          };
        });

        return (
          <Form>
            <motion.div variants={container} initial="hidden" animate="show">
              <Card className="shadow-sm border">
                <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    पावतीची यादी
                  </CardTitle>

                  <Button
                    className="bg-blue-900 text-white w-full sm:w-auto"
                    onClick={handleNewAdd}
                    type="button"
                  >
                    नवीन जोडा
                  </Button>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
                  {loading && (
                    <div className="flex justify-center items-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-t-transparent" />
                    </div>
                  )}

                {!loading && tableData.length > 0 && (
                    <>
                      {/* ---- NEW: Generic Search Field above table ---- */}
                      <div className="flex justify-start">
                        <Input
                          type="text"
                          placeholder="शोधा... (Search)"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full sm:w-100 h-9"
                        />
                      </div>

                      <div className="w-full overflow-x-auto rounded-md border mt-4">
                        <ShadCNTable
                          headers={headers}
                          data={tableRows}
                          keyMapping={keyMapping}
                          pagination={false}
                          className="min-w-[900px]"
                        />
                      </div>

                      {filteredData.length === 0 && (
                        <p className="text-center text-gray-500 mt-4">
                          कोणतेही रेकॉर्ड सापडले नाही
                        </p>
                      )}
                    </>
                  )}

                  {!loading && tableData.length === 0 && (
  <p className="text-center text-gray-500 mt-4">
    डेटा उपलब्ध नाही
  </p>
)}
                </CardContent>
              </Card>
            </motion.div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default FrmReceiptListKarjat;
