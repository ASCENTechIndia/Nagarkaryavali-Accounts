import { Formik, Form } from "formik";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";

/* ================= INITIAL ================= */
const getInitialValues = () => {
  return {
    asOnDate: new Date(),
  };
};

const Row = ({ label, children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
    <Label className="text-sm sm:text-right sm:pr-2 font-medium">
      {label} :
    </Label>
    {children}
  </div>
);

const RptCashBankBalance = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const zoneId = user?.zoneId; // 👈 assuming from login

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);

  /* ================= SEARCH ================= */
  const handleSearch = async (values) => {
    try {
      setLoading(true);

      const payload = {
        asOnDate: values.asOnDate.toISOString().split("T")[0],
        zoneId: zoneId,
        ulbId: ulbId,
      };

      const res = await axios.post(
        `${BASE_URL}/api/RptCashBankBalance/cash-bank-balance`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const list = res.data?.data?.data || [];

      if (!list.length) {
        Swal.fire("No Data", "No records found", "warning");
        return;
      }

      setTableData(list);

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Formik initialValues={getInitialValues()} onSubmit={handleSearch}>
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <Card className="shadow-sm border rounded-lg">

            {/* HEADER */}
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">
                रोख बँक शिल्लक अहवाल
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* DATE FIELD */}
              <div className="grid md:grid-cols-2 gap-4">
                <Row label="दिनांक">
                  <DatePicker
                    value={values.asOnDate}
                    onChange={(date) => setFieldValue("asOnDate", date)}
                  />
                </Row>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 justify-center">
                <Button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "प्रक्रिया"}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    resetForm();
                    setTableData([]);
                  }}
                >
                  हटवा
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  बाहेर जा
                </Button>
              </div>

              {/* ================= TABLE ================= */}
              {tableData.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">GL Name</th>
                        <th className="p-2 text-left">Account Name</th>
                        <th className="p-2 text-right">Balance</th>
                      </tr>
                    </thead>

                    <tbody>
                      {tableData.map((item, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{item.GLNAME}</td>
                          <td className="p-2">{item.ACCNAME}</td>
                          <td className="p-2 text-right">
                            {item.BALANCE}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};

export default RptCashBankBalance;