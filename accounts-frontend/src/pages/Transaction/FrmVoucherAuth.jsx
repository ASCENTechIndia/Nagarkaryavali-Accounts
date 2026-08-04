import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import config from "@/utils/config.jsx";
import Swal from "sweetalert2";
import { DatePicker } from "@/components/ui/calendar";
import ShadCNTable from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

const initialValues = {
  remark: "",
};

const FrmVoucherAuth = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const deptId = config.deptId;
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zoneList, setZoneList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [tableData, setTableData] = useState([]);

  const headers = [
  "संदर्भ क्र.",
  "दिनांक",
  "व्हाउचर नं.",
  "प्रभाग",
  "रक्कम",
  "पार्टी",
  "युजर",
  "दिनांक/ वेळ",
];

  const keyMapping = {
  "संदर्भ क्र.": "refNo",
  "दिनांक": "date",
  "व्हाउचर नं.": "voucherNo",
  "प्रभाग": "zone",
  "रक्कम": "amount",
  "पार्टी": "partyName",
  "युजर": "userName",
  "दिनांक/ वेळ": "dateTime",
};

 const columnStyles = {
  "संदर्भ क्र.": { width: "170px" },
  "दिनांक": { width: "110px" },
  "व्हाउचर नं.": { width: "120px" },
  "प्रभाग": { width: "150px" },
  "रक्कम": { width: "120px" },
  "पार्टी": { width: "220px" },
  "युजर": { width: "220px" },
  "दिनांक/ वेळ": { width: "120px" },
};

  const handleSubmit = async (values) => {
    console.log(values);
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, handleChange, setFieldValue }) => {
        return (
          <Form>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-2 sm:px-4 mt-4 sm:mt-6"
            >
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    प्रमाणक अधिकृतता
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="mt-6">
                    <ShadCNTable
                      headers={headers}
                      data={tableData}
                      keyMapping={keyMapping}
                      columnStyles={columnStyles}
                      pagination={false}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="तपशील" />
                        <span>:</span>
                      </div>
                      <Input
                        type="text"
                        name="remark"
                        value={values.remark || ""}
                        onChange={handleChange}
                      />
                    </div>
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

export default FrmVoucherAuth;
