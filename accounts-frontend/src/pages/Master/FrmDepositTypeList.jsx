import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import ShadCNTable from "@/components/ui/table";

const FrmDepositTypeList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const ulbId = user?.ulbId;

    const [corporations, setCorporations] = useState([]);
    const [selectedCorp, setSelectedCorp] = useState("");
    const [tableData, setTableData] = useState([]);

    // ✅ Deposit List headers
    const headers = ["निवडा", "ठेवेचे नाव"];

    const keyMapping = {
        निवडा: "select",
        "ठेवेचे नाव": "depositName",
    };

    const fetchCorporations = async () => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/Receipt/corporation`,
                { corp_id: ulbId },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );

            const corpData = res.data.data || [];
            setCorporations(corpData);

            if (corpData.length > 0) {
                const defaultCorp = corpData[0].CORPORATIONID.toString();
                setSelectedCorp(defaultCorp);
                fetchDeposits(defaultCorp);
            }
        } catch (err) {
            console.error("Corporation API Error:", err);
        }
    };

    const fetchDeposits = async (corpId) => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/Deposit/depositlist`,
                { corp_id: corpId },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );

            const apiData = res.data?.data?.list || [];

            const formatted = apiData.map((item) => ({
                select: (
                    <Button
                        variant="link"
                        className="text-blue-700 px-0 h-auto"
                        onClick={() =>
                            navigate("/Masters/FrmDepositTypeMst", {
                                state: {
                                    mode: 2,
                                    data: {
                                        id: item.DEPOSITID,
                                        depositName: item.DEPOSITNAME.trim(),
                                    },
                                },
                            })
                        }
                    >
                        निवडा
                    </Button>
                ),
                depositName: item.DEPOSITNAME.trim(),
            }));

            setTableData(formatted);
        } catch (err) {
            console.error("Deposit API Error:", err);
            setTableData([]);
        }
    };

    useEffect(() => {
        fetchCorporations();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 sm:mt-6 px-2 sm:px-4"
        >
            <Card className="shadow-sm border rounded-lg">
                {/* HEADER */}
                <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <CardTitle className="text-lg font-semibold">ठेवेची यादी</CardTitle>

                    <Button
                        className="bg-blue-900 hover:bg-blue-800 text-white w-full sm:w-auto"
                        onClick={() => navigate("/Masters/FrmDepositTypeMst")}
                    >
                        नविन जोडा
                    </Button>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-6">
                    {/* Corporation Dropdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span className="sm:w-40 text-left sm:text-right font-medium text-gray-700">
                            नगरपालिकेचे नाव :
                        </span>
                        <Select
                            value={selectedCorp}
                            onValueChange={(val) => {
                                setSelectedCorp(val);
                                fetchDeposits(val);
                            }}
                            disabled
                        >
                            <SelectTrigger className="w-full sm:flex-1 h-9">
                                <SelectValue placeholder="-- निवडा --" />
                            </SelectTrigger>
                            <SelectContent>
                                {corporations.map((corp) => (
                                    <SelectItem
                                        key={corp.CORPORATIONID}
                                        value={corp.CORPORATIONID.toString()}
                                    >
                                        {corp.CORPORATIONNAME}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* TABLE */}
                    {tableData.length > 0 && (
                        <div className="border rounded-md bg-white overflow-x-auto">
                            <ShadCNTable
                                headers={headers}
                                data={tableData}
                                keyMapping={keyMapping}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default FrmDepositTypeList;
