import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Formik, Form } from "formik";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";

import { useAuth } from "@/context/AuthContext";

import SearchableSelect from "@/components/SearchableSelect";

import ShadCNTable from "@/components/ui/table";

const container = {
  hidden: { opacity: 0, y: 20 },

  show: {
    opacity: 1,
    y: 0,

    transition: {
      staggerChildren: 0.08,
    },
  },
};

const FrmLedgerDetailRpt = () => {
  const { user } = useAuth();

  const token = user?.token;

  const ulbId = user?.ulbId;

  const navigate = useNavigate();

  const location = useLocation();

  const { data } = location.state || {};

  console.log("data: ", data);

  const formikRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zones, setZones] = useState([]);

  const [glCodes, setGlCodes] = useState([]);

  const [ledgerOptions, setLedgerOptions] = useState([]);

  const [monthlyData, setMonthlyData] = useState([]);

  const [dailyData, setDailyData] = useState([]);

  const [transactionData, setTransactionData] = useState([]);

  const [viewType, setViewType] = useState("monthly");

  const [selectedMonth, setSelectedMonth] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);

  const [monthlyLoading, setMonthlyLoading] = useState(false);

  const [dailyLoading, setDailyLoading] = useState(false);

  const [transactionLoading, setTransactionLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showMonthlyTable, setShowMonthlyTable] = useState(true);

  const initialFormValues = {
    prabhag: "-1",
    deptCode: "",  
    ledger: "",   
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;

    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");

    const month = d
      .toLocaleString("en", {
        month: "short",
      })
      .toUpperCase();

    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") {
      return "";
    }

    return Number(num).toLocaleString("en-IN");
  };

  const fetchZones = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
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
      console.error(err);
    }
  };

  const fetchGLCodes = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/Receipt/searchGLALL`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res?.data?.data) {
        const formatted = res.data.data.map((g) => ({
          label: g.GLSEARCHNAME,
          value: String(g.GLFUNCTION),
        }));

        console.log("Formatted GLCodes: ", formatted);

        setGlCodes(formatted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLedger = async (glcode) => {
    try {
      if (!glcode || !ulbId) return;

      const res = await axios.post(
        `${BASE_URL}/api/FrmTransfer/credit-leasure`,
        {
          corp_id: Number(ulbId),
          glcode: Number(glcode),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res?.data?.data?.success) {
        const formatted = res.data.data.rows.map((l) => ({
          label: l.ACCNAME,
          value: String(l.OBJECTCODE),
        }));

        console.log("Formatted Ledger: ", formatted);

        setLedgerOptions(formatted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (ulbId) {
        fetchZones();
        fetchGLCodes();
    }
  }, [ulbId]);

  useEffect(() => {
    if (data?.FUNCTIONCODE) {
      fetchLedger(data.FUNCTIONCODE);
    }
  }, [data]);

  useEffect(() => {
    if (
        data &&
        glCodes.length > 0 &&
        ledgerOptions.length > 0 &&
        formikRef.current
    ) {
        const matchedDept = glCodes.find(
        (g) =>
            String(g.value).trim() ===
            String(data.FUNCTIONCODE).trim()
        );

        const matchedLedger = ledgerOptions.find(
        (l) =>
            String(l.value).trim() ===
            String(data.OBJECTCODE).trim()
        );

        console.log("Matched Dept:", matchedDept);
        console.log("Matched Ledger:", matchedLedger);

        if (matchedDept) {
        formikRef.current.setFieldValue("deptCode", matchedDept.value);
        }
        
        if (matchedLedger) {
        formikRef.current.setFieldValue("ledger", matchedLedger.value);
        }
        
        setIsInitialized(true);
    }
  }, [data, glCodes, ledgerOptions]);

  useEffect(() => {
    if (
        isInitialized &&
        formikRef.current?.values?.deptCode &&
        formikRef.current?.values?.ledger &&
        glCodes.length > 0 &&
        ledgerOptions.length > 0
    ) {
        handleMonthlySummary(formikRef.current.values);
    }
  }, [isInitialized, formikRef.current?.values?.deptCode, formikRef.current?.values?.ledger, glCodes, ledgerOptions]);
  

  const handleMonthlySummary = async (values = null) => {
    try {
      setMonthlyLoading(true);

      const formValues = values || formikRef.current?.values;

      const payload = {
        glcode: Number(formValues?.deptCode),

        accno: Number(formValues?.ledger),

        zoneId: formValues?.prabhag || "0",

        grampanchId: "0",
      };

      console.log("Monthly Payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/api/BankBalRpt/monthly-summary`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const list = res.data?.data?.list || [];

      let runningBalance = 0;

      const formatted = list.map((row, index) => {
        let opening = 0;

        const debit = Number(row.DEBIT || 0);

        const credit = Number(row.CREDIT || 0);

        if (index === 0) {
          opening = Number(row.OPENINGBAL || 0);
        } else {
          opening = runningBalance;
        }

        runningBalance = opening + debit + credit;

        return {
          month: (
            <Button
              variant="link"
              className="text-blue-700 px-0"
              onClick={() =>
                handleDailySummary(row.TRNS_MONTH)
              }
            >
              {row.TRNS_MONTH}
            </Button>
          ),

          opening: formatNumber(opening),

          credit: formatNumber(credit),

          debit: formatNumber(debit),

          balance: formatNumber(runningBalance),
        };
      });

      setMonthlyData(formatted);
    } catch (err) {
      console.error(err);

      Swal.fire({
        text: "Monthly Summary Data Error",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setMonthlyLoading(false);
    }
  };

  const handleDailySummary = async (month) => {
    try {
      setDailyLoading(true);
      setSelectedMonth(month);
      setViewType("daily");     
      setTransactionData([]);
      setShowMonthlyTable(false);

      const [mon, year] = month.split("-");

      const monthIndex = new Date(
        `${mon} 1, ${year}`
      ).getMonth();

      const fromDate = new Date(year, monthIndex, 1);

      const toDate = new Date(year, monthIndex + 1, 0);

      const formValues = formikRef.current?.values;

      const payload = {
        ulbId: Number(ulbId),
        glcode: Number(formValues?.deptCode),
        accno: Number(formValues?.ledger),
        fromDate: formatDateForAPI(fromDate),
        toDate: formatDateForAPI(toDate),
        zoneId: formValues?.prabhag || "0",
        grampanchId: "0",
      };

      console.log("Daily Payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/api/BankBalRpt/daily-summary`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const list = res.data?.data?.list || [];

      let runningBalance = 0;

      const formatted = list.map((row, index) => {
        let opening = 0;

        const debit = Number(row.DEBIT || 0);

        const credit = Number(row.CREDIT || 0);

        if (index === 0) {
          opening = Number(row.OPENINGBAL || 0);
        } else {
          opening = runningBalance;
        }

        runningBalance = opening + debit + credit;

        return {
          date: (
            <Button
              variant="link"
              className="text-blue-700 px-0"
              onClick={() =>
                handleTransactionDetails(row.TRNS_DATE)
              }
            >
              {new Date(
                row.TRNS_DATE
              ).toLocaleDateString("en-GB")}
            </Button>
          ),

          opening: formatNumber(opening),

          credit: formatNumber(credit),

          debit: formatNumber(debit),

          balance: formatNumber(runningBalance),

          type: runningBalance < 0 ? "Dr" : "Cr",
        };
      });

      setDailyData(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setDailyLoading(false);
    }
  };

  const handleTransactionDetails = async (date) => {
    try {
      setTransactionLoading(true);
      setSelectedDate(date);
      setViewType("transaction");
      setShowMonthlyTable(false);

      const formValues = formikRef.current?.values;

      const payload = {
        ulbId: Number(ulbId),

        glcode: Number(formValues?.deptCode),

        accno: Number(formValues?.ledger),

        fromDate: formatDateForAPI(date),

        toDate: formatDateForAPI(date),

        zoneId: formValues?.prabhag || "0",

        grampanchId: "0",
      };

      console.log("Transaction Payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/api/BankBalRpt/transaction-details`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const list = res.data?.data?.list || [];

      const formatted = [];

      let runningBalance = Number(
        list[0]?.OPENINGBAL || 0
      );

      if (list.length > 0) {
        formatted.push({
          trnsDate: new Date(
            date
          ).toLocaleDateString("en-GB"),

          transNo: "",

          narration: "Opening Balance",

          chqNo: "",

          chqDate: "",

          credit: "",

          debit: "",

          balance: formatNumber(runningBalance),

          type: "",
        });
      }

      list.forEach((row) => {
        const debit = Number(row.DEBIT || 0);

        const credit = Number(row.CREDIT || 0);

        runningBalance += debit + credit;

        formatted.push({
          trnsDate: new Date(
            row.TRNSDATE
          ).toLocaleDateString("en-GB"),

          transNo: row.TRANSNO,

          narration: row.NARRATION,

          chqNo: row.CHQNO,

          chqDate: row.CHQDATE
            ? new Date(
                row.CHQDATE
              ).toLocaleDateString("en-GB")
            : "",

          credit: formatNumber(credit),

          debit: formatNumber(debit),

          balance: formatNumber(runningBalance),

          type: row.TYPE,
        });
      });

      setTransactionData(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setTransactionLoading(false);
    }
  };

  const prabhagOptions = [
    {
      value: "-1",
      label: "-- ALL --",
    },

    ...(zones.map((z) => ({
      value: z.ZONEID?.toString(),

      label: z.ZONEENAME,
    })) || []),
  ];

  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialFormValues}
      enableReinitialize
    >
      {({ values, setFieldValue }) => {
        console.log("Current form values:", values); 
        console.log("deptCode:", values.deptCode, "ledger:", values.ledger);

        return (
          <Form>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
            >
              <Card className="shadow-sm border">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    Ledger Details Report
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="प्रभाग" />
                        <span>:</span>
                      </div>

                      <Select
                        value={values.prabhag}
                        onValueChange={(v) =>
                          setFieldValue("prabhag", v)
                        }
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {prabhagOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="विभाग संकेतांक." />
                        <span>:</span>
                      </div>

                      <SearchableSelect
                        options={glCodes}
                        value={values.deptCode}
                        onChange={(option) => {
                            setFieldValue("deptCode", option?.value || "");  
                            setFieldValue("ledger", "");                   
                            fetchLedger(option?.value);
                        }}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="लेखाशीर्ष" />
                        <span>:</span>
                      </div>

                      <SearchableSelect
                        options={ledgerOptions}
                        value={values.ledger}
                        onChange={(option) =>
                            setFieldValue("ledger", option?.value || "") 
                        }
                        className="w-full h-9"
                      />
                    </div>
                  </div>

                    {showMonthlyTable && monthlyData.length > 0 && (
                    <div className="border rounded-lg bg-white mb-6">
                        {monthlyLoading ? (
                        <div className="p-4 text-center">Loading...</div>
                        ) : (
                        monthlyData.length > 0 && (
                            <ShadCNTable
                            headers={[
                                "Month",
                                "Opening",
                                "Credit",
                                "Debit",
                                "Balance",
                            ]}
                            data={monthlyData}
                            keyMapping={{
                                Month: "month",
                                Opening: "opening",
                                Credit: "credit",
                                Debit: "debit",
                                Balance: "balance",
                            }}
                            />
                        )
                        )}
                    </div>
                    )}

                    {viewType === "daily" && dailyData.length > 0 && (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setViewType("monthly");
                                setShowMonthlyTable(true);
                            }}
                        >
                            Back
                        </Button>

                        <div className="border rounded-lg bg-white mb-6">
                            {dailyLoading ? (
                            <div className="p-4 text-center">Loading...</div>
                            ) : (
                            <ShadCNTable
                                headers={[
                                "Date",
                                "Opening",
                                "Credit",
                                "Debit",
                                "Balance",
                                "Dr/Cr",
                                ]}
                                data={dailyData}
                                keyMapping={{
                                Date: "date",
                                Opening: "opening",
                                Credit: "credit",
                                Debit: "debit",
                                Balance: "balance",
                                "Dr/Cr": "type",
                                }}
                            />
                            )}
                        </div>
                    </>

                    
                    )}

                    {viewType === "transaction" && transactionData.length > 0 && (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                setViewType("daily");
                                }}
                            >
                                Back
                            </Button>

                            <div className="border rounded-lg bg-white">
                                    {transactionLoading ? (
                                    <div className="p-4 text-center">Loading...</div>
                                    ) : (
                                    <ShadCNTable
                                        headers={[
                                        "TrnsDate",
                                        "TransNo",
                                        "Description",
                                        "ChqNo",
                                        "Cheque Date",
                                        "Credit",
                                        "Debit",
                                        "Balance",
                                        "Cr/Dr",
                                        ]}
                                        data={transactionData}
                                        keyMapping={{
                                        TrnsDate: "trnsDate",
                                        TransNo: "transNo",
                                        Description: "narration",
                                        ChqNo: "chqNo",
                                        "Cheque Date": "chqDate",
                                        Credit: "credit",
                                        Debit: "debit",
                                        Balance: "balance",
                                        "Cr/Dr": "type",
                                        }}
                                    />
                                    )}
                            </div>
                        </>
                    
                    )}

                

                  <div className="flex justify-center gap-4">
                    <Button
                        type="button"
                        disabled={monthlyLoading || dailyLoading || transactionLoading}
                        onClick={async () => {

                        await handleMonthlySummary();

                        setShowMonthlyTable(true);

                        }}
                        >
                        प्रक्रिया
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                        navigate("/HomePage/FrmHomePage")
                        }
                    >
                        बाहेर
                    </Button>
                </div>
                </CardContent>
              </Card>
            </motion.div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default FrmLedgerDetailRpt;