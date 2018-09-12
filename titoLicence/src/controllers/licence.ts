import { Headers } from "form-data";


export const productionIpArray: string[] = ['127.0.0.1', '51.15.213.105'];
export interface EnLicence extends Licence {
    enlicence: string;
}
export type DocId = string;

export type Ip = string; //127.0.0.1 localhost

export namespace Registration {

    export interface Doc {
        name: string;
        _id?: DocId;
        _rev?: string;
        ip: Ip;
    }

    export const REGISTRATION_DB_NAME: string = 'ah_registration';
    export const DESIGN_DOC_NAME: string = 'unique';
    export const VIEW_NAME: string = 'username';
}

export interface CheckUniqueNameResponse {
    bUnique: boolean;
}

export interface HostMApDoc {
    _id: string;
    _rev?: string;
    Host: string;
}

export interface Licence {
    _id: string;
    _rev?: string;
    clientId: string;
    clientType: string;
    allowAccess: boolean;
    isLocalHostClient: boolean;
    validity: number;
    isTrial: boolean,
    licStartDate: number,
    macArray: string[],
    enlicence: string,
    deviceInfo?: DeviceInfo
}

export interface DeviceInfo {
    hostName: string,
    macs: string[],
    serialNumber: string,
    machineDetails:
    {
        cpus: any[],
        tmpDir: string,
        arch: string,
        totalmemInMB: number,
        type: string,
        platform: string,
        hostname: string,
        homedir: string,
        endianness: string,
        release: string
    }
}


export interface RegistrationName {
    registrationName: string;
}
export interface LicenceReq extends RegistrationName {
    licenceId: string;
    validity: number;
    isTrial: boolean;
    licStartDate?: number;
}


export interface DbInfo {
    ip: string;
    port: number;
    username: string;
    password: string;
    db?: string;
}

export interface cloudDbs {
    serverMap: DbInfo
    ;
    productionCloud: DbInfo
    ;
    trialCloud: DbInfo
    ;
    registrationDb: DbInfo;

}
export const cloudlLcenceDbs: cloudDbs = {
    serverMap: {
        ip: "52.66.110.58",
        port: 5984,
        username: "couchadmin",
        password: "test",
        db: "tito_server_map"
    },
    productionCloud: {
        ip: "127.0.0.1",
        port: 5985,
        username: "couchadmin",
        password: "test",
    }, trialCloud: {
        ip: "51.15.206.208",
        port: 5984,
        username: "couchadmin",
        password: "test",
    }, registrationDb: {
        ip: "51.15.206.208",
        port: 5984,
        username: "registrar",
        password: "ganesh",
        db: "ah_registration"
    }
}



export interface LicenceResponse {
    hasApplied: boolean;
    isAuthorized: boolean;
    daysLeft4LicenceExpiry: number;
    isTrial: boolean;
    allowAccess: boolean;
    info?: string;
}


export interface LicenceRequest {
    query: Query,
    clientIp: string,
    headers: Headers
}

interface Query {
    clientType: string;
    dbContext: string
}
