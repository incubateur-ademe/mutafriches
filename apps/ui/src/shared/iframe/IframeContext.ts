import { createContext } from "react";
import { DEFAULT_IFRAME_CONTEXT } from "./IframeContext.constants";
import { IframeContextValue } from "./IframeContext.types";

export const IframeContext = createContext<IframeContextValue>(DEFAULT_IFRAME_CONTEXT);
