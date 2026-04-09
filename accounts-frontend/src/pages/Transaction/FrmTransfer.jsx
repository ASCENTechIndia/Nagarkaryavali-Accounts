import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Formik, Form } from "formik";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import apiService from "../../apiService";

import { validateTransfer } from "@/validations/validations";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { DatePicker } from "@/Components/ui/calendar";

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

const FrmTransfer = () => {
  const [loading] = useState(false);
  const navigate = useNavigate();

  const [transactionTypes, setTransactionTypes] = useState([]);
  const [parties, setParties] = useState([]);

  useEffect(() => {
    fetchTransactionTypes();
    fetchParties();
  }, []);

  const fetchTransactionTypes = async () => {
    try {
      const res = await apiService.get("transaction-types");
      if (res?.data?.success) {
        setTransactionTypes(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching transaction types", err);
    }
  };

  const fetchParties = async () => {
    try {
      const res = await apiService.post("party-list", {
        corpId: 770,
      });

      if (res?.data?.success) {
        setParties(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching parties", err);
    }
  };

  const handleSubmit = (values) => {
    const errors = validateTransfer(values);

    if (errors?.length > 0) {
      Swal.fire({
        icon: "warning",
        title: errors[0].message,
        confirmButtonColor: "#083c76",
      });
      return;
    }

    console.log(values);

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
                Transfer Details
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* TOP SECTION */}
                <section className="border rounded-lg p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4">
                    {/* प्रभाग */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[90px_10px_1fr] gap-2 items-start sm:items-center">
                      <Label className="sm:text-right whitespace-nowrap">
                        प्रभाग
                      </Label>
                      <span className="hidden sm:flex justify-center">:</span>
                      <Select
                        value={values.department}
                        onValueChange={(v) => setFieldValue("department", v)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="निवडा" />
                        </SelectTrigger>
                      </Select>
                    </div>

                    {/* व्यवहार प्रकार */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[90px_10px_1fr] gap-2 items-start sm:items-center">
                      <Label className="sm:text-right whitespace-nowrap">
                        व्यवहार प्रकार
                      </Label>
                      <span className="hidden sm:flex justify-center">:</span>
                      <Select
                        value={values.transactionType}
                        onValueChange={(v) =>
                          setFieldValue("transactionType", v)
                        }
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="निवडा" />
                        </SelectTrigger>

                        <SelectContent>
                          {transactionTypes.map((item) => (
                            <SelectItem
                              key={item.NUM_TRNSTYPE_TRNSTYPEID}
                              value={item.NUM_TRNSTYPE_TRNSTYPEID.toString()}
                            >
                              {item.VAR_TRNSTYPE_TRNSTYPE}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* दिनांक */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[90px_10px_1fr] gap-2 items-start sm:items-center">
                      <Label className="sm:text-right whitespace-nowrap">
                        दिनांक
                      </Label>
                      <span className="hidden sm:flex justify-center">:</span>
                      <DatePicker
                        value={values.date}
                        onChange={(d) => setFieldValue("date", d)}
                        className="h-9 w-full"
                      />
                    </div>

                    {/* वाउचर */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[90px_10px_1fr] gap-2 items-start sm:items-center">
                      <Label className="sm:text-right whitespace-nowrap">
                        व्हाउचर क्रमांक
                      </Label>
                      <span className="hidden sm:flex justify-center">:</span>
                      <Input
                        name="voucherNo"
                        value={values.voucherNo}
                        onChange={handleChange}
                        className="h-9 w-full"
                      />
                    </div>
                  </div>
                </section>

                {/* CREDIT + DEBIT */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CREDIT */}
                  <section className="border rounded-lg p-4 sm:p-5 space-y-4">
                    <h3 className="font-semibold text-gray-700">जमा</h3>

                    {/* विभाग कोड */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] gap-2 items-start sm:items-center">
                      <Label className="sm:text-right">विभाग कोड</Label>
                      <span className="hidden sm:flex justify-center">:</span>
                      <Input
                        name="creditDept"
                        value={values.creditDept}
                        onChange={handleChange}
                      />
                    </div>

                    {/* लेखाशिर्ष */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] gap-2 items-start sm:items-center">
                      <Label className="sm:text-right">लेखाशिर्ष</Label>
                      <span className="hidden sm:flex justify-center">:</span>
                      <Input
                        name="creditLedger"
                        value={values.creditLedger}
                        onChange={handleChange}
                      />
                    </div>

                    {/* रक्कम */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] gap-2 items-start sm:items-center">
                      <Label className="sm:text-right">रक्कम</Label>
                      <span className="hidden sm:flex justify-center">:</span>
                      <Input
                        name="creditAmount"
                        value={values.creditAmount}
                        onChange={handleChange}
                      />
                    </div>

                    {/* ✅ Conditional Cheque Fields */}
                    {!hideChequeFields && (
                      <>
                        {/* धनादेश क्रमांक */}
                        <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] gap-2 items-start sm:items-center">
                          <Label className="sm:text-right">धनादेश क्रमांक</Label>
                          <span className="hidden sm:flex justify-center">:</span>
                          <Input
                            name="chequeNo"
                            value={values.chequeNo}
                            onChange={handleChange}
                          />
                        </div>

                        {/* धनादेश तारीख */}
                        <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] gap-2 items-start sm:items-center">
                          <Label className="sm:text-right">धनादेश तारीख</Label>
                          <span className="hidden sm:flex justify-center">:</span>
                          <DatePicker
                            value={values.chequeDate}
                            onChange={(d) => setFieldValue("chequeDate", d)}
                          />
                        </div>

                        {/* धनादेश पुष्टी */}
                        <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] gap-2 items-start sm:items-center">
                          <Label className="sm:text-right">धनादेश पुष्टी</Label>
                          <span className="hidden sm:flex justify-center">:</span>
                          <Select
                            value={values.chequeRef}
                            onValueChange={(v) => setFieldValue("chequeRef", v)}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Ref 1</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {/* पार्टी */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] gap-2 items-start sm:items-center">
                      <Label className="sm:text-right">पार्टी</Label>
                      <span className="hidden sm:flex justify-center">:</span>
                      <Select
                        value={values.party}
                        onValueChange={(v) => setFieldValue("party", v)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="निवडा" />
                        </SelectTrigger>

                        <SelectContent>
                          {parties.map((item) => (
                            <SelectItem
                              key={item.NUM_PARTYMST_PARTYID}
                              value={item.NUM_PARTYMST_PARTYID.toString()}
                            >
                              {item.VAR_PARTYMST_PARTYNAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* तपशील */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] gap-2">
                      <Label className="sm:text-right">तपशील</Label>
                      <span className="hidden sm:flex justify-center mt-2">:</span>
                      <Textarea
                        name="details"
                        value={values.details}
                        onChange={handleChange}
                        className="min-h-20 w-full"
                      />
                    </div>
                  </section>

                  {/* DEBIT */}
                  <section className="border rounded-lg p-4 sm:p-5 space-y-4">
                    <h3 className="font-semibold text-gray-700">खर्च</h3>

                    {["debitDept", "debitLedger", "debitAmount"].map(
                      (field, i) => {
                        const labels = ["विभाग कोड", "लेखाशिर्ष", "रक्कम"];
                        return (
                          <div
                            key={field}
                            className="flex flex-col sm:grid sm:grid-cols-[140px_10px_1fr] gap-2 items-start sm:items-center"
                          >
                            <Label className="sm:text-right">{labels[i]}</Label>
                            <span className="hidden sm:flex justify-center">
                              :
                            </span>
                            <Input
                              name={field}
                              value={values[field]}
                              onChange={handleChange}
                            />
                          </div>
                        );
                      },
                    )}
                  </section>
                </div>
              </div>

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
                  बदल
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => navigate("/Transactions/FrmTransferList")}
                  className="w-full sm:w-auto"
                >
                  परत
                </Button>
              </div>
            </div>
          </motion.div>
        </Form>
      )}
    </Formik>
  );
};

export default FrmTransfer;
