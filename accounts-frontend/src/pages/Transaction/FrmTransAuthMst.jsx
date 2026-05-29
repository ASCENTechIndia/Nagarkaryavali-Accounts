import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ShadCNTable from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { DatePicker } from "@/components/ui/calendar";
import config from "@/utils/config";
import Swal from "sweetalert2";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const FrmTransAuthMst = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const location = useLocation();
  const navigate = useNavigate();

  const [zone, setZone] = useState("");
  const [refNo, setRefNo] = useState("");
  const [transType, setTransType] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [trnsDate, setTrnsDate] = useState(new Date());
  const [partyName, setPartyName] = useState("");
  const [username, setUsername] = useState("");
  const [datetime, setDatetime] = useState("");
  const [amount, setAmount] = useState("");

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [zones, setZones] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  console.log("location.state?.voucherData", location.state?.voucherData);

  const headers = [
    "मेजर",
    "मेजर कोड नाव",
    "मायनर",
    "मायनर कोड नाव",
    "तपशील",
    "पार्टी",
    "क्रेडिट",
    "डेबिट",
  ];

  const keyMapping = {
    मेजर: "majorCode",
    "मेजर कोड नाव": "majorName",
    मायनर: "minorCode",
    "मायनर कोड नाव": "minorName",
    तपशील: "description",
    पार्टी: "party",
    क्रेडिट: "credit",
    डेबिट: "debit",
  };

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
        }
      );

      if (res?.data) {
        setZones(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching zones:", err);
    }
  };

  const fetchTransactionDetails = async (refNoParam, trnsTypeIdParam) => {
    try {
      setLoading(true);

      const response = await axios.post(
        `${BASE_URL}/api/FrmTransAuthList/transaction-details`,
        {
          refNo: refNoParam,
          trnsTypeId: trnsTypeIdParam,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.success && response?.data?.data) {
        const { header, rows } = response.data.data;

        setRefNo(header.REFNO?.toString() || "");
        setVoucherNo(header.DOCNO?.toString() || "");
        setTransType(header.TRNSTYPE || "");
        setZone(header.ZONENAME || "");
        setPartyName(header.PARTY || "");
        setTrnsDate(header.TRNSDATE ? new Date(header.TRNSDATE) : new Date());
        setUsername(header.USERNAME || "");
        setDatetime(header.DATETIME ? new Date(header.DATETIME).toLocaleString() : "");
        
        const totalAmount = rows.reduce((sum, row) => sum + (row.credit || row.debit || 0), 0);
        setAmount(totalAmount.toString());

        const formattedRows = rows.map((row, index) => ({
          id: index,
          majorCode: row.glCode || "-",
          majorName: row.glName || "-",
          minorCode: row.accNo || "-",
          minorName: row.accName || "-",
          description: row.narration || "-",
          party: row.party || "-",
          credit: row.credit?.toLocaleString("en-IN") || "0",
          debit: row.debit?.toLocaleString("en-IN") || "0",
          creditRaw: row.credit || 0,
          debitRaw: row.debit || 0,
        }));

        setTableData(formattedRows);
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      Swal.fire({
        icon: "error",
        title: "त्रुटी",
        text: "व्यवहार तपशील मिळवताना त्रुटी आली",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCredit = tableData.reduce((sum, row) => sum + (row.creditRaw || 0), 0);
  const totalDebit = tableData.reduce((sum, row) => sum + (row.debitRaw || 0), 0);

  const handleAccept = async () => {
    const result = await Swal.fire({
      title: "अधिकृतता",
      text: "आपण हा व्यवहार अधिकृत करण्याची खात्री करतो का?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "होय, अधिकृत करा",
      cancelButtonText: "रद्द करा",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) {
      return;
    }

    let loaderSwal;

    try {
      setSubmitting(true);
      loaderSwal = Swal.fire({
        title: "Approving...",
        text: "Please wait for transaction approval",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
      });

      const voucherData = location.state?.voucherData;

      const requestBody = {
        refNo: parseInt(voucherData.refno),
        trnsSourceId:  parseInt(voucherData.trnstypeid),
        trnsStatus: "A",
        str1: null,
        str2: null,
        userId: user?.userId,
      };

      const response = await axios.post(
        `${BASE_URL}/api/FrmTransAuthList/trans-auth-save`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Approve Response :", response);

      loaderSwal.close();

      if (response.data?.success || response.data?.data?.errorCode === -100) {
        const message = response.data?.data?.message || "व्यवहार यशस्वीरित्या अधिकृत करण्यात आला";
        await Swal.fire({
          text: message,
          confirmButtonText: "ठीक आहे",
        });
        await generatePDF(voucherData);
        navigate("/Transactions/FrmTransAuthList");
      } else {
        const errorMsg = response?.data?.data?.message || response?.data?.message || "व्यवहार अधिकृत करताना त्रुटी आली";
        await Swal.fire({
          text: errorMsg,
          confirmButtonText: "ठीक आहे",
        });
      }
    } catch (error) {
      console.error("Error accepting transaction:", error);
      let errorMsg = "व्यवहार अधिकृत करताना त्रुटी आली";
      
      if (error.response?.data?.data?.message) {
        errorMsg = error.response.data.data.message;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      await Swal.fire({
        text: errorMsg,
        confirmButtonText: "ठीक आहे",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const generatePDF = async (voucherData) => {
    debugger;
    let pdfLoader = null;
    try {
      pdfLoader  =Swal.fire({
        title: "Generating PDF...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      let pdfUrl = null;
      const currentUlbId = Number(user?.ulbId);
      const transTypeId = parseInt(location.state?.transvalue);
      const refNo = parseInt(voucherData.refno);

      console.log("Generating PDF for:", { currentUlbId, transTypeId, refNo });

      if (currentUlbId === 930) {
        if (transTypeId === 1) {
          console.log("Calling receipt-pdf API...");
          const res = await axios.post(
            `${BASE_URL}/api/Receipt/receipt-pdf`,
            {
              refno: refNo,
              ulbid: currentUlbId,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          console.log("Receipt PDF Response:", res.data);
          
          if (res?.data?.success && res?.data?.pdfUrl) {
            pdfUrl = res.data.pdfUrl;
          } else if (res?.data?.pdfUrl) {
            pdfUrl = res.data.pdfUrl;
          }
        }
        else if (transTypeId === 2) {
          console.log("Calling payment-pdf API...");
          const res = await axios.post(
            `${BASE_URL}/api/frmPayment/payment-pdf`,
            {
              refno: refNo,
              ulbid: currentUlbId,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          console.log("Payment PDF Response:", res.data);
          
          if (res?.data?.success && res?.data?.pdfUrl) {
            pdfUrl = res.data.pdfUrl;
          } else if (res?.data?.pdfUrl) {
            pdfUrl = res.data.pdfUrl;
          }
        }
        else if (transTypeId === 5 || transTypeId === 8 || transTypeId === 9) {
          console.log("Calling counter-voucher-pdf API...");
          const res = await axios.post(
            `${BASE_URL}/api/FrmTransfer/counter-voucher-pdf`,
            {
              refno: refNo,
              ulbId: currentUlbId,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          console.log("Counter Voucher PDF Response:", res.data);
          
          if (res?.data?.success && res?.data?.pdfUrl) {
            pdfUrl = res.data.pdfUrl;
          } else if (res?.data?.pdfUrl) {
            pdfUrl = res.data.pdfUrl;
          }
        }
      }
      
      await pdfLoader.close();

      if (pdfUrl) {
        console.log("Opening PDF:", pdfUrl);
        window.open(pdfUrl, "_blank");
      } else {
        console.warn("No PDF URL received");
        await Swal.fire({
          text: "व्यवहार अधिकृत झाला, परंतु PDF तयार करता आला नाही.",
          icon: "info",
          confirmButtonText: "ठीक आहे",
          timer: 2000,
        });
      }
    } catch (error) {
      console.error("PDF Generation Error:", error);
      Swal.fire({
          icon: "error",
          text: error?.response?.data?.message || "Failed To Fetch Branch List",
      });
    }
  };

  const handleReject = async () => {
    const result = await Swal.fire({
      title: "नाकारणे",
      text: "आपण हा व्यवहार नाकारण्याची खात्री करतो का?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "होय, नाकारा",
      cancelButtonText: "रद्द करा",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
    });

    if (!result.isConfirmed) {
      return;
    }

    let loaderSwal;
    try {
      setSubmitting(true);

      loaderSwal = Swal.fire({
        title: "Rejection...",
        text: "Please wait for trasaction rejection",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
      });

      const voucherData = location.state?.voucherData;

      const requestBody = {
        refNo: parseInt(voucherData.refno),
        trnsSourceId:  parseInt(voucherData.trnstypeid),
        trnsStatus: "R",
        str1: null,
        str2: null,
        userId: user?.userId,
      };

      const response = await axios.post(
        `${BASE_URL}/api/FrmTransAuthList/trans-auth-save`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Reject Response :", response);

      loaderSwal.close();

      if (response.data?.success || response.data?.data?.errorCode === -100) {
        const message = response.data?.data?.message || "व्यवहार यशस्वीरित्या नाकारण्यात आला";
        
        await Swal.fire({
          text: message,
          confirmButtonText: "ठीक आहे",
        });
        navigate("/Transactions/FrmTransAuthList");
      } else {
        const errorMsg = response?.data?.data?.message || response?.data?.message || "व्यवहार नाकारताना त्रुटी आली";
        await Swal.fire({
          text: errorMsg,
          confirmButtonText: "ठीक आहे",
        });
      }
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      let errorMsg = "व्यवहार नाकारताना त्रुटी आली";
      
      if (error.response?.data?.data?.message) {
        errorMsg = error.response.data.data.message;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      await Swal.fire({
        text: errorMsg,
        confirmButtonText: "ठीक आहे",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // useEffect(() => {
  //   if (ulbId) {
  //     fetchZones();
  //   }

  //   const voucherData = location.state?.voucherData;
  //   if (voucherData) {
  //     setRefNo(voucherData.refno?.toString() || "");
  //     setVoucherNo(voucherData.docno?.toString() || "");
  //     setZone(voucherData.zonename || "");
  //     setPartyName(voucherData.partyname || "");
  //     setTrnsDate(voucherData.trnsdate ? new Date(voucherData.trnsdate) : new Date());
  //     setUsername(voucherData.username || "");
  //     setDatetime(voucherData.datetime ? new Date(voucherData.datetime).toLocaleString() : "");
  //     setAmount(voucherData.amount?.toString() || "");
  //     setTransType(voucherData.trnstype || "");

  //     if (voucherData.refno && voucherData.trnstypeid) {
  //       fetchTransactionDetails(voucherData.refno, voucherData.trnstypeid);
  //     }
  //   }
  // }, [location.state, ulbId]);

  useEffect(() => {
    const initializeData = async () => {
      setInitialLoading(true);
      
      if (ulbId) {
        await fetchZones();
      }

      const voucherData = location.state?.voucherData;
      if (voucherData) {
        setRefNo(voucherData.refno?.toString() || "");
        setVoucherNo(voucherData.docno?.toString() || "");
        setZone(voucherData.zonename || "");
        setPartyName(voucherData.partyname || "");
        setTrnsDate(voucherData.trnsdate ? new Date(voucherData.trnsdate) : new Date());
        setUsername(voucherData.username || "");
        setDatetime(voucherData.datetime ? new Date(voucherData.datetime).toLocaleString() : "");
        setAmount(voucherData.amount?.toString() || "");
        setTransType(voucherData.trnstype || "");

        if (voucherData.refno && voucherData.trnstypeid) {
          await fetchTransactionDetails(voucherData.refno, voucherData.trnstypeid);
        }
      }
      
      setInitialLoading(false);
    };
    
    initializeData();
  }, [location.state, ulbId]);
  
  const zoneOptions = zones.map((z) => ({
    value: z.ZONEID?.toString(),
    label: z.ZONEENAME,
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <Card className="shadow-sm border">
        <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <CardTitle className="text-lg font-semibold">
            व्यवहार अधिकृतता तपशील
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4">

          {initialLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">व्यवहार तपशील लोड होत आहे...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                    <Label text="झोन" />
                    <span>:</span>
                  </div>
                  <Select
                    value={zone}
                    onValueChange={setZone}
                    disabled
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="-- विकल्प निवडा --" />
                    </SelectTrigger>
                    <SelectContent>
                      {zoneOptions.map((option) => (
                        <SelectItem key={option.value} value={option.label}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                    <Label text="रेफ. क्रमांक" />
                    <span>:</span>
                  </div>
                  <Input
                    value={refNo}
                    readOnly
                    className="w-full h-9"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                    <Label text="व्यवहार प्रकार" />
                    <span>:</span>
                  </div>
                  <Input
                    value={transType}
                    readOnly
                    className="w-full h-9"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                    <Label text="तारीख" />
                    <span>:</span>
                  </div>
                  <DatePicker
                    value={trnsDate}
                    onChange={setTrnsDate}
                    className="w-full h-9"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                    <Label text="व्हाउचर क्रमांक" />
                    <span>:</span>
                  </div>
                  <Input
                    value={voucherNo}
                    readOnly
                    className="w-full h-9"
                  />
                </div>
              </div>

              <div className="border rounded-lg bg-white overflow-hidden mt-4">
                {loading && (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    माहिती लोड होत आहे...
                  </div>
                )}

                {!loading && tableData.length === 0 && (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    कोणतीही माहिती उपलब्ध नाही
                  </div>
                )}

                {!loading && tableData.length > 0 && (
                  <>
                    <ShadCNTable
                      headers={headers}
                      data={tableData}
                      keyMapping={keyMapping}
                      className="max-md:min-w-380"
                    />

                    <div className="flex justify-end items-center gap-6 p-3 border-t">
                      <div className="flex items-center gap-2">
                        {/* <Label className="font-semibold text-base">एकूण क्रेडिट :</Label> */}
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                            <Label text="एकूण क्रेडिट" />
                            <span>:</span>
                        </div>
                        <Input
                          value={totalCredit.toLocaleString("en-IN")}
                          readOnly
                          className="w-40 text-right h-9"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {/* <Label className="font-semibold text-base">एकूण डेबिट :</Label> */}
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                            <Label text="एकूण डेबिट" />
                            <span>:</span>
                        </div>
                        <Input
                          value={totalDebit.toLocaleString("en-IN")}
                          readOnly
                          className="w-40 text-right h-9"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <Button
                  onClick={handleAccept}
                  disabled={submitting || loading}
                >
                  स्वीकार
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={submitting || loading}
                >
                  रद्द
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  बाहेर जा
                </Button>
                
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmTransAuthMst;
