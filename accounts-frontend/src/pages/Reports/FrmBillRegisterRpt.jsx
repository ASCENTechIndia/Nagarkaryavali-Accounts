import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Swal from "sweetalert2";
import { DatePicker } from "@/components/ui/calendar";
import { Formik, Form } from "formik";
import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultiSelect from "@/components/MultiSelect";

const FrmBillRegisterRpt = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [partyOptions, setPartyOptions] = useState([]);
  const [zones, setZones] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [glAllList, setGlAllList] = useState([]);
  const [ledgerOptions, setLedgerOptions] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const formatDate = (date) => {
    const d = new Date(date);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const day = String(d.getDate()).padStart(2, "0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const fetchParties = async () => {
    const res = await axios.post(
      `${BASE_URL}/api/Receipt/party`,
      { ulbid: ulbId },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res?.data?.data) {
      const formatted = res.data.data.map((p) => ({
        label: p.PARTYNAME,
        value: p.NUM_PARTYMST_PARTYID.toString(),
      }));
      setPartyOptions(formatted);
    }
  };

  const fetchZones = async () => {
    const res = await axios.post(
      `${BASE_URL}/api/Receipt/zones`,
      { corp_id: Number(ulbId) },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res?.data?.data) setZones(res.data.data);
  };

  const fetchDepartments = async () => {
    const res = await axios.post(
      `${BASE_URL}/api/Receipt/departments`,
      { ulbid: Number(ulbId) },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res?.data?.data) setDepartments(res.data.data);
  };

  const fetchGLAll = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = res.data.data || [];
      const formatted = data.map((item) => ({
        label: item.GLSEARCHNAME,
        value: item.GLFUNCTION.toString(),
      }));
      setGlAllList(formatted);
    } catch (err) {
      console.error("GL ALL API Error:", err);
    }
  };

  const fetchCreditLeasure = async (glcodes) => {
    try {
      if (!glcodes || glcodes.length === 0) return;

      setLoadingLedger(true);
      setLedgerOptions([]);

      let allLedgers = [];

      for (const code of glcodes) {
        const res = await axios.post(
          `${BASE_URL}/api/FrmTransfer/credit-leasure`,
          {
            corp_id: Number(ulbId),
            glcode: Number(code),
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const data = res.data?.data?.rows || [];

        const formatted = data.map((item) => ({
          label: item.ACCNAME,
          value: item.OBJECTCODE.toString(),
        }));

        allLedgers.push(...formatted);
      }

      const uniqueLedgers = Array.from(
        new Map(allLedgers.map((item) => [item.value, item])).values(),
      );

      setLedgerOptions(uniqueLedgers);
    } catch (err) {
      console.error("Credit Leasure API Error:", err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchParties();
    fetchZones();
    fetchDepartments();
    fetchGLAll();
  }, [ulbId]);

  const handleSubmit = async (values) => {
    if (values.fromDate && values.toDate) {
      try {
        const payload = {
          fromDate: formatDate(values.fromDate),
          toDate: formatDate(values.toDate),
          zoneId: Number(values.prabhag) || null,
          deptId: values.vibhag.map(Number) || [],
          partyId: values.party.map(Number) || [],
          accno: values.ledger.map(Number) || [],
          glcode: values.deptCode.map(Number) || [],
          ulbid: Number(ulbId),
        };

        Swal.fire({
          title: "Generating PDF...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const res = await axios.post(
          `${BASE_URL}/api/FrmBillRegisterRpt/bill-register-report-pdf`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        Swal.close();

        if (res.data?.success) {
          const pdfUrl = res.data.pdfUrl;

          if (pdfUrl) {
            window.open(pdfUrl, "_blank");
          }

          Swal.fire({
            text: res.data?.message,
            confirmButtonColor: "#1e3a8a",
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          text: "No Records found",
          confirmButtonColor: "#1e3a8a",
        });
      }
    } else {
      Swal.fire({
        text: "Please select Date",
        confirmButtonColor: "#1e3a8a",
      });
    }
  };

  return (
    <Formik
      initialValues={{
        fromDate: new Date(),
        toDate: new Date(),
        prabhag: "",
        vibhag: [],
        party: [],
        deptCode: [],
        ledger: [],
      }}
      onSubmit={handleSubmit}
    >
      {({ values, setFieldValue }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 sm:mt-6 px-2 sm:px-4"
          >
            <Card className="shadow-sm border rounded-lg">
              <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <CardTitle className="text-lg font-semibold">
                  बिल रजिस्टर
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      प्रभाग :
                    </label>
                    <Select
                      value={values.prabhag}
                      onValueChange={(v) => setFieldValue("prabhag", v)}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="-- ALL --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">-- ALL --</SelectItem>
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

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      विभाग :
                    </label>
                    <MultiSelect
                      options={departments.map((d) => ({
                        label: d.DEPTNAME,
                        value: d.DEPTID.toString(),
                      }))}
                      value={values.vibhag}
                      onChange={(selectedValues) =>
                        setFieldValue("vibhag", selectedValues)
                      }
                      placeholder="विभाग निवडा"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      पार्टी :
                    </label>
                    <MultiSelect
                      options={partyOptions}
                      value={values.party}
                      onChange={(selectedValues) =>
                        setFieldValue("party", selectedValues)
                      }
                      placeholder="पार्टी निवडा"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      विभाग संकेतांक :
                    </label>
                    <MultiSelect
                      options={glAllList}
                      value={values.deptCode}
                      onChange={(selectedValues) => {
                        setFieldValue("deptCode", selectedValues);

                        setFieldValue("ledger", []);
                        setLedgerOptions([]);

                        if (selectedValues.length > 0) {
                          fetchCreditLeasure(selectedValues);
                        }
                      }}
                      placeholder="विभाग संकेतांक निवडा"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      लेखाशीर्ष :
                    </label>
                    <MultiSelect
                      options={ledgerOptions}
                      value={values.ledger}
                      onChange={(selectedValues) =>
                        setFieldValue("ledger", selectedValues)
                      }
                      placeholder={
                        loadingLedger
                          ? "लोड होत आहे..."
                          : values.deptCode.length === 0
                            ? "प्रथम विभाग संकेतांक निवडा"
                            : "लेखाशीर्ष निवडा"
                      }
                      disabled={values.deptCode.length === 0 || loadingLedger}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      दिनांक पासून :
                    </label>
                    <DatePicker
                      className="w-full"
                      value={values.fromDate}
                      onChange={(date) => setFieldValue("fromDate", date)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      दिनांक पर्यंत :
                    </label>
                    <DatePicker
                      className="w-full"
                      value={values.toDate}
                      onChange={(date) => setFieldValue("toDate", date)}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  <Button
                    type="submit"
                    className="bg-blue-900 text-white px-6 h-9"
                  >
                    प्रक्रिया
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="px-6 h-9 text-red-600"
                    onClick={() => navigate("/HomePage/FrmHomePage")}
                  >
                    बाहेर
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

export default FrmBillRegisterRpt;
