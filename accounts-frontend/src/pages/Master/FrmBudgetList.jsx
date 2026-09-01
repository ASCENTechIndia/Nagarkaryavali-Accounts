import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
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
import ShadCNTable from "@/components/ui/table";
import { DatePicker } from "@/components/ui/calendar"; // ✅ your DatePicker component

const FrmBudgetList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = user?.token;

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [tableData, setTableData] = useState([]);

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [showTable, setShowTable] = useState(false);

    const headers = [
        "निवडा",
        "बजेट नं.",
        "तारीख",
        "बजेट हेड",
        "तपशील",
        "रक्कम",
        "तात्पुरती रक्कम",
        "मेजर कोड",
        "मापनर कोड",
    ];

    const keyMapping = {
        निवडा: "select",
        "बजेट नं.": "budgetNo",
        तारीख: "date",
        "बजेट हेड": "budgetHead",
        तपशील: "details",
        रक्कम: "amount",
        "तात्पुरती रक्कम": "tempAmount",
        "मेजर कोड": "majorCode",
        "मापनर कोड": "minorCode",
    };

    const formatDate = (date) => {
        const d = new Date(date);

        const months = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        const day = String(d.getDate()).padStart(2, "0");
        const month = months[d.getMonth()];
        const year = d.getFullYear();

        return `${day}-${month}-${year}`;
      };


    const fetchBudgetList = async () => {
        try {

            Swal.fire({
                title: "Loading ...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const from = formatDate(fromDate);
            const to = formatDate(toDate);

            const res = await axios.get(
                `${BASE_URL}/api/Budgetlist/budgetlist`,
                {
                    params: { fromDate: from, toDate: to },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const list = res.data?.data?.list || [];

            if (list.length === 0) {
                setShowTable(false);
                setTableData([]);
                Swal.fire({
                    text: "Data Not Found",
                    confirmButtonColor: "#1e3a8a",
                });
                return;
            }

            const formatted = list.map((item) => ({
                select: (
                    <Button
                        variant="link"
                        className="text-blue-700 px-0 h-auto"
                        onClick={() =>
                            navigate("/Masters/FrmBudgetMst", {
                                state: {
                                    mode: 2,
                                    data: {
                                        id: item.NUM_BUDGET_BUDGETNO,
                                    },
                                },
                            })
                        }
                    >
                        निवडा
                    </Button>
                ),
                budgetNo: item.NUM_BUDGET_BUDGETNO,
                date: new Date(item.DATE_BUDGET_BUDGETDATE).toLocaleDateString("en-GB"),
                budgetHead: item.VAR_BUDGETHEAD_NAME?.trim(),
                details: item.VAR_BUDGET_NARATION,
                amount: item.NUM_BUDGET_BUDGAMOUT,
                tempAmount: item.PROV_AMOUNT,
                majorCode: item.NUM_BUDGET_BUDGETGL,
                minorCode: item.NUM_BUDGET_BUDGETACCNO,
            }));

            setTableData(formatted);
            setShowTable(true);
        } catch (err) {
            console.error("Budget API Error:", err);
            setTableData([]);
        } finally {
            Swal.close();
        }
    };

    const handleSearch = () => {
        if (fromDate && toDate) {
            fetchBudgetList();
        } else {
            Swal.fire({
                text: "Please select Date",
                confirmButtonColor: "#1e3a8a",
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 sm:mt-6 px-2 sm:px-4"
        >
            <Card className="shadow-sm border rounded-lg">
                {/* HEADER */}
                <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <CardTitle className="text-lg font-semibold">
                        अर्थसंकल्पीय अंदाजपत्रकाची यादी
                    </CardTitle>

                    <div className="flex gap-3">
                        <Button
                            className="bg-blue-900 hover:bg-blue-800 text-white w-full sm:w-auto"
                            onClick={() => navigate("/Masters/FrmBudgetMst")}
                        >
                            नविन जोडा
                        </Button>
                    </div>
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
                                <DatePicker className="w-full sm:flex-1" value={fromDate} onChange={setFromDate} />
                            </div>

                            {/* To Date */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <span className="sm:w-40 text-left sm:text-right font-medium text-gray-700">
                                    दिनांक पर्यंत :
                                </span>
                                <DatePicker className="w-full sm:flex-1" value={toDate} onChange={setToDate} />
                            </div>

                            <div className="flex items-center sm:items-end">
                                <Button
                                    className="bg-blue-900 hover:bg-blue-800 text-white w-full sm:w-auto"
                                    onClick={handleSearch}
                                >
                                    शोधा
                                </Button>
                            </div>
                        </div>
                    </div>

                    {showTable && (
                        <div className="border rounded-md bg-white overflow-x-auto">
                            <ShadCNTable
                                headers={headers}
                                data={tableData}
                                keyMapping={keyMapping}
                                classname="max-sm:min-w-[270px]"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default FrmBudgetList;
