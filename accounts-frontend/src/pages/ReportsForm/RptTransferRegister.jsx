import { Formik, Form } from "formik";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { de } from "date-fns/locale";

/* ================= INITIAL ================= */
const getInitialValues = () => {
  const today = new Date();
  return {
    zoneId: "",
    fromDate: today,
    toDate: today,
    trnstypeid: "",
    exportType: "PDF",
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

const RptTransferRegister = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [trnTypes, setTrnTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD ZONES ================= */
  useEffect(() => {
    axios
      .post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => setZones(res.data?.data || []))
      .catch(console.error);
  }, [ulbId]);

  /* ================= LOAD TRANSACTION TYPES ================= */
  useEffect(() => {
    debugger;
    axios
      .get(`${BASE_URL}/api/RptTransferRegister/transfer-type`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setTrnTypes(res.data?.data?.data || []);
      })
      .catch(console.error);
  }, []);

  /* ================= SEARCH ================= */
  const handleSearch = async (values) => {
    try {
      setLoading(true);

      const payload = {
        fromDate: values.fromDate.toISOString().split("T")[0],
        toDate: values.toDate.toISOString().split("T")[0],
        trnstypeid: values.trnstypeid ? [Number(values.trnstypeid)] : [],
        zoneId: values.zoneId || null,
        ulbId: ulbId,
      };

      const res = await axios.post(
        `${BASE_URL}/api/RptTransferRegister/transfer-register`,
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

      console.log("DATA 👉", list);

      Swal.fire("Success", `Fetched ${list.length} records`, "success");

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
                हस्तांतरण नोंदणी अहवाल
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* ROW 1 */}
              <div className="grid md:grid-cols-3 gap-4">

                {/* PRABHAG */}
                <Row label="प्रभाग">
                  <Select
                    value={values.zoneId}
                    onValueChange={(v) => setFieldValue("zoneId", v)}
                  >
                    <SelectTrigger className="w-full" >
                      <SelectValue placeholder="-- ALL --" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((z) => (
                        <SelectItem key={z.ZONEID} value={String(z.ZONEID)}>
                          {z.ZONEENAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>

                {/* FROM DATE */}
                <Row label="दिनांक पासून">
                  <DatePicker
                    value={values.fromDate}
                    onChange={(date) => setFieldValue("fromDate", date)}
                  />
                </Row>

                {/* TO DATE */}
                <Row label="दिनांक पर्यंत">
                  <DatePicker
                    value={values.toDate}
                    onChange={(date) => setFieldValue("toDate", date)}
                  />
                </Row>
              </div>

              {/* ROW 2 */}
              <div className="grid md:grid-cols-3 gap-4">

                {/* TRANSACTION TYPE */}
                <Row label="व्यवहार प्रकार">
                  <Select
                    value={values.trnstypeid}
                    onValueChange={(v) => setFieldValue("trnstypeid", v)}
                  >
                    <SelectTrigger className="w-full" >
                      <SelectValue placeholder="-- निवडा --" />
                    </SelectTrigger>
                    <SelectContent>
                      {trnTypes.map((t) => (
                        <SelectItem
                          key={t.TRNSTYPEID}
                          value={String(t.TRNSTYPEID)}
                        >
                          {t.TRNSTYPE}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>

                {/* EXPORT */}
                <div className="flex items-center gap-4">
                  <Label>Export To :</Label>

                  <label className="flex gap-2">
                    <input
                      type="radio"
                      checked={values.exportType === "PDF"}
                      onChange={() => setFieldValue("exportType", "PDF")}
                    />
                    PDF
                  </label>

                  <label className="flex gap-2">
                    <input
                      type="radio"
                      checked={values.exportType === "Excel"}
                      onChange={() => setFieldValue("exportType", "Excel")}
                    />
                    Excel
                  </label>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 justify-center">
                <Button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "प्रक्रिया"}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => resetForm()}
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

            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};

export default RptTransferRegister;