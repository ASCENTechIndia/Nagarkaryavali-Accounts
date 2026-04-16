const ClassifiedAbstractSummary = () => {
  return (
    <Formik initialValues={{
      zoneId: "",
      fromDate: new Date(),
      toDate: new Date(),
      type: "receipt",
      exportType: "PDF",
    }}>
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <Card>
            <CardHeader>
              <CardTitle>
                Classified Abstract Receipts/Payments Summary
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              <Row label="प्रभाग">
                <Select onValueChange={(v)=>setFieldValue("zoneId", v)}>
                  <SelectTrigger><SelectValue placeholder="-- ALL --" /></SelectTrigger>
                  <SelectContent />
                </Select>
              </Row>

              <div className="grid md:grid-cols-2 gap-4">
                <Row label="दिनांक पासून">
                  <DatePicker value={values.fromDate}
                    onChange={(d)=>setFieldValue("fromDate", d)} />
                </Row>

                <Row label="दिनांक पर्यंत">
                  <DatePicker value={values.toDate}
                    onChange={(d)=>setFieldValue("toDate", d)} />
                </Row>
              </div>

              <RadioGroup
                label="व्यवहार प्रकार"
                value={values.type}
                onChange={(v)=>setFieldValue("type", v)}
                options={[
                  { label: "रिसीट", value: "receipt" },
                  { label: "पेमेंट", value: "payment" }
                ]}
              />

              <ExportRadio values={values} setFieldValue={setFieldValue} />

              <ActionButtons resetForm={resetForm} />

            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};
export default ClassifiedAbstractSummary;