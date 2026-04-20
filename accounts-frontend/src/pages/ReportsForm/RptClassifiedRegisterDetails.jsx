import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // ✅ YOUR INPUT
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";

/* ================= HELPERS ================= */

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[160px_1fr] items-center gap-2">
    <Label className="text-sm font-medium text-left">
      {label} :
    </Label>
    {children}
  </div>
);

const ActionButtons = ({ resetForm }) => (
  <div className="flex justify-center gap-3">
    <Button type="submit">प्रक्रिया</Button>

    <Button type="button" variant="destructive" onClick={resetForm}>
      हटवा
    </Button>

    <Button type="button" variant="outline">
      बाहेर जा
    </Button>
  </div>
);

/* ✅ USING YOUR INPUT FOR RADIO */
const RadioGroup = ({ label, value, onChange, options }) => (
  <div className="flex gap-4 items-center">
    <Label>{label} :</Label>

    {options.map((opt) => (
      <label key={opt.value} className="flex items-center gap-2">
        <Input
          type="radio"
          checked={value === opt.value}
          onChange={() => onChange(opt.value)}
        />
        {opt.label}
      </label>
    ))}
  </div>
);

/* ✅ USING YOUR INPUT FOR RADIO */
const ExportRadio = ({ values, setFieldValue }) => (
  <div className="flex gap-4 items-center">
    <Label>Export To :</Label>

    <label className="flex items-center gap-2">
      <Input
        type="radio"
        checked={values.exportType === "PDF"}
        onChange={() => setFieldValue("exportType", "PDF")}
      />
      PDF
    </label>

    <label className="flex items-center gap-2">
      <Input
        type="radio"
        checked={values.exportType === "Excel"}
        onChange={() => setFieldValue("exportType", "Excel")}
      />
      Excel
    </label>
  </div>
);

/* ================= MAIN ================= */

const ClassifiedRegisterDetails = () => {
  return (
    <Formik
      initialValues={{
        zoneId: "",
        fromDate: new Date(),
        toDate: new Date(),
        type: "receipt",
        exportType: "PDF",
      }}
      onSubmit={(values) => {
        console.log("FORM VALUES 👉", values);
      }}
    >
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <Card className="shadow-sm border rounded-lg">
            {/* HEADER */}
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">
                वर्गीकृत नोंदणी तपशील अहवाल
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* PRABHAG */}
              <Row label="प्रभाग">
                <Select
                  value={values.zoneId}
                  onValueChange={(v) => setFieldValue("zoneId", v)}
                >
                  <SelectTrigger className="w-[300px]" >
                    <SelectValue placeholder="-- ALL --" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* map zones here */}
                  </SelectContent>
                </Select>
              </Row>

              {/* DATE */}
              <div className="grid md:grid-cols-3 gap-4">
                <Row label="दिनांक पासून">
                  <DatePicker
                    value={values.fromDate}
                    onChange={(date) => setFieldValue("fromDate", date)}
                  />
                </Row>

                <Row label="दिनांक पर्यंत">
                  <DatePicker
                    value={values.toDate}
                    onChange={(date) => setFieldValue("toDate", date)}
                  />
                </Row>
              </div>

              {/* TRANSACTION TYPE */}
              <RadioGroup
                label="व्यवहार प्रकार"
                value={values.type}
                onChange={(v) => setFieldValue("type", v)}
                options={[
                  { label: "रिसीट", value: "receipt" },
                  { label: "पेमेंट", value: "payment" },
                ]}
              />

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

export default ClassifiedRegisterDetails;