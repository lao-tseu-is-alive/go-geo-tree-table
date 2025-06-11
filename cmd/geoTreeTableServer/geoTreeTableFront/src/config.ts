import { levelLog, Log } from "@/log"

export const APP = "geoTreeTable"
export const APP_TITLE = "geoTreeTable"
export const VERSION = "0.0.1"
export const BUILD_DATE = "2024-06-05"
// eslint-disable-next-line no-undef
export const DEV = process.env.NODE_ENV === "development"
export const HOME = DEV ? "http://localhost:3000/" : "/"
// eslint-disable-next-line no-restricted-globals
const url = new URL(location.toString())
export const BACKEND_URL = DEV ? "http://localhost:7979" : url.origin
export const getLog = (ModuleName: string, verbosityDev: levelLog, verbosityProd: levelLog) =>
  DEV ? new Log(ModuleName, verbosityDev) : new Log(ModuleName, verbosityProd)

export const defaultAxiosTimeout = 10000 // 10 sec
