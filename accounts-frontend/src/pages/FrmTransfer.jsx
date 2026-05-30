import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Formik, Form } from "formik";
import { validateTransfer } from "@/validations/validations";
import Swal from "sweetalert2";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { DatePicker } from "@/Components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

const FrmTransfer = () => {
  const [loading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (values) => {
    const errors = validateTransfer(values);

    if (errors && errors.length > 0) {
      Swal.fire({
        // icon: "warning",
        title: errors[0].message, // ✅ फक्त पहिला error
        confirmButtonColor: "#083c76",
      });
      return;
    }

    // ✅ SUCCESS
    console.log("Form Values:", values);

    Swal.fire({
      // icon: "success",
      title: "डेटा यशस्वीरित्या सेव झाला",
      confirmButtonColor: "#083c76",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 mt-10">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-blue-600">Loading...</span>
      </div>
    );
  }

  return (
    <Formik
      initialValues={{
        department: "",
        transactionType: "",
        date: new Date(),
        voucherNo: "",
        creditDept: "",
        creditLedger: "",
        creditAmount: "",
        chequeNo: "",
        chequeDate: new Date(), // Fixed missing parentheses here
        chequeRef: "",
        details: "",
        party: "",
        debitDept: "",
        debitLedger: "",
        debitAmount: "",
      }}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, setFieldValue, resetForm }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className=" sm:px-6 py-4 bg-gradient-to-br from-gray-50 to-gray-100"
          >
            <Card className="w-full border-0 shadow-xl rounded-2xl bg-white  mx-auto">
              <CardContent className="p-4 sm:p-6">
                {/* MAIN CONTENT */}
                <div className="w-full">
                  {/* SECTION TITLE */}
                  <div className="text-xl font-semibold text-gray-700 mb-6 pb-3">
                    Transfer Details
                  </div>

                  {/* TOP ROW */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                    {/* Department */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex sm:w-28 justify-between shrink-0">
                        <Label className="text-sm text-gray-600">प्रभाग</Label>
                        <span className="hidden sm:inline text-gray-600">:</span>
                      </div>
                      <div className="flex-1 w-full">
                        <Select
                          value={values.department}
                          onValueChange={(v) => setFieldValue("department", v)}
                        >
                          <SelectTrigger className="h-9 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500">
                            <SelectValue placeholder="-- विकल्प निवडा --" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Dept 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Transaction Type */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex sm:w-28 justify-between shrink-0">
                        <Label className="text-sm text-gray-600">व्यवहार प्रकार</Label>
                        <span className="hidden sm:inline text-gray-600">:</span>
                      </div>
                      <div className="flex-1 w-full">
                        <Select
                          value={values.transactionType}
                          onValueChange={(v) =>
                            setFieldValue("transactionType", v)
                          }
                        >
                          <SelectTrigger className="h-9 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500">
                            <SelectValue placeholder="-- विकल्प निवडा --" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Type 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex sm:w-20 justify-between shrink-0">
                        <Label className="text-sm text-gray-600">दिनांक</Label>
                        <span className="hidden sm:inline text-gray-600">:</span>
                      </div>
                      <div className="flex-1 w-full">
                        <DatePicker
                          value={values.date}
                          onChange={(d) => setFieldValue("date", d)}
                          className="h-9 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Voucher */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex sm:w-20 justify-between shrink-0">
                        <Label className="text-sm text-gray-600">वाउचर</Label>
                        <span className="hidden sm:inline text-gray-600">:</span>
                      </div>
                      <div className="flex-1 w-full">
                        <Input
                          name="voucherNo"
                          value={values.voucherNo}
                          onChange={handleChange}
                          className="h-9 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CREDIT + DEBIT */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white  p-4 ">
                    
                    {/* CREDIT SECTION */}
                    <div className="p-2 sm:p-4">
                      <div className="text-base sm:text-lg font-semibold mb-2  pb-2 ">
                        जमा 
                      </div>

                      <div className="space-y-4">
                        {[
                          ["विभाग कोड", "creditDept"],
                          ["लेखाशिर्ष", "creditLedger"],
                          ["रक्कम", "creditAmount"],
                          ["धनादेश क्रमांक", "chequeNo"],
                        ].map(([label, name]) => (
                          <div key={name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <div className="flex sm:w-32 justify-between shrink-0">
                              <Label className="text-sm text-gray-600">{label}</Label>
                              <span className="hidden sm:inline text-gray-600">:</span>
                            </div>
                            <div className="flex-1 w-full">
                              <Input
                                name={name}
                                value={values[name]}
                                onChange={handleChange}
                                className="h-9 w-full rounded-lg"
                              />
                            </div>
                          </div>
                        ))}

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <div className="flex sm:w-32 justify-between shrink-0">
                            <Label className="text-sm text-gray-600">धनादेश तारीख</Label>
                            <span className="hidden sm:inline text-gray-600">:</span>
                          </div>
                          <div className="flex-1 w-full">
                            <DatePicker
                              value={values.chequeDate}
                              onChange={(d) => setFieldValue("chequeDate", d)}
                              className="h-9 w-full rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <div className="flex sm:w-32 justify-between shrink-0">
                            <Label className="text-sm text-gray-600">धनादेश पुष्टी</Label>
                            <span className="hidden sm:inline text-gray-600">:</span>
                          </div>
                          <div className="flex-1 w-full">
                            <Select
                              value={values.chequeRef}
                              onValueChange={(v) => setFieldValue("chequeRef", v)}
                            >
                              <SelectTrigger className="h-9 w-full rounded-lg">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Ref 1</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                          <div className="flex sm:w-32 justify-between shrink-0 sm:mt-2">
                            <Label className="text-sm text-gray-600">तपशील</Label>
                            <span className="hidden sm:inline text-gray-600">:</span>
                          </div>
                          <div className="flex-1 w-full">
                            <Textarea
                              name="details"
                              value={values.details}
                              onChange={handleChange}
                              className="min-h-[70px] w-full rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <div className="flex sm:w-32 justify-between shrink-0">
                            <Label className="text-sm text-gray-600">पार्टी</Label>
                            <span className="hidden sm:inline text-gray-600">:</span>
                          </div>
                          <div className="flex-1 w-full">
                            <Select
                              value={values.party}
                              onValueChange={(v) => setFieldValue("party", v)}
                            >
                              <SelectTrigger className="h-9 w-full rounded-lg">
                                <SelectValue placeholder="-- विकल्प निवडा --" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Party 1</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DEBIT SECTION */}
                    <div className="p-2 sm:p-4  lg:border-gray-100">
                      <div className="text-base sm:text-lg font-semibold mb-4 pb-2 ">
                        खर्च 
                      </div>

                      <div className="space-y-4">
                        {[
                          ["विभाग कोड", "debitDept"],
                          ["लेखाशिर्ष", "debitLedger"],
                          ["रक्कम", "debitAmount"],
                        ].map(([label, name]) => (
                          <div key={name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <div className="flex sm:w-32 justify-between shrink-0">
                              <Label className="text-sm text-gray-600">{label}</Label>
                              <span className="hidden sm:inline text-gray-600">:</span>
                            </div>
                            <div className="flex-1 w-full">
                              <Input
                                name={name}
                                value={values[name]}
                                onChange={handleChange}
                                className="h-9 w-full rounded-lg"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex flex-wrap justify-center gap-3 mt-2 pt-2">
                    <Button 
                      type="submit"
                      className="bg-[#083c76] w-full sm:w-auto px-8 shadow-md hover:scale-105 transition"
                    >
                      स्वीकार
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto px-8 hover:bg-gray-100"
                      onClick={() => resetForm()}
                    >
                      बदल
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full sm:w-auto px-8 shadow-sm"
                      onClick={() => navigate("/Transactions/FrmTransferList")}
                    >
                      परत
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Form>
      )}
    </Formik>
  );
};

export default FrmTransfer;