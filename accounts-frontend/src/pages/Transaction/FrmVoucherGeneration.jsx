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
  department: "-1",
  fromDate: new Date(),
  toDate: new Date(),
  fromDateEnabled: false,
  partyCode: "",
  deptCode: "",
  ledger: "",
  amount: "",
  chequeNo: "",
  chequeDate: new Date(),
  paymentType: "2",
  details: "",
  transactionDate: new Date(),
  receiptNo: "",
  chequeBookNo: "",
  bankBalance: "",
};

/* ================= REUSABLE FIELD ================= */
const FormField = ({ label, children }) => (
  <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] items-start sm:items-center gap-2">
    <Label className="sm:text-right w-full">{label}</Label>
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
  const [voucherList, setVoucherList] = useState([]);
  const [voucherDetails, setVoucherDetails] = useState([]);
  const [chequeBooks, setChequeBooks] = useState([]);

  const totalSelectedAmount = voucherList
    .filter((v) => v.selected)
    .reduce((sum, v) => sum + (v.deyRakkam || 0), 0);

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

  const fetchVouchers = async (values) => {
    debugger;
    try {
      // ✅ SHOW LOADER
      Swal.fire({
        title: "लोड होत आहे...",
        text: "कृपया थांबा",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const payload = {
        zone_id: Number(values.department),
        from_date: values.fromDate.toLocaleDateString("en-GB"),
        to_date: values.toDate.toLocaleDateString("en-GB"),
        party_id: Number(values.partyCode),
        budget_id: "",
        nidhi_id: "",
        corp_id: ulbId,
      };
      console.log("zone id ", values.department);

      const headers = { Authorization: `Bearer ${token}` };

      // 🔹 1. TRY balance voucher
      let res = await axios.post(
        `${BASE_URL}/api/FrmVoucherGeneration/balance-voucher`,
        payload,
        { headers },
      );

      let data = res.data?.rows || [];

      // 🔹 2. IF EMPTY → call voucher-prep
      if (!data.length) {
        const prepRes = await axios.post(
          `${BASE_URL}/api/FrmVoucherGeneration/voucher-prep`,
          payload,
          { headers },
        );
        data = prepRes.data?.rows || [];
      }

      setVoucherList(data);

      // ✅ CLOSE LOADER
      Swal.close();
    } catch (err) {
      Swal.close(); // always close loader

      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Voucher fetch failed",
      });
    }
  };

  const fetchChequeBook = async (values) => {
    try {
      // ✅ match .NET validation (6 digit cheque)
      if (!/^\d{6}$/.test(values.chequeNo)) {
        return;
      }

      if (!values.deptCode || !values.ledger) return;

      const res = await axios.post(
        `${BASE_URL}/api/FrmVoucherGeneration/cheque-book`,
        {
          bank_glcode: values.deptCode,
          bank_accno: values.ledger,
          cheque_no: values.chequeNo,
          corp_id: ulbId,
          zone_id: values.department,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setChequeBooks(res.data?.rows || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Cheque book fetch failed");
    }
  };

  const fetchVoucherDetails = async (selectedRefs) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmVoucherGeneration/voucher-details`,
        {
          refno_list: selectedRefs,
          corp_id: ulbId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setVoucherDetails(res.data?.rows || []);
    } catch {
      Swal.fire("Voucher details failed");
    }
  };

  const fetchVoucherFullData = async (voucherNo) => {
    try {
      const [tableRes, taxRes] = await Promise.all([
        axios.post(
          `${BASE_URL}/api/FrmVoucherGeneration/voucher-table`,
          { voucher_no: voucherNo, corp_id: ulbId },
          { headers: { Authorization: `Bearer ${token}` } },
        ),
        axios.post(
          `${BASE_URL}/api/FrmVoucherGeneration/voucher-tax`,
          { voucher_no: voucherNo, corp_id: ulbId },
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ]);

      return {
        table: tableRes.data?.data?.rows || [],
        tax: taxRes.data?.rows || [],
      };
    } catch {
      Swal.fire("Voucher full data failed");
    }
  };

const handleSubmit = async (values, formikHelpers) => {
  formikHelpers.setSubmitting(true);

  const status = "A";

  try {
    const selectedRows = voucherList.filter((v) => v.selected);

    if (!selectedRows.length) {
      Swal.fire("किमान एक व्यवहार निवडा");
      return;
    }

  
    if (values.paymentType === "2" || values.paymentType === "3") {
      if (!values.chequeNo) {
        Swal.fire("Cheque number required");
        return;
      }

      if (!values.chequeBookNo) {
        Swal.fire("Cheque book required");
        return;
      }
    }

    Swal.fire({
      title: "Saving...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

   
    const fullData = await fetchVoucherFullData(selectedRows[0].VCHNO);

    if (!fullData) {
      Swal.close();
      Swal.fire("Error", "Voucher data load failed", "error");
      return;
    }

    const firstTax = fullData.tax?.[0];

    const deptCode = firstTax?.GLCODE || values.deptCode;
    const ledger = firstTax?.ACCNO || values.ledger;
    const narration = fullData.table?.[0]?.DRACCNO || values.details || "-";

    const formatDate = (date) =>
      new Date(date)
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/ /g, "-");

    const str2 = selectedRows.map((v) => v.REFNO).join(",");

    const str3 = selectedRows
      .map((v) => {
        const nivalDey = (v.TOTALAMT || 0) - (v.AMT || 0);
        const dey = v.deyRakkam ?? nivalDey;
        const shillak = nivalDey - dey;

        return [
          v.REFNO,
          nivalDey,
          dey,
          shillak,
          v.TOTALAMT || 0,
          v.AMT || 0,
          v.VCHNO,
          v.DEPTID || 0,
        ].join("#");
      })
      .join("$");

    const str4 = selectedRows
      .map((v) => {
        const nivalDey = (v.TOTALAMT || 0) - (v.AMT || 0);
        const dey = v.deyRakkam ?? nivalDey;
        const shillak = nivalDey - dey;

        return [
          v.REFNO,
          new Date(v.TRNSDATE).toLocaleDateString("en-GB"),
          v.VCHNO,
          deptCode,
          ledger,
          narration,
          nivalDey,
          dey,
          shillak,
          values.partyCode || 0,
          v.DEPTID || 0,
        ].join("#");
      })
      .join("$");

    
    const str1 = [
      status,
      4, 
      narration,
      deptCode,
      ledger,
      totalSelectedAmount,
      values.chequeNo || "", 
      formatDate(values.chequeDate),
      values.department || 0,
      0,
      formatDate(values.transactionDate),
      values.budgetId || "",
      values.chequeBookNo || "", 
      values.paymentType || 2,
      values.nidhi_id || "",
    ].join("~");

    const payload = {
      refNo: selectedRows[0].REFNO,
      userId: user?.userId,
      txnSourceId: 6,
      txnStatus: status,
      str1,
      str2,
      str3,
      str4,
    };

    console.log("FINAL PAYLOAD:", payload);

    const res = await axios.post(
      `${BASE_URL}/api/FrmVoucherGeneration/voucher-generation`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Swal.close();

    if (res.data?.success) {
      Swal.fire("Success", res.data.errorMsg, "success");
    } else {
      Swal.fire("Error", res.data.errorMsg, "error");
    }
  
  } catch (err) {
    Swal.close();
    console.error(err);
    Swal.fire("Error", "Voucher generation failed", "error");
  }
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
                          {/* ✅ ALL OPTION */}
                          <SelectItem value="-1">All</SelectItem>

                          {/* EXISTING OPTIONS */}
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

                    <div className="flex items-end col-span-full sm:col-span-1 gap-2">
                      <Button
                        type="button"
                        onClick={() => fetchVouchers(values)}
                        className="bg-blue-900 text-white w-full sm:w-auto "
                      >
                        व्हाउचर शोध
                      </Button>

                      <Button
                        type="button"
                        className="bg-blue-900 text-white w-full sm:w-auto "
                        onClick={() => {
                          const selectedRefs = voucherList
                            .filter((v) => v.selected)
                            .map((v) => v.REFNO);

                          if (!selectedRefs.length) {
                            Swal.fire("किमान एक व्यवहार निवडा");
                            return;
                          }

                          fetchVoucherDetails(selectedRefs);
                        }}
                      >
                        व्यवहार तपशील
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="border rounded-lg p-4 sm:p-5 space-y-4">
                  {voucherList.length > 0 && (
                    <div className="mt-4 rounded-xl border bg-white shadow-sm overflow-hidden">
                      {/* TABLE WRAPPER */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          {/* HEADER */}
                          <thead className="bg-muted border-b">
                            <tr className="text-muted-foreground">
                              <th className="p-3 text-left">Select</th>
                              <th className="p-3 text-left">Ref No</th>
                              <th className="p-3 text-left">दिनांक</th>
                              <th className="p-3 text-left">Voucher</th>
                              <th className="p-3 text-left">Zone</th>
                              <th className="p-3 text-left">Party</th>
                              <th className="p-3 text-right">Total</th>
                              <th className="p-3 text-right">Amt</th>
                              <th className="p-3 text-right">निव्वळ देय</th>
                              <th className="p-3 text-right">देय रक्कम</th>
                              <th className="p-3 text-right">शिल्लक</th>
                            </tr>
                          </thead>

                          {/* BODY */}
                          <tbody>
                            {voucherList.map((row, i) => {
                              const nivalDey =
                                (row.TOTALAMT || 0) - (row.AMT || 0);
                              const deyRakkam = row.deyRakkam ?? nivalDey;
                              const shillak = nivalDey - deyRakkam;

                              return (
                                <tr
                                  key={i}
                                  className="border-b hover:bg-muted/50 transition-colors"
                                >
                                  {/* CHECKBOX */}
                                  <td className="p-3">
                                    <Checkbox
                                      checked={row.selected || false}
                                      onCheckedChange={(checked) => {
                                        const updated = [...voucherList];
                                        updated[i].selected = checked;
                                        updated[i].deyRakkam = checked
                                          ? updated[i].deyRakkam || nivalDey
                                          : 0;
                                        setVoucherList(updated);
                                      }}
                                    />
                                  </td>

                                  <td className="p-3">{row.REFNO}</td>

                                  <td className="p-3">
                                    {new Date(
                                      row.TRNSDATE,
                                    ).toLocaleDateString()}
                                  </td>

                                  <td className="p-3 font-medium">
                                    {row.VCHNO}
                                  </td>
                                  <td className="p-3">{row.ZONENAME}</td>
                                  <td className="p-3">{row.PARTYNAME}</td>

                                  <td className="p-3 text-right">
                                    {row.TOTALAMT}
                                  </td>
                                  <td className="p-3 text-right">{row.AMT}</td>

                                  {/* निव्वळ देय */}
                                  <td className="p-3 text-right font-medium">
                                    {nivalDey}
                                  </td>

                                  {/* EDITABLE */}
                                  <td className="p-3 text-right">
                                    <Input
                                      value={deyRakkam}
                                      disabled={!row.selected}
                                      onChange={(e) => {
                                        let val = Number(e.target.value) || 0;

                                        if (val > nivalDey) {
                                          Swal.fire(
                                            "देय रक्कम जास्त असू शकत नाही!",
                                          );
                                          return;
                                        }

                                        const updated = [...voucherList];
                                        updated[i].deyRakkam = val;
                                        setVoucherList(updated);
                                      }}
                                      className="h-8 w-24 text-right"
                                    />
                                  </td>

                                  {/* शिल्लक */}
                                  <td
                                    className={`p-3 text-right font-medium ${
                                      shillak < 0 ? "text-red-600" : ""
                                    }`}
                                  >
                                    {shillak}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
                          const value = v?.value;

                          setFieldValue("ledger", value);

                          // 🔍 find selected ledger object
                          const selectedLedger = ledgers.find(
                            (l) => String(l.OBJECTCODE) === String(value),
                          );

                          if (selectedLedger) {
                            // ✅ 1. Auto fill bank balance
                            setFieldValue(
                              "bankBalance",
                              selectedLedger.BALANCE || 0,
                            );

                            // ✅ 2. Auto fill details (ACCNAME)
                            setFieldValue(
                              "details",
                              selectedLedger.ACCNAME || "",
                            );
                          }
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

                    <FormField label="देय रक्कम एकूण">
                      <Input value={totalSelectedAmount} readOnly />
                    </FormField>

                    <FormField label="देयक प्रकार">
                      <Select
                        value={values.paymentType}
                        onValueChange={(v) => setFieldValue("paymentType", v)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="निवडा" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="2">Cheque</SelectItem>
                          <SelectItem value="1">Bank</SelectItem>
                          <SelectItem value="3">RTGS</SelectItem>
                          <SelectItem value="4">Adjustment</SelectItem>
                          <SelectItem value="5">
                            FDR (मुदत ठेव पावती)
                          </SelectItem>
                          <SelectItem value="6">Bank Guarantee</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    {(values.paymentType === "2" ||
                      values.paymentType === "3") && (
                      <FormField label="धनादेश पुस्तिका क्रमांक">
                        <Select
                          value={values.chequeBookNo}
                          onValueChange={(v) =>
                            setFieldValue("chequeBookNo", v)
                          }
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="निवडा" />
                          </SelectTrigger>
                          <SelectContent>
                            {chequeBooks.length > 0 ? (
                              chequeBooks.map((b) => (
                                <SelectItem
                                  key={b.NUM_CHEQUEBOOK_BOOKNO}
                                  value={String(b.NUM_CHEQUEBOOK_BOOKNO)}
                                >
                                  {b.BOOKNO}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem  value="0">
                                No cheque book found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </FormField>
                    )}

                    {(values.paymentType === "2" ||
                      values.paymentType === "3") && (
                      <FormField label="धनादेश क्रमांक">
                        <Input
                          name="chequeNo"
                          value={values.chequeNo}
                          onChange={(e) => {
                            handleChange(e);

                            // 🔥 clear old data
                            setChequeBooks([]);
                            setFieldValue("chequeBookNo", "");

                            const updatedValues = {
                              ...values,
                              chequeNo: e.target.value,
                            };

                            fetchChequeBook(updatedValues);
                          }}
                          className="h-9 w-full"
                        />
                      </FormField>
                    )}

                    {(values.paymentType === "2" ||
                      values.paymentType === "3") && (
                      <FormField label="धनादेश दिनांक">
                        <DatePicker
                          value={values.chequeDate}
                          onChange={(d) => setFieldValue("chequeDate", d)}
                          className="h-9 w-full"
                        />
                      </FormField>
                    )}

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
