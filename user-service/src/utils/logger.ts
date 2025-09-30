import winston from "winston"; 
import path from "path";


const appLogDir = path.join(process.cwd(),"logs","app.log")
const errorLogDir = path.join(process.cwd(),"logs","error.log")

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
        winston.format.printf((info)=> `${info.timestamp} [${info.level.toLocaleUpperCase()}]: ${info.message}`)
    
)
,
transports:[
    new winston.transports.File({filename: errorLogDir,level:"error"}),
    new winston.transports.File({filename: appLogDir}),
    new winston.transports.Console()
]

});
export default logger;

