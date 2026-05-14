import { useNavigate, useLocation } from "react-router-dom";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { de } from "date-fns/locale";

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
  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center gap-2 sm:gap-3">
    <Label className="sm:text-right text-left whitespace-nowrap">
      {label} :
    </Label>
    <div className="w-full">{children}</div>
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
  const [chequeBooks, setChequeBooks] = useState([]);

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

    const loadInitialData = async () => {
      try {
        Swal.fire({
          title: "Loading...",
          text: "Please wait",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const headers = { Authorization: `Bearer ${token}` };

        const [zonesRes, txnRes, glRes, partyRes] = await Promise.all([
          axios.post(
            `${BASE_URL}/api/Receipt/zones`,
            { corp_id: ulbId },
            { headers },
          ),
          axios.get(`${BASE_URL}/api/FrmTransfer/transaction-types`, {
            headers,
          }),
          axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
            },
          }),
          axios.post(
            `${BASE_URL}/api/FrmTransfer/party-list`,
            { corpId: ulbId },
            { headers },
          ),
        ]);

        setZones(zonesRes.data?.data || []);
        setTransactionTypes(txnRes.data?.data?.rows || []);
        setGlCodes(glRes.data?.data || []);
        setParties(partyRes.data?.data?.rows || []);
      } catch (err) {
        console.error(err);
        Swal.fire("डेटा लोड करण्यात अडचण आली");
      } finally {
        Swal.close(); // ✅ CLOSE LOADER
      }
    };

    loadInitialData();
  }, [ulbId]);

  const loadLedgers = async (glcode, type) => {
    if (!glcode || !ulbId) return [];

    try {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

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

      if (type === "credit") setCreditLedgers([...rows]);
      else setDebitLedgers([...rows]);

      return rows;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      Swal.close();
    }
  };

  const fetchChequeBook = async (values, chequeNo, setFieldValue) => {
    try {
      console.log("values", values);
      const res = await axios.post(
        `${BASE_URL}/api/FrmVoucherGeneration/cheque-book`,
        {
          bank_glcode: values.creditDept,
          bank_accno: values.creditLedger,
          cheque_no: chequeNo,
          corp_id: ulbId,
          zone_id: values.department,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log("chequeBook Payload", {
        bank_glcode: values.creditDept,
        bank_accno: values.creditLedger,
        cheque_no: chequeNo,
        corp_id: ulbId,
        zone_id: values.department,
      });
      const books = res.data?.rows || [];
      console.log("Fetched cheque books:", books);

      setChequeBooks(books);

      // ✅ AUTO SELECT
      if (books.length > 0) {
        setFieldValue("chequeRef", String(books[0].NUM_CHEQUEBOOK_BOOKNO));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (
      !location?.state?.refNo ||
      !token ||
      !ulbId ||
      zones.length === 0 ||
      transactionTypes.length === 0
    )
      return;

    const fetchData = async () => {
      try {
        Swal.fire({
          title: "Loading...",
          text: "Please wait",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const headers = { Authorization: `Bearer ${token}` };

        const res = await axios.post(
          `${BASE_URL}/api/FrmTransfer/contra-details`,
          { tranRef: location.state.refNo },
          { headers },
        );

        const apiRows = res.data?.data?.rows || [];
        if (!apiRows.length) {
          Swal.close();
          return;
        }

        const first = apiRows[0];
        const creditRow = apiRows.find((r) => Number(r.CREDIT) > 0);
        const debitRow = apiRows.find((r) => Number(r.DEBIT) > 0);

        const form = formikRef.current;
        if (!form) {
          Swal.close();
          return;
        }

        /* ================= BASIC ================= */
        form.setFieldValue("date", new Date(first.TRNSDATE));
        form.setFieldValue("voucherNo", first.VCHNO || "");
        form.setFieldValue("details", first.NARRATION || "");

        const partyId =
          first.PARTYID ||
          first.NUM_PARTYID ||
          first.NUM_PARTYMST_PARTYID ||
          first.PARTYMST_PARTYID ||
          "";

        form.setFieldValue("party", String(partyId || ""));

        // ✅ SAFE MATCHING
        const zoneMatch = zones.find(
          (z) => String(z.ZONEID) === String(first.ZONEID),
        );

        if (zoneMatch) {
          form.setFieldValue("department", String(zoneMatch.ZONEID));
        }

        const txnMatch = transactionTypes.find(
          (t) => String(t.NUM_TRNSTYPE_TRNSTYPEID) === String(first.TRNSTYPEID),
        );

        if (txnMatch) {
          form.setFieldValue(
            "transactionType",
            String(txnMatch.NUM_TRNSTYPE_TRNSTYPEID),
          );
        }

        /* ================= CREDIT ================= */
        if (creditRow?.GLCODE) {
          const creditGL = String(creditRow.GLCODE);
          const creditObj = String(creditRow.OBJECTCODE);

          form.setFieldValue("creditDept", creditGL);

          const creditLedgerRows = await loadLedgers(creditGL, "credit");

          const creditExists = creditLedgerRows.find(
            (r) => String(r.OBJECTCODE) === creditObj,
          );

          if (creditExists) {
            form.setFieldValue("creditLedger", creditObj);
          }

          form.setFieldValue("creditAmount", Math.abs(creditRow.CREDIT || 0));
        } else if (debitRow) {
          const fallbackGL = String(debitRow.GLCODE);
          const fallbackObj = String(debitRow.OBJECTCODE);

          form.setFieldValue("creditDept", fallbackGL);

          const creditLedgerRows = await loadLedgers(fallbackGL, "credit");

          const exists = creditLedgerRows.find(
            (r) => String(r.OBJECTCODE) === fallbackObj,
          );

          if (exists) {
            form.setFieldValue("creditLedger", fallbackObj);
          }

          form.setFieldValue("creditAmount", Math.abs(debitRow.DEBIT || 0));
        }

        /* ================= DEBIT ================= */
        if (debitRow?.GLCODE) {
          const debitGL = String(debitRow.GLCODE);
          const debitObj = String(debitRow.OBJECTCODE);

          form.setFieldValue("debitDept", debitGL);

          const debitLedgerRows = await loadLedgers(debitGL, "debit");

          const debitExists = debitLedgerRows.find(
            (r) => String(r.OBJECTCODE) === debitObj,
          );

          if (debitExists) {
            form.setFieldValue("debitLedger", debitObj);
          }

          form.setFieldValue("debitAmount", Math.abs(debitRow.DEBIT || 0));
        } else if (creditRow) {
          const fallbackGL = String(creditRow.GLCODE);
          const fallbackObj = String(creditRow.OBJECTCODE);

          form.setFieldValue("debitDept", fallbackGL);

          const debitLedgerRows = await loadLedgers(fallbackGL, "debit");

          const exists = debitLedgerRows.find(
            (r) => String(r.OBJECTCODE) === fallbackObj,
          );

          if (exists) {
            form.setFieldValue("debitLedger", fallbackObj);
          }

          form.setFieldValue("debitAmount", Math.abs(creditRow.CREDIT || 0));
        }

        Swal.close();
      } catch (err) {
        console.error("contra-details error:", err);

        Swal.close();

        Swal.fire({
          icon: "error",
          text: "डेटा लोड करण्यात अडचण आली",
        });
      }
    };

    fetchData();
  }, [location?.state?.refNo, token, ulbId, zones, transactionTypes]);

  const handleSubmit = async (values, { resetForm }) => {
    try {
      if (!values.department) return Swal.fire("प्रभाग निवडा");
      if (!values.transactionType) return Swal.fire("व्यवहार प्रकार निवडा");

      if (!values.creditDept || !values.creditLedger)
        return Swal.fire("Credit खाते निवडा");

      if (!values.debitDept || !values.debitLedger)
        return Swal.fire("Debit खाते निवडा");

      if (Number(values.debitAmount) > Number(values.creditAmount))
        return Swal.fire("Debit > Credit नाही");
      const formatDate = (d) => {
        const date = new Date(d);
        const day = String(date.getDate()).padStart(2, "0");
        const month = date
          .toLocaleString("en-US", { month: "short" })
          .toUpperCase();
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const clean = (v) => (v ? String(v).trim() : "0");

      const paramStr = [
        formatDate(values.date),

        "1", // ✅ ALWAYS 1 for new

        values.department || "0",
        "0",

        values.transactionType, // ✅ DO NOT CHANGE

        "1", // InMode
        "0", // RefNo

        " ", // ✅ VERY IMPORTANT (NOT "0")
        " ", // ✅ VERY IMPORTANT

        values.budgetId || "0",
        values.nidhiId || "0",

        values.transactionType === "5" ? values.chequeNo || "0" : "0",

        formatDate(values.chequeDate),

        values.transactionType === "5"
          ? values.chequeRef || "0" // ✅ correct field
          : "0",
      ].join("~");

      /* ================= PARAM STR 2 ================= */
      const credit = [
        clean(values.creditDept),
        clean(values.creditLedger),
        Number(values.creditAmount || 0),
        clean(values.details),
        clean(values.party || "0"),
      ].join("#");

      const debit = [
        clean(values.debitDept),
        clean(values.debitLedger),
        -Math.abs(values.debitAmount || 0), // ✅ MUST NEGATIVE
        clean(values.details),
        clean(values.party || "0"),
      ].join("#");

      const paramStr2 = `${credit}$${debit}`;

      console.log("FINAL paramStr:", paramStr);
      console.log("FINAL paramStr2:", paramStr2);

      /* ================= SAVE ================= */
      Swal.fire({
        title: "Saving...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const saveRes = await axios.post(
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

      const response = saveRes.data;

      /* ================= SUCCESS ================= */
      if (response?.ok && response?.data?.success) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: response.data.message,
        });

        /* ================= REF NO ================= */
        const message = response.data.message;
        const refMatch = message.match(/Reference No\. *: *(\d+)/);
        const refNo = refMatch ? refMatch[1] : null;

        /* ================= PDF ================= */
        if (refNo) {
          try {
            Swal.fire({
              title: "PDF तयार होत आहे...",
              allowOutsideClick: false,
              didOpen: () => Swal.showLoading(),
            });

            const pdfRes = await axios.post(
              `${BASE_URL}/api/FrmTransfer/counter-voucher-pdf`,
              {
                refno: Number(refNo),
                ulbId: user?.ulbId,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );

            Swal.close();

            const pdfUrl = pdfRes?.data?.pdfUrl;

            if (pdfUrl) {
              window.open(pdfUrl, "_blank");
            } else {
              Swal.fire("PDF तयार करण्यात अडचण आली");
            }
          } catch (err) {
            Swal.close();
            console.error(err);
            Swal.fire("PDF Error");
          }
        }

        resetForm();

        setTimeout(() => {
          navigate("/Transactions/FrmTransferList");
        }, 800);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            response?.data?.message ||
            response?.message ||
            "Something went wrong",
        });
      }
    } catch (err) {
      Swal.close();
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Something went wrong",
      });
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-sm border rounded-lg">
                <CardHeader className="border-b flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">
                    Transfer/Contra Entry
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                  {/* 🔷 TOP ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                    {/* प्रभाग */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-24 sm:text-right whitespace-nowrap">
                        प्रभाग :
                      </Label>
                      <div className="flex-1">
                        <Select
                          value={values.department}
                          onValueChange={(v) => setFieldValue("department", v)}
                          disabled={isEditMode}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="-- निवडा --" />
                          </SelectTrigger>
                          <SelectContent>
                            {zones.map((z) => (
                              <SelectItem
                                key={z.ZONEID}
                                value={String(z.ZONEID)}
                              >
                                {z.ZONEENAME}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* व्यवहार प्रकार */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-28 sm:text-right whitespace-nowrap">
                        व्यवहार प्रकार :
                      </Label>
                      <div className="flex-1">
                        <Select
                          value={values.transactionType}
                          onValueChange={handleTransactionChange}
                          disabled={isEditMode}
                        >
                          <SelectTrigger className="w-full h-9">
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
                    </div>

                    {/* दिनांक */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-20 sm:text-right whitespace-nowrap">
                        दिनांक :
                      </Label>
                      <Input
                        className="w-full sm:w-[150px] h-9"
                        value={formatDate(values.date)}
                        readOnly
                      />
                    </div>

                    {/* व्हाउचर क्रमांक */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-32 sm:text-right whitespace-nowrap">
                        व्हाउचर क्रमांक :
                      </Label>
                      <Input
                        className="w-full sm:w-[150px] h-9"
                        value={values.voucherNo}
                        onChange={(e) =>
                          setFieldValue("voucherNo", e.target.value)
                        }
                        disabled={isEditMode}
                      />
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* 🔷 MAIN SECTION */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-12">
                    {/* LEFT SECTION */}
                    <div>
                      <h3 className="mb-3 font-semibold text-base sm:text-lg">
                        जमा
                      </h3>

                      <div className="space-y-3">
                        <Row label="विभाग कोड">
                          <SearchableSelect
                            options={glCodes.map((g) => ({
                              label: g.GLSEARCHNAME || "",
                              value: String(g.GLCODE || ""),
                            }))}
                            value={values.creditDept}
                            onChange={async (v) => {
                              const glcode = v?.value || v;
                              setFieldValue("creditDept", glcode);
                              setFieldValue("creditLedger", "");
                              await loadLedgers(glcode, "credit");
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
                            onChange={(v) =>
                              setFieldValue("creditLedger", v?.value || "")
                            }
                          />
                        </Row>

                        <Row label="रक्कम">
                          <Input
                            className="w-full h-9"
                            value={values.creditAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFieldValue("creditAmount", val);
                              setFieldValue("debitAmount", val);
                            }}
                          />
                        </Row>

                        {showChequeFields && (
                          <>
                            <Row label="धनादेश क्रमांक">
                              <Input
                                className="w-full h-9"
                                maxLength={6}
                                value={values.chequeNo}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFieldValue("chequeNo", value);

                                  if (
                                    value &&
                                    /^\d{1,6}$/.test(value) &&
                                    values.creditDept &&
                                    values.creditLedger &&
                                    values.department
                                  ) {
                                    fetchChequeBook(
                                      values,
                                      value,
                                      setFieldValue,
                                    );
                                  }
                                }}
                              />
                            </Row>

                            <Row label="धनादेश तारीख">
                              <Input
                                className="w-full h-9"
                                value={formatDate(values.chequeDate)}
                                readOnly
                              />
                            </Row>

                            <Row label="धनादेश पुष्टिका क्रमांक">
                              <Select
                                value={values.chequeRef || ""}
                                onValueChange={(v) =>
                                  setFieldValue("chequeRef", v)
                                }
                              >
                                <SelectTrigger className="w-full h-9">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {chequeBooks.map((b) => (
                                    <SelectItem
                                      key={b.NUM_CHEQUEBOOK_BOOKNO}
                                      value={String(b.NUM_CHEQUEBOOK_BOOKNO)}
                                    >
                                      {b.BOOKNO}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </Row>
                          </>
                        )}

                        <Row label="तपशील">
                          <Textarea
                            className="w-full min-h-[80px]"
                            value={values.details}
                            onChange={(e) =>
                              setFieldValue("details", e.target.value)
                            }
                          />
                        </Row>

                        <Row label="पार्टी संकेतांक">
                          <Select
                            value={values.party ? String(values.party) : ""}
                            onValueChange={(v) => setFieldValue("party", v)}
                          >
                            <SelectTrigger className="w-full h-9">
                              <SelectValue placeholder="-- निवडा --" />
                            </SelectTrigger>
                            <SelectContent>
                              {parties.map((p) => (
                                <SelectItem
                                  key={p.NUM_PARTYMST_PARTYID}
                                  value={String(p.NUM_PARTYMST_PARTYID)}
                                >
                                  {p.VAR_PARTYMST_PARTYNAME || "--"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Row>
                      </div>
                    </div>

                    {/* RIGHT SECTION */}
                    <div>
                      <h3 className="mb-3 font-semibold text-base sm:text-lg">
                        खर्च
                      </h3>

                      <div className="space-y-3">
                        <Row label="विभाग कोड">
                          <SearchableSelect
                            options={glCodes.map((g) => ({
                              label: g.GLSEARCHNAME || "",
                              value: String(g.GLCODE || ""),
                            }))}
                            value={values.debitDept}
                            onChange={async (v) => {
                              const glcode = v?.value || v;
                              setFieldValue("debitDept", glcode);
                              setFieldValue("debitLedger", "");
                              await loadLedgers(glcode, "debit");
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
                            onChange={(v) =>
                              setFieldValue("debitLedger", v?.value || "")
                            }
                          />
                        </Row>

                        <Row label="रक्कम">
                          <Input
                            className="w-full h-9"
                            value={values.debitAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFieldValue("creditAmount", val);
                              setFieldValue("debitAmount", val);
                            }}
                          />
                        </Row>
                      </div>
                    </div>
                  </div>

                  {/* 🔷 BUTTONS */}
                  <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
                    <Button
                      type="submit"
                      className="w-full sm:w-auto bg-blue-900 text-white px-6"
                    >
                      स्वीकार
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full sm:w-auto px-6"
                      onClick={() => navigate("/Transactions/FrmTransferList")}
                    >
                      रद्द
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full sm:w-auto px-6"
                      onClick={() => formikRef.current.resetForm()}
                    >
                      बदल
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

export default FrmTransfer;
