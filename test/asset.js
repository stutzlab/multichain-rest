import AssetService from './assetService'
import multichain_config from '../config/multichainConfig';
import logger from 'console-server';

const assetService = new AssetService(multichain_config.port, multichain_config.host, multichain_config.user, multichain_config.pass);

const POOL_ADDRESS = '12d6DyR2YPi7rFiGgFrp7deAVbmTQj41dZQXT3';
const INCOMING_ADDRESS = '14yxBtWS1VYaKacKVCasuEprLLjBj4Ai1UwshL';
const OUTCOMING_ADDRESS = '1DRCPwY3bca3jGDqTLN3m33qnJq2UTeqFnZjQ8';
const FEE_ADDRESS = '1VjSVWPmArgQ39z1jEavv4Aa87zrujmnHTB7sB';

class Asset{

    constructor() {
    }

    async transactions(request, response){
        try {
            let transactions = await assetService.listAddressTransactions(request.params.address);
            response.send(transactions);
        } catch (err) {
            logger.error(`error on listAddressTransactions for ${request.params.address}`, err);
            response.sendStatus(500);
        }
    }

    async createAddress(request, response){
        try {
            let newAddress = await assetService.getNewAddress();
            assetService.grant(newAddress);
            response.send(newAddress);
        }catch (err){
            logger.error('error on createAddress', err);
            response.sendStatus(500);
        }
    }

    async balance(request, response){
        try {
            let balance = await assetService.getAddressBalances(request.params.address);
            response.send(balance);
        }catch (err){
            logger.error(`error on balance for ${request.params.address}`, err);
            response.sendStatus(500);
        }
    }

    async locks(request, response) {
        try {
            let unspents = await assetService.listUnspent(request.params.address);
            response.send(unspents);
        } catch (err) {
            logger.error(`error on locks for ${request.params.address}`, err);
            response.sendStatus(500);
        }
    }

    async lock(request, response) {
        try {
            let unspent = await assetService.lock(request.params.address, request.body.asset, request.body.qty);
            response.send(unspent);
        } catch (err) {
            logger.error(`error on lock ${request.params.address}`, err);
            response.sendStatus(500);
        }
    }

    async deposit(request, response) {
        try {
            //  1 - ISSUED ACCOUNT (POLL)  -> REGISTRY INCOMING
            //  2 - REGISTRY INCOMING -> CLIENT ACCOUNT
            let customerAddress = request.params.address;
            await assetService.sendAssetFrom(POOL_ADDRESS, INCOMING_ADDRESS, request.body.asset, request.body.value);
            let txId = await assetService.sendAssetFrom(INCOMING_ADDRESS, customerAddress, request.body.asset, request.body.value);
            response.send(txId);
        } catch (err) {
            logger.error(`error on deposit on ${request.params.address}`, err);
            if(err.code!=null) {
              response.status(400).send(err);
            } else {
              response.sendStatus(500);
            }
        }
    }

    async withdraw(request, response) {
        try {
            //  1 - CLIENT ACCOUNT -> REGISTRY OUTGOING
            //  2 - REGISTRY OUTGOING -> POOL
            let customerAddress = request.params.address;
            await assetService.sendAssetFrom(customerAddress, OUTCOMING_ADDRESS, request.body.asset, request.body.value);
            let txId = await assetService.sendAssetFrom(OUTCOMING_ADDRESS, POOL_ADDRESS, request.body.asset, request.body.value);
            response.send(txId);
        } catch (err) {
            logger.error(`error on withdraw on ${request.params.address}`, err);
            response.sendStatus(500);
        }
    }

    async reserve(request, response) {
        try{
           let resp = await assetService.issue(POOL_ADDRESS, request.body.asset, request.body.value);
            response.send(resp);
        } catch (err) {
            logger.error(`error on reserves on ${request.body.asset} ${request.body.value}`, err);
            response.sendStatus(500);
        }
    }

    async delete(req, res){
        if(req.body && req.body.txid && req.body.vout != null){
            let vout = req.body.vout;
            if((typeof vout) === 'string'){
                vout = parseInt(vout);
            }
            logger.debug('unlocking', req.body);
            await assetService.unlock(req.body.txid, vout);
            res.send('ok');
        }else{
            logger.debug('req.body', req.body, req.body.txid, req.body.vout);
            res.status(500).send('To delete a tx both txid and vout must be passed');
        }
    }

    async transfer(request, response) {

        let acceptTx = {            
            txid:request.body.acceptTxid,
            vout:request.body.acceptVout,
        };
        let offerTx = {
            txid:request.body.offerTxid,
            vout:request.body.offerVout
        };

        assetService.transfer(acceptTx, offerTx, 
            (respTransfer) => {
                response.send(respTransfer.resp);
            }, (err) => {
                logger.error(`[ERROR] error on tranfer on ${offerTx.txid} ${acceptTx.txid}`, err);
                response.sendStatus(500);
            }
        );
    }

    async exchange(request, response) {
        let exchange = request.body;

        if(exchange.offer && exchange.accept.length > 0) {
            let offerTx = exchange.offer;
            let acceptTx = exchange.accept[0];

            assetService.getTxOutByPooling(20, offerTx, async (err, resp2) => {
                if (err) {
                    logger.info(err);
                    response.sendStatus(500);
                }
                else {
                    try {
                        let createRawExchangeObj = {};
                        createRawExchangeObj.assets = offerTx.acceptAsset;
                        createRawExchangeObj.txid = offerTx.txid;
                        createRawExchangeObj.vout = offerTx.vout;

                        logger.debug("******************");
                        logger.debug("-> ", offerTx);

                        let txout = await assetService.getTxOut(offerTx.txid, offerTx.vout);

                        logger.debug("-> ", txout);
                        logger.debug("******************");


                        let hexstringCreate = await assetService.createRawExchange(createRawExchangeObj);

                        let appendRawExchangeObj = {};
                        appendRawExchangeObj.hexstring = hexstringCreate;
                        appendRawExchangeObj.txid = acceptTx.txid;
                        appendRawExchangeObj.vout = acceptTx.vout;
                        appendRawExchangeObj.assets = acceptTx.offerAsset;

                        logger.debug("******************");
                        logger.debug("-> ", acceptTx);
                        txout = await assetService.getTxOut(acceptTx.txid, acceptTx.vout);
                        logger.debug("-> ", txout);
                        logger.debug("******************");

                        let hexstringAppend = await assetService.appendRawExchange(appendRawExchangeObj);

                        for (let i = 1; i < exchange.accept.length; i++) {
                            let accept = exchange.accept[i];
                            logger.debug("******************");
                            logger.debug("->" + i + " - " + JSON.stringify(accept));
                            txout = await assetService.getTxOut(accept.txid, accept.vout);
                            logger.debug("-> ", txout);
                            logger.debug("******************");
                            let rawExchangeObj = {};
                            rawExchangeObj.hexstring = hexstringAppend.hex;
                            rawExchangeObj.txid = accept.txid;
                            rawExchangeObj.vout = accept.vout;
                            rawExchangeObj.assets = accept.offerAsset;

                            hexstringAppend = await assetService.appendRawExchange(rawExchangeObj);
                        }
                        let x = await assetService.decodeRawexchange(hexstringAppend);

                        logger.debug("Decoded ->", x);

                        logger.debug("Decoded ->", x.vin.length);
                        for (let i = 0; i < x.vin.length; i++) {
                            let y =  x.vin[i];
                            logger.debug("******************");
                            logger.debug(y.scriptSig);
                            logger.debug("******************");
                        }

                        logger.debug("Decoded ->", x.vout.length);
                        for (let i = 0; i < x.vout.length; i++) {
                            let y =  x.vout[i];
                            logger.debug("******************");
                            logger.debug(y.assets);
                            logger.debug("******************");
                        }

                        if (hexstringAppend.complete) {
                            let txid = await assetService.sendRawTransaction(hexstringAppend);
                            let exchangeResponse = {txid: txid};
                            response.send(exchangeResponse);
                        } else {
                            logger.error(`hexstring is not complete for ${offerTx.txid} ${acceptTx.txid}`);
                            response.sendStatus(500);
                        }
                    } catch (err) {
                        logger.error(`error on transfer on ${offerTx.txid} ${acceptTx.txid}`, err);
                        response.sendStatus(500);
                    }
                }
            });
        } else {
            response.status(400).send({message:'Invalid request', request:request.body});
        }
    }

    async withdrawBTCFromLock(req, res){
        await this.withdrawFromLockStep(1, req, res, req.body.offerTxidBtcQty, req.body.offerVoutBtcQty);
        await this.withdrawFromLockStep(2, req, res, req.body.offerTxidMiningFee, req.body.offerVoutMiningFee);
        res.send('ok');
    }

    async withdrawBRLFromLock(req, res){
        console.log(`[assets.js] withdrawBRLFromLock`, req.body);
        await this.withdrawFromLockStep(1, req, res, req.body.offerTxid, req.body.offerVout);
        res.send('ok');
    }

    async withdrawFromLockStep(step, req, res, offerTxid, offerVout){
        console.log(`withdrawFromLock p${step} offerTxid:${offerTxid} - offerVout:${offerVout}`);
        
        try {
            let unspent = await assetService.lock(multichain_config.OUTCOMING_ADDRESS, req.body.acceptAsset, '0');
            console.log('withdrawFromLock after unspent');

            let acceptTx = {
                txid:unspent.txid,
                vout:unspent.vout
            };
            let offerTx = {
                txid:offerTxid,
                vout:offerVout
            };

            assetService.transfer(acceptTx, offerTx, 
                async (respTransfer) => {
                    console.log('withdrawFromLock after transfer');
                    let txId = await assetService.sendAssetFrom(OUTCOMING_ADDRESS, POOL_ADDRESS, respTransfer.offerTx.assetName, respTransfer.offerTx.assetQty);
                    // res.send(respTransfer.resp);
                }, (err) => {
                    console.log(`[ERROR] error on tranfer on ${offerTx.txid} ${acceptTx.txid}`, err);
                    res.sendStatus(500);
                }
            );
        } catch (err) {
            console.log(`[ERROR] error on lock for withdraw ${req.body}`, err);
            res.sendStatus(500);
        }
    }
}

export default Asset
