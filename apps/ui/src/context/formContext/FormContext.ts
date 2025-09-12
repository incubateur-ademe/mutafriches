import { createContext } from "react";
import { FormContextType } from "./FormContext.types";

export const FormContext = createContext<FormContextType | undefined>(undefined);
