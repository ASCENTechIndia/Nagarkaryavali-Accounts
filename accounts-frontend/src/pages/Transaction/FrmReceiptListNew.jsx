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

const FrmReceiptListNew = () => {
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
        `${BASE_URL}/api/FrmUserTax/list
`,
        {
          userId: userId
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const formatted = (res.data.data.data || []).map((item) => ({
        mainId: item.MAIN_ID,
        // date: new Date(item.TRNSDATE).toLocaleDateString("en-GB"),
        userId: item.USER_ID,
        wardId: item.WARD_ID,
        transTypeID: item.TRANS_TYPE_ID,
        receiptNo: item.RECEIPT_NO,
        glCode: item.GL_CODE,
        accountNo: item.ACCOUNT_NO,
        deptId: item.DEPT_ID,
        remarks: item.REMARKS,
        createdBy: item.CREATED_BY,
        createdAt: new Date(item.CREATED_DATE).toLocaleDateString("en-GB"),
      }));

      setTableData(formatted);
    } catch (err) {
      console.error("Receipt API Error:", err);
      setTableData([]);
    } finally {
      setLoading(false);
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

      if (count > 0) {
        navigate("/Transactions/FrmReceiptNew", {
          state: {
            mode: "EDIT",
            receiptNo,
            userMapData: res.data.data.data,
          },
        });
      } else {
        navigate("/Transactions/FrmReceiptListNew", {
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
  "वापरकर्ता",
//   "प्रभाग",
//   "व्यवहार प्रकार",
  "पावती क्रमांक",
  "जीएल कोड",
  "खाते क्रमांक",
//   "विभाग",
  "शेरा",
  "तयार केलेली तारीख"
];

const keyMapping = {
  "निवडा": "select",
  "वापरकर्ता": "userId",
//   "प्रभाग": "wardId",
//   "व्यवहार प्रकार": "transTypeID",
  "पावती क्रमांक": "receiptNo",
  "जीएल कोड": "glCode",
  "खाते क्रमांक": "accountNo",
//   "विभाग": "deptId",
  "शेरा": "remarks",
  "तयार केलेली तारीख": "createdAt",
};

  const initialValues = {
    municipality: defaultMunicipality,
    prabhag: "",
  };

  useEffect(() => {
    if (ulbId) {
      fetchCorporations();
    }
    fetchReceiptList(userId);
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
                // onClick={() => handleSelect(row.receiptNo)}
                // onClick={handleNewAdd}
                onClick={() =>
              navigate("/Transactions/FrmReceiptNew", {
                state: {
                  mainId: row.mainId
                 
                },
              })
            }
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
                  Receipt Accountcode Map List
                  </CardTitle>

                  <Button
                  type="button"
                    className="bg-blue-900 text-white w-full sm:w-auto"
                    onClick={() => navigate("/Transactions/FrmReceiptNew")}
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

export default FrmReceiptListNew;
