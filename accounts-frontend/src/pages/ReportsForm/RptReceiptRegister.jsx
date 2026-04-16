import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent
} from "@/components/ui/select";

const RptReceiptRegister = () => {
  return (
    <Formik initialValues={{
      zoneId: "",
      fromDate: new Date(),
      toDate: new Date(),
      deptCode: "",
      ledger: "",
      userType: "",
      reportType: "summary",
      exportType: "PDF",
    }}>
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <Card>
            <CardHeader>
              <CardTitle>पावती रजिस्टर</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              <div className="grid md:grid-cols-3 gap-4">
                <Row label="प्रभाग">
                  <Select onValueChange={(v)=>setFieldValue("zoneId", v)}>
                    <SelectTrigger><SelectValue placeholder="-- ALL --" /></SelectTrigger>
                    <SelectContent />
                  </Select>
                </Row>

                <Row label="दिनांक पासून">
                  <DatePicker value={values.fromDate}
                    onChange={(d)=>setFieldValue("fromDate", d)} />
                </Row>

                <Row label="दिनांक पर्यंत">
                  <DatePicker value={values.toDate}
                    onChange={(d)=>setFieldValue("toDate", d)} />
                </Row>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Row label="विभाग संकेतांक"><Input /></Row>
                <Row label="लेखाशिर्ष"><Input /></Row>

                <Row label="वापरकर्ता निवडा">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="-- निवडा --" />
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </Row>
              </div>

              <div className="flex justify-between">
                <RadioGroup
                  label="अहवालाचा प्रकार"
                  value={values.reportType}
                  onChange={(v)=>setFieldValue("reportType", v)}
                  options={[
                    { label: "सारांश", value: "summary" },
                    { label: "तपशील", value: "detail" }
                  ]}
                />

                <ExportRadio values={values} setFieldValue={setFieldValue} />
              </div>

              <ActionButtons resetForm={resetForm} />

            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};
export default RptReceiptRegister;