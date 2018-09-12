import { Licence, DeviceInfo, RegistrationName, HostMApDoc, DbInfo, LicenceReq, cloudDbs, cloudlLcenceDbs, productionIpArray, EnLicence, Registration } from './licence';
import * as nanoBlue from 'nano-blue';
import * as crypto from './cryptolib';
import Doc = Registration.Doc;
import REGISTRATION_DB_NAME = Registration.REGISTRATION_DB_NAME;
import DESIGN_DOC_NAME = Registration.DESIGN_DOC_NAME;
import VIEW_NAME = Registration.VIEW_NAME;


function formatServerUrl(dbInfo: DbInfo): string {
    return 'http://' + dbInfo.username + ':' + dbInfo.password + '@' + dbInfo.ip + ':' + dbInfo.port;
}

function formDbName(id) {
    return 'pg_licencedb_' + id
}

const getDoc = async function (dbInfo: DbInfo, id: string): Promise<any> {
    try {

        const dbInstance = getDbInstance(dbInfo);
        let resp = await dbInstance.get(id);
        return resp[0];
    } catch (ex) {
        throw 'Failed in get Doc :' + id + '  <> ' + JSON.stringify(ex);
    }
}

const getHostFromMap = async function (registrationName: string): Promise<any> {
    let licence: Licence;
    const serverMap = cloudlLcenceDbs.serverMap;
    return getDoc(serverMap, registrationName);
}

const getLicenceDoc = async function (dbInfo: DbInfo, id: string): Promise<Licence> {
    let licence: Licence;
    try {
        licence = await getDoc(dbInfo, id);
        return licence;
    } catch (ex) {
        console.log(ex);
        throw 'failed in getLicenceDoc <> ' + ex.error;
    }
}

const getEnLicence = async function (doc: Licence): Promise<EnLicence> {
    let licence: EnLicence = {
        _id: doc._id,
        allowAccess: doc.allowAccess,
        clientId: doc.clientId,
        clientType: doc.clientType,
        isLocalHostClient: doc.isLocalHostClient,
        isTrial: doc.isTrial,
        licStartDate: doc.licStartDate,
        validity: doc.validity,
        macArray: doc.macArray,
        enlicence: crypto.encrypt(doc)
    }
    if (doc._rev) {
        licence._rev = doc._rev;
    }
    return licence;
};


const getAndFormLicenceDoc = async function (dbInfo: DbInfo, licenceReq: LicenceReq): Promise<EnLicence> {
    let licenceDOc: EnLicence = await getLicenceDoc(dbInfo, licenceReq.licenceId);
    let licence = decrypt(licenceDOc);
    licence._rev = licenceDOc._rev;
    licence.isTrial = licenceReq.isTrial;
    licence.licStartDate = licenceReq.licStartDate;
    licence.validity = licenceReq.validity;
    let enlicence = await getEnLicence(licence);
    return enlicence;
}


const updateLicenceDoc = async function (licenceReq: LicenceReq, dbInfo: DbInfo): Promise<Licence> {
    let licence: EnLicence = await getAndFormLicenceDoc(dbInfo, licenceReq);
    try {
        const dbInstance = getDbInstance(dbInfo);
        let resp = await dbInstance.insert(licence, licence._id);
        return resp;
    } catch (ex) {
        console.log(ex);
        throw ex;
    }
}


export const decrypt = function (doc: EnLicence): Licence {
    return crypto.decrypt(doc.enlicence);
}


const insertInServerMap = async function (licenceReq) {
    let dbInfo: DbInfo = cloudlLcenceDbs.serverMap;
    try {
        console.log('insert in serverMap');
        const dbInstance = getDbInstance(dbInfo);
        // let mapDoc: HostMApDoc;
        // mapDoc._id = licenceReq.registrationDb;
        // mapDoc.Host = dbInfo.ip;
        let mapDoc = {
            _id: licenceReq.registrationName,
            Host: dbInfo.ip
        }
        let resp = await dbInstance.insert(mapDoc, mapDoc._id);
        console.log('successfully inserted in serverMap');
        return resp;
    } catch (ex) {
        console.log(ex);
        throw 'failed to insert map doc';
    }
}
const replicete = async function (sourceDBUrl: string, targetDBUrl: string) {
    let sourceCouchClient = require('nano-blue')('http://couchadmin:test@localhost:5984');
    try {
        let resp = await sourceCouchClient.db.replicate(sourceDBUrl, targetDBUrl, {
            create_target: true
        });

        // console.log(resp);
        console.log('success');
    } catch (err) {
        // console.log(err);    
        console.log("replicate failed");
        console.log(err);
        throw 'replicate failed';
    }
}

const getRegistrationId = async function (name: string): Promise<Doc> {
    console.log(name);
    let params = {
        key: name.toLowerCase(),
        include_docs: true
    };
    const dbInstance = getDbInstance(cloudlLcenceDbs.registrationDb);
    let queryResp = await dbInstance.view(DESIGN_DOC_NAME, VIEW_NAME, params);
    if (!queryResp[0].rows.length) {
        throw {
            error: 'Unknown Name. Try Registration First'
        };
    } else if (queryResp[0].rows.length > 1) {
        //not expected to come here
        throw {
            error: 'Unknown Error. Contact AlienHU Admin.', //This string is used in other places. If you change it make sure you change in other places also
            code: "UNKNOWN" //This is used in other places. If you change it make sure you change it in other places also
        };
    }
    let response: Doc = queryResp[0].rows[0].doc;
    return response;
};

async function getHostIpIfProduction(licenceReq: LicenceReq): Promise<string> {
    let hostIp: string;
    try {
        let hostIp: string;
        let regInfo = await getHostFromMap(licenceReq.registrationName);
        hostIp = regInfo.Host;
        console.log(licenceReq.registrationName + 'found in serverMap');
        if (licenceReq.isTrial) {
            //if licence is already in production db ?
            throw 'Registration name ' + licenceReq.registrationName + ' Exist in production <' + regInfo.Host + '>';
        }
        return hostIp;
    } catch (ex) {
        console.log(ex.error);
        return hostIp;
    }
}

async function grantTrialLicence(licenceReq: LicenceReq, dbInfo: DbInfo) {
    try {
        let resp = await updateLicenceDoc(licenceReq, dbInfo);
        return resp;
    } catch (ex) {
        throw 'Failed in grantTrialLicence' + JSON.stringify(ex);
    }
}

async function updateProductionLicence(dbInfo: DbInfo, dbId: string, licenceReq: LicenceReq) {
    try {
        dbInfo = cloudlLcenceDbs.productionCloud;
        dbInfo.db = formDbName(dbId);
        let resp = await updateLicenceDoc(licenceReq, dbInfo);
        return resp;
    } catch (ex) {
        throw 'Failed in updateProductionLicence' + JSON.stringify(ex);
    }
}

async function grantTrialToProduction(dbInfo: DbInfo, dbId: string, licenceReq: LicenceReq) {
    try {
        let sourceDBUrl = formatServerUrl(cloudlLcenceDbs.trialCloud) + '/' + dbInfo.db;
        let targetDBUrl = formatServerUrl(cloudlLcenceDbs.productionCloud) + '/' + dbInfo.db + '_1';
        //replicete doc to production db
        console.log("replication start");
        await replicete(sourceDBUrl, targetDBUrl);
        console.log("replication done");
        //update licence db
        let forTest: DbInfo = cloudlLcenceDbs.productionCloud;
        dbInfo.db = formDbName(dbId);
        forTest.db = dbInfo.db + '_1';
        let resp = await updateLicenceDoc(licenceReq, forTest);
        //insert in server_map
        await insertInServerMap(licenceReq);
    } catch (ex) {
        throw 'Failed in grantTrialToProduction <> ' + JSON.stringify(ex);
    }
}

function getDbInstance(dbInfo: DbInfo) {
    const serverInstance = nanoBlue(formatServerUrl(dbInfo));
    const dbInstance = serverInstance.use(dbInfo.db);
    return dbInstance;
}


const updateLicence = async function (licenceReq: LicenceReq, dbId: string): Promise<string> {
    let dbInfo: DbInfo = cloudlLcenceDbs.trialCloud;
    dbInfo.db = formDbName(dbId);


    try {
        let hostIp: string = await getHostIpIfProduction(licenceReq);
        if (hostIp) {
            dbInfo.ip = hostIp;
            await updateProductionLicence(dbInfo, dbId, licenceReq);
        } else if (licenceReq.isTrial) {
            await grantTrialLicence(licenceReq, dbInfo);
        } else if (!licenceReq.isTrial) {
            await grantTrialToProduction(dbInfo, dbId, licenceReq);
        }
    } catch (ex) {
        console.log("exception");
        console.log(ex);
        throw ex;
    }
    return 'Licence granted successfully';
}

export const grantLicence = async function (licenceReq: LicenceReq): Promise<string> {
    console.log("Input: => ");
    console.log(licenceReq);
    let regDoc: Doc;
    try {
        regDoc = await getRegistrationId(licenceReq.registrationName);
        console.log(regDoc);
    } catch (ex) {
        console.log(ex);
        throw 'Failed to find Registration Name';
    }
    return await updateLicence(licenceReq, regDoc._id);


}

export const getTitoLicence = async function (licenceReq: LicenceReq) {
    let regDoc;
    try {
        regDoc = await getRegistrationId(licenceReq.registrationName);
        const dbInfo = cloudlLcenceDbs.trialCloud;
        dbInfo.db = formDbName(regDoc._id);
        const hostIp: string = await getHostIpIfProduction(licenceReq);
        if (hostIp) {
            dbInfo.ip = hostIp;
        }
        const dbInstance = getDbInstance(dbInfo);
        const list = await dbInstance.list({ include_docs: true });
        const docs = list[0].rows;
        let licencedoc = [];
        let filteredLicencedoc = [];
        for (let y = 0; y < docs.length; y++) {
            if (docs[y].key.substring(0, docs[y].key.indexOf("_")) == "licence") {
                 licencedoc.push(crypto.decrypt(docs[y].doc.enlicence));
            }
        }
        if(licenceReq.licenceId){
            for(let i=0; i<licencedoc.length;i++){
                if(licenceReq.licenceId ==licencedoc[i]._id){
                    filteredLicencedoc.push(licencedoc[i]);
                }
            }
            return filteredLicencedoc;
        }else{
            return  licencedoc;
        }
    } catch (ex) {
        console.log(ex);
        throw "Failed to find get all licence";
    }
    
    };