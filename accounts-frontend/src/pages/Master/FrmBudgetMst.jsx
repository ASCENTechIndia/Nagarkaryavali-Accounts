import React from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
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
import { useAuth } from "@/context/AuthContext";
import { DatePicker } from "@/components/ui/calendar"; 
import Swal from "sweetalert2";

const initialValues = {
  date: null,
  budgetType: "",
  workCode: "",
  accountHead: "",
  amount: "",
  tempAmount: "",
  remark: "",
};

const FrmBudgetMst = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, chequeData } = location.state || {};

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const handleSubmit = async (values) => {
    console.log("submitted success", values);
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, handleChange, setFieldValue }) => (
        <Form>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  अर्थसंकल्पीय अंदाजपत्रक मास्टर
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date */}
                  <div className="flex items-center gap-2">
                    <Label className="w-40">दिनांक :</Label>
                    <DatePicker
                      value={values.date}
                      onChange={(date) => setFieldValue("date", date)}
                      className="flex-1"
                    />
                  </div>

                  {/* Budget Type */}
                  <div className="flex items-center gap-2">
                    <Label className="w-40">अर्थसंकल्पीय अंदाजपत्रक :</Label>
                    <Select
                      value={values.budgetType}
                      onValueChange={(v) => setFieldValue("budgetType", v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="-- विकल्प निवडा --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Option 1</SelectItem>
                        <SelectItem value="2">Option 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* कार्यप्रकार संकेतांक */}
                  <div className="flex items-center gap-2">
                    <Label className="w-40">कार्यप्रकार संकेतांक :</Label>
                    <Input
                      name="workCode"
                      value={values.workCode}
                      onChange={handleChange}
                      className="flex-1"
                    />
                  </div>

                  {/* लेखाशीर्ष */}
                  <div className="flex items-center gap-2">
                    <Label className="w-40">लेखाशीर्ष :</Label>
                    <Input
                      name="accountHead"
                      value={values.accountHead}
                      onChange={handleChange}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* रक्कम */}
                  <div className="flex items-center gap-2">
                    <Label className="w-40">रक्कम :</Label>
                    <Input
                      name="amount"
                      value={values.amount}
                      onChange={handleChange}
                      type="number"
                      className="flex-1"
                    />
                  </div>

                  {/* तात्पुरती रक्कम */}
                  <div className="flex items-center gap-2">
                    <Label className="w-40">तात्पुरती रक्कम :</Label>
                    <Input
                      name="tempAmount"
                      value={values.tempAmount}
                      onChange={handleChange}
                      type="number"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-start gap-2">
                    <Label className="w-40 mt-2">तपशील :</Label>
                    <textarea
                      name="remark"
                      value={values.remark}
                      onChange={handleChange}
                      className="flex-1 border rounded-md p-2 h-24"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-center gap-4 pt-4">
                  <Button type="submit" className="bg-blue-900 text-white px-6">
                    साठवा
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="px-6"
                    onClick={() => navigate("/HomePage/FrmHomePage")}
                  >
                    परत
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

export default FrmBudgetMst;
