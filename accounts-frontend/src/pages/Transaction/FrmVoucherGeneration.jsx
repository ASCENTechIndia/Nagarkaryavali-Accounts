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
  const [searchDone, setSearchDone] = useState(false);

  const totalSelectedAmount = voucherList
    .filter((v) => v.selected)
    .reduce((sum, v) => sum + Math.abs(v.deyRakkam || 0), 0); // ✅ FIX

  useEffect(() => {
    if (!ulbId) return;

    const headers = { Authorization: `Bearer ${token}` };

    // 🔷 PRABHAG
    axios
      .post(`${BASE_URL}/api/Receipt/zones`, { corp_id: ulbId }, { headers })
      .then((res) => setZones(res.data?.data || []));

    // 🔷 GL CODES
    axios
      .get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache", // ✅ prevent 304 issue
        },
      })
      .then((res) => {
        setGlCodes(res.data?.data || []); // ✅ FIXED (data not rows)
      })
      .catch(() => Swal.fire("GL list load failed"));

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
    try {
      Swal.fire({
        title: "लोड होत आहे...",
        text: "कृपया थांबा",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        zone_id: Number(values.department),
        from_date: values.fromDateEnabled
          ? values.fromDate.toLocaleDateString("en-GB")
          : "",
        to_date: values.fromDateEnabled
          ? values.toDate.toLocaleDateString("en-GB")
          : "",
        party_id: values.partyCode ? Number(values.partyCode) : null,
        budget_id: values.budgetId ? Number(values.budgetId) : null,
        nidhi_id: values.nidhiId ? Number(values.nidhiId) : null,
        corp_id: Number(ulbId),
      };

      const headers = { Authorization: `Bearer ${token}` };

      const [balanceRes, prepRes] = await Promise.all([
        axios.post(
          `${BASE_URL}/api/FrmVoucherGeneration/balance-voucher`,
          payload,
          { headers },
        ),
        axios.post(
          `${BASE_URL}/api/FrmVoucherGeneration/voucher-prep`,
          payload,
          { headers },
        ),
      ]);

      const normalizeData = (data) =>
        (data || []).map((row) => ({
          REFNO: row.REFNO ?? row.refno,
          TRNSDATE: row.TRNSDATE ?? row.trnsdate,
          VCHNO: row.VCHNO ?? row.vchno,

          ZONENAME: row.ZONENAME ?? row.zonename,
          GRAMPANCH: row.GRAMPANCH ?? row.grampanch ?? "",
          PARTYNAME: row.PARTYNAME ?? row.partyname ?? "",

          TOTALAMT: Number(row.TOTALAMT ?? row.totalamt ?? 0),
          AMT: Number(row.AMT ?? row.amt ?? 0),
          BALAMT: Number(row.BALAMT ?? row.balamt ?? 0),

          DRGL: row.DRGL ?? row.drgl,
          GLNAME: row.GLNAME ?? row.glname,
          DRACC: row.DRACC ?? row.dracc,
          ACCNAME: row.ACCNAME ?? row.accname,

          PRENARRATION: row.PRENARRATION ?? row.prenarration ?? "",
          PARTYCODE: row.PARTYCODE ?? row.partycode ?? 0,
          DEPTID: row.DEPTID ?? row.deptid ?? 0,
        }));

      const balanceData = normalizeData(balanceRes.data?.rows);
      const prepData = normalizeData(prepRes.data?.rows);

      const finalData = [...balanceData, ...prepData];

      finalData.forEach((v) => {
        const nival = v.BALAMT || v.TOTALAMT - v.AMT;

        v.deyRakkam = Math.abs(nival); // ✅ FIX
      });
      setVoucherList(finalData);
      setCurrentPage(1);

      Swal.close();

      if (finalData.length > 0) {
        setSearchDone(true);
      } else {
        Swal.fire("No data found");
      }
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "Voucher fetch failed", "error");
    }
  };

  const fetchChequeBook = async ({
    chequeNo,
    deptCode,
    ledger,
    department,
    setFieldValue,
  }) => {
    try {
      const payload = {
        bank_glcode: String(deptCode),
        bank_accno: String(ledger),
        cheque_no: String(chequeNo),
        corp_id: String(ulbId),
        zone_id: String(department),
      };

      const res = await axios.post(
        `${BASE_URL}/api/FrmVoucherGeneration/cheque-book`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const books = res.data?.rows || [];

      console.log("Books:", books);

      setChequeBooks(books);

      if (books.length > 0) {
        const bookNo = String(books[0].NUM_CHEQUEBOOK_BOOKNO);

        // ✅ ensure state updated first
        setTimeout(() => {
          setFieldValue("chequeBookNo", bookNo);
        }, 100);
      }
      // ✅ FORCE AUTO SELECT
      if (books.length > 0) {
        const bookNo = String(books[0].NUM_CHEQUEBOOK_BOOKNO);

        // 🔥 important: delay ensures dropdown is ready
        setTimeout(() => {
          setFieldValue("chequeBookNo", bookNo);
        }, 0);
      } else {
        setFieldValue("chequeBookNo", "");
      }
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

  const fetchBankBalance = async (glcode, accno, setFieldValue) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/frmPayment/account-balance`,
        {
          targetDate: new Date()
            .toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            .replace(/ /g, "-"), // 👉 29-APR-2026 format
          corpId: Number(ulbId),
          ulbid: Number(ulbId),
          glcode: Number(glcode),
          accno: Number(accno),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const balance = res.data?.data?.data?.BALANCE || 0;

      setFieldValue("bankBalance", Math.abs(balance));
    } catch (err) {
      console.error(err);
      Swal.fire("Bank balance fetch failed");
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = voucherList.slice(startIndex, startIndex + rowsPerPage);

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

      const isCheque = values.paymentType === "2" || values.paymentType === "3";

      if (isCheque) {
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
      const narration = fullData.table?.[0]?.NARRATION || values.details || "-";

      // ✅ TOTAL AMOUNT FIX
      const totalSelectedAmount = selectedRows.reduce(
        (sum, v) => sum + Number(v.deyRakkam || 0),
        0,
      );

      // ✅ DATE FORMATTERS
      const formatDate = (date) =>
        new Date(date)
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replace(/ /g, "-");

      const formatDate2 = (date) =>
        new Date(date).toLocaleDateString("en-GB").replace(/\//g, "-");

      const str2 = selectedRows.map((v) => v.REFNO).join(",");

      // ✅ IMPORTANT: numeric voucher no
      const getVoucherNo = (v) =>
        v.VOUCHERNO || formatDate2(v.TRNSDATE).replace(/-/g, "");

      // ✅ STR3
      const str3 = selectedRows
        .map((v) => {
          const nivalDey =
            v.BALAMT != null
              ? Math.abs(Number(v.BALAMT))
              : Math.abs((v.TOTALAMT || 0) - (v.AMT || 0));

          const dey = Math.abs(v.deyRakkam ?? nivalDey);
          const shillak = Math.abs(nivalDey - dey);

          return [
            v.REFNO,
            nivalDey,
            dey,
            shillak,
            v.TOTALAMT || 0,
            v.AMT || 0,
            getVoucherNo(v),
            v.DEPTID || 0,
          ].join("#");
        })
        .join("$");

      // ✅ STR4
      const str4 = selectedRows
        .map((v) => {
          const nivalDey = (v.TOTALAMT || 0) - (v.AMT || 0);
          const dey = v.deyRakkam ?? nivalDey;
          const shillak = nivalDey - dey;

          return [
            v.REFNO,
            formatDate2(v.TRNSDATE),
            getVoucherNo(v),
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

      // ✅ CHEQUE VALUES
      let chequeNo = "0";
      let chequeDate = "0";
      let chequeBook = "0";

      if (isCheque) {
        chequeNo = values.chequeNo;
        chequeBook = values.chequeBookNo;
        chequeDate = formatDate(values.chequeDate);
      }

      // ✅ FIXED STR1 (CRITICAL)
      const str1 = [
        status,
        4,
        narration,
        deptCode,
        ledger,
        totalSelectedAmount,
        chequeNo,
        chequeDate,
        values.zoneId || 0, // ✅ FIXED
        values.grampanchayatId || 0, // ✅ FIXED
        formatDate(values.transactionDate),
        values.budgetId || 0,
        chequeBook,
        values.paymentType,
        values.nidhi_id || 0,
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
        { headers: { Authorization: `Bearer ${token}` } },
      );

      Swal.close();

      if (res.data?.success) {
        Swal.fire({
          title: "Success",
          text: res.data.errorMsg,
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });

        formikHelpers.resetForm();
        setVoucherList([]);
        setVoucherDetails([]);
        setChequeBooks([]);
        setSearchDone(false);
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
                        disabled={searchDone} // ✅ ADD THIS
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {/* ✅ ALL OPTION */}
                          <SelectItem>-- विकल्प निवडा --</SelectItem>

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
                          className="border-gray-700 data-[state=checked]:bg-blue-900"
                          checked={values.fromDateEnabled}
                          onCheckedChange={(v) =>
                            setFieldValue("fromDateEnabled", v)
                          }
                          disabled={searchDone} // ✅ ADD THIS
                        />
                        <DatePicker
                          value={values.fromDate}
                          onChange={(d) => setFieldValue("fromDate", d)}
                          disabled={!values.fromDateEnabled} // ✅ ADD
                        />
                      </div>
                    </FormField>

                    <FormField label="दिनांक पर्यंत">
                      <DatePicker
                        value={values.toDate}
                        onChange={(d) => setFieldValue("toDate", d)}
                        className="h-9 w-full"
                        disabled={searchDone}
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
                        disabled={searchDone} // ✅ ADD THIS
                        onClick={() => {
                          // ✅ ONLY Prabhag required
                          if (
                            !values.department ||
                            values.department === "-1"
                          ) {
                            Swal.fire("Please select Prabhag");
                            return;
                          }

                          fetchVouchers(values);
                        }}
                        className="bg-blue-900 text-white w-full sm:w-auto"
                      >
                        व्हाउचर शोध
                      </Button>

                      {searchDone && (
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
                      )}
                    </div>
                  </div>
                </section>

                <section className="border rounded-lg p-4 sm:p-5 space-y-4">
                  {voucherList.length > 0 && (
                    <div className="mt-4  border bg-white shadow-sm overflow-hidden">
                      {/* TABLE WRAPPER */}
                      <div className="border border-gray-300 bg-white shadow-sm overflow-x-auto  max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[#163e72] text-white">
                            <tr>
                              <th className="p-2">Select</th>
                              <th className="p-2">रेफ. क्र.</th>
                              <th className="p-2">दिनांक</th>
                              <th className="p-2">व्हा. क्र.</th>
                              <th className="p-2">झोन</th>
                              <th className="p-2">पार्टी</th>

                              <th className="p-2 text-right">एकूण रक्कम</th>

                              <th className="p-2">डेबिट जीएल</th>
                              <th className="p-2">डेबिट जीएल नाव</th>
                              <th className="p-2">डेबिट खाते</th>
                              <th className="p-2">डेबिट खाते नाव</th>

                              <th className="p-2">तपशील</th>

                              <th className="p-2 text-right">रक्कम</th>
                              <th className="p-2 text-right">निव्वळ देय</th>
                              <th className="p-2 text-right">देय रक्कम</th>
                              <th className="p-2 text-right">शिल्लक</th>
                            </tr>
                          </thead>

                          <tbody>
                            {paginatedData.map((row, i) => {
                              const actualIndex = startIndex + i;

                              const nivalDey =
                                row.BALAMT != null
                                  ? Number(row.BALAMT)
                                  : (row.TOTALAMT || 0) - (row.AMT || 0);

                              const deyRakkam = row.deyRakkam ?? nivalDey;
                              const shillak = nivalDey - deyRakkam;

                              return (
                                <tr
                                  key={i}
                                  className="border-b hover:bg-gray-50"
                                >
                                  {/* SELECT */}
                                  <td className="p-2 text-center">
                                    <Checkbox
                                      checked={row.selected || false}
                                      onCheckedChange={(checked) => {
                                        const updated = voucherList.map(
                                          (v, idx) =>
                                            idx === actualIndex
                                              ? {
                                                  ...v,
                                                  selected: checked,
                                                  deyRakkam: checked
                                                    ? (v.deyRakkam ?? nivalDey)
                                                    : 0,
                                                }
                                              : v,
                                        );
                                        setVoucherList(updated);
                                      }}
                                    />
                                  </td>

                                  <td className="p-2">{row.REFNO}</td>

                                  <td className="p-2">
                                    {row.TRNSDATE
                                      ? new Date(
                                          row.TRNSDATE,
                                        ).toLocaleDateString("en-GB")
                                      : "-"}
                                  </td>

                                  <td className="p-2">{row.VCHNO}</td>

                                  <td className="p-2">{row.ZONENAME || "-"}</td>

                                  <td className="p-2">
                                    {row.PARTYNAME || `ID: ${row.PARTYCODE}`}
                                  </td>

                                  {/* TOTAL */}
                                  <td className="p-2 text-right">
                                    {row.TOTALAMT}
                                  </td>

                                  {/* GL */}
                                  <td className="p-2">{row.DRGL}</td>
                                  <td className="p-2">{row.GLNAME}</td>

                                  {/* ACCOUNT */}
                                  <td className="p-2">{row.DRACC}</td>
                                  <td className="p-2">{row.ACCNAME}</td>

                                  {/* NARRATION */}
                                  <td className="p-2">{row.PRENARRATION}</td>

                                  {/* AMT */}
                                  <td className="p-2 text-right">{row.AMT}</td>

                                  {/* NIVAL */}
                                  <td className="p-2 text-right font-semibold">
                                    {nivalDey}
                                  </td>

                                  {/* EDITABLE */}
                                  <td className="p-2 text-right">
                                    <Input
                                      className="h-7 w-24 text-right"
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

                                        const updated = voucherList.map(
                                          (v, idx) =>
                                            idx === actualIndex
                                              ? { ...v, deyRakkam: val }
                                              : v,
                                        );

                                        setVoucherList(updated);
                                      }}
                                    />
                                  </td>

                                  {/* BALANCE */}
                                  <td className="p-2 text-right">{shillak}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="flex justify-between items-center p-4">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                          >
                            Previous
                          </Button>

                          <span className="text-sm">
                            Page {currentPage} of{" "}
                            {Math.ceil(voucherList.length / rowsPerPage)}
                          </span>

                          <Button
                            type="button"
                            variant="outline"
                            disabled={
                              currentPage ===
                              Math.ceil(voucherList.length / rowsPerPage)
                            }
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                          >
                            Next
                          </Button>
                        </div>
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
                          label: g.GLSEARCHNAME || "", // ✅ FIXED
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

                          const selectedLedger = ledgers.find(
                            (l) => String(l.OBJECTCODE) === String(value),
                          );

                          if (selectedLedger) {
                            fetchBankBalance(
                              values.deptCode,
                              value,
                              setFieldValue,
                            );
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
                          value={values.chequeBookNo || ""}
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
                                  value={String(b.NUM_CHEQUEBOOK_BOOKNO)} // ✅ string only
                                >
                                  {b.BOOKNO}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="0">
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
                            const value = e.target.value;

                            setFieldValue("chequeNo", value);

                            // reset previous result
                            setChequeBooks([]);
                            setFieldValue("chequeBookNo", "");

                            if (
                              value &&
                              /^\d{6}$/.test(value) &&
                              values.deptCode &&
                              values.ledger &&
                              values.department
                            ) {
                              fetchChequeBook({
                                chequeNo: value,
                                deptCode: values.deptCode,
                                ledger: values.ledger,
                                department: values.department,
                                setFieldValue,
                              });
                            }
                          }}
                          disabled={
                            !values.deptCode ||
                            !values.ledger ||
                            !values.department
                          } // ✅ IMPORTANT
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
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full sm:w-auto"
                >
                  रद्द
                </Button>

                <Button
                  type="button"
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
