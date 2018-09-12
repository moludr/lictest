import { Request, Response } from "express";
import { grantLicence } from "./grantTitoLicence";
import { LicenceReq } from "./licence";
import * as grantTitoLicence from "./grantTitoLicence";
// const licencer = require("grantProfitGuruLicence");
export let helloWorld = (req: Request, res: Response) => {
    res.send({
        hello: "world"
    });
    res.end();
};

function checkLicence(password: string): boolean {
    let bRet: boolean = false;
    if (password === "aHpassword") {
        bRet = true;
    }
    return bRet;
}
export let getLicenceDoc = async (req: Request, res: Response) => {
    if (!checkLicence(req.body.password)) {
        res.send({
            data: "Invalid Password"
        });
        return;
    }
    const serverId = req.body.serverId;
    const clientId = req.body.clientId;
    const param = {
        url: req.body.serverIp
    };
    const result = await getDoc(param, req.body.appType, serverId,clientId);
    res.send({
       result
    });
};

export let grantLicenceAPI = async (req: Request, res: Response) => {
    try {
        if (!checkLicence(req.body.password)) {
            res.send({
                resp: "Invalid Password"
            });
            return;
        }
        let ret;
        const argv = req.body;
        if (argv.appType === "tito") {
            const licenceReq: LicenceReq = {
                isTrial: argv.isTrial,
                registrationName: argv.serverId,
                licenceId: argv.clientId,
                validity: argv.numberOfDays,
                licStartDate: argv.dateOfLicense
            };
            ret = await grantLicence(licenceReq);
        } else {
            const grantLicenceObj = require("./grantProfitGuruLicence");
            ret = await grantLicenceObj.getLicenceCouchdb1(argv);
        }
        res.send({
            resp: ret
        });
    } catch (ex) {
        res.send({
            resp: ex
        });
    }
};

interface CouchParams {
    username?: string;
    password?: string;
    url: string;
    port?: number;
    bHTTPs?: boolean;
}

interface LicenceData {
    isLocalHostClient?: boolean;
    validity?: number;
    enlicence?: string;
    candClientId?: boolean;
}

function getFormattedUrl(params: CouchParams): string {
    if (!params.username) {
        params.username = "couchadmin";
        params.password = "test";
    }
    if (!params.url) {
        throw "URL is mendatory";
    }
    if (!params.port) {
        params.port = 5984;
    }

    let httpType = "http";
    if (params.bHTTPs) {
        httpType = "https";
    }
    const getFormattedUrl: string = httpType + "://" + params.username + ":" + params.password + "@" + params.url + ":" + params.port;
    // const getFormattedUrl = httpType + "://" + params.username + ":" + params.password + "@" + params.url + ":" + params.port ;
    return getFormattedUrl;
}


const ipArray = ["51.15.213.105", "51.15.244.27"];
const getDoc = async (params: CouchParams, appType: string, serverId: string,clientId:string) => {
    let dbName: string = "pg_collection_" + appType + "_licencedb";
    if (params.url !== "127.0.0.1") {
        dbName = "pg_collection_cloud_" + appType + "_licencedb_" + serverId;
        //  ipArray = ["127.0.0.1"];
    }
    const responseAray = [];
    for (let i = 0; i < ipArray.length; i++) {
        let res = {
            ip: ipArray[i],
            data: {}
        };
        params.url = ipArray[i];

        const serverUrl: string = getFormattedUrl(params);
        const serverInstance = require("nano-blue")(serverUrl);
        let dbIns = undefined;
        try {
            dbIns = await serverInstance.db.use(dbName);
        } catch (ex) {
            console.log("Ex:");
            console.log(ex);
            res.data = "Db not found";
        }
        try {
            const data = await dbIns.list({ include_docs: true });
            const licData = data[0].rows;
            let allLicence = [];
            for(let i=0;i<licData.length;i++){
                if(licData[i].id.substring(0,8)=='licence_'){
                    allLicence.push(decryptLicence(licData[i].doc));
                }
            }
            let filetredLic =[];
            if(clientId){
                for(let j= 0;j<allLicence.length;j++){
                    if(allLicence[j].clientId == clientId){
                       filetredLic.push(allLicence[j]);
                    }
                }
                res.data = filetredLic;
            }else{
                res.data =allLicence;
            }
            
            
        } catch (ex) {
            console.log("Ex:");
            console.log(ex);
            res.data = "Db does't exist";
        }

        responseAray.push(res);
    }
    return responseAray;

};


const crypto = require("crypto"),
    algorithm = "aes-256-ctr";
const HashMap = require("hashmap");


function decryptLicence(thisEncLicence: any) {

    let decipher, decLicence;
    if (thisEncLicence.candClientId) {
        decipher = crypto.createDecipher(algorithm, thisEncLicence.candClientId);
        decLicence = decipher.update(thisEncLicence.enDeviceInfo, "hex", "utf8");
    } else if (thisEncLicence.clientId) {
        decipher = crypto.createDecipher(algorithm, thisEncLicence.clientId);
        decLicence = decipher.update(thisEncLicence.enlicence, "hex", "utf8");
    } else {
        console.log("No Id for licence decryption");
    }

    decLicence += decipher.final("utf8");
    decLicence = JSON.parse(decLicence);
    return decLicence;
}

export let viewTitoLicence = async function(req, resp) {
    let licence = {
                    licenceId:"",
                    validity: 10,
                    isTrial: true,
                    registrationName: ""
                };
        licence.licenceId = req.body.licenceId;
        licence.registrationName = req.body.registrationName;
    const result = await grantTitoLicence.getTitoLicence(licence);
    resp.send(result);
    resp.end();
    };



