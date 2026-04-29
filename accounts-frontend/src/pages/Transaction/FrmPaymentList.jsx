import React, { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { } from "react";
import { useAuth } from "@/context/AuthContext";
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
import Swal from "sweetalert2";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const FrmPaymentList = () => {
  const [tableData, setTableData] = useState([]);
  const [corporations, setCorporations] = useState([]);
  const [defaultMunicipality, setDefaultMunicipality] = useState("");
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const { user } = useAuth();

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const ulbId = user?.ulbId;

  const headers = [
    "निवडा",
    "अनुक्रमांक",
    "व्यवहार दिनांक",
    "प्रमाण क्र.",
    "व्यवहार प्रकार",
    "प्रभाग",
    "रक्कम",
    "वापरकर्ता",
    "दिनांक",
  ];

  const keyMapping = {
    निवडा: "select",
    अनुक्रमांक: "srNo",
    "व्यवहार दिनांक": "transactionDate",
    "प्रमाण क्र.": "referenceNo",
    "व्यवहार प्रकार": "type",
    प्रभाग: "zone",
    रक्कम: "amount",
    वापरकर्ता: "user",
    दिनांक: "date",
  };

  const initialValues = {
    municipality: defaultMunicipality,
    zone: "",
  };

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
        { corp_id: ulbId },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const corpData = res.data.data || [];
      setCorporations(corpData);

      if (corpData.length > 0) {
        const defaultCorp = corpData[0].CORPORATIONID.toString();

        setDefaultMunicipality(defaultCorp);
        fetchZones(defaultCorp);
      }
      Swal.close();
    } catch (err) {
      console.error("Corporation API Error:", err);
    }
  };

  const fetchZones = async (corpId) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: corpId },
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

  const fetchPaymentList = async (zoneId, corpId) => {
    try {
      Swal.fire({
            title: "Loading...",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

      const res = await axios.post(
        `${BASE_URL}/api/frmPayment/payment-list`,
        {
          zoneId: Number(zoneId),
          ulbId: Number(corpId),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const formatted = (res.data?.data?.data || []).map((item) => ({
        srNo: item.REFNO,
        transactionDate: new Date(item.TRNSDATE).toLocaleDateString("en-GB"),
        referenceNo: item.DOCNO,
        type: item.TRNSTYPE,
        zone: item.ZONENAME,
        amount: item.AMOUNT,
        user: item.USERNAME,
        date: new Date(item.DATETIME).toLocaleDateString("en-GB"),
      }));

      setTableData(formatted);
       Swal.close();
    } catch (err) {
      console.error("Payment API Error:", err);
      setTableData([]);
    }
  };

  useEffect(() => {
    if (ulbId && user?.token) {
      fetchCorporations();
    }
  }, [ulbId, user]);

  return (
    <Formik initialValues={initialValues} enableReinitialize onSubmit={() => { }}>
      {({ values, setFieldValue }) => {

        const tableRows = tableData.map((row) => ({
          select: (
            <Button
              variant="link"
              size="sm"
              className="text-blue-700 px-0"
              onClick={() =>
                navigate("/Transactions/FrmPayment", {
                  state: {
                    mode: "EDIT",
                    referenceNo: row.srNo,
                  },
                })
              }
            >
              निवडा
            </Button>
          ),
          srNo: row.srNo,
          transactionDate: row.transactionDate,
          referenceNo: row.referenceNo,
          type: row.type,
          zone: row.zone,
          amount: row.amount,
          user: row.user,
          date: row.date,
        }));

        return (
          <Form>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
            // className=" p-4 sm:p-6"
            >
              <Card className="shadow-sm border">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <motion.h2 variants={item} className="text-lg font-semibold">
                    पेमेंट यादी
                  </motion.h2>

                  <hr />

                  <motion.div variants={item}>
                    <Button
                      className="bg-blue-900 text-white text-sm"
                      onClick={() => navigate("/Transactions/FrmPayment")}
                    >
                      नवीन जोडा
                    </Button>
                  </motion.div>

                  {/* Filters */}
                  <motion.div
                    variants={item}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-32">महानगरपालिका</span>
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
                      <span className="w-32">झोन</span>
                      <span>:</span>
                      <Select
                        value={values.zone}
                        onValueChange={(val) => {
                          setFieldValue("zone", val);
                          fetchPaymentList(val, values.municipality);
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
                              {z.ZONENAME || z.ZONEENAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>

                  {/* TABLE */}
                  {values.zone && tableData.length > 0 && (
                    <div className="w-full overflow-x-auto border mt-4">
                      <ShadCNTable
                        headers={headers}
                        data={tableRows}
                        keyMapping={keyMapping}
                        pagination={false}
                      />
                    </div>
                  )}

                  {values.zone && tableData.length === 0 && (
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

export default FrmPaymentList;