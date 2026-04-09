import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import ShadCNTable from "@/components/ui/table";

const FrmPartyList = () => {
  const navigate = useNavigate();

  const headers = [
    "निवडा",
    "पार्टी संकेतांक",
    "पार्टीचे नाव",
    "शहर",
    "पिन कोड",
    "मोबाइल",
    "ईमेल",
    "पॅनकार्ड क्र.",
    "जीएसटी क्र.",
  ];

  const keyMapping = {
    निवडा: "select",
    "पार्टी संकेतांक": "code",
    "पार्टीचे नाव": "name",
    शहर: "city",
    "पिन कोड": "pincode",
    मोबाइल: "mobile",
    ईमेल: "email",
    "पॅनकार्ड क्र.": "pan",
    "जीएसटी क्र.": "gst",
  };

  const rawData = [
    {
      id: 1,
      code: "464",
      name: "SUMIT BAVISKAR",
      city: "BHIWANDI",
      pincode: "423203",
      mobile: "7774008818",
      email: "sumidj22@gmail.com",
      pan: "ELCPR1333P",
      gst: "27ABCDE1234F1Z5",
    },
  ];

  const tableData = rawData.map((row) => ({
    select: (
      <Button
        variant="link"
        className="text-blue-700 px-0 h-auto"
        onClick={() =>
          navigate("/Masters/FrmPartyMaster", {
            state: {
              mode: 2,
              data: row,
            },
          })
        }
      >
        निवडा
      </Button>
    ),
    code: row.code,
    name: row.name,
    city: row.city,
    pincode: row.pincode,
    mobile: row.mobile,
    email: row.email,
    pan: row.pan,
    gst: row.gst,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto mt-6"
    >
      <Card className="shadow-sm border rounded-lg">

        {/* HEADER */}
        <CardHeader className="border-b flex justify-between items-center ">
          <CardTitle className="text-lg font-semibold">
            पार्टी यादी
          </CardTitle>

          <Button
            className="bg-blue-900 hover:bg-blue-800 text-white"
            onClick={() => navigate("/Masters/FrmPartyMaster")}
          >
            नवीन जोडा
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">

          {/* FILTER SECTION */}
          <div className="border rounded-md p-4 bg-gray-50">

            <div className="grid md:grid-cols-3 gap-6">

              {/* Municipality */}
              <div className="flex items-center gap-3">
                <span className="w-40 text-right font-medium text-gray-700">
                  नगरपालिकेचे नाव :
                </span>

                <Select>
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue placeholder="-- निवडा --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      मालेगाव महानगरपालिका
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 md:col-span-2">
                <span className="w-40 text-right font-medium text-gray-700">
                  शोध :
                </span>

                <Input
                  placeholder="शोध मजकूर प्रविष्ट करा"
                  className="flex-1 h-9"
                />
              </div>

            </div>
          </div>

          {/* TABLE */}
          <div className="border rounded-md overflow-hidden bg-white">
            <ShadCNTable
              headers={headers}
              data={tableData}
              keyMapping={keyMapping}
            />
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmPartyList;