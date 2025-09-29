import type { Request,Response } from "express";
import jwt from "jsonwebtoken";
import memoryStore from "../config/memoryStore.ts";

const JWT_SECRET = process.env.JWT_SECRET as string;

interface CustomRequest extends Request{
    user?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export default function tokenTest(req: CustomRequest,res:Response,next:Function){
    const {cookie} = req.headers;
    if(!cookie) return res.status(401).json({message: "No cookies found"});
    const cookies = cookie?.split(";");
    let user:string | undefined = undefined;
    for(const c of cookies){
        const [name,value] = c.trim().split("=");
        if(name === "token"){
            try{
                const decoded = jwt.verify(value as string, JWT_SECRET) as {email: string, iat: number, exp: number};
                user = decoded.email;
            }catch(e){
                console.log(e);
                return res.status(401).json({message: "Invalid token"});
            }
        }
        if(name === "sessionId"){
            const email = memoryStore.get(value as string);
            if(email){
                if (user && user !== email) {
                    return res.status(401).json({ message: "Token and session do not match" });
                }
                user = email;
            }
        }
    }
    if(!user) return res.status(401).json({message: "No user found"});
    req.user = user;
    return next();
}