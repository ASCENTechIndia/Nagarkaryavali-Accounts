import React, { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const FrmReceiptList = () => {
  const [tableData, setTableData] = useState([]);
  const [corporations, setCorporations] = useState([]);
  const [zones, setZones] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const ulbId = user?.ulbId;

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  console.log("usertokan :", user.token);
  console.log("BASE_URL:", BASE_URL);


  const fetchCorporations = async (setFieldValue) => {
    try {
      debugger;
      const res = await axios.post(`${BASE_URL}/api/Receipt/corporation`, {
        corp_id: ulbId,
      },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      console.log("res :", res)
      const corpData = res.data.data || [];
      setCorporations(corpData);

      if (corpData.length > 0) {
        const defaultCorp = corpData[0].CORPORATIONID.toString();

        setFieldValue("municipality", defaultCorp);

        fetchZones(defaultCorp);
      }

    } catch (err) {
      console.error("Corporation API Error:", err);
    }
  };

  const fetchZones = async (corpId) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/Receipt/zones`, {
        corp_id: corpId,
      },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setZones(res.data.data || []);
    } catch (err) {
      console.error("Zone API Error:", err);
    }
  };

  const fetchReceiptList = async (zoneId, corpId) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/Receipt/receiptList`, {
        ddl_ZoneID: zoneId,
        ddl_ULB_ID: corpId,
      },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const formatted = (res.data.data || []).map((item) => ({
        receiptNo: item.REFNO,
        date: new Date(item.TRNSDATE).toLocaleDateString("en-GB"),
        voucherNo: item.DOCNO,
        type: item.TRNSTYPE,
        zone: item.ZONENAME,
        amount: item.AMOUNT,
        user: item.USERNAME,
        createdAt: new Date(item.DATETIME).toLocaleDateString("en-GB"),
      }));

      setTableData(formatted);
    } catch (err) {
      console.error("Receipt API Error:", err);
      setTableData([]);
    }
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
    municipality: "",
    prabhag: "",
  };

  return (
    <Formik initialValues={initialValues} onSubmit={() => { }}>
      {({ values, setFieldValue }) => {

        useEffect(() => {
          fetchCorporations(setFieldValue);
        }, []);

        const tableRows = tableData.map((row) => ({
          select: (
            <Button
              variant="link"
              size="sm"
              className="text-blue-700 px-0"
              onClick={() =>
                navigate("/Transactions/FrmReceipt", {
                  state: {
                    mode: "EDIT",
                    receiptNo: row.receiptNo,
                  },
                })
              }
            >
              निवडा
            </Button>
          ),
          ...row,
        }));

        return (
          <Form>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
            // className="min-h-screen bg-gray-100 p-4 sm:p-6"
            >
              <Card className="shadow-sm border">
                <CardContent className="p-4 sm:p-6 space-y-4">

                  <motion.h2 variants={item} className="text-lg font-semibold">
                    पावतीची यादी
                  </motion.h2>

                  <hr className="mb-2" />

                  <motion.div variants={item}>
                    <Button
                      className="bg-blue-900 text-white text-sm"
                      onClick={() => navigate("/Transactions/FrmReceipt")}
                    >
                      नवीन जोडा
                    </Button>
                  </motion.div>

                  <motion.div
                    variants={item}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-32">नगरपालिका</span>
                      <span>:</span>

                      <Select
                        value={values.municipality}
                        onValueChange={(val) => {
                          setFieldValue("municipality", val);
                          fetchZones(val);
                        }}
                        disabled
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="-- निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {corporations.map((c) => (
                            <SelectItem
                              key={c.CORPORATIONID}
                              value={c.CORPORATIONID.toString()}
                            >
                              {c.CORPORATIONNAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-32">प्रभाग</span>
                      <span>:</span>

                      <Select
                        value={values.prabhag}
                        onValueChange={(val) => {
                          setFieldValue("prabhag", val);
                          fetchReceiptList(val, values.municipality);
                        }}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map((z) => (
                            <SelectItem
                              key={z.ZONEID}
                              value={z.ZONEID.toString()}
                            >
                              {z.ZONEENAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>

                  {values.prabhag && tableData.length > 0 && (
                    <div className="w-full overflow-x-auto border mt-4">
                      <ShadCNTable
                        headers={headers}
                        data={tableRows}
                        keyMapping={keyMapping}
                        pagination={false}
                      />
                    </div>
                  )}

                  {values.prabhag && tableData.length === 0 && (
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

export default FrmReceiptList;