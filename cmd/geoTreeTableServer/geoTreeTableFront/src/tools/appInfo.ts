import {getLog} from "@/config";
import { JwtCustomClaims } from "@/tools/jwt";

const log = getLog("appInfo", 4, 2);

/**
 * @interface AppInfo
 * @description Defines the structure of the application information received from the API.
 * @property {string} app - The name of the application.
 * @property {string} version - The version of the application.
 * @property {string} repository - The URL of the application's code repository.
 * @property {string} authUrl - The authentication URL for the application's login form.
 */
export interface AppInfo {
    app: string;
    version: string;
    repository: string;
    authUrl: string;
    statusUrl: string;
}

/****
 * @function fetchAppInfo
 * @description Fetches application information from a specified URL.
 * @param {string} url - The URL endpoint to fetch the app information from (e.g., "/goAppInfo").
 * @returns {Promise<AppInfo>} A promise that resolves with the AppInfo object if successful.
 * @throws {Error} Throws an error if the fetch operation fails or if the response is not OK.
 */
export async function fetchAppInfo(url: string): Promise<AppInfo> {
    log.t(`about to fetch app info from ${url} ... `)
    try {
        // Make a GET request to the provided URL endpoint
        const response: Response = await fetch(url);

        // Check if the response was successful (status code 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} when fetching ${url}`);
        }

        // Parse the JSON response containing the AppInfo type and return it
        return await response.json();

    } catch (error: any) { // Explicitly type error as 'any' for broader error handling
        // Log the error and re-throw it so the caller can handle it
        log.e("Could not fetch app information from " + url + ":", error);
        throw new Error(`Failed to fetch app information: ${error.message}`);
    }
}


export async function fetchJwtStatus(url: string): Promise<JwtCustomClaims> {
  log.t(`about to fetch jwt status from ${url} ... `);
  try {
    // Make a GET request to the provided URL endpoint
    const response: Response = await fetch(url, { credentials: 'include' });
    // Check if the response was successful (status code 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} when fetch ${url}`)
    }
    // Parse the JSON response containing the AppInfo type and return it
    return await response.json();
  } catch (error: any) { // Explicitly type error as 'any' for broader error handling
    // Log the error and re-throw it so the caller can handle it
    log.w("Could not fetch app information from " + url + ":", error);
    throw new Error(`Failed to fetch status information: ${error.message}`);
  }
}

export async function fetchAuthUrl(url: string): Promise<string> {
  log.t(`about to fetch jwt auth url from ${url} ... `);
  try {
    const response: Response = await fetch(url);
    if (!response.ok) {
      return`HTTP error! status: ${response.status} when fetch ${url}`
    }
    // Parse the JSON response containing the AppInfo type and return it
    return await response.text();
  } catch (error: any) { // Explicitly type error as 'any' for broader error handling
    log.e("Could not fetch auth url from " + url + ":", error);
    return `error doing fetch auth url : ${error.message}`;
  }
}
