import MultichainNode from 'multichain-node'
import logger from 'console-server';
class AssetService{

    constructor(port, host, user, pass){
        this.multichainNode = MultichainNode({
            port: port,
            host: host,
            user: user,
            pass: pass,
            timeout: 5000
        });
    }

    // listAddressTransactions(address) {
    //     return new Promise((resolve, reject) => {
    //         this.multichainNode.listAddressTransactions({"address": address, "count": 99999, "skip": 0, "verbose": false}, (err, balance) => {
    //             this.handleMultichainResponse(err, resolve, reject, balance);
    //         });
    //     });
    // }

    // getAddressBalances(address){
    //     return new Promise((resolve, reject) => {
    //         this.multichainNode.getAddressBalances({"address": address}, (err, balance) => {
    //             this.handleMultichainResponse(err, resolve, reject, balance);
    //         });
    //     });
    // }

    // getAddressBalancesIncludeLocked(address){
    //     return new Promise((resolve, reject) => {
    //         this.multichainNode.getAddressBalances({"address": address, "includeLocked":true}, (err, balance) => {
    //             this.handleMultichainResponse(err, resolve, reject, balance);
    //         });
    //     });
    // }

    getTxOut(txid, vout){
        return new Promise((resolve, reject) => {
            this.multichainNode.getTxOut({"txid":txid, "vout":vout}, (err, resp) => {
                this.handleMultichainResponse(err, resolve, reject, resp);
            });
        });
    }

    getTxOutByPooling(retries, obj, callback){
        logger.info('gettxout attemps left',retries);

        this.multichainNode.getTxOut({"txid":obj.txid, "vout":obj.vout}, (err, resp) => {
            if(err){
                callback(err, resp);
            }
            if(resp == null){
                if(retries > 0){
                    setTimeout(()=>{this.getTxOutByPooling(retries-1, obj, callback)}, 500);
                }else{
                    callback(err, resp);
                }
            }else{
                callback(err, resp);
            }
        });
    }


    // sendAssetFrom(addressFrom, addressTo, asset, value) {
    //     return new Promise((resolve, reject) => {
    //         this.multichainNode.sendAssetFrom( {
    //             "from":addressFrom,
    //             "to":addressTo,
    //             "asset":asset,
    //             "qty":value
    //         }, (err, resp) => {
    //             this.handleMultichainResponse(err, resolve, reject, resp);
    //         });
    //     });
    // }

    unlock(txid, vout) {
        return new Promise((resolve, reject) => {
            this.multichainNode.lockUnspent( {
                "unlock":true,
                "outputs":[{txid, vout}]
            }, (err, resp) => {
                this.handleMultichainResponse(err, resolve, reject, resp);
            });
        });
    }

    createRawExchange(rawExchangeObj){
        return new Promise((resolve, reject) => {
            this.multichainNode.createRawExchange(rawExchangeObj, (err, hexstring) => {
                this.handleMultichainResponse(err, resolve, reject, hexstring);
            });
        });
    }

    appendRawExchange(rawExchangeObj){
        return new Promise((resolve, reject) => {
            this.multichainNode.appendRawExchange(rawExchangeObj, (err, hexstring) => {
                this.handleMultichainResponse(err, resolve, reject, hexstring);
            });
        });
    }

    decodeRawexchange(hexTxid){
        return new Promise((resolve, reject) => {
            this.multichainNode.decodeRawTransaction({"hexstring":hexTxid.hex}, (err, resp) => {
                this.handleMultichainResponse(err, resolve, reject, resp);
            });
        });
    }

    sendRawTransaction(hexstring){
        return new Promise((resolve, reject) => {
            this.multichainNode.sendRawTransaction({"hexstring":hexstring.hex}, (err, resp) => {
                this.handleMultichainResponse(err, resolve, reject, resp);
            });
        });
    }

    // getNewAddress(){
    //     return new Promise((resolve, reject) => {
    //         this.multichainNode.getNewAddress((err, newAddr) => {
    //             this.handleMultichainResponse(err, resolve, reject, newAddr);
    //         });
    //     });
    // }

    // grant(address){
    //     return new Promise((resolve, reject) => {
    //         this.multichainNode.grant({"addresses":address, "permissions":"receive,send"}, (err, resp) =>{
    //             this.handleMultichainResponse(err, resolve, reject, resp);
    //         });
    //     });
    // }

    listUnspent(address){
        return new Promise((resolve, reject) => {
            this.multichainNode.listUnspent({"receivers":[address]}, (err, unspents) => {
                this.handleMultichainResponse(err, resolve, reject, unspents);
            });
        });
    }

    lock(address, asset, qty){
        return new Promise((resolve, reject) => {
            let tx = {
                "from":address,
                "assets" : {}
            };
            tx.assets[asset] = parseFloat(qty);
            this.multichainNode.prepareLockUnspentFrom(tx, (err, unspent) => {
                this.handleMultichainResponse(err, resolve, reject, unspent);
            });
        });
    }

    // issue(address, asset, value){
    //     return new Promise((resolve, reject) => {
    //         let obj = {
    //             "address":address,
    //             "asset":asset,
    //             "qty":value
    //         };
    //         this.multichainNode.issueMore(obj, (err, resp) => {
    //             if(err && err.code == -708){
    //                 let units = 0.01;
    //                 if(asset=='BTC') {
    //                     units = 0.00000001;
    //                 }
    //                 let obj = {
    //                     "address":address,
    //                     "asset":{"name":asset, "open":true},
    //                     "qty":value,
    //                     "units":units
    //                 };
    //                 this.multichainNode.issue(obj, (err, resp) => {
    //                     this.handleMultichainResponse(err, resolve, reject, resp);
    //                 });
    //             }else{
    //                 resolve(resp);
    //             }
    //         });
    //     });
    // }

    // handleMultichainResponse(err, resolve, reject, resp) {
    //     if (!err) {
    //         resolve(resp);
    //     } else {
    //         logger.error('error on executing operation at multichain', err);
    //         reject(err);
    //     }
    // }

    async transfer(offerTx, acceptTx, onSuccess, onError){
        offerTx.offerAsset={};
        acceptTx.acceptAsset={};
        this.getTxOutByPooling(20, offerTx, async (err, resp2) => {
            if(err){
                logger.info(err);
                response.sendStatus(500);
            }else{
                try {
                    offerTx.offerAsset[resp2.assets[0].name] = resp2.assets[0].qty;
                    offerTx.assetName = resp2.assets[0].name;
                    offerTx.assetQty = resp2.assets[0].qty;

                    this.getTxOutByPooling(20, acceptTx, async(err, responseOfferTx) => {
                    // let responseOfferTx = await assetService.getTxOut(acceptTx.txid, acceptTx.vout);

                        acceptTx.acceptAsset[responseOfferTx.assets[0].name] = responseOfferTx.assets[0].qty;
                        acceptTx.assetName = responseOfferTx.assets[0].name;
                        acceptTx.assetQty = responseOfferTx.assets[0].qty;

                        let createRawExchangeObj = {};
                        createRawExchangeObj.assets = acceptTx.acceptAsset;
                        createRawExchangeObj.txid = offerTx.txid;
                        createRawExchangeObj.vout = offerTx.vout;

                        let hexstringCreate = await this.createRawExchange(createRawExchangeObj);

                        let appendRawExchangeObj = {};
                        appendRawExchangeObj.hexstring = hexstringCreate;
                        appendRawExchangeObj.txid = acceptTx.txid;
                        appendRawExchangeObj.vout = acceptTx.vout;
                        appendRawExchangeObj.assets = offerTx.offerAsset;

                        let hexstringAppend = await this.appendRawExchange(appendRawExchangeObj);
                        let resp = await this.sendRawTransaction(hexstringAppend);

                        onSuccess({
                            resp,
                            offerTx,
                            acceptTx
                        });
                    });
                } catch (err) {
                    onError(err);
                }
            }
        });

    }
}

export default AssetService