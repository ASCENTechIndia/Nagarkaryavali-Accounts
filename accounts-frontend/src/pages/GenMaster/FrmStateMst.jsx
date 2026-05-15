import { Formik, Form } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmState = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); 

  const mode = location.state?.mode || 1;
  const editData = location.state?.data;

  const [formData, setFormData] = useState({
    stateCode: "",
    stateName: "",
  });

  const [loading, setLoading] = useState(false);

  /* 🔥 FETCH SINGLE (NEW API) */
  const fetchDetails = async (id) => {
    try {
      Swal.fire({
        title: "Loading Data...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.get(
        `${BASE_URL}/api/District/state/${id}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      Swal.close();

      if (res.data?.ok && res.data?.data?.data) {
        const d = res.data.data.data;

        setFormData({
          stateCode: d.STATEID || "",
          stateName: d.STATENAME || "",
        });
      }
    } catch (err) {
      Swal.close();
      console.error(err);
      Swal.fire("Error loading data");
    }
  };

  /* 🔥 INIT */
  useEffect(() => {
    if (mode === 2 && editData?.STATE_ID) {
      fetchDetails(editData.STATE_ID); 
    }
  }, [user]);


const handleSubmit = async (values, { resetForm }) => {
  try {
    // Validation
    if (!values.stateName?.trim()) {
      return Swal.fire({
        icon: "warning",
        title: "राज्याचे नाव भरा",
      });
    }

    // Payload
    const payload = {
      stateName: values.stateName.trim(),
      userId: user?.userId,
      mode, 
    };

    
    if (mode === 2) {
      payload.stateId = Number(values.stateCode);
    }

    console.log("Submit Payload:", payload);

   
    Swal.fire({
      title: mode === 1 ? "Saving..." : "Updating...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

  
    const res = await axios.post(
      `${BASE_URL}/api/District/statemaster`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    Swal.close();

    // Success Response
    if (res.data?.ok && res.data?.data?.success) {
      await Swal.fire({
        icon: "success",
        title:
          mode === 1
            ? "Record Saved Successfully"
            : "Record Updated Successfully",
      });

      resetForm();
      navigate("/Masters/FrmStateList");
    } else {
      Swal.fire({
        icon: "error",
        title: res.data?.message || "Something went wrong",
      });
    }
  } catch (error) {
    Swal.close();
    console.error("Submit Error:", error);

    Swal.fire({
      icon: "error",
      title:
        error?.response?.data?.message ||
        error?.message ||
        "Server Error",
    });
  }
};
  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <Formik
      enableReinitialize
      initialValues={formData}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, resetForm, isSubmitting }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto mt-6"
          >
            <Card className="border shadow-sm">
              {/* HEADER */}
              <CardHeader className="border-b">
                <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800">
                 राज्य मास्टर
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-6">

                {/* FORM */}
               <div className="space-y-5 max-w-2xl mx-auto">

  {/* CODE */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 items-center">
    <Label className="text-sm sm:text-right sm:pr-2">
      राज्य संकेतांक :
    </Label>

    <Input
      name="stateCode"
      value={values.stateCode}
      onChange={handleChange}
      disabled={mode === 2}
      className="w-full"
    />
  </div>

  {/* NAME */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 items-center">
    <Label className="text-sm sm:text-right sm:pr-2">
      राज्याचे नाव :
    </Label>

    <Input
      name="stateName"
      value={values.stateName}
      onChange={handleChange}
      className="w-full"
    />
  </div>

</div>

                {/* BUTTONS */}
                <div className="flex justify-center gap-4 pt-4 border-t">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "साठवा"}
                  </Button>

                  <Button type="button" variant="outline" onClick={resetForm}>
                    रद्द
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => navigate("/Masters/FrmStateList")}
                  >
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

export default FrmState;