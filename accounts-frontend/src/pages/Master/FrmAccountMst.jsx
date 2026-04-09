import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/* 🔥 Field Layout */
const Field = ({ label, children }) => (
  <div className="flex items-center gap-4">
    <span className="w-52 text-right font-medium">{label} :</span>
    <div className="flex-1 max-w-md">{children}</div>
  </div>
);

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmAccountMaster = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mode = location.state?.mode || 1;

  const [corporationList, setCorporationList] = useState([]);
  const [glList, setGlList] = useState([]);
  const [nidhiList, setNidhiList] = useState([]);
  const [subTypeList, setSubTypeList] = useState([]);
  const [zoneList, setZoneList] = useState([]);

  /* 🔥 FETCH DATA */
  useEffect(() => {
    if (!user?.token) return;

    const fetchData = async () => {
      try {
        const [corp, gl, nidhi, subType] = await Promise.all([
          axios.get(`${BASE_URL}/api/FrmParty/corporation/list`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${BASE_URL}/api/FrmAccount/gl-master`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${BASE_URL}/api/FrmAccount/nidhi-master`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${BASE_URL}/api/FrmAccount/account-subTypes`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        setCorporationList(corp.data?.data?.list || []);
        setGlList(gl.data?.data?.data || []);
        setNidhiList(nidhi.data?.data?.data || []);
        setSubTypeList(subType.data?.data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [user]);

  /* 🔥 ZONE */
  const getZones = async (corpId) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmAccount/zone-list`,
        { corpId },
        { headers: { Authorization: `Bearer ${user?.token}` } },
      );
      setZoneList(res.data?.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* 🔥 NEXT ACC NO */
  const getNextAccountNo = async (glCode, subTypeId, setFieldValue, values) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmAccount/next-accountNo`,
        {
          ulbId: Number(values.ulbId),
          glCode: Number(glCode),
          subTypeId: Number(subTypeId),
        },
        { headers: { Authorization: `Bearer ${user?.token}` } },
      );

      const next = res.data?.data?.data?.NEXTACCNO || "";
      const finalNo = `${glCode}${subTypeId}${next}`;

      setFieldValue("accNo", finalNo);
    } catch (err) {
      console.error(err);
    }
  };

  /* 🔥 SUBMIT */
  const handleSubmit = async (values, { resetForm }) => {
    try {
      const payload = {
        mode: mode === 2 ? 2 : 1,
        ulbId: Number(values.ulbId),
        glCode: Number(values.glCode),
        accNo: Number(values.accNo),

        accName: values.accName,
        accNameEng: values.accNameEng,
        userId: user?.userName || "admin",

        subTypeId: Number(values.subTypeId),
        oldAccNo: values.oldAccNo,
        nidhiId: Number(values.nidhiId),

        openingBal: Number(values.openingBal || 0),
        budgetAmt: Number(values.budgetAmt || 0),
        maxLimit: Number(values.maxLimit || 0),
        revBudgetAmt: Number(values.revBudgetAmt || 0),
      };

      // 🔥 LOADING ALERT
      Swal.fire({
        title: "Saving...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/FrmAccount/save-account`,
        payload,
        { headers: { Authorization: `Bearer ${user?.token}` } },
      );

      Swal.close();

      if (res.data?.data?.success) {
        // 🔥 WAIT for alert to finish
        await Swal.fire({
          icon: "success",
          title: res.data.data.message,
          confirmButtonText: "OK",
        });

        navigate("/Masters/FrmAccountList");
        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          title: res.data?.data?.message || "Something went wrong",
        });
      }
    } catch (err) {
      Swal.close();

      Swal.fire({
        icon: "error",
        title: err.response?.data?.message || "Error saving data",
      });
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={{
        ulbId: user?.ulbId?.toString() || "",
        glCode: "",
        nidhiId: "",
        subTypeId: "",
        accountTypeId: "",
        accNo: "",
        accName: "",
        accNameEng: "",
        oldAccNo: "",
        openingBal: "",
        budgetAmt: "",
        maxLimit: "",
        revBudgetAmt: "",
      }}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, setFieldValue, isSubmitting }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto mt-6"
          >
            <Card className="shadow-sm border rounded-lg">
              <CardHeader className="border-b flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">
                  खाते मास्टर
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 gap-x-16 gap-y-5">
                  {/* ULB */}
                  <Field label="महानगरपालिकेचे नाव">
                    <Select value={values.ulbId} disabled>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="महानगरपालिका निवडा" />
                      </SelectTrigger>

                      <SelectContent>
                        {corporationList.map((c) => (
                          <SelectItem
                            key={c.NUM_CORPORATION_ID}
                            value={c.NUM_CORPORATION_ID.toString()}
                          >
                            {c.VAR_CORPORATION_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* NIDHI */}
                  <Field label="निधि">
                    <Select
                      value={values.nidhiId}
                      onValueChange={(val) => setFieldValue("nidhiId", val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {nidhiList.map((n) => (
                          <SelectItem
                            key={n.NUM_NIDHI_ID}
                            value={n.NUM_NIDHI_ID.toString()}
                          >
                            {n.VAR_NIDHI_NIDHINAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* GL */}
                  <Field label="जी.एल. फंक्शन कोड">
                    <Select
                      value={values.glCode}
                      onValueChange={(val) => {
                        setFieldValue("glCode", val);
                        if (values.subTypeId) {
                          getNextAccountNo(
                            val,
                            values.subTypeId,
                            setFieldValue,
                            values,
                          );
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {glList.map((g) => (
                          <SelectItem key={g.GLCODE} value={g.GLCODE}>
                            {g.GLCODE} - {g.GLNAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* SUBTYPE */}
                  <Field label="जी.एल./ऑब्जेक्ट कोड">
                    <Select
                      value={values.subTypeId}
                      onValueChange={(val) => {
                        setFieldValue("subTypeId", val);

                        let accountTypeId = "";
                        if (val >= 1000 && val < 2000) accountTypeId = "1";
                        else if (val >= 2000 && val < 3000) accountTypeId = "2";
                        else if (val >= 3000 && val < 4000) accountTypeId = "3";
                        else if (val >= 4000) accountTypeId = "4";

                        setFieldValue("accountTypeId", accountTypeId);

                        if (values.glCode) {
                          getNextAccountNo(
                            values.glCode,
                            val,
                            setFieldValue,
                            values,
                          );
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subTypeList.map((s) => (
                          <SelectItem
                            key={s.NUM_ACCSUBTYPEMST_ACCSUBTYPEID}
                            value={s.NUM_ACCSUBTYPEMST_ACCSUBTYPEID.toString()}
                          >
                            {s.VAR_ACCSUBTYPEMST_ACCSUBTYPE}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* ACCOUNT NO */}
                  <Field label="खाते आय.डी">
                    <Input
                      value={values.accNo}
                      readOnly
                      className="bg-gray-100"
                    />
                  </Field>

                  {/* OLD ACC */}
                  <Field label="जुना खाते क्र.">
                    <Input
                      name="oldAccNo"
                      value={values.oldAccNo}
                      onChange={handleChange}
                    />
                  </Field>

                  {/* MARATHI */}
                  <Field label="जी.एल. खाते नाव (मराठी)">
                    <Input
                      name="accName"
                      value={values.accName}
                      onChange={handleChange}
                    />
                  </Field>

                  {/* ENGLISH */}
                  <Field label="जी.एल. खाते नाव (English)">
                    <Input
                      name="accNameEng"
                      value={values.accNameEng}
                      onChange={handleChange}
                    />
                  </Field>

                  {/* BUDGET */}
                  <Field label="बजेट तरतूद रक्कम">
                    <Input
                      name="budgetAmt"
                      value={values.budgetAmt}
                      onChange={handleChange}
                    />
                  </Field>

                  {/* REV BUDGET */}
                  <Field label="सुधारित बजेट रक्कम">
                    <Input
                      name="revBudgetAmt"
                      value={values.revBudgetAmt}
                      onChange={handleChange}
                    />
                  </Field>

                  {/* OPENING */}
                  <Field label="प्रारंभिक शिल्लक">
                    <Input
                      name="openingBal"
                      value={values.openingBal}
                      onChange={handleChange}
                    />
                  </Field>

                  {/* MAX */}
                  <Field label="कमाल मर्यादा">
                    <Input
                      name="maxLimit"
                      value={values.maxLimit}
                      onChange={handleChange}
                    />
                  </Field>
                </div>

                {/* BUTTONS */}
                <div className="flex justify-center gap-4 mt-8">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "साठवा"}
                  </Button>

                  <Button variant="secondary">रद्द</Button>

                  <Button variant="destructive" onClick={() => navigate(-1)}>
                    परत
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

export default FrmAccountMaster;
