import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";

import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import SearchableSelect from "@/components/SearchableSelect";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { DatePicker } from "@/Components/ui/calendar";
import { Checkbox } from "@/Components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

/* ================= INITIAL VALUES ================= */
const initialValues = {
  department: "",
  fromDate: new Date(),
  toDate: new Date(),
  fromDateEnabled: false,
  partyCode: "",
  deptCode: "",
  ledger: "",
  amount: "",
  chequeNo: "",
  chequeDate: new Date(),
  paymentType: "Cheque",
  details: "",
  transactionDate: new Date(),
  receiptNo: "",
  chequeBookNo: "",
};

/* ================= REUSABLE FIELD ================= */
const FormField = ({ label, children }) => (
  <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] items-start sm:items-center gap-2">
    <Label className="sm:text-right">{label}</Label>
    <span className="hidden sm:block">:</span>
    <div className="w-full">{children}</div>
  </div>
);

/* ================= COMPONENT ================= */
const FrmVoucherGeneration = () => {
  const navigate = useNavigate();
  const [loading] = useState(false);

  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zones, setZones] = useState([]);
  const [glCodes, setGlCodes] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [parties, setParties] = useState([]);

  

  useEffect(() => {
    if (!ulbId) return;

    const headers = { Authorization: `Bearer ${token}` };

    // 🔷 PRABHAG
    axios
      .post(`${BASE_URL}/api/Receipt/zones`, { corp_id: ulbId }, { headers })
      .then((res) => setZones(res.data?.data || []));

    // 🔷 GL CODES
    axios
      .get(`${BASE_URL}/api/FrmTransfer/gl-codes`, { headers })
      .then((res) => setGlCodes(res.data?.data?.rows || []));

    // 🔷 PARTY LIST ✅ NEW
    axios
      .post(
        `${BASE_URL}/api/FrmTransfer/party-list`,
        { corpId: ulbId },
        { headers },
      )
      .then((res) => setParties(res.data?.data?.rows || []))
      .catch(() => Swal.fire("Party list load failed"));
  }, [ulbId]);

  const loadLedgers = async (glcode) => {
    if (!glcode || !ulbId) return;

    try {
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

      setLedgers(res.data?.data?.rows || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Ledger load failed");
    }
  };

  const handleSubmit = (values) => {
    const errors = validateVoucher(values);

    if (errors?.length > 0) {
      Swal.fire({
        icon: "warning",
        title: errors[0].message,
        confirmButtonColor: "#083c76",
      });
      return;
    }

    console.log("Form Values:", values);

    Swal.fire({
      icon: "success",
      title: "डेटा यशस्वीरित्या सेव झाला",
      confirmButtonColor: "#083c76",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center mt-10 text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, handleChange, setFieldValue, resetForm }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            // className="min-h-screen bg-gray-50 p-4 sm:p-6"
          >
            <div className=" bg-white border rounded-lg shadow-sm">
              {/* HEADER */}
              <div className="border-b px-4 sm:px-6 py-4 text-lg font-semibold">
                प्रमाणक निर्मिती
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* FILTER SECTION */}
                <section className="border rounded-lg p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <FormField label="प्रभाग">
                      <Select
                        value={values.department}
                        onValueChange={(v) => setFieldValue("department", v)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="निवडा" />
                        </SelectTrigger>

                        <SelectContent>
                          {zones.map((z) => (
                            <SelectItem key={z.ZONEID} value={String(z.ZONEID)}>
                              {z.ZONEENAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="दिनांक पासून">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={values.fromDateEnabled}
                          onCheckedChange={(v) =>
                            setFieldValue("fromDateEnabled", v)
                          }
                        />
                        <DatePicker
                          value={values.fromDate}
                          onChange={(d) => setFieldValue("fromDate", d)}
                          className="h-9 w-full"
                        />
                      </div>
                    </FormField>

                    <FormField label="दिनांक पर्यंत">
                      <DatePicker
                        value={values.toDate}
                        onChange={(d) => setFieldValue("toDate", d)}
                        className="h-9 w-full"
                      />
                    </FormField>

                    <FormField label="पार्टी संकेतांक">
                      <SearchableSelect
                        options={parties.map((p) => ({
                          label: p.VAR_PARTYMST_PARTYNAME || "",
                          value: String(p.NUM_PARTYMST_PARTYID),
                        }))}
                        value={values.partyCode}
                        onChange={(v) => {
                          setFieldValue("partyCode", v?.value);
                        }}
                      />
                    </FormField>

                    <div className="flex items-end col-span-full sm:col-span-1">
                      <Button className="bg-blue-900 hover:bg-blue-800 text-white w-full sm:w-auto">
                        व्हाउचर शोध
                      </Button>
                    </div>
                  </div>
                </section>

                {/* MAIN FORM */}
                <section className="border rounded-lg p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <FormField label="विभाग कोड">
                      <SearchableSelect
                        options={glCodes.map((g) => ({
                          label: g.GLNAME || "",
                          value: String(g.GLCODE || ""),
                        }))}
                        value={values.deptCode}
                        onChange={async (v) => {
                          const glcode = v?.value || v;

                          setFieldValue("deptCode", glcode);
                          setFieldValue("ledger", "");

                          await loadLedgers(glcode);
                        }}
                      />
                    </FormField>

                    <FormField label="लेखाशीर्ष">
                      <SearchableSelect
                        options={ledgers.map((l) => ({
                          label: l.ACCNAME || "",
                          value: String(l.OBJECTCODE || ""),
                        }))}
                        value={values.ledger}
                        onChange={(v) => {
                          setFieldValue("ledger", v?.value);
                        }}
                      />
                    </FormField>

                    <FormField label="बँकेची शिल्लक">
                      <Input
                        value={values.bankBalance}
                        name="bankBalance"
                        onChange={handleChange}
                        className="h-9 w-full"
                      />
                    </FormField>

                    <FormField label="व्यवहार दिनांक">
                      <DatePicker
                        value={values.transactionDate}
                        onChange={(d) => setFieldValue("transactionDate", d)}
                        className="h-9 w-full"
                      />
                    </FormField>

                    <FormField label="देय रक्कम">
                      <Input
                        name="amount"
                        value={values.amount}
                        onChange={handleChange}
                        className="h-9 w-full"
                      />
                    </FormField>

                    <FormField label="देयक प्रकार">
                      <Select
                        value={values.paymentType}
                        onValueChange={(v) => setFieldValue("paymentType", v)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="धनादेश पुस्तिका क्रमांक">
                      <Select
                        value={values.chequeBookNo}
                        onValueChange={(v) => setFieldValue("chequeBookNo", v)}
                        disabled={values.paymentType === "Cash"}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="निवडा" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Book 1</SelectItem>
                          <SelectItem value="2">Book 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="धनादेश क्रमांक">
                      <Input
                        name="chequeNo"
                        value={values.chequeNo}
                        onChange={handleChange}
                        className="h-9 w-full"
                      />
                    </FormField>

                    <FormField label="धनादेश दिनांक">
                      <DatePicker
                        value={values.chequeDate}
                        onChange={(d) => setFieldValue("chequeDate", d)}
                        className="h-9 w-full"
                        disabled={values.paymentType === "Cash"}
                      />
                    </FormField>

                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] gap-2 col-span-full">
                      <Label className="sm:text-right">तपशील</Label>
                      <span className="hidden sm:block mt-2">:</span>
                      <Textarea
                        name="details"
                        value={values.details}
                        onChange={handleChange}
                        className="min-h-18 w-full"
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* FOOTER */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 border-t p-4">
                <Button
                  type="submit"
                  className="bg-blue-900 text-white px-6 w-full sm:w-auto"
                >
                  स्वीकार
                </Button>

                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="w-full sm:w-auto"
                >
                  रद्द
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => navigate("/")}
                  className="w-full sm:w-auto"
                >
                  बाहेर जा
                </Button>
              </div>
            </div>
          </motion.div>
        </Form>
      )}
    </Formik>
  );
};

export default FrmVoucherGeneration;
