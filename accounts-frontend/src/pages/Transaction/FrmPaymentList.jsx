import React, { useState } from "react";
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
  const navigate = useNavigate(); // 🔥 IMPORTANT

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

  // Dummy Data
  const mockData = {
    1: [
      {
        srNo: "40328",
        transactionDate: "25/03/2026",
        referenceNo: "1234",
        type: "बँक पेमेंट",
        zone: "Ho",
        amount: "5000",
        user: "MMCDTU",
        date: "25/03/2026",
      },
    ],
    2: [],
  };

  const initialValues = {
    municipality: "1",
    zone: "",
  };

  return (
    <Formik initialValues={initialValues} onSubmit={() => {}}>
      {({ values, setFieldValue }) => {

        // 🔥 Inject Select Button into table
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
                    srNo: row.srNo,
                    referenceNo: row.referenceNo,
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

                  {/* Title */}
                  <motion.h2 variants={item} className="text-lg font-semibold">
                    पेमेंट यादी
                  </motion.h2>

                  <hr />

                  {/* Add Button */}
                  <motion.div variants={item}>
                    <Button className="bg-blue-900 text-white text-sm" path="/Transactions/FrmPayment">
                      नवीन जोडा
                    </Button>
                  </motion.div>

                  {/* Filters */}
                  <motion.div
                    variants={item}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                  >
                    {/* Municipality */}
                    <div className="flex items-center gap-2">
                      <span className="w-32">नगरपालिका</span>
                      <span>:</span>
                      <Select
                        value={values.municipality}
                        onValueChange={(val) =>
                          setFieldValue("municipality", val)
                        }
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">
                            माळगाव महानगरपालिका माळगाव
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Zone */}
                    <div className="flex items-center gap-2">
                      <span className="w-32">झोन</span>
                      <span>:</span>
                      <Select
                        value={values.zone}
                        onValueChange={(val) => {
                          setFieldValue("zone", val);
                          setTableData(mockData[val] || []);
                        }}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Ho</SelectItem>
                          <SelectItem value="2">Zone 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>

                  {/* TABLE */}
                  {values.zone && tableData.length > 0 && (
                    <div className="w-full overflow-x-auto border mt-4">
                      <ShadCNTable
                        headers={headers}
                        data={tableRows} // 🔥 IMPORTANT
                        keyMapping={keyMapping}
                        pagination={false}
                      />
                    </div>
                  )}

                  {/* No Data */}
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