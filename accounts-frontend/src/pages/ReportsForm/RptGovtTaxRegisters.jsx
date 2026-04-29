import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { useAuth } from "@/context/AuthContext";
import SearchableSelect from "@/components/SearchableSelect";
import axios from "axios";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/Components/ui/select";
import { DatePicker } from "@/Components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";

const initialValues = {
  prabhag: "",
  reportType: "0",
  fromDate: new Date(),
  toDate: new Date(),
  kapatCode: "",
  kapatLedger: "",
  bankCode: "",
  bankLedger: "",
  party: "",
  exportType: "PDF",
};

const RptGovtTaxRegisters = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zones, setZones] = useState([]);
  const [glCodes, setGlCodes] = useState([]);
  const [kapatLedgers, setKapatLedgers] = useState([]);
  const [bankLedgers, setBankLedgers] = useState([]);
  const [parties, setParties] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!ulbId) return;

    const headers = { Authorization: `Bearer ${token}` };
    // PRABHAG
    axios
      .post(`${BASE_URL}/api/Receipt/zones`, { corp_id: ulbId }, { headers })
      .then((res) => setZones(res.data?.data || []));

    // GL CODES
    axios
      .get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache", // ✅ prevents 304 empty issue
        },
      })
      .then((res) => {
        setGlCodes(res.data?.data || []); // ✅ FIXED
      })
      .catch(() => Swal.fire("GL list load failed"));

    // PARTY
    axios
      .post(
        `${BASE_URL}/api/FrmTransfer/party-list`,
        { corpId: ulbId },
        { headers },
      )
      .then((res) => setParties(res.data?.data?.rows || []));
  }, [ulbId]);

  const loadLedgers = async (glcode, type) => {
    if (!glcode) return;

    const res = await axios.post(
      `${BASE_URL}/api/FrmTransfer/credit-leasure`,
      {
        corp_id: Number(ulbId),
        glcode: Number(glcode),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const rows = res.data?.data?.rows || [];

    if (type === "kapat") setKapatLedgers(rows);
    else setBankLedgers(rows);
  };

  const handleSubmit = async (values) => {
    try {
      if (!token) {
        console.error("Token missing!");
        return;
      }

      // ✅ SHOW LOADER
      Swal.fire({
        title: "Generating PDF...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate(),
        ).padStart(2, "0")}`;
      };

      const basePayload = {
        fromDate: formatDate(values.fromDate),
        toDate: formatDate(values.toDate),
        ulbId: Number(ulbId),
      };

      const fullPayload = {
        ...basePayload,
        zoneId: Number(values.prabhag) || "",
        partyId: Number(values.party) || "",
        majorCode: Number(values.kapatCode) || "",
        minorCode: Number(values.kapatLedger) || "",
        bankGl: Number(values.bankCode) || "",
        bankAcc: Number(values.bankLedger) || "",
      };

      let apiUrl = "";
      let payload = {};

      if (values.reportType === "0") {
        apiUrl = `${BASE_URL}/api/RptGovtTaxRegisters/govt-tax-register-pdf1`;
        payload = fullPayload;
      } else if (values.reportType === "1") {
        apiUrl = `${BASE_URL}/api/RptGovtTaxRegisters/govt-tax-register-summary-pdf`;
        payload = basePayload;
      } else if (values.reportType === "2") {
        apiUrl = `${BASE_URL}/api/RptGovtTaxRegisters/govt-tax-summary2-pdf`;
        payload = fullPayload;
      }

      const res = await axios.post(apiUrl, payload, { headers });

      // ✅ CLOSE LOADER
      Swal.close();

      if (res.data?.success) {
        const pdfUrl = res.data.pdfUrl;

        // ✅ SUCCESS MESSAGE (optional)
        Swal.fire({
          icon: "success",
          title: "PDF Generated!",
          timer: 1500,
          showConfirmButton: false,
        });

        // open PDF
        window.open(pdfUrl, "_blank");
      } else {
        Swal.fire("Error", "PDF generation failed", "error");
      }
    } catch (error) {
      Swal.close();

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: error.message || "API Error",
      });

      console.error("Error:", error);
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setFieldValue, resetForm }) => {
        // ✅ Correct placement
        const isAllSelected = values.reportType === "2";

        return (
          <Form>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="shadow-sm border rounded-lg ">
                {/* HEADER */}
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    सरकारी कर नोंदणी अहवाल
                  </CardTitle>
                </CardHeader>

                {/* BODY */}
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* TOP ROW */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* PRABHAG */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] items-center gap-2">
                      <Label className="sm:text-right">प्रभाग</Label>
                      <span className="hidden sm:block">:</span>
                      <Select
                        value={values.prabhag}
                        onValueChange={(v) => setFieldValue("prabhag", v)}
                      >
                        <SelectTrigger className="w-full ">
                          <SelectValue placeholder="-- ALL --" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="-1">-- ALL --</SelectItem>

                          {zones.map((z) => (
                            <SelectItem key={z.ZONEID} value={String(z.ZONEID)}>
                              {z.ZONEENAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* REPORT TYPE */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[160px_10px_1fr] gap-2">
                      <Label className="sm:text-left">अहवालाचा प्रकार</Label>
                      <span className="hidden sm:block">:</span>
                      <div className="flex flex-wrap gap-4">
                        <Label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={values.reportType === "0"}
                            onChange={() => setFieldValue("reportType", "0")}
                          />
                          कर प्राप्त
                        </Label>

                        <Label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={values.reportType === "1"}
                            onChange={() => setFieldValue("reportType", "1")}
                          />
                          कर प्राप्त सारांश
                        </Label>

                        <Label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={values.reportType === "2"}
                            onChange={() => setFieldValue("reportType", "2")}
                          />
                          सर्व
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* SECOND GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* FROM DATE */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] items-center gap-2">
                      <Label className="sm:text-left">दिनांक पासून</Label>
                      <span className="hidden sm:block">:</span>
                      <DatePicker
                        value={values.fromDate}
                        onChange={(d) => setFieldValue("fromDate", d)}
                      />
                    </div>

                    {/* TO DATE */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] items-center gap-2">
                      <Label className="sm:text-left">दिनांक पर्यंत</Label>
                      <span className="hidden sm:block">:</span>
                      <DatePicker
                        value={values.toDate}
                        onChange={(d) => setFieldValue("toDate", d)}
                      />
                    </div>

                    {/* KAPAT CODE */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] items-center gap-2">
                      <Label className="sm:text-left">कपात संकेतांक</Label>
                      <span className="hidden sm:block">:</span>
                      <SearchableSelect
                        disabled={isAllSelected}
                        options={glCodes.map((g) => ({
                          label: g.GLSEARCHNAME,
                          value: String(g.GLCODE),
                        }))}
                        value={values.kapatCode}
                        onChange={async (v) => {
                          const code = v?.value;

                          setFieldValue("kapatCode", code);
                          setFieldValue("kapatLedger", "");

                          await loadLedgers(code, "kapat");
                        }}
                      />
                    </div>

                    {/* KAPAT LEDGER */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] items-center gap-2">
                      <Label className="sm:text-left">कपात लेखाशिर्ष</Label>
                      <span className="hidden sm:block">:</span>
                      <SearchableSelect
                        disabled={isAllSelected}
                        options={kapatLedgers.map((l) => ({
                          label: l.ACCNAME,
                          value: String(l.OBJECTCODE),
                        }))}
                        value={values.kapatLedger}
                        onChange={(v) => setFieldValue("kapatLedger", v?.value)}
                      />
                    </div>

                    {/* BANK CODE */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] items-center gap-2">
                      <Label className="sm:text-left">बँक संकेतांक</Label>
                      <span className="hidden sm:block">:</span>
                      <SearchableSelect
                        disabled={isAllSelected}
                        options={glCodes.map((g) => ({
                          label: g.GLSEARCHNAME,
                          value: String(g.GLCODE),
                        }))}
                        value={values.bankCode}
                        onChange={async (v) => {
                          const code = v?.value;

                          setFieldValue("bankCode", code);
                          setFieldValue("bankLedger", "");

                          await loadLedgers(code, "bank");
                        }}
                      />
                    </div>

                    {/* BANK LEDGER */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] items-center gap-2">
                      <Label className="sm:text-left">बँक लेखाशिर्ष</Label>
                      <span className="hidden sm:block">:</span>
                      <SearchableSelect
                        disabled={isAllSelected}
                        options={bankLedgers.map((l) => ({
                          label: l.ACCNAME,
                          value: String(l.OBJECTCODE),
                        }))}
                        value={values.bankLedger}
                        onChange={(v) => setFieldValue("bankLedger", v?.value)}
                      />
                    </div>

                    {/* PARTY FULL WIDTH */}
                    <div className=" flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] items-center gap-2">
                      <Label className="sm:text-left">पार्टी</Label>
                      <span className="hidden sm:block">:</span>
                      <SearchableSelect
                        disabled={isAllSelected}
                        options={parties.map((p) => ({
                          label: p.VAR_PARTYMST_PARTYNAME,
                          value: String(p.NUM_PARTYMST_PARTYID),
                        }))}
                        value={values.party}
                        onChange={(v) => setFieldValue("party", v?.value)}
                      />
                    </div>

                    {/* EXPORT */}
                    <div className="lg:col-span-2 flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] gap-2">
                      <Label className="sm:text-right">Export To</Label>
                      <span className="hidden sm:block">:</span>
                      <Label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={values.exportType === "PDF"}
                          onChange={() => setFieldValue("exportType", "PDF")}
                        />
                        PDF
                      </Label>
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex justify-center gap-3 pt-4 border-t">
                    {/* ✅ SUBMIT */}
                    <Button type="submit" className="bg-blue-900 text-white">
                      प्रक्रिया
                    </Button>

                  
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => resetForm()}
                    >
                      रद्द
                    </Button>

                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/HomePage/FrmHomePage")}
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

export default RptGovtTaxRegisters;
