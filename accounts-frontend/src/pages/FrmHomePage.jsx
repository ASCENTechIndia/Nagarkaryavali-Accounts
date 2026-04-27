import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as BarTooltip,
    Legend as BarLegend,
} from "recharts";
import ShadCNTable from "@/components/ui/table";
import { Label } from "@/components/ui/label";

const FrmDashboard = () => {
    const { user } = useAuth();
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const ulbId = user?.ulbId;
    const token = user?.token;
    const [tab, setTab] = useState("balance");
    const [balanceTableData, setBalanceTableData] = useState([]);
    const [budgetTableData, setBudgetTableData] = useState([]);
    const [grantTableData, setGrantTableData] = useState([]);
    const [amountType, setAmountType] = useState("crores");

    const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#0ea5e9"];

    const convertAmount = (value) => {
        if (amountType === "crores") return value / 10000000;
        if (amountType === "lakhs") return value / 100000;
        return value;
    };

    const balanceHeaders = ["बँक", "शिल्लक"];

    const balanceKeyMapping = {
        "बँक": "name",
        "शिल्लक": "value",
    };

    const fetchBalanceData = async () => {
        try {
            Swal.fire({
                title: "Loading...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await axios.post(
                `${BASE_URL}/api/dashboard/BindPayModeGrid`,
                { corpId: ulbId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const apiData = res.data?.data || [];

            const formatted = apiData.map((item) => ({
                name: item.BANK,
                value: Number(convertAmount(item.BALANCE).toFixed(2)),
            }));

            const totalValue = formatted.reduce((sum, item) => sum + item.value, 0);

            formatted.push({
                name: "एकूण",
                value: Number(totalValue.toFixed(2)),
            });

            setBalanceTableData(formatted);

        } catch (err) {
            console.error("Balance API Error:", err);
            setBalanceTableData([]);
        } finally {
            Swal.close();
        }
    };

    const budgetHeaders = ["विभाग", "तरतूद", "उपयोग", "%"];

    const budgetKeyMapping = {
        "विभाग": "name",
        "तरतूद": "provision",
        "उपयोग": "utilization",
        "%": "percent",
    };

    const fetchBudgetData = async () => {
        try {
            Swal.fire({
                title: "Loading...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await axios.post(
                `${BASE_URL}/api/dashboard/BindReceiptGrid`,
                { corpId: ulbId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const apiData = res.data?.data || [];

            const formatted = apiData.map((item) => ({
                name: item.VAR_BUDGETCONFIG_BUDGETNAME,
                provision: Number(item.PROVISION),
                utilization: Number(item.UTILISATION),
                percent: item.PERCENTAGE,
            }));

            const totalProvision = formatted.reduce((sum, item) => sum + item.provision, 0);
            const totalUtilization = formatted.reduce((sum, item) => sum + item.utilization, 0);
            const totalPercent = formatted.reduce((sum, item) => sum + item.percent, 0);

            formatted.push({
                name: "एकूण",
                provision: Number(totalProvision.toFixed(2)),
                utilization: Number(totalUtilization.toFixed(2)),
                percent: `${totalPercent}`,
            });

            setBudgetTableData(formatted);

        } catch (err) {
            console.error("Budget API Error:", err);
            setBudgetTableData([]);
        } finally {
            Swal.close();
        }
    };

    const grantHeaders = ["विभाग", "अनुदान", "मिळाले", "उपयोग", "शिल्लक"];

    const grantKeyMapping = {
        "विभाग": "name",
        "अनुदान": "grant",
        "मिळाले": "received",
        "उपयोग": "utilized",
        "शिल्लक": "balance",
    };

    const fetchGrantData = async () => {
        try {
            Swal.fire({
                title: "Loading...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await axios.post(
                `${BASE_URL}/api/dashboard/BindGrantsGrid`,
                { corpId: ulbId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const apiData = res.data?.data || [];

            const formatted = apiData.map((item) => ({
                name: item.DEPTNAME,
                grant: Number(convertAmount(item.GRANTS).toFixed(2)),
                received: Number(convertAmount(item.RECEIVED).toFixed(2)),
                utilized: Number(convertAmount(item.UTILISED).toFixed(2)),
                balance: Number(convertAmount(item.BALANCE).toFixed(2)),
            }));

            const totalGrant = formatted.reduce((sum, item) => sum + item.grant, 0);
            const totalReceived = formatted.reduce((sum, item) => sum + item.received, 0);
            const totalUtilized = formatted.reduce((sum, item) => sum + item.utilized, 0);
            const totalBalance = formatted.reduce((sum, item) => sum + item.balance, 0);

            formatted.push({
                name: "एकूण",
                grant: Number(totalGrant.toFixed(2)),
                received: Number(totalReceived.toFixed(2)),
                utilized: Number(totalUtilized.toFixed(2)),
                balance: Number(totalBalance.toFixed(2)),
            });

            setGrantTableData(formatted);

        } catch (err) {
            console.error("Grant API Error:", err);
            setGrantTableData([]);
        } finally {
            Swal.close();
        }
    };

    useEffect(() => {
        if (!ulbId || !token) return;

        fetchBalanceData();
        fetchBudgetData();
        fetchGrantData();

    }, [ulbId, token, amountType]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4"
        >
            <Card className="shadow-md rounded-xl">
                <CardHeader className="border-b">
                    <Tabs
                        value={tab}
                        onValueChange={(val) => {
                            setTab(val);
                        }}
                    >
                        <TabsList className="grid grid-cols-3 w-full max-w-md">
                            <TabsTrigger value="balance">शिल्लक</TabsTrigger>
                            <TabsTrigger value="budget">अर्थसंकल्पाचा वापर</TabsTrigger>
                            <TabsTrigger value="grant">अनुदान वापर</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>

                <CardContent className="p-4">

                    {tab === "balance" && (
                        <div>
                            <div className="mb-4 flex items-center gap-3">
                                <Label className="font-medium" text="रक्कम * :" />
                                <Select value={amountType} onValueChange={setAmountType}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rupees">Rupees</SelectItem>
                                        <SelectItem value="lakhs">Lakhs</SelectItem>
                                        <SelectItem value="crores">Crores</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ShadCNTable
                                    headers={balanceHeaders}
                                    data={balanceTableData}
                                    keyMapping={balanceKeyMapping}
                                />

                                <div className="border rounded-lg p-4 flex justify-center items-center">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={balanceTableData.filter(item => item.name !== "एकूण")}
                                                dataKey="value"
                                                nameKey="name"
                                                outerRadius={100}
                                                label={(entry) => entry.value}
                                            >
                                                {balanceTableData
                                                    .filter(item => item.name !== "एकूण")
                                                    .map((entry, index) => (
                                                        <Cell key={index} fill={COLORS[index]} />
                                                    ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                    )}

                    {tab === "budget" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <ShadCNTable
                                headers={budgetHeaders}
                                data={budgetTableData}
                                keyMapping={budgetKeyMapping}
                            />

                            <div className="border rounded-lg p-4">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={budgetTableData.filter(item => item.name !== "एकूण")}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <BarTooltip />
                                        <BarLegend />
                                        <Bar dataKey="provision" fill="#0ea5e9" name="Provision" />
                                        <Bar dataKey="utilization" fill="#7c3aed" name="Utilization" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="col-span-2 text-red-500 text-sm mt-2">
                                * Amounts in Crores
                            </div>

                        </div>
                    )}

                    {tab === "grant" && (
                        <div>
                            <div className="mb-4 flex items-center gap-3">
                                <Label className="font-medium" text="Amount In * :" />
                                <Select value={amountType} onValueChange={setAmountType}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rupees">Rupees</SelectItem>
                                        <SelectItem value="lakhs">Lakhs</SelectItem>
                                        <SelectItem value="crores">Crores</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <ShadCNTable
                                    headers={grantHeaders}
                                    data={grantTableData}
                                    keyMapping={grantKeyMapping}
                                />

                                <div className="border rounded-lg p-4">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={grantTableData.filter(item => item.name !== "एकूण")}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />

                                            <Bar dataKey="grant" fill="#0284c7" name="Grants" />
                                            <Bar dataKey="received" fill="#7c3aed" name="received" />
                                            <Bar dataKey="utilized" fill="#10b981" name="Utilised" />
                                            <Bar dataKey="balance" fill="#22c55e" name="Balance" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default FrmDashboard;