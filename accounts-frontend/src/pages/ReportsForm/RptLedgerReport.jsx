import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";

/* ================= HELPERS ================= */

const Row = ({ label, children }) => (
  <div className="flex items-center gap-4">
    <Label className="w-[150px] text-sm font-medium text-left">
      {label} :
    </Label>
    <div className="flex-1 max-w-[300px]">{children}</div>
  </div>
);

const ActionButtons = ({ resetForm }) => (
  <div className="flex justify-center gap-3 pt-2">
    <Button type="submit">प्रक्रिया</Button>

    <Button type="button" variant="destructive" onClick={resetForm}>
      हटवा
    </Button>

    <Button type="button" variant="outline">
      बाहेर जा
    </Button>
  </div>
);

const ExportRadio = ({ values, setFieldValue }) => (
  <div className="flex items-center gap-6">
    <Label className="w-[150px]">Export To :</Label>

    <label className="flex items-center gap-2">
      <Input
        type="radio"
        name="export"
        checked={values.exportType === "PDF"}
        onChange={() => setFieldValue("exportType", "PDF")}
      />
      PDF
    </label>

    <label className="flex items-center gap-2">
      <Input
        type="radio"
        name="export"
        checked={values.exportType === "Excel"}
        onChange={() => setFieldValue("exportType", "Excel")}
      />
      Excel
    </label>
  </div>
);

/* ================= MAIN ================= */

const LedgerReport = () => {
  return (
    <Formik
      initialValues={{
        zoneId: "",
        deptCode: "",
        ledger: "",
        fromDate: new Date(),
        toDate: new Date(),
        exportType: "PDF",
      }}
      onSubmit={(values) => {
        console.log("Ledger Report 👉", values);
      }}
    >
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <Card className="shadow-sm border rounded-lg">
            {/* HEADER */}
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">
                खातावही अहवाल
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* PRABHAG */}
              <Row label="प्रभाग">
                <Select
                  value={values.zoneId}
                  onValueChange={(v) => setFieldValue("zoneId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- ALL --" />
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </Row>

              {/* DEPT */}
              <Row label="विभाग संकेतांक">
                <Input
                  value={values.deptCode}
                  onChange={(e) =>
                    setFieldValue("deptCode", e.target.value)
                  }
                />
              </Row>

              {/* LEDGER */}
              <Row label="लेखाशिर्ष">
                <Input
                  value={values.ledger}
                  onChange={(e) =>
                    setFieldValue("ledger", e.target.value)
                  }
                />
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

              {/* EXPORT */}
              <ExportRadio
                values={values}
                setFieldValue={setFieldValue}
              />

              {/* BUTTONS */}
              <ActionButtons resetForm={resetForm} />
            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};

export default LedgerReport;