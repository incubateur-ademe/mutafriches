import { useContext } from "react";
import { FormContext } from "./FormContext";

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext doit être utilisé dans un FormProvider");
  }
  return context;
};
