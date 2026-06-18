import React, { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Swal from "sweetalert2";

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
  const [defaultMunicipality, setDefaultMunicipality] = useState("");
  const [loading, setLoading] = useState(false);
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

  const fetchZones = async (corpId) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        {
          corp_id: corpId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      setZones(res.data.data || []);
    } catch (err) {
      console.error("Zone API Error:", err);
    }
  };

  const fetchReceiptList = async (zoneId, corpId, userId) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/receiptList`,
        {
          ddl_ZoneID: zoneId,
          ddl_ULB_ID: corpId,
          ddl_USER_ID: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
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
    } finally {
      setLoading(false);
    }
  };

  const handleNewAdd = async () => {
    try {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/Receipt/usermapdetails`,
        {
          userId: user?.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const count = res.data?.data?.count || 0;
      if (count > 0 && userId === "JCMCSC01") {
        navigate("/Transactions/FrmReceiptJcmcSC", {
          state: {
            userMapData: res.data.data.data,
          },
        });
      } else if (count > 0) {
        navigate("/Transactions/FrmReceiptJcmc", {
          state: {
            userMapData: res.data.data.data,
          },
        });
      } else {
        navigate("/Transactions/FrmReceipt");
      }
    } catch (err) {
      console.error("User Map Details Error:", err);

      Swal.fire({
        icon: "error",
        text: "Failed to fetch user mapping details",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      Swal.close();
    }
  };

  const handleSelect = async (receiptNo) => {
    debugger;
    try {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/Receipt/usermapdetails`,
        {
          userId: user?.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const count = res.data?.data?.count || 0;
      if (count > 0 && userId === "JCMCSC01") {
        navigate("/Transactions/FrmReceiptJcmcSC", {
          state: {
            mode: "EDIT",
            receiptNo,
            userMapData: res.data.data.data,
          },
        });
      } else if (count > 0) {
        navigate("/Transactions/FrmReceiptJcmc", {
          state: {
            mode: "EDIT",
            receiptNo,
            userMapData: res.data.data.data,
          },
        });
      } else {
        navigate("/Transactions/FrmReceipt", {
          state: {
            mode: "EDIT",
            receiptNo,
          },
        });
      }
    } catch (err) {
      console.error("User Map Details Error:", err);

      Swal.fire({
        icon: "error",
        text: "Failed to fetch user mapping details",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      Swal.close();
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
    municipality: defaultMunicipality,
    prabhag: "",
  };

  useEffect(() => {
    if (ulbId) {
      fetchCorporations();
    }
  }, [ulbId]);

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      onSubmit={() => {}}
    >
      {({ values, setFieldValue }) => {
        const tableRows = tableData.map((row) => {
          console.log("row: ", row);
          return {
            select: (
              <Button
                variant="link"
                size="sm"
                className="text-blue-700 px-0"
                onClick={() => handleSelect(row.receiptNo)}
                // onClick={handleNewAdd}
              >
                निवडा
              </Button>
            ),
            ...row,
          };
        });

        return (
          <Form>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              // className="min-h-screen bg-gray-100 p-4 sm:p-6"
            >
              <Card className="shadow-sm border">
                <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    पावतीची यादी
                  </CardTitle>

                  <Button
                    className="bg-blue-900 text-white w-full sm:w-auto"
                    onClick={handleNewAdd}
                  >
                    नवीन जोडा
                  </Button>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
                  <motion.div
                    variants={item}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="sm:w-32 font-medium">महानगरपालिका</span>

                      <div className="flex items-center gap-2 flex-1">
                        <span className="hidden sm:block">:</span>

                        <Select
                          value={values.municipality}
                          onValueChange={(val) => {
                            setFieldValue("municipality", val);
                            fetchZones(val);
                          }}
                          disabled
                        >
                          <SelectTrigger className="w-full h-9">
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
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="sm:w-32 font-medium">प्रभाग</span>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="hidden sm:block">:</span>
                        <Select
                          value={values.prabhag}
                          onValueChange={(val) => {
                            setFieldValue("prabhag", val);
                            fetchReceiptList(val, values.municipality, userId);
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
                    </div>
                  </motion.div>

                  {loading && (
                    <div className="flex justify-center items-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-t-transparent" />
                    </div>
                  )}

                  {!loading && values.prabhag && tableData.length > 0 && (
                    <div className="w-full overflow-x-auto rounded-md border mt-4">
                      <ShadCNTable
                        headers={headers}
                        data={tableRows}
                        keyMapping={keyMapping}
                        pagination={false}
                        className="min-w-[900px]"
                      />
                    </div>
                  )}

                  {!loading && values.prabhag && tableData.length === 0 && (
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
