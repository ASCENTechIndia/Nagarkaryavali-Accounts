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
import ShadCNTable from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { Input } from "@/components/ui/input";

const FrmauthorizationconfigList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = user?.token;
    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [tableData, setTableData] = useState([]);
    const [rawData, setRawData] = useState([]);
    const [searchText, setSearchText] = useState("");

    const headers = ["निवडा", "महानगरपालिका कोड", "महानगरपालिका नाव", "स्थिती"];

    const keyMapping = {
        निवडा: "select",
        "महानगरपालिका कोड": "code",
        "महानगरपालिका नाव": "name",
        स्थिती: "status",
    };

    const formatTableData = (data) => {
        const formatted = data.map((item) => ({
            select: (
                <Button
                    variant="link"
                    className="text-blue-700 px-0 h-auto"
                    onClick={() =>
                        navigate("/Masters/Frmauthorizationconfig", {
                            state: {
                                mode: 2,
                                data: {
                                    id: item.AUTHORIZID,
                                    code: item.ULBID,
                                    name: item.CORPORATIONNAME,
                                    status: item.STATUS,
                                },
                            },
                        })
                    }
                >
                    निवडा
                </Button>
            ),
            code: item.ULBID,
            name: item.CORPORATIONNAME,
            status: item.STATUS,
        }));

        setTableData(formatted);
    };

    const fetchAuthConfigList = async () => {
        try {
            Swal.fire({
                title: "Loading...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await axios.get(
                `${BASE_URL}/api/Frmauthorizationconfig/authconfig-list`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const apiData = res.data?.data?.list || [];

            setRawData(apiData);
            formatTableData(apiData);

        } catch (error) {
            console.error("Auth Config API Error:", error);
            setTableData([]);
            Swal.fire("Error", "Failed to fetch data", "error");
        } finally {
            Swal.close();
        }
    };

    useEffect(() => {
        fetchAuthConfigList();
    }, []);

    useEffect(() => {
        if (!searchText.trim()) {
            formatTableData(rawData);
            return;
        }

        const lower = searchText.toLowerCase();

        const filtered = rawData.filter((item) =>
            Object.values(item).some((val) =>
                String(val).toLowerCase().includes(lower)
            )
        );

        formatTableData(filtered);
    }, [searchText, rawData]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 sm:mt-6 px-2 sm:px-4"
        >
            <Card className="shadow-sm border rounded-lg">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg font-semibold">
                        Authorization Config List
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

                        <div className="flex items-center gap-2 w-full sm:w-2/3">
                            <Label className="font-medium">Search :</Label>

                            <Input
                                type="text"
                                placeholder="Search Here.."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full border px-3 py-2 rounded-sm focus:outline-none"
                            />
                        </div>

                        <Button
                            className="bg-blue-900 hover:bg-blue-800 text-white px-4"
                            onClick={() => navigate("/Masters/Frmauthorizationconfig")}
                        >
                            नवीन जोडा
                        </Button>
                    </div>

                    <div className="border rounded-md bg-white overflow-x-auto">
                        <ShadCNTable
                            headers={headers}
                            data={tableData}
                            keyMapping={keyMapping}
                            headerClass="bg-blue-200 font-semibold"
                        />
                    </div>

                </CardContent>
            </Card>
        </motion.div>
    );
};

export default FrmauthorizationconfigList;