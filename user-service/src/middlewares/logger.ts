import logger from "../utils/logger.ts";
import type { Request, Response, NextFunction } from "express";


export const logRequests = (req:Request,res:Response, next:NextFunction) => {
    const {method, url, ip} = req;
    logger.info("Incoming Request: "+ method + " " + url + " - " + ip);
    next();
};