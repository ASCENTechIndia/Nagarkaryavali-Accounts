import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ShadCNTable from "@/components/ui/table";

import { useAuth } from "@/context/AuthContext";

const initialValues = {
  remark: "",
};

const FrmVoucherAuth = () => {
  const { user } = useAuth();

  const token = user?.token;
  const ulbId = user?.ulbId;
  const userId = user?.userId;

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const navigate = useNavigate();
  const location = useLocation();

  const { mode, vchTransNo } = location.state || {};

  const [voucherInfo, setVoucherInfo] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const headers = [
    "संदर्भ क्र.",
    "दिनांक",
    "व्हाउचर नं.",
    "प्रभाग",
    "रक्कम",
    "पार्टी",
    "युजर",
    "दिनांक/ वेळ",
  ];

  const keyMapping = {
    "संदर्भ क्र.": "refNo",
    दिनांक: "date",
    "व्हाउचर नं.": "voucherNo",
    प्रभाग: "zone",
    रक्कम: "amount",
    पार्टी: "partyName",
    युजर: "userName",
    "दिनांक/ वेळ": "dateTime",
  };

  const columnStyles = {
    "संदर्भ क्र.": { width: "120px" },
    दिनांक: { width: "120px" },
    "व्हाउचर नं.": { width: "120px" },
    प्रभाग: { width: "150px" },
    रक्कम: { width: "120px" },
    पार्टी: { width: "250px" },
    युजर: { width: "170px" },
    "दिनांक/ वेळ": { width: "170px" },
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB");
  };

  const formatDateTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-GB");
  };

  // ==========================
  // Voucher Details
  // ==========================

  const fetchVoucherDetails = async () => {
    try {
      setTableLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/FrmVoucherAuth/voucher-auth-by-id`,
        {
          vchTransNo: Number(vchTransNo),
          ulbId: Number(ulbId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.data?.ok) {
        setTableData([]);
        return;
      }

      const rows = res.data.data?.data || [];

      if (rows.length > 0) {
        setVoucherInfo(rows[0]);
      }

      const mapped = rows.map((item) => ({
        refNo: item.REFNO,
        date: formatDate(item.TRNSDATE),
        voucherNo: item.VCHNO,
        zone: item.ZONENAME || "-",
        amount: Number(item.AMOUNT).toLocaleString("en-IN"),
        partyName: item.PARTYNAME || "-",
        userName: item.USERNAME || "-",
        dateTime: formatDateTime(item.DATETIME),
      }));

      setTableData(mapped);
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to fetch voucher details.",
      });

      setTableData([]);
    } finally {
      setTableLoading(false);
    }
  };
  useEffect(() => {
    if (!mode || !vchTransNo) {
      navigate("/Transactions/FrmVoucherAuthList");
      return;
    }

    if (ulbId) {
      fetchVoucherDetails();
    }
  }, [mode, ulbId, vchTransNo]);

  // ==========================
  // Authorize Voucher
  // ==========================

  const handleSubmit = async (values) => {
    try {
      Swal.fire({
        title: "Authorizing...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        ulbId: Number(ulbId),
        userId,
        vchTransNo: Number(vchTransNo),
        refNo: voucherInfo?.REFNO,
        remark: values.remark,
        status: "A",
      };

      const res = await axios.post(
        `${BASE_URL}/api/FrmVoucherAuth/voucher-approval`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Swal.close();

      if (res.data?.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data.message,
        }).then(() => {
          navigate("/Transactions/FrmVoucherAuthList");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data.message,
        });
      }
    } catch (err) {
      Swal.close();

      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Authorization failed.",
      });
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, handleChange }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-2 sm:px-4 mt-4 sm:mt-6"
          >
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  प्रमाणक अधिकृतता
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6 p-5">
                {/* Voucher Details */}

                <div className="border rounded-md">
                  {tableLoading ? (
                    <div className="flex items-center justify-center h-52">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />

                        <p className="text-sm text-gray-500">
                          Loading voucher details...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ShadCNTable
                      headers={headers}
                      data={tableData}
                      keyMapping={keyMapping}
                      columnStyles={columnStyles}
                      pagination={false}
                    />
                  )}
                </div>

                {/* Remark */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-36 flex justify-between">
                      <Label text="Remark" />

                      <span>:</span>
                    </div>

                    <Input
                      name="remark"
                      value={values.remark}
                      onChange={handleChange}
                      placeholder="Enter Remark"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Buttons */}

                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    type="submit"
                    className="bg-green-700 hover:bg-green-800"
                  >
                    Authorize
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/Transactions/FrmVoucherAuthList")}
                  >
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Form>
      )}
    </Formik>
  );
};

export default FrmVoucherAuth;
