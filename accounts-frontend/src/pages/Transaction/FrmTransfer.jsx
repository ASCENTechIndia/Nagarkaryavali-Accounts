import { useNavigate, useLocation } from "react-router-dom";

import { motion } from "framer-motion";
import { Formik, Form } from "formik";
import Swal from "sweetalert2";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import SearchableSelect from "@/components/SearchableSelect";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

/* ================= INITIAL ================= */
const initialValues = {
  department: "",
  transactionType: "",
  date: new Date(),
  voucherNo: "",
  creditDept: "",
  creditLedger: "",
  creditAmount: "",
  chequeNo: "",
  chequeDate: new Date(),
  chequeRef: "",
  details: "",
  party: "",
  debitDept: "",
  debitLedger: "",
  debitAmount: "",
};

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[160px_1fr] items-center gap-3">
    <Label className="text-right">{label} :</Label>
    {children}
  </div>
);

const FrmTransfer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const location = useLocation();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zones, setZones] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [glCodes, setGlCodes] = useState([]);
  const [creditLedgers, setCreditLedgers] = useState([]);
  const [debitLedgers, setDebitLedgers] = useState([]);

  const [parties, setParties] = useState([]);

  const isEditMode = Boolean(location?.state?.refNo);

  const formikRef = useRef(null);

  /* ================= DATE ================= */
  const formatDate = (d) => {
    const date = new Date(d);
    return `${date.getDate()}-${date
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase()}-${date.getFullYear()}`;
  };

  useEffect(() => {
    if (!ulbId) return;

    const headers = { Authorization: `Bearer ${token}` };

    /* ZONES */
    axios
      .post(`${BASE_URL}/api/Receipt/zones`, { corp_id: ulbId }, { headers })
      .then((res) => setZones(res.data?.data || []));

    /* TRANSACTION TYPES */
    axios
      .get(`${BASE_URL}/api/FrmTransfer/transaction-types`, { headers })
      .then((res) => setTransactionTypes(res.data?.data?.rows || []));

    /* GL CODES */
    axios
      .get(`${BASE_URL}/api/FrmTransfer/gl-codes`, { headers })
      .then((res) => setGlCodes(res.data?.data?.rows || []));

    /* PARTY LIST */
    axios
      .post(
        `${BASE_URL}/api/FrmTransfer/party-list`,
        {
          corpId: ulbId,
        },
        { headers },
      )
      .then((res) => setParties(res.data?.data?.rows || []));
  }, [ulbId]);

  const loadLedgers = async (glcode, type) => {
    if (!glcode || !ulbId) return [];

    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmTransfer/credit-leasure`,
        {
          corp_id: ulbId,
          glcode,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const rows = res.data?.data?.rows || [];
      console.log(`Ledgers for GLCODE ${glcode} fetched:`, rows);

      if (type === "credit") setCreditLedgers([...rows]);
      else setDebitLedgers([...rows]);

      return rows; // ✅ CRITICAL FIX
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  useEffect(() => {
    if (!location?.state?.refNo || !token || !ulbId) return;

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const res = await axios.post(
          `${BASE_URL}/api/FrmTransfer/contra-details`,
          { tranRef: location.state.refNo },
          { headers },
        );

        const rows = res.data?.data?.rows || [];
        console.log("Contra details fetched:", rows);
        if (!rows.length) return;

        const first = rows[0];
        const credit = rows.find((r) => Number(r.CREDIT) > 0);
        const debit = rows.find((r) => Number(r.DEBIT) > 0);

        const form = formikRef.current;
        if (!form) return;

        // 🔹 BASIC FIELDS
        form.setFieldValue("department", String(first.ZONEID || ""));
        form.setFieldValue("transactionType", String(first.TRNSTYPEID || ""));
        form.setFieldValue("date", new Date(first.TRNSDATE));
        form.setFieldValue("voucherNo", first.VCHNO || "");
        form.setFieldValue("details", first.NARRATION || "");

        const partyId =
          first.PARTYID ||
          first.NUM_PARTYID ||
          first.NUM_PARTYMST_PARTYID ||
          first.PARTYMST_PARTYID ||
          "";

        setTimeout(() => {
          form.setFieldValue("party", String(partyId || ""));
        }, 100);

        // 🔥 CREDIT LEDGER (NEW API FIX)
        if (credit?.GLCODE) {
          await loadLedgers(String(credit.GLCODE), "credit");

          form.setFieldValue("creditDept", String(credit.GLCODE));

          setTimeout(() => {
            form.setFieldValue("creditLedger", String(credit.OBJECTCODE));
          }, 150);

          form.setFieldValue("creditAmount", Math.abs(credit.CREDIT || 0));
        }

        // 🔥 DEBIT LEDGER (NEW API FIX)
        if (debit?.GLCODE) {
          await loadLedgers(String(debit.GLCODE), "debit");

          form.setFieldValue("debitDept", String(debit.GLCODE));

          setTimeout(() => {
            form.setFieldValue("debitLedger", String(debit.OBJECTCODE));
          }, 150);

          form.setFieldValue("debitAmount", Math.abs(debit.DEBIT || 0));
        }
      } catch (err) {
        console.error("contra-details error:", err);
      }
    };

    fetchData();
  }, [location?.state?.refNo, token, ulbId]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (values) => {
    try {
      if (!values.department) return Swal.fire("प्रभाग निवडा");
      if (!values.transactionType) return Swal.fire("व्यवहार प्रकार निवडा");

      if (!values.creditDept || !values.creditLedger)
        return Swal.fire("Credit खाते निवडा");

      if (!values.debitDept || !values.debitLedger)
        return Swal.fire("Debit खाते निवडा");

      if (Number(values.debitAmount) > Number(values.creditAmount))
        return Swal.fire("Debit > Credit नाही");

      /* PARAM STR */
      const paramStr = [
        formatDate(values.date),
        values.voucherNo || "1",
        values.department,
        "0",
        values.transactionType,
        "1",
        "0",
        "",
        "",
        "",
        "",
        values.chequeNo || "0",
        formatDate(values.chequeDate),
        values.chequeRef || "0",
      ].join("~");

      const credit = [
        values.creditDept,
        values.creditLedger,
        values.creditAmount,
        values.details,
        values.party || " ",
      ].join("#");

      const debit = [
        values.debitDept,
        values.debitLedger,
        -Math.abs(values.debitAmount),
        values.details,
        values.party || " ",
      ].join("#");

      const paramStr2 = `${credit}$${debit}`;

      Swal.fire({
        title: "Saving...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${BASE_URL}/api/FrmTransfer/transfer-save`,
        {
          userId: user?.userId,
          paramStr,
          paramStr2,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      Swal.close();

      if (res.data?.errorCode === -100) {
        Swal.fire("Success", res.data.message, "success");
        navigate("/Transactions/FrmTransferList");
      } else {
        Swal.fire(res.data?.message || "Error");
      }
    } catch (err) {
      Swal.close();
      Swal.fire("Server Error");
    }
  };

  
  /* ================= UI ================= */
  return (
    <Formik
  initialValues={initialValues}
  onSubmit={handleSubmit}
  innerRef={formikRef}
>
  {({ values, setFieldValue }) => {
    const showChequeFields = values.transactionType === "5";

    // ✅ HANDLE RESET WITHOUT useEffect
    const handleTransactionChange = (v) => {
      setFieldValue("transactionType", v);

      if (v !== "3") {
        setFieldValue("chequeNo", "");
        setFieldValue("chequeDate", new Date());
      }
    };

    return (
        <Form>
          <div className=" rounded-md p-4">
            <h2 className="text-lg font-semibold mb-3">
              Transfer/Contra Entry
            </h2>

            <div className="bg-white border p-4">
              {/* 🔷 TOP ROW */}
              <div className="grid grid-cols-4 gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Label className="w-24 text-right">प्रभाग :</Label>
                  <Select
                    value={values.department}
                    onValueChange={(v) => setFieldValue("department", v)}
                    disabled={isEditMode}
                  >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder="-- निवडा --" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((z) => (
                        <SelectItem key={z.ZONEID} value={String(z.ZONEID)}>
                          {z.ZONEENAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-28 text-right">व्यवहार प्रकार :</Label>
                  <Select
                    value={values.transactionType}
                    onValueChange={handleTransactionChange}
                    disabled={isEditMode}
                  >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder="-- निवडा --" />
                    </SelectTrigger>
                    <SelectContent>
                      {transactionTypes.map((t) => (
                        <SelectItem
                          key={t.NUM_TRNSTYPE_TRNSTYPEID}
                          value={String(t.NUM_TRNSTYPE_TRNSTYPEID)}
                        >
                          {t.VAR_TRNSTYPE_TRNSTYPE}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-20 text-right">दिनांक :</Label>
                  <Input
                    className="w-[150px] h-8"
                    value={formatDate(values.date)}
                    readOnly
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32 text-right">व्हाउचर क्रमांक :</Label>
                  <Input
                    className="w-[150px] h-8"
                    value={values.voucherNo}
                    onChange={(e) => setFieldValue("voucherNo", e.target.value)}
                    disabled={isEditMode}
                  />
                </div>
              </div>

              <hr className="my-4" />

              {/* 🔷 MAIN */}
              <div className="grid grid-cols-2 gap-16">
                {/* LEFT */}
                <div>
                  <h3 className="mb-2 font-semibold">जमा</h3>

                  <div className="space-y-3">
                    <Row label="विभाग कोड">
                      <SearchableSelect
                        options={glCodes.map((g) => ({
                          label: g.GLNAME || "",
                          value: String(g.GLCODE || ""),
                        }))}
                        value={values.creditDept}
                        onChange={async (v) => {
                          setFieldValue("creditDept", v);
                          setFieldValue("creditLedger", "");
                          await loadLedgers(v, "credit");
                        }}
                      />
                    </Row>

                    <Row label="लेखाशिर्ष">
                      <SearchableSelect
                        options={creditLedgers.map((l) => ({
                          label: l.ACCNAME || "",
                          value: String(l.OBJECTCODE || ""),
                        }))}
                        value={values.creditLedger}
                        onChange={(v) => setFieldValue("creditLedger", v)}
                      />
                    </Row>

                    <Row label="रक्कम">
                      <Input
                        className="w-full h-8"
                        value={values.creditAmount}
                        onChange={(e) =>
                          setFieldValue("creditAmount", e.target.value)
                        }
                      />
                    </Row>
    {showChequeFields && (
                <>
                  <Row label="धनादेश क्रमांक">
                    <Input
                      className="w-full h-8"
                      value={values.chequeNo}
                      onChange={(e) =>
                        setFieldValue("chequeNo", e.target.value)
                      }
                    />
                  </Row>

                  <Row label="धनादेश तारीख">
                    <Input
                      className="w-full h-8"
                      value={formatDate(values.chequeDate)}
                      readOnly
                    />
                  </Row>

                  <Row label="धनादेश पुष्टिका क्रमांक">
                    <Select>
                      <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                </>
              )}

                    <Row label="तपशील">
                      <Textarea
                        className="w-full"
                        value={values.details}
                        onChange={(e) =>
                          setFieldValue("details", e.target.value)
                        }
                      />
                    </Row>

                    {/* ✅ FIXED PARTY */}
                    <Row label="पार्टी संकेतांक">
                      <Select
                        value={values.party ? String(values.party) : ""}
                        onValueChange={(v) => setFieldValue("party", v)}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="-- निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {parties.map((p) => (
                            <SelectItem
                              key={p.NUM_PARTYMST_PARTYID}
                              value={String(p.NUM_PARTYMST_PARTYID)} // ✅ correct field
                            >
                              {p.VAR_PARTYMST_PARTYNAME || "--"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Row>
                  </div>
                </div>

                {/* RIGHT */}
                <div>
                  <h3 className="mb-2 font-semibold">खर्च</h3>

                  <div className="space-y-3">
                    <Row label="विभाग कोड">
                      <SearchableSelect
                        options={glCodes.map((g) => ({
                          label: g.GLNAME || "",
                          value: String(g.GLCODE || ""),
                        }))}
                        value={values.debitDept}
                        onChange={async (v) => {
                          setFieldValue("debitDept", v);
                          setFieldValue("debitLedger", "");
                          await loadLedgers(v, "debit");
                        }}
                      />
                    </Row>

                    <Row label="लेखाशिर्ष">
                      <SearchableSelect
                        options={debitLedgers.map((l) => ({
                          label: l.ACCNAME || "",
                          value: String(l.OBJECTCODE || ""),
                        }))}
                        value={values.debitLedger}
                        onChange={(v) => setFieldValue("debitLedger", v)}
                      />
                    </Row>

                    <Row label="रक्कम">
                      <Input
                        className="w-full h-8"
                        value={values.debitAmount}
                        onChange={(e) =>
                          setFieldValue("debitAmount", e.target.value)
                        }
                      />
                    </Row>
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex justify-center gap-3 mt-6">
                <Button className="bg-blue-900 text-white px-6">स्वीकार</Button>
                <Button variant="destructive" className="px-6">
                  रद्द
                </Button>
                <Button variant="secondary" className="px-6">
                  बदल
                </Button>
              </div>
            </div>
          </div>
        </Form>
      );
  }}
</Formik>
  );
};

export default FrmTransfer;
