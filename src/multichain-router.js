const logger = require('console-server');
const Bluebird = require('bluebird');
const MultichainNode = require('multichain-node');

function toHex(str) {
    var hex = '';
    for (var i = 0; i < str.length; i++) {
        hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
}

function fromHex(hexx) {
    if(hexx==null) return null;
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function AsyncArray(dt) {
    this.data = dt;
    this.filterAsync = function(predicate) {
        // Take a copy of the array, it might mutate by the time we've finished
        const dat = Array.from(this.data);
        // Transform all the elements into an array of promises using the predicate
        // as the promise
        return Promise.all(dat.map((element, index) => predicate(element, index, dat)))
            // Use the result of the promises to call the underlying sync filter function
            .then(result => {
                return dat.filter((element, index) => {
                    return result[index];
                });
            });
    }
    this.mapAsync = function (predicate) {
        // Take a copy of the array, it might mutate by the time we've finished
        const dat = Array.from(this.data);
        // Transform all the elements into an array of promises using the predicate
        // as the promise
        return Promise.all(dat.map((element, index) => predicate(element, index, dat)))
            // Use the result of the promises to call the underlying sync filter function
            .then(result => {
                return dat.map((element, index) => {
                    return result[index];
                });
            });
    }
}


function MultichainRouter(multichainHost, multichainPort, multichainUser, multichainPass) {

    let multichainNode = MultichainNode({
        port: multichainPort,
        host: multichainHost,
        user: multichainUser,
        pass: multichainPass,
        timeout: 5000
    });
    this.multichainNodeAsync = Bluebird.promisifyAll(multichainNode);

    this.setupRoutes = function(router) {

        logger.info('Setting up multichain routes');

        router.post('/addresses', async (req, res) => {
            try {
                logger.debug('Creating new asset address');
                let address = await this.multichainNodeAsync.getNewAddressAsync();
                if (req.body.permissions!=null) {
                    logger.debug('Granting permissions to address ' + address);
                    let txid = await this.multichainNodeAsync.grantAsync({ addresses: address, permissions: req.body.permissions });
                }
                res.location('/addresses/' + address).status(200).send({address});
            } catch (err) {
                logger.warn(err);
                res.status(500).send({ error: err });
            }
        });

        router.get('/addresses/:address/balance', async (req, res) => {
            try {
                let balances = await this.multichainNodeAsync.getAddressBalancesAsync({
                    address: req.params.address,
                    minconf: parseInt(req.query.minconf || 1),
                    includeLocked: JSON.parse(req.query.includeLocked || false)
                });
                res.status(200).send({balances});
            } catch (err) {
                logger.warn(err);
                res.status(500).send({ error: err });
            }
        });

        router.get('/addresses/:address/transactions', async (req, res) => {
            try {
                let transactions = await this.multichainNodeAsync.listAddressTransactionsAsync({
                    address: req.params.address,
                    count: parseInt(req.query.count || 9999),
                    skip: parseInt(req.query.skip || 0),
                    verbose: JSON.parse(req.query.verbose || false)
                });

                if(req.query.pretty == "true") {
                    let transactions2 = transactions.map((transaction) => {
                        if(transaction.issue!=null) {
                            return {
                                time: new Date(transaction.time*1000),
                                amount: transaction.balance.amount,
                                assets: transaction.balance.assets,
                                data: transaction.issue.details
                            }
                        } else {
                            return {
                                time: new Date(transaction.time*1000),
                                amount: transaction.balance.amount,
                                assets: transaction.balance.assets,
                                addresses: transaction.addresses,
                                data: fromHex(transaction.data)
                            }
                        }
                    }).filter(entry => {
                        return entry.amount!=0 || entry.assets.length>0
                    });
                    res.status(200).send({ transactions:transactions2 });
                } else {
                    res.status(200).send({ transactions });
                }

            } catch (err) {
                logger.warn(err);
                res.status(500).send({ error: err });
            }
        });

        router.post('/addresses/:address/grant', async (req, res) => {
            try {
                req.body.addresses = req.params.address;
                let txid = await this.multichainNodeAsync.grantAsync(req.body);
                res.status(201).send({ txid });
            } catch (err) {
                logger.warn(err);
                res.status(500).send({ error: err });
            }
        });

        router.post('/addresses/:address/issue', async (req, res) => {
            try {
                let params = req.body;
                try {
                    params.address = req.params.address;
                    let txid = await this.multichainNodeAsync.issueMoreAsync(params);
                    res.status(201).send({ txid });
                } catch (err) {
                    if (err && err.code == -708) {
                        if (params.units==null) {
                            throw '"units" attribute is required for creating the asset';
                        }
                        //asset not issued yet. issue now
                        let params2 = {
                            "address": params.address,
                            "asset": { "name": params.asset, "open": true },
                            "qty": params.qty,
                            "units": params.units,
                            "details": params.details
                        };
                        let txid = await this.multichainNodeAsync.issueAsync(params2);
                        res.status(201).send({ txid });
                    } else {
                        throw err;
                    }
                }
            } catch (err) {
                logger.warn(err);
                res.status(500).send({ error: err });
            }
        });
        
        router.post('/addresses/:address/send_asset', async (req, res) => {
            try {
                let params = req.body;
                params.address = req.params.address;
                if(params.data==null) {
                    let txid = await this.multichainNodeAsync.sendAssetFromAsync(params);
                    res.status(200).send({ txid });
                } else {
                    params.data = toHex(params.data);
                    params.amount = JSON.parse("{\""+ params.asset +"\":"+ params.qty +"}");
                    logger.debug(params.amount);
                    let txid = await this.multichainNodeAsync.sendWithMetadataFromAsync(params);
                    res.status(200).send({ txid });
                }
            } catch (err) {
                logger.warn(err);
                res.status(500).send({ error: err });
            }
        });

        router.post('/addresses/:address/locks', async (req, res) => {
            try {
                let params = {
                    from: req.params.address,
                    assets: {}
                };
                params.assets[req.body.asset] = req.body.qty;
                let txout = await this.multichainNodeAsync.prepareLockUnspentFromAsync(params);
                res.location('/addresses/:address/locks/' + txout.txid + '/' + txout.vout).status(200).send({ txout });
            } catch (err) {
                logger.warn(err);
                res.status(500).send({ error: err });
            }
        });

        router.get('/addresses/:address/locks', async (req, res) => {
            try {
                let listLocks = new AsyncArray(await this.multichainNodeAsync.listLockUnspentAsync());

                let txouts = new AsyncArray(await listLocks.mapAsync(async lock => {
                    let txout = await this.multichainNodeAsync.getTxOutAsync({
                        txid: lock.txid + '',
                        vout: parseInt(lock.vout)
                    });
                    return {
                        txid: lock.txid,
                        vout: lock.vout,
                        addresses: txout?txout.scriptPubKey.addresses:null,
                        assets: txout?txout.assets:null
                    }
                }));
                let txouts2 = await txouts.filterAsync(async txout => {
                    if (txout && txout.addresses && txout.addresses.includes(req.params.address)) {
                        return true;
                    }
                    return false;
                });
                    
                res.status(200).send({locks:txouts2});

            } catch (err) {
                logger.warn(err);
                res.status(500).send({error: err});
            }
        });

        router.delete('/addresses/:address/locks/:txid/:vout', async (req, res) => {
            try {
                let details = await this.multichainNodeAsync.getTxOutAsync({
                    txid: req.params.txid+'', vout: parseInt(req.params.vout)
                });
                logger.debug(details);

                if(details==null) {
                    logger.warn('txout ' + req.params.txid + ':' + req.params.vout + ' could not be found');
                    res.status(404).send({
                        error: 'txout ' + req.params.txid + ':' + req.params.vout + ' could not be found'
                    });
                    return;

                } else if (!details.scriptPubKey.addresses.includes(req.params.address)) {
                    logger.warn('txout ' + req.params.txid + ':' + req.params.vout + ' doesn\'t belong to address ' + req.params.address);
                    res.status(400).send({
                        error: 'txout ' + req.params.txid + ':' + req.params.vout + ' doesn\'t belong to address ' + req.params.address
                    });
                    return;
                }

                let result = await this.multichainNodeAsync.lockUnspentAsync({
                    unlock: true,
                    outputs: [{ txid:req.params.txid+'', vout:parseInt(req.params.vout) }]
                });
                res.status(200).send({result});
            } catch (err) {
                logger.warn(err);
                res.status(500).send({ error: err });
            }
        });

        router.post('/exchange', async (req, res) => {
            let context = '';
            try {

                //lock resources from side 1
                context = 'lock address_1 ' + req.body.address_1;
                let params1 = {
                    from: req.body.address_1,
                    assets: {}
                };
                params1.assets[req.body.asset_1] = req.body.qty_1;
                let txout1 = await this.multichainNodeAsync.prepareLockUnspentFromAsync(params1);
                logger.debug('txout1', txout1);

                //lock resources from side 2
                context = 'lock address_2 ' + req.body.address_2;
                let params2 = {
                    from: req.body.address_2,
                    assets: {}
                };
                params2.assets[req.body.asset_2] = req.body.qty_2;
                let txout2 = await this.multichainNodeAsync.prepareLockUnspentFromAsync(params2);
                logger.debug('txout2', txout2);

                //create exchange with side 1
                context = 'exchange side1';
                let createRawExchangeParam = {};
                createRawExchangeParam.assets = {};
                createRawExchangeParam.assets[req.body.asset_2] = req.body.qty_2;
                createRawExchangeParam.txid = txout1.txid;
                createRawExchangeParam.vout = txout1.vout;
                let hexstringCreate = await this.multichainNodeAsync.createRawExchangeAsync(createRawExchangeParam);
                logger.debug('createRawExchangeParam', createRawExchangeParam);
                logger.debug('hexstringCreate', hexstringCreate);

                //append exchange with side 2
                context = 'exchange side2';
                let appendRawExchangeParam = {};
                appendRawExchangeParam.hexstring = hexstringCreate;
                appendRawExchangeParam.assets = {};
                appendRawExchangeParam.assets[req.body.asset_1] = req.body.qty_1;
                appendRawExchangeParam.txid = txout2.txid;
                appendRawExchangeParam.vout = txout2.vout;
                let hexstringAppend = await this.multichainNodeAsync.appendRawExchangeAsync(appendRawExchangeParam);
                logger.debug('appendRawExchangeParam', appendRawExchangeParam);
                logger.debug('hexstringAppend', hexstringAppend);

                //send exchange transaction for good!
                context = 'submit exchange';
                let result = await this.multichainNodeAsync.sendRawTransactionAsync({ hexstring: hexstringAppend.hex});
                logger.debug('result', result);

                res.status(200).send({
                    exchange: result,
                    txout1: txout1,
                    txout2: txout2
                });

            } catch (err) {
                logger.warn(err, context);
                res.status(500).send({
                    error: err,
                    context: context
                });
            }
        });

    }

}

module.exports = MultichainRouter;