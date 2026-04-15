import React from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { DatePicker } from "@/components/ui/calendar";

const FrmBankReconciliation = () => {
  return (
    <Formik
      initialValues={{
        creditDept: "",
        ledger: "",
        fromDate: new Date(),
        toDate: new Date(),
      }}
      onSubmit={(values) => {
        console.log(values);
      }}
    >
      {({ values, setFieldValue, handleChange }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto mt-6 px-4"
          >
            <Card className="border shadow-sm">
              {/* HEADER */}
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  बँक सलोखा
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-6">

                {/* RESPONSIVE GRID */}
                <div
                  className="
                    grid grid-cols-1 gap-y-4
                    md:grid-cols-[160px_12px_1fr_160px_12px_1fr]
                    md:gap-x-2 md:gap-y-5
                    items-center
                  "
                >

                  {/* CREDIT DEPT */}
                  <Label className="text-sm md:text-right md:pr-2 w-full">
                    क्रेडिट विभाग संकेतांक
                  </Label>
                  <span className="hidden md:block text-center">:</span>

                  <Select
                    value={values.creditDept}
                    onValueChange={(v) => setFieldValue("creditDept", v)}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="-- विकल्प निवडा --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Dept 1</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* LEDGER */}
                  <Label className="text-sm md:text-right md:pr-2">
                    क्रेडिट लेखाशिर्ष
                  </Label>
                  <span className="hidden md:block text-center">:</span>

                  <Input
                    name="ledger"
                    value={values.ledger}
                    onChange={handleChange}
                    className="h-9 w-full"
                  />

                  {/* FROM DATE */}
                  <Label className="text-sm md:text-right md:pr-2">
                    दिनांक पासून
                  </Label>
                  <span className="hidden md:block text-center">:</span>

                  <DatePicker
                    value={values.fromDate}
                    onChange={(d) => setFieldValue("fromDate", d)}
                  />

                  {/* TO DATE */}
                  <Label className="text-sm md:text-right md:pr-2">
                    दिनांक पर्यंत
                  </Label>
                  <span className="hidden md:block text-center">:</span>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <DatePicker
                      value={values.toDate}
                      onChange={(d) => setFieldValue("toDate", d)}
                    />

                    <Button
                      type="submit"
                      className="bg-blue-700 hover:bg-blue-800 h-9 px-4 w-full sm:w-auto"
                    >
                      शोधा
                    </Button>
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 pt-6 border-t">
                  <Button variant="destructive" className="w-full sm:w-auto">
                    हटवा
                  </Button>

                  <Button variant="outline" className="w-full sm:w-auto">
                    बाहेर जा
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

export default FrmBankReconciliation;