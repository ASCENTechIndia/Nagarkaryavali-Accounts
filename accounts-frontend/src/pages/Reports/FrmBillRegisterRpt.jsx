import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Swal from "sweetalert2";
import { DatePicker } from "@/components/ui/calendar";
import { Formik, Form } from "formik";

const FrmBillRegisterRpt = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = user?.token;

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const formatDate = (date) => {
        if (!date) return "";

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const handleSubmit = async (values) => {
        if (values.fromDate && values.toDate) {
            try {
                const payload = {
                    fromDate: formatDate(values.fromDate),
                    toDate: formatDate(values.toDate),
                };

                Swal.fire({
                    title: "Generating PDF...",
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });

                const res = await axios.post(
                    `${BASE_URL}/api/FrmBillRegisterRpt/bill-register-report-pdf`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                Swal.close();

                if (res.data?.success) {
                    const pdfUrl = res.data.pdfUrl;
                    window.open(pdfUrl, "_blank");


                    Swal.fire({
                        text: "PDF Generated Successfully",
                        confirmButtonColor: "#1e3a8a",
                    });
                }
            } catch (error) {
                console.error(error);

                Swal.fire({
                    text: "Failed to generate PDF",
                    confirmButtonColor: "#1e3a8a",
                });
            }
        } else {
            Swal.fire({
                text: "Please select Date",
                confirmButtonColor: "#1e3a8a",
            });
        }
    }

    return (
        <Formik
            initialValues={{
                fromDate: new Date(),
                toDate: new Date(),
            }}
            onSubmit={handleSubmit}
        >
            {({ values, setFieldValue }) => (
                <Form>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 sm:mt-6 px-2 sm:px-4"
                    >
                        <Card className="shadow-sm border rounded-lg">
                            {/* HEADER */}
                            <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                <CardTitle className="text-lg font-semibold">
                                    बिल रजिस्टर
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-6 space-y-6">
                                {/* DATE FILTERS */}
                                <div className="p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                        {/* From Date */}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                            <span className="sm:w-40 text-left sm:text-right font-medium text-gray-700">
                                                दिनांक पासून :
                                            </span>
                                            <DatePicker
                                                className="w-full sm:flex-1"
                                                value={values.fromDate}
                                                onChange={(date) =>
                                                    setFieldValue("fromDate", date)
                                                }
                                            />
                                        </div>

                                        {/* To Date */}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                            <span className="sm:w-40 text-left sm:text-right font-medium text-gray-700">
                                                दिनांक पर्यंत :
                                            </span>
                                            <DatePicker
                                                className="w-full sm:flex-1"
                                                value={values.toDate}
                                                onChange={(date) =>
                                                    setFieldValue("toDate", date)
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-3 pt-4 mt-5">
                                        <Button
                                            type="submit"
                                            className="bg-blue-900 text-white px-6 h-9"
                                        >
                                            प्रक्रिया
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="px-6 h-9 text-red-600"
                                            onClick={() =>
                                                navigate("/HomePage/FrmHomePage")
                                            }
                                        >
                                            बाहेर
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Form>
            )}
        </Formik>
    );
};

export default FrmBillRegisterRpt;