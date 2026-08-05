import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

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
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/calendar";
import ShadCNTable from "@/components/ui/table";

import { useAuth } from "@/context/AuthContext";
import config from "@/utils/config";

const initialValues = {
  zoneId: "-1",
  fromDate: new Date(),
  toDate: new Date(),
  userId: "-1",
};

const FrmVoucherAuthList = () => {
  const { user } = useAuth();

  const token = user?.token;
  const ulbId = user?.ulbId;
  const deptId = config.deptId;

  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zoneList, setZoneList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [searched, setSearched] = useState(false);

  const headers = [
    "निवडा",
    "व्यवहार क्र",
    "व्यवहार दिनांक",
    "व्यवहार प्रकार",
    "प्रभाग",
    "धनादेश क्र",
    "धनादेश दिनांक",
  ];

  const keyMapping = {
    निवडा: "select",
    "व्यवहार क्र": "voucherNo",
    "व्यवहार दिनांक": "voucherDate",
    "व्यवहार प्रकार": "voucherType",
    प्रभाग: "zoneName",
    "धनादेश क्र": "chequeNo",
    "धनादेश दिनांक": "chequeDate",
  };

  const columnStyles = {
    निवडा: { width: "80px" },
    "व्यवहार क्र": { width: "150px" },
    "व्यवहार दिनांक": { width: "140px" },
    "व्यवहार प्रकार": { width: "220px" },
    प्रभाग: { width: "150px" },
    "धनादेश क्र": { width: "150px" },
    "धनादेश दिनांक": { width: "150px" },
  };

  const formatPayloadDate = (date) => {
    const d = new Date(date);

    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
  };

  const formatDisplayDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB");
  };

  // ==========================
  // Navigate to Auth Page
  // ==========================

  const handleSelectVoucher = (row) => {
    navigate("/Transactions/FrmVoucherAuth", {
      state: {
        mode: 2,
        vchTransNo: row.vchTransNo,
      },
    });
  };

  // ==========================
  // Load Zones
  // ==========================

  const fetchZones = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        {
          corp_id: ulbId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data?.ok) {
        setZoneList(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================
  // Load Users
  // ==========================

  const fetchUsers = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmTransAuthList/user-list`,
        {
          ulbId,
          deptId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data?.success) {
        setUserList(res.data.rows || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================
  // Voucher List
  // ==========================

  const fetchVoucherList = async (values) => {
    try {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        ulbId: Number(ulbId),
        fromDate: formatPayloadDate(values.fromDate),
        toDate: formatPayloadDate(values.toDate),
        zoneId: values.zoneId !== "-1" ? Number(values.zoneId) : null,
        userId: values.userId !== "-1" ? Number(values.userId) : null,
      };

      const res = await axios.post(
        `${BASE_URL}/api/FrmVoucherAuth/voucher-auth-list`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Swal.close();

      if (!res.data?.ok) {
        setTableData([]);
        return;
      }

      const rows = (res.data.data?.data || []).map((item) => ({
        vchTransNo: item.VCHTRANSNO,

        voucherNo: item.VCHTRANSNO,

        voucherDate: formatDisplayDate(item.TRANSDATE),

        voucherType: item.TRANSTYPE,

        zoneName: item.DEPTNAME || "-",

        chequeNo: item.CHQNO || "-",

        chequeDate: item.CHQDATE ? formatDisplayDate(item.CHQDATE) : "-",
      }));

      console.log("Fetched Voucher List:", rows);

      setTableData(rows);
    } catch (err) {
      Swal.close();

      console.error(err);

      setTableData([]);
    }
  };

  useEffect(() => {
    if (ulbId) {
      fetchZones();
      fetchUsers();
    }
  }, [ulbId]);

  const handleSubmit = async (values) => {
    setSearched(true);
    await fetchVoucherList(values);
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setFieldValue }) => {
        const tableRows = tableData.map((row) => ({
          select: (
            <Button
              variant="link"
              size="sm"
              className="text-blue-700 font-medium px-0 hover:text-blue-900"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectVoucher(row);
              }}
            >
              निवडा
            </Button>
          ),

          voucherNo: row.voucherNo,
          voucherDate: row.voucherDate,
          voucherType: row.voucherType,
          zoneName: row.zoneName,
          chequeNo: row.chequeNo,
          chequeDate: row.chequeDate,
        }));

        return (
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

                <CardContent className="space-y-5 p-5">
                  {/* Filters */}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 flex justify-between">
                        <Label text="प्रभाग" />
                        <span>:</span>
                      </div>

                      <Select
                        value={values.zoneId}
                        onValueChange={(value) =>
                          setFieldValue("zoneId", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="-- ALL --" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="-1">-- ALL --</SelectItem>

                          {zoneList.map((zone) => (
                            <SelectItem
                              key={zone.ZONEID}
                              value={zone.ZONEID.toString()}
                            >
                              {zone.ZONEENAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 flex justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={showPendingOnly}
                            onCheckedChange={(checked) =>
                              setShowPendingOnly(checked === true)
                            }
                          />

                          <Label text="दिनांक पासून" />
                        </div>

                        <span>:</span>
                      </div>

                      <DatePicker
                        value={values.fromDate}
                        onChange={(date) => setFieldValue("fromDate", date)}
                        className="w-full"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 flex justify-between">
                        <Label text="दिनांक पर्यंत" />

                        <span>:</span>
                      </div>

                      <DatePicker
                        value={values.toDate}
                        onChange={(date) => setFieldValue("toDate", date)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 flex justify-between">
                        <Label text="वापरकर्ता" />

                        <span>:</span>
                      </div>

                      <Select
                        value={values.userId}
                        onValueChange={(value) =>
                          setFieldValue("userId", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="-1">-- ALL --</SelectItem>

                          {userList.map((user) => (
                            <SelectItem key={user.USERID} value={user.USERID}>
                              {user.USERNAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      className="bg-blue-900 hover:bg-blue-800"
                    >
                      व्हाउचर शोध
                    </Button>
                  </div>

                  {searched && (
                    <div className="mt-6">
                      {tableRows.length > 0 ? (
                        <ShadCNTable
                          headers={headers}
                          data={tableRows}
                          keyMapping={keyMapping}
                          columnStyles={columnStyles}
                          pagination
                          rowsPerPage={10}
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No records found.
                        </div>
                      )}
                    </div>
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

export default FrmVoucherAuthList;
