import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DatePicker } from "@/components/ui/calendar";
import ShadCNTable from "@/components/ui/table";

/* ✅ FIELD */
const Field = ({ label, children }) => (
  <div className="flex items-center gap-3">
    <div className="w-[140px] text-sm font-medium text-right">{label}</div>
    <div>:</div>
    <div className="flex-1">{children}</div>
  </div>
);

const FrmGovtTaxPayment = () => {
  const { user } = useAuth();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zoneList, setZoneList] = useState([]);
  const [glList, setGlList] = useState([]);
  const [creditList, setCreditList] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [showTable, setShowTable] = useState(false);
  /* ✅ API INSTANCE */
  const api = axios.create({ baseURL: BASE_URL });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  /* 🔥 LOAD INITIAL */
  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      const [zonesRes, glRes] = await Promise.all([
        api.post("/api/Receipt/zones", { corp_id: user?.ulbId }),
        api.get("/api/FrmTransfer/gl-codes"),
      ]);

      setZoneList(zonesRes.data?.data || []);
      setGlList(glRes.data?.data?.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* 🔥 LOAD CREDIT */
  const loadCredit = async (glCode) => {
    try {
      const res = await api.post("/api/FrmTransfer/credit-leasure", {
        corp_id: user?.ulbId,
        glcode: Number(glCode),
      });

      setCreditList(res.data?.data?.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* 🔥 DATE FORMAT */
  const formatDate = (date) => (date ? date.toISOString().split("T")[0] : "");

  /* 🔥 SEARCH */
  const handleSubmit = async (values) => {
    try {
      Swal.fire({ title: "Loading...", didOpen: () => Swal.showLoading() });
debugger;
      const payload = {
        glCode: values.glCode,
        fromDate: formatDate(values.fromDate),
        toDate: formatDate(values.toDate),
        ulbId: user?.ulbId?.toString(),
        taxAccno: values.credit,
      };

      const res = await api.post(
        "/api/FrmGovtTaxPayment/govt-tax-payment",
        payload,
      );

      const rows =
        res.data?.data?.rows?.map((r) => ({
          ...r,
          TRNSDATE: r.TRNSDATE?.split("T")[0],
        })) || [];
      console.log("Table Data:", rows);

      setTableData(rows);
      showTable(true);

      Swal.close();
    } catch (err) {
      Swal.close();
      console.error(err);
      Swal.fire("Error fetching data");
    }
  };

  return (
    <Formik
      initialValues={{
        zone: "",
        glCode: "",
        credit: "",
        fromDate: null,
        toDate: null,
      }}
      onSubmit={handleSubmit}
    >
      {({ values, setFieldValue }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-sm border rounded-lg">
              {/* HEADER */}
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  शासकीय कर देयक
                </CardTitle>
              </CardHeader>

              {/* CONTENT */}
              <CardContent className="p-6 space-y-6">
                {/* 🔥 3 COLUMN LAYOUT */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* प्रभाग */}
                  <Field label="प्रभाग">
                    <Select
                      value={values.zone}
                      onValueChange={(v) => setFieldValue("zone", v)}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="निवडा" />
                      </SelectTrigger>
                      <SelectContent>
                        {zoneList.map((z) => (
                          <SelectItem
                            key={z.ZONEID}
                            value={z.ZONEID.toString()}
                          >
                            {z.ZONEENAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* विभाग कोड */}
                  <Field label="विभाग कोड">
                    <Select
                      value={values.glCode}
                      onValueChange={(v) => {
                        setFieldValue("glCode", v);
                        loadCredit(v);
                      }}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="निवडा" />
                      </SelectTrigger>
                      <SelectContent>
                        {glList.map((g) => (
                          <SelectItem
                            key={g.GLCODE}
                            value={g.GLCODE.toString()}
                          >
                            {g.GLNAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* लेखाशिर्ष */}
                  <Field label="लेखाशिर्ष">
                    <Select
                      value={values.credit}
                      onValueChange={(v) => setFieldValue("credit", v)}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="--Select Options--" />
                      </SelectTrigger>
                      <SelectContent>
                        {creditList.map((c) => (
                          <SelectItem key={c.OBJECTCODE} value={c.OBJECTCODE}>
                            {c.ACCNAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* FROM DATE */}
                  <Field label="दिनांक पासून">
                    <DatePicker
                      value={values.fromDate}
                      onChange={(d) => setFieldValue("fromDate", d)}
                    />
                  </Field>

                  {/* TO DATE */}
                  <Field label="दिनांक पर्यंत">
                    <DatePicker
                      value={values.toDate}
                      onChange={(d) => setFieldValue("toDate", d)}
                    />
                  </Field>

                  {/* BUTTON */}
                  <div className="flex items-center">
                    <Button
                      type="submit"
                      className="bg-blue-900 text-white px-6"
                    >
                      हाऊचर शोध
                    </Button>
                  </div>
                </div>

                {/* 🔥 TABLE ALWAYS RENDER */}
                {showTable && (
                  <ShadCNTable
                    headers={[
                      "GLCODE",
                      "ACCNO",
                      "ACCNAME",
                      "PARTYNAME",
                      "TRNSNO",
                      "TRNSDATE",
                      "BILLAMT",
                      "TAXAMT",
                      "BALAMT",
                    ]}
                    data={tableData || []}
                    keyMapping={{
                      GLCODE: "GLCODE",
                      ACCNO: "ACCNO",
                      ACCNAME: "ACCNAME",
                      PARTYNAME: "PARTYNAME",
                      TRNSNO: "TRNSNO",
                      TRNSDATE: "TRNSDATE",
                      BILLAMT: "BILLAMT",
                      TAXAMT: "TAXAMT",
                      BALAMT: "BALAMT",
                    }}
                    pagination={true}
                    rowsPerPage={5}
                  />
                )}
                {showTable && tableData.length === 0 && (
                  <div className="text-center text-red-500 mt-4">
                    No records found
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Form>
      )}
    </Formik>
  );
};

export default FrmGovtTaxPayment;
