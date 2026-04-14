
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { PaymentSchema } from "../validations/global.validation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { DatePicker } from "@/components/ui/calendar";

const validateWithZod = (values) => {
    const result = PaymentSchema.safeParse(values);

    if (result.success) return {};

    const errors = {};
    result.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
    });

    return errors;
};
const FrmPayment = () => {
    const initialValues = {
        zoneId: "",
        transactionType: "",
        debtorType: "",
        date: new Date(),
        deptCode: "",
        ledgerHead: "",
        bankBalance: "",
        costomerName: "",
        voucherNo: "",
        chequeNo: "",
        chequePageNo: "",
        chequeDate: new Date(),
        debtorName: "",
        debtorDeptCode: "",
        debtorLedgerHead: "",
        amount: "",
        details: "",
        partyCode: "",
    };

    return (
        <Formik
            initialValues={initialValues}
            validate={validateWithZod}
            onSubmit={(values) => {
                console.log("Submitted:", values);
            }}
        >
            {({
                values,
                handleChange,
                setFieldValue,
                errors,
                touched,
            }) => (
                <Form>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                       
                    >
                        <Card className="gap-0  border shadow-sm">
                            <CardHeader className="border-b ">
                                <CardTitle className="text-lg font-semibold">
                                    Direct Payment Entry
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="px-4 py-2 sm:px-6 space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <Label text="प्रभाग :" />
                                        <Select
                                            onValueChange={(v) => setFieldValue("zoneId", v)}
                                            value={values.zoneId}
                                        >
                                            <SelectTrigger className="w-full border rounded-md">
                                                <SelectValue placeholder="-- विकल्प निवडा --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Zone 1</SelectItem>
                                                <SelectItem value="2">Zone 2</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.zoneId && touched.zoneId && (
                                            <p className="mt-1 text-sm text-red-500">{errors.zoneId}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label text="व्यवहार प्रकार :" />
                                        <Select
                                            onValueChange={(v) => setFieldValue("transactionType", v)}
                                            value={values.transactionType}
                                        >
                                            <SelectTrigger className="w-full border rounded-md">
                                                <SelectValue placeholder="-- विकल्प निवडा --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="credit">Credit</SelectItem>
                                                <SelectItem value="debit">Debit</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.transactionType && touched.transactionType && (
                                            <p className="text-red-500 text-sm">{errors.transactionType}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label text="देवक प्रकार :" />
                                        <Select
                                            onValueChange={(v) => setFieldValue("debtorType", v)}
                                            value={values.debtorType}
                                        >
                                            <SelectTrigger className="w-full border rounded-md">
                                                <SelectValue placeholder="-- विकल्प निवडा --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="individual">Individual</SelectItem>
                                                <SelectItem value="corporate">Corporate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.debtorType && touched.debtorType && (
                                            <p className="text-red-500 text-sm">{errors.debtorType}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <Label text="दिनांक :" />
                                        <DatePicker
                                            value={values.date}
                                            onChange={(d) => setFieldValue("date", d)}
                                        />
                                        {errors.date && touched.date && (
                                            <p className="text-red-500 text-sm">{errors.date}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label text="विभाग कोड :" />
                                        <Input
                                            name="deptCode"
                                            value={values.deptCode}
                                            onChange={handleChange}
                                        />
                                        {errors.deptCode && touched.deptCode && (
                                            <p className="text-red-500 text-sm">{errors.deptCode}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label text="लेखाशीर्ष :" />
                                        <Input
                                            name="ledgerHead"
                                            value={values.ledgerHead}
                                            onChange={handleChange}
                                        />
                                        {errors.ledgerHead && touched.ledgerHead && (
                                            <p className="text-red-500 text-sm">{errors.ledgerHead}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <Label text="व्हाउचर क्रमांक :" />
                                        <Input
                                            name="voucherNo"
                                            value={values.voucherNo}
                                            onChange={handleChange}
                                        />
                                        {errors.voucherNo && touched.voucherNo && (
                                            <p className="text-red-500 text-sm">{errors.voucherNo}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label text="बैंकची शिल्लक :" />
                                        <Input
                                            name="bankBalance"
                                            value={values.bankBalance}
                                            onChange={handleChange}
                                            type="number"
                                        />
                                        {errors.bankBalance && touched.bankBalance && (
                                            <p className="text-red-500 text-sm">{errors.bankBalance}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label text="धनादेश क्रमांक :" />
                                        <Input
                                            name="chequeNo"
                                            value={values.chequeNo}
                                            onChange={handleChange}
                                        />
                                        {errors.chequeNo && touched.chequeNo && (
                                            <p className="text-red-500 text-sm">{errors.chequeNo}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <Label text="धनादेश पृष्ठिका क्रमांक :" className="w-48" />
                                        <Input
                                            name="chequePageNo"
                                            value={values.chequePageNo}
                                            onChange={handleChange}
                                        />
                                        {errors.chequePageNo && touched.chequePageNo && (
                                            <p className="text-red-500 text-sm">{errors.chequePageNo}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label text="धनादेश दिनांक :" />
                                        <DatePicker
                                            value={values.chequeDate}
                                            onChange={(d) => setFieldValue("chequeDate", d)}
                                        />
                                        {errors.chequeDate && touched.chequeDate && (
                                            <p className="text-red-500 text-sm">{errors.chequeDate}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <Label text="देयकाधाराकाचे नाव :" className="w-32" />
                                        <Input
                                            name="costomerName"
                                            value={values.costomerName}
                                            onChange={handleChange}
                                        />
                                        {errors.costomerName && touched.costomerName && (
                                            <p className="text-red-500 text-sm">{errors.costomerName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label text="विभाग कोड :" />
                                        <Input
                                            name="debtorDeptCode"
                                            value={values.debtorDeptCode}
                                            onChange={handleChange}
                                        />
                                        {errors.debtorDeptCode && touched.debtorDeptCode && (
                                            <p className="text-red-500 text-sm">{errors.debtorDeptCode}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label text="लेखाशीर्ष :" />
                                        <Input
                                            name="debtorLedgerHead"
                                            value={values.debtorLedgerHead}
                                            onChange={handleChange}
                                        />
                                        {errors.debtorLedgerHead && touched.debtorLedgerHead && (
                                            <p className="text-red-500 text-sm">{errors.debtorLedgerHead}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <Label text="रक्कम :" />
                                        <Input
                                            name="amount"
                                            value={values.amount}
                                            onChange={handleChange}
                                            placeholder="रक्कम"
                                            type="number"
                                        />
                                        {errors.amount && touched.amount && (
                                            <p className="text-red-500 text-sm">{errors.amount}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label text="तपशील :" />
                                        <Input
                                            name="details"
                                            value={values.details}
                                            onChange={handleChange}
                                        />
                                        {errors.details && touched.details && (
                                            <p className="text-red-500 text-sm">{errors.details}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label text="पार्टी कोड :" />
                                        <Select
                                            onValueChange={(v) => setFieldValue("partyCode", v)}
                                            value={values.partyCode}
                                        >
                                            <SelectTrigger className="w-full border rounded-md">
                                                <SelectValue placeholder="-- विकल्प निवडा --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="party1">Party 1</SelectItem>
                                                <SelectItem value="party2">Party 2</SelectItem>
                                                <SelectItem value="party3">Party 3</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.partyCode && touched.partyCode && (
                                            <p className="text-red-500 text-sm">{errors.partyCode}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-center gap-3 pt-4">
                                    <Button type="submit" className="bg-blue-900 text-white hover:bg-blue-800">
                                        स्वीकार
                                    </Button>
                                    <Button type="button" variant="destructive">
                                        हटवा
                                    </Button>
                                    <Button type="button" path="/Transactions/FrmPaymentList">
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

export default FrmPayment;